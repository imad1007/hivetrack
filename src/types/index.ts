// ─── Plan Tiers ─────────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "scale";

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  plan_tier: PlanTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
}

// ─── Apiary ──────────────────────────────────────────────────────────────────

export type EnvironmentType =
  | "urban"
  | "suburban"
  | "rural"
  | "forest"
  | "agricultural"
  | "mountain";

export interface Apiary {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lng: number;
  altitude?: number;
  exposure?: string;
  environment_type?: EnvironmentType;
  water_nearby?: boolean;
  polygon_geojson?: object;
  created_at: string;
  updated_at: string;
}

// ─── Hive ────────────────────────────────────────────────────────────────────

export type HiveType = "langstroth" | "dadant" | "warré" | "top-bar" | "other";
export type HiveStatus = "active" | "dead" | "sold";

export interface Hive {
  id: string;
  apiary_id: string;
  user_id: string;
  name: string;
  type: HiveType;
  color_code?: string;
  qr_code_token: string;
  status: HiveStatus;
  created_at: string;
  updated_at: string;
}

// ─── Queen ───────────────────────────────────────────────────────────────────

export type QueenStatus = "present" | "missing" | "replaced";

export interface Queen {
  id: string;
  hive_id: string;
  mark_color: string;
  mark_year: number;
  breed?: string;
  origin?: string;
  introduced_at: string;
  status: QueenStatus;
  created_at: string;
}

// ─── Visit ───────────────────────────────────────────────────────────────────

export type ColonyBehavior = "calm" | "nervous" | "aggressive";

export interface WeatherSnapshot {
  temp_c: number;
  wind_kph: number;
  condition: string;
  icon: string;
  humidity?: number;
}

export interface Visit {
  id: string;
  hive_id: string;
  user_id: string;
  visited_at: string;
  template_id?: string;
  weather_json?: WeatherSnapshot;
  behavior?: ColonyBehavior;
  brood_frames?: number;
  stores_frames?: number;
  pollen_frames?: number;
  space_needed?: boolean;
  queen_seen?: boolean;
  queen_laying?: boolean;
  notes?: string;
  photos_urls?: string[];
  swarm_signs?: SwarmSign[];
  created_at: string;
  updated_at: string;
}

export type SwarmSign = "queen_cells" | "weight_loss" | "specific_buzzing";

// ─── Treatment ───────────────────────────────────────────────────────────────

export interface Treatment {
  id: string;
  hive_id: string;
  product_name: string;
  amm_code?: string;
  dosage?: string;
  start_date: string;
  end_date: string;
  withdrawal_days: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Feeding ─────────────────────────────────────────────────────────────────

export type FeedingType = "syrup_1_1" | "syrup_2_1" | "fondant" | "pollen_sub" | "other";
export type FoodType = "light_syrup" | "heavy_syrup" | "protein_paste" | "candi";
export type FeedingUnit = "kg" | "L";
export type FeedingSessionType = "collective" | "individual";

export interface Feeding {
  id: string;
  hive_id?: string;   // nullable — collective feedings use apiary_id
  apiary_id?: string;
  visit_id?: string;
  // legacy columns
  type?: FeedingType;
  quantity_liters?: number;
  // new columns
  food_type?: FoodType;
  quantity?: number;
  unit?: FeedingUnit;
  feeding_session_type?: FeedingSessionType;
  notes?: string;
  feeding_date: string;
  created_at: string;
}

// ─── Queen Rearing ────────────────────────────────────────────────────────────

export type RearingType   = "natural" | "grafting" | "division";
export type RearingStatus = "in_progress" | "success" | "failure";

export interface QueenRearing {
  id: string;
  hive_id: string;
  user_id: string;
  grafting_date: string;
  rearing_type: RearingType;
  status: RearingStatus;
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QueenRearingStage {
  id: string;
  queen_rearing_id: string;
  stage_name: string;
  estimated_date: string;
  alert_days_before: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface QueenRearingWithDetails extends QueenRearing {
  hives?: { name: string; apiary_id: string } | null;
  queen_rearing_stages?: QueenRearingStage[];
}

// ─── Swarm ───────────────────────────────────────────────────────────────────

export interface Swarm {
  id: string;
  hive_id: string;
  detected_at: string;
  queen_cells_found?: boolean;
  estimated_weight?: number;
  origin?: string;
  destination_hive_id?: string;
  notes?: string;
  created_at: string;
}

// ─── Harvest ─────────────────────────────────────────────────────────────────

export interface Harvest {
  id: string;
  apiary_id: string;
  user_id: string;
  harvest_date: string;
  flora_type?: string;
  total_weight_kg: number;
  humidity_percent?: number;
  avg_yield_per_hive?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Queen Line ───────────────────────────────────────────────────────────────

export interface QueenLine {
  id: string;
  user_id: string;
  breed: string;
  description?: string;
  traits_json?: Record<string, unknown>;
  created_at: string;
}

// ─── Visit Template ───────────────────────────────────────────────────────────

export interface VisitTemplate {
  id: string;
  user_id: string;
  name: string;
  fields_config_json: Record<string, unknown>;
  created_at: string;
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export type SyncOperation = "INSERT" | "UPDATE" | "DELETE";

export interface SyncQueueItem {
  id: string;
  user_id: string;
  table_name: string;
  operation: SyncOperation;
  record_id: string;
  payload: Record<string, unknown>;
  synced_at?: string;
  created_at: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface OverviewStats {
  total_hives: number;
  total_apiaries: number;
  hives_needing_attention: number;
  treatments_ending_soon: number;
  overwintering_mortality_rate: number;
  hive_ids_needing_attention: string[];
}

// ─── DAR Engine ──────────────────────────────────────────────────────────────

export interface DARResult {
  blocked: boolean;
  daysRemaining: number;
  message: string;
}

// ─── Queen Color ─────────────────────────────────────────────────────────────

export interface QueenColorResult {
  color: string;
  name: string;
  hex: string;
}

// ─── Swarm Risk ──────────────────────────────────────────────────────────────

export interface SwarmRiskResult {
  score: number;
  level: "low" | "medium" | "high";
}

// ─── Plan Limits ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<
  PlanTier,
  { apiaries: number; hives: number; export: boolean; qr: boolean; team: number }
> = {
  free: { apiaries: 2, hives: 10, export: false, qr: false, team: 0 },
  pro: { apiaries: 10, hives: Infinity, export: true, qr: true, team: 0 },
  scale: { apiaries: Infinity, hives: Infinity, export: true, qr: true, team: 3 },
};

// ─── API Response helpers ────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export interface ApiSuccess<T> {
  data: T;
}
