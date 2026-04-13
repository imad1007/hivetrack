"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { flushQueue, pullAllFromServer } from "@/lib/sync/sync-engine";
import { getDB } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

export function useSync() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const db = getDB();
      const count = await db.syncQueue
        .where("synced_at")
        .equals("")
        .count()
        .catch(() => 0);
      // Dexie doesn't support null filter with equals("") — use filter instead
      const pending = await db.syncQueue.filter((item) => !item.synced_at).count();
      setPendingCount(pending);
    } catch {
      // DB not available in SSR
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!userIdRef.current || !navigator.onLine) return;
    setSyncing(true);
    try {
      const { synced, conflicts } = await flushQueue(userIdRef.current);
      if (synced > 0 || conflicts > 0) {
        const msg = [
          synced > 0 ? `${synced} change${synced > 1 ? "s" : ""} synced` : "",
          conflicts > 0 ? `${conflicts} conflict${conflicts > 1 ? "s" : ""} resolved` : "",
        ]
          .filter(Boolean)
          .join(", ");
        toast({ title: "Sync complete", description: msg, variant: "success" });
      }
      setLastSynced("just now");
      await updatePendingCount();
    } catch (err) {
      console.warn("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [updatePendingCount]);

  useEffect(() => {
    setOnline(navigator.onLine);
    updatePendingCount();

    const onOnline = () => {
      setOnline(true);
      runSync();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Initial pull on mount
    if (navigator.onLine && userIdRef.current) {
      pullAllFromServer(userIdRef.current).catch(console.warn);
    }

    // Periodic sync every 2 minutes
    const interval = setInterval(runSync, 2 * 60 * 1000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [runSync, updatePendingCount]);

  return { online, syncing, pendingCount, lastSynced };
}
