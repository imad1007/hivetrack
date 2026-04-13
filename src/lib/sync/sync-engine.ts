"use client";

import { getDB } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import type { SyncOperation, SyncQueueItem } from "@/types";

const SYNC_TABLES = [
  "apiaries",
  "hives",
  "queens",
  "visits",
  "treatments",
  "feedings",
  "swarms",
  "harvests",
] as const;

type SyncTable = (typeof SYNC_TABLES)[number];

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * Write a record to local IndexedDB first, then queue a Supabase sync.
 * The sync is attempted immediately but does NOT block the return.
 */
export async function localWrite<T extends { id: string; updated_at?: string }>(
  table: SyncTable,
  operation: SyncOperation,
  record: T,
  userId: string
): Promise<void> {
  const db = getDB();

  // 1. Write to local DB
  if (operation === "DELETE") {
    await (db[table] as Dexie.Table<T>).delete(record.id);
  } else {
    await (db[table] as Dexie.Table<T>).put(record);
  }

  // 2. Enqueue for sync
  const queueItem: SyncQueueItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    table_name: table,
    operation,
    record_id: record.id,
    payload: record as unknown as Record<string, unknown>,
    created_at: new Date().toISOString(),
  };
  await db.syncQueue.add(queueItem);

  // 3. Attempt immediate sync (fire-and-forget)
  flushQueue(userId).catch(console.warn);
}

// ─── Queue flusher ────────────────────────────────────────────────────────────

let isFlushing = false;

export async function flushQueue(userId: string): Promise<{ synced: number; conflicts: number }> {
  if (isFlushing) return { synced: 0, conflicts: 0 };
  isFlushing = true;

  const db = getDB();
  const supabase = createClient();
  let synced = 0;
  let conflicts = 0;

  try {
    const pending = await db.syncQueue
      .where("user_id")
      .equals(userId)
      .filter((item) => !item.synced_at)
      .sortBy("created_at");

    for (const item of pending) {
      try {
        if (item.operation === "INSERT" || item.operation === "UPDATE") {
          // Check server version for conflict detection
          const { data: serverRecord } = await supabase
            .from(item.table_name)
            .select("id, updated_at")
            .eq("id", item.record_id)
            .maybeSingle();

          const localUpdatedAt = (item.payload as Record<string, string>).updated_at;
          const serverUpdatedAt = serverRecord?.updated_at;

          // Conflict: server is newer than local → server wins
          if (
            serverUpdatedAt &&
            localUpdatedAt &&
            new Date(serverUpdatedAt) > new Date(localUpdatedAt)
          ) {
            // Pull server version into local DB
            const { data: fresh } = await supabase
              .from(item.table_name)
              .select("*")
              .eq("id", item.record_id)
              .single();

            if (fresh) {
              await (db[item.table_name as SyncTable] as Dexie.Table).put(fresh);
            }
            conflicts++;
          } else {
            // Local wins → push to server
            const { error } = await supabase
              .from(item.table_name)
              .upsert(item.payload, { onConflict: "id" });

            if (error) throw error;
          }
        } else if (item.operation === "DELETE") {
          const { error } = await supabase
            .from(item.table_name)
            .delete()
            .eq("id", item.record_id);

          if (error) throw error;
        }

        // Mark as synced
        await db.syncQueue.update(item.id, { synced_at: new Date().toISOString() });
        synced++;
      } catch (err) {
        console.warn(`Sync failed for ${item.table_name}:${item.record_id}`, err);
      }
    }
  } finally {
    isFlushing = false;
  }

  return { synced, conflicts };
}

// ─── Full pull (initial load / reconnect) ────────────────────────────────────

export async function pullAllFromServer(userId: string): Promise<void> {
  const db = getDB();
  const supabase = createClient();

  for (const table of SYNC_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.warn(`Failed to pull ${table}:`, error);
      continue;
    }

    if (data && data.length > 0) {
      await (db[table] as Dexie.Table).bulkPut(data);
    }
  }
}
