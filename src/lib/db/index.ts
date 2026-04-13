import Dexie, { type Table } from "dexie";
import type {
  Apiary,
  Hive,
  Queen,
  Visit,
  Treatment,
  Feeding,
  Swarm,
  Harvest,
  SyncQueueItem,
} from "@/types";

export class HiveTrackDB extends Dexie {
  apiaries!: Table<Apiary>;
  hives!: Table<Hive>;
  queens!: Table<Queen>;
  visits!: Table<Visit>;
  treatments!: Table<Treatment>;
  feedings!: Table<Feeding>;
  swarms!: Table<Swarm>;
  harvests!: Table<Harvest>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("HiveTrackDB");

    this.version(1).stores({
      apiaries:   "id, user_id, name, created_at, updated_at",
      hives:      "id, apiary_id, user_id, status, qr_code_token, created_at, updated_at",
      queens:     "id, hive_id, status, introduced_at",
      visits:     "id, hive_id, user_id, visited_at, created_at, updated_at",
      treatments: "id, hive_id, start_date, end_date, created_at, updated_at",
      feedings:   "id, hive_id, visit_id, feeding_date, created_at",
      swarms:     "id, hive_id, detected_at, created_at",
      harvests:   "id, apiary_id, user_id, harvest_date, created_at, updated_at",
      syncQueue:  "id, user_id, table_name, operation, record_id, synced_at, created_at",
    });
  }
}

// Singleton instance — safe to share across the app
let _db: HiveTrackDB | null = null;

export function getDB(): HiveTrackDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie can only be used in the browser");
  }
  if (!_db) {
    _db = new HiveTrackDB();
  }
  return _db;
}
