// Demo data used when no authenticated user is present (open-access mode).
// All IDs are fixed so detail-page links remain consistent across navigation.

import type { EnvironmentType, HiveType, HiveStatus, VarroaMethod, SplitType, SplitQueenStatus, SplitOutcome, RearingType, RearingStatus, FoodType, FeedingUnit, FeedingSessionType, QueenStatus } from "@/types";

const A1 = "aaaaaaaa-0000-0000-0000-000000000001";
const A2 = "aaaaaaaa-0000-0000-0000-000000000002";
const A3 = "aaaaaaaa-0000-0000-0000-000000000003";

const H1 = "bbbbbbbb-0000-0000-0000-000000000001";
const H2 = "bbbbbbbb-0000-0000-0000-000000000002";
const H3 = "bbbbbbbb-0000-0000-0000-000000000003";
const H4 = "bbbbbbbb-0000-0000-0000-000000000004";
const H5 = "bbbbbbbb-0000-0000-0000-000000000005";
const H6 = "bbbbbbbb-0000-0000-0000-000000000006";
const H7 = "bbbbbbbb-0000-0000-0000-000000000007";
const H8 = "bbbbbbbb-0000-0000-0000-000000000008";
const H9 = "bbbbbbbb-0000-0000-0000-000000000009";

// ─── Apiaries ────────────────────────────────────────────────────────────────

export const DEMO_APIARIES_ENRICHED = [
  {
    id: A1,
    user_id: "demo",
    name: "Rucher du Souss",
    lat: 30.42,
    lng: -9.59,
    altitude: 80,
    environment_type: "agricultural" as EnvironmentType,
    water_nearby: true,
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2025-03-01T00:00:00Z",
    hive_count: 3,
  },
  {
    id: A2,
    user_id: "demo",
    name: "Rucher de l'Atlas",
    lat: 31.52,
    lng: -7.68,
    altitude: 1200,
    environment_type: "mountain" as EnvironmentType,
    water_nearby: false,
    created_at: "2025-04-10T00:00:00Z",
    updated_at: "2025-04-10T00:00:00Z",
    hive_count: 3,
  },
  {
    id: A3,
    user_id: "demo",
    name: "Rucher Côte Atlantique",
    lat: 33.59,
    lng: -7.62,
    altitude: 20,
    environment_type: "rural" as EnvironmentType,
    water_nearby: true,
    created_at: "2025-05-15T00:00:00Z",
    updated_at: "2025-05-15T00:00:00Z",
    hive_count: 2,
  },
];

// ─── Hives ───────────────────────────────────────────────────────────────────

const QUEENS = [
  { id: "q1", hive_id: H1, mark_color: "yellow", mark_year: 2024, breed: "Apis mellifera intermissa", introduced_at: "2024-04-10", status: "present" as QueenStatus, created_at: "2024-04-10T00:00:00Z" },
  { id: "q2", hive_id: H2, mark_color: "white",  mark_year: 2025, breed: "Saharian local",           introduced_at: "2025-03-20", status: "present" as QueenStatus, created_at: "2025-03-20T00:00:00Z" },
  { id: "q3", hive_id: H3, mark_color: "yellow", mark_year: 2024, breed: "Apis mellifera intermissa", introduced_at: "2024-05-01", status: "present" as QueenStatus, created_at: "2024-05-01T00:00:00Z" },
  { id: "q4", hive_id: H4, mark_color: "green",  mark_year: 2023, breed: "Saharian local",           introduced_at: "2023-06-15", status: "present" as QueenStatus, created_at: "2023-06-15T00:00:00Z" },
  { id: "q5", hive_id: H5, mark_color: "blue",   mark_year: 2022, breed: "Apis mellifera intermissa", introduced_at: "2022-07-01", status: "present" as QueenStatus, created_at: "2022-07-01T00:00:00Z" },
  { id: "q6", hive_id: H6, mark_color: "red",    mark_year: 2025, breed: "Saharian local",           introduced_at: "2025-04-05", status: "present" as QueenStatus, created_at: "2025-04-05T00:00:00Z" },
  { id: "q7", hive_id: H7, mark_color: "yellow", mark_year: 2024, breed: "Apis mellifera intermissa", introduced_at: "2024-05-12", status: "present" as QueenStatus, created_at: "2024-05-12T00:00:00Z" },
  { id: "q8", hive_id: H8, mark_color: "white",  mark_year: 2025, breed: "Saharian local",           introduced_at: "2025-02-20", status: "present" as QueenStatus, created_at: "2025-02-20T00:00:00Z" },
];

export const DEMO_HIVES_WITH_DETAILS = [
  { id: H1, apiary_id: A1, user_id: "demo", name: "Zahara",             type: "langstroth" as HiveType, color_code: "#F59E0B", qr_code_token: "demo-h1", status: "active" as HiveStatus, created_at: "2025-03-02T00:00:00Z", updated_at: "2025-03-02T00:00:00Z", queens: [QUEENS[0]], apiaries: { id: A1, name: "Rucher du Souss" } },
  { id: H2, apiary_id: A1, user_id: "demo", name: "Nour",               type: "dadant"     as HiveType, color_code: "#EF4444", qr_code_token: "demo-h2", status: "active" as HiveStatus, created_at: "2025-03-02T00:00:00Z", updated_at: "2025-03-02T00:00:00Z", queens: [QUEENS[1]], apiaries: { id: A1, name: "Rucher du Souss" } },
  { id: H3, apiary_id: A1, user_id: "demo", name: "Baraka",             type: "langstroth" as HiveType, color_code: "#10B981", qr_code_token: "demo-h3", status: "active" as HiveStatus, created_at: "2025-03-10T00:00:00Z", updated_at: "2025-03-10T00:00:00Z", queens: [QUEENS[2]], apiaries: { id: A1, name: "Rucher du Souss" } },
  { id: H4, apiary_id: A2, user_id: "demo", name: "Asni",               type: "warré"      as HiveType, color_code: "#3B82F6", qr_code_token: "demo-h4", status: "active" as HiveStatus, created_at: "2025-04-11T00:00:00Z", updated_at: "2025-04-11T00:00:00Z", queens: [QUEENS[3]], apiaries: { id: A2, name: "Rucher de l'Atlas" } },
  { id: H5, apiary_id: A2, user_id: "demo", name: "Taghia",             type: "langstroth" as HiveType, color_code: "#8B5CF6", qr_code_token: "demo-h5", status: "active" as HiveStatus, created_at: "2025-04-11T00:00:00Z", updated_at: "2025-04-11T00:00:00Z", queens: [QUEENS[4]], apiaries: { id: A2, name: "Rucher de l'Atlas" } },
  { id: H6, apiary_id: A2, user_id: "demo", name: "Imilchil",           type: "dadant"     as HiveType, color_code: "#F97316", qr_code_token: "demo-h6", status: "active" as HiveStatus, created_at: "2025-04-15T00:00:00Z", updated_at: "2025-04-15T00:00:00Z", queens: [QUEENS[5]], apiaries: { id: A2, name: "Rucher de l'Atlas" } },
  { id: H7, apiary_id: A3, user_id: "demo", name: "Asilah",             type: "langstroth" as HiveType, color_code: "#EC4899", qr_code_token: "demo-h7", status: "active" as HiveStatus, created_at: "2025-05-16T00:00:00Z", updated_at: "2025-05-16T00:00:00Z", queens: [QUEENS[6]], apiaries: { id: A3, name: "Rucher Côte Atlantique" } },
  { id: H8, apiary_id: A3, user_id: "demo", name: "Moulay Bousselham",  type: "dadant"     as HiveType, color_code: "#14B8A6", qr_code_token: "demo-h8", status: "active" as HiveStatus, created_at: "2025-05-16T00:00:00Z", updated_at: "2025-05-16T00:00:00Z", queens: [QUEENS[7]], apiaries: { id: A3, name: "Rucher Côte Atlantique" } },
  { id: H9, apiary_id: A3, user_id: "demo", name: "Kenitra",            type: "top-bar"    as HiveType, color_code: "#6B7280", qr_code_token: "demo-h9", status: "dead"   as HiveStatus, created_at: "2025-05-20T00:00:00Z", updated_at: "2026-01-10T00:00:00Z", queens: [],          apiaries: { id: A3, name: "Rucher Côte Atlantique" } },
];

export const DEMO_LAST_VISIT_MAP: Record<string, string> = {
  [H1]: "2026-06-28T09:00:00Z",
  [H2]: "2026-06-25T10:30:00Z",
  // H3 has no recent visit — will be flagged as needing attention
  [H4]: "2026-06-30T08:00:00Z",
  [H5]: "2026-06-22T11:00:00Z",
  [H6]: "2026-06-28T14:00:00Z",
  // H7 also no recent visit
  [H8]: "2026-07-01T09:00:00Z",
};

// ─── Treatments ──────────────────────────────────────────────────────────────

export const DEMO_TREATMENTS = [
  {
    id: "t1",
    hive_id: H1,
    product_name: "Apiguard",
    amm_code: "AMM 95/204",
    dosage: "1 plateau de 25g par ruche",
    start_date: "2026-06-10",
    end_date: "2026-07-20",
    withdrawal_days: 42,
    notes: "Traitement varroa printemps. Poser le plateau sur les cadres.",
    created_at: "2026-06-10T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
    hives: { id: H1, name: "Zahara", apiary_id: A1, apiaries: { name: "Rucher du Souss" } },
  },
  {
    id: "t2",
    hive_id: H6,
    product_name: "Acide oxalique (sublimation)",
    amm_code: "AMM 34/2017",
    dosage: "2.1g par ruche",
    start_date: "2026-06-28",
    end_date: "2026-07-06",
    withdrawal_days: 0,
    notes: "Traitement d'urgence — infestation à 4%.",
    created_at: "2026-06-28T00:00:00Z",
    updated_at: "2026-06-28T00:00:00Z",
    hives: { id: H6, name: "Imilchil", apiary_id: A2, apiaries: { name: "Rucher de l'Atlas" } },
  },
  {
    id: "t3",
    hive_id: H3,
    product_name: "ApiLife Var",
    amm_code: "AMM 01/2020",
    dosage: "1 tablette par corps de ruche",
    start_date: "2026-04-01",
    end_date: "2026-05-15",
    withdrawal_days: 30,
    notes: "Traitement de printemps — thymol.",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    hives: { id: H3, name: "Baraka", apiary_id: A1, apiaries: { name: "Rucher du Souss" } },
  },
  {
    id: "t4",
    hive_id: H5,
    product_name: "Thymovar",
    amm_code: "AMM 78/1999",
    dosage: "1 éponge (15g) par ruche",
    start_date: "2026-03-01",
    end_date: "2026-04-20",
    withdrawal_days: 56,
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    hives: { id: H5, name: "Taghia", apiary_id: A2, apiaries: { name: "Rucher de l'Atlas" } },
  },
];

// ─── Harvests ────────────────────────────────────────────────────────────────

export const DEMO_HARVESTS = [
  {
    id: "harv1",
    apiary_id: A1,
    user_id: "demo",
    harvest_date: "2026-06-20",
    flora_type: "Acacia",
    total_weight_kg: 85,
    humidity_percent: 17.2,
    avg_yield_per_hive: 28.3,
    notes: "Excellente miellée d'acacia. Miel de couleur claire, cristallisation lente.",
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
    apiaries: { name: "Rucher du Souss" },
  },
  {
    id: "harv2",
    apiary_id: A2,
    user_id: "demo",
    harvest_date: "2026-06-10",
    flora_type: "Thym",
    total_weight_kg: 62,
    humidity_percent: 18.1,
    avg_yield_per_hive: 20.7,
    notes: "Miel de thym aromatique. Légèrement plus foncé que prévu.",
    created_at: "2026-06-10T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
    apiaries: { name: "Rucher de l'Atlas" },
  },
  {
    id: "harv3",
    apiary_id: A3,
    user_id: "demo",
    harvest_date: "2026-05-15",
    flora_type: "Toutes fleurs",
    total_weight_kg: 45,
    humidity_percent: 19.5,
    avg_yield_per_hive: 22.5,
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    apiaries: { name: "Rucher Côte Atlantique" },
  },
  {
    id: "harv4",
    apiary_id: A1,
    user_id: "demo",
    harvest_date: "2026-01-20",
    flora_type: "Jujubier (Sidr)",
    total_weight_kg: 120,
    humidity_percent: 16.8,
    avg_yield_per_hive: 40,
    notes: "Excellente récolte de miel de jujubier. Couleur ambrée, arôme prononcé.",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    apiaries: { name: "Rucher du Souss" },
  },
];

// ─── Feedings ────────────────────────────────────────────────────────────────

export const DEMO_FEEDINGS = [
  {
    id: "feed1",
    hive_id: H1,
    apiary_id: null,
    food_type: "fondant" as FoodType,
    quantity: 2,
    unit: "kg" as FeedingUnit,
    feeding_session_type: "individual" as FeedingSessionType,
    feeding_date: "2026-02-05",
    notes: "Nourrissage hivernal préventif.",
    created_at: "2026-02-05T00:00:00Z",
    hives: { name: "Zahara" },
    apiaries: null,
  },
  {
    id: "feed2",
    hive_id: null,
    apiary_id: A3,
    food_type: "light_syrup" as FoodType,
    quantity: 20,
    unit: "L" as FeedingUnit,
    feeding_session_type: "collective" as FeedingSessionType,
    feeding_date: "2026-01-20",
    notes: "Nourrissage collectif rucher côtier — période de disette.",
    created_at: "2026-01-20T00:00:00Z",
    hives: null,
    apiaries: { name: "Rucher Côte Atlantique" },
  },
  {
    id: "feed3",
    hive_id: H4,
    apiary_id: null,
    food_type: "heavy_syrup" as FoodType,
    quantity: 5,
    unit: "L" as FeedingUnit,
    feeding_session_type: "individual" as FeedingSessionType,
    feeding_date: "2026-01-10",
    notes: null,
    created_at: "2026-01-10T00:00:00Z",
    hives: { name: "Asni" },
    apiaries: null,
  },
  {
    id: "feed4",
    hive_id: H7,
    apiary_id: null,
    food_type: "light_syrup" as FoodType,
    quantity: 3,
    unit: "L" as FeedingUnit,
    feeding_session_type: "individual" as FeedingSessionType,
    feeding_date: "2026-01-28",
    notes: null,
    created_at: "2026-01-28T00:00:00Z",
    hives: { name: "Asilah" },
    apiaries: null,
  },
  {
    id: "feed5",
    hive_id: H2,
    apiary_id: null,
    food_type: "protein_paste" as FoodType,
    quantity: 1,
    unit: "kg" as FeedingUnit,
    feeding_session_type: "individual" as FeedingSessionType,
    feeding_date: "2026-02-15",
    notes: "Stimulation de ponte.",
    created_at: "2026-02-15T00:00:00Z",
    hives: { name: "Nour" },
    apiaries: null,
  },
];

// ─── Varroa checks ───────────────────────────────────────────────────────────

export const DEMO_VARROA_HIVES = [
  { id: H1, name: "Zahara",            color_code: "#F59E0B" },
  { id: H2, name: "Nour",              color_code: "#EF4444" },
  { id: H3, name: "Baraka",            color_code: "#10B981" },
  { id: H4, name: "Asni",              color_code: "#3B82F6" },
  { id: H5, name: "Taghia",            color_code: "#8B5CF6" },
  { id: H6, name: "Imilchil",          color_code: "#F97316" },
  { id: H7, name: "Asilah",            color_code: "#EC4899" },
  { id: H8, name: "Moulay Bousselham", color_code: "#14B8A6" },
];

export const DEMO_VARROA_CHECKS_MAP: Record<string, { check_date: string; mites_counted: number; bees_sampled: number; method: VarroaMethod } | null> = {
  [H1]: { check_date: "2026-06-15", mites_counted: 3, bees_sampled: 100, method: "alcohol_wash" },
  [H2]: { check_date: "2026-06-20", mites_counted: 1, bees_sampled: 100, method: "sugar_roll"   },
  [H3]: { check_date: "2026-05-25", mites_counted: 2, bees_sampled: 100, method: "alcohol_wash" },
  [H4]: { check_date: "2026-06-25", mites_counted: 2, bees_sampled: 100, method: "alcohol_wash" },
  [H5]: { check_date: "2026-06-18", mites_counted: 0, bees_sampled: 100, method: "sugar_roll"   },
  [H6]: { check_date: "2026-06-22", mites_counted: 4, bees_sampled: 100, method: "alcohol_wash" },
  [H7]: { check_date: "2026-05-28", mites_counted: 1, bees_sampled: 100, method: "alcohol_wash" },
  [H8]: { check_date: "2026-06-28", mites_counted: 1, bees_sampled: 100, method: "alcohol_wash" },
};

// ─── Queen rearing ───────────────────────────────────────────────────────────

export const DEMO_QUEEN_REARINGS = [
  {
    id: "qr1",
    hive_id: H3,
    user_id: "demo",
    grafting_date: "2026-06-10",
    rearing_type: "grafting" as RearingType,
    status: "in_progress" as RearingStatus,
    notes: "Élevage de reines à partir de larves sélectionnées de la ruche Baraka.",
    created_at: "2026-06-10T00:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
    hives: { name: "Baraka", apiary_id: A1 },
    queen_rearing_stages: [
      { id: "qrs1", queen_rearing_id: "qr1", stage_name: "Operculation cellule royale", estimated_date: "2026-06-15", alert_days_before: 1, completed: true,  completed_at: "2026-06-15T00:00:00Z", created_at: "2026-06-10T00:00:00Z" },
      { id: "qrs2", queen_rearing_id: "qr1", stage_name: "Naissance de la reine",       estimated_date: "2026-06-26", alert_days_before: 1, completed: true,  completed_at: "2026-06-26T00:00:00Z", created_at: "2026-06-10T00:00:00Z" },
      { id: "qrs3", queen_rearing_id: "qr1", stage_name: "Vol de fécondation",          estimated_date: "2026-07-02", alert_days_before: 3, completed: false, completed_at: null,                    created_at: "2026-06-10T00:00:00Z" },
      { id: "qrs4", queen_rearing_id: "qr1", stage_name: "Ponte observée",              estimated_date: "2026-07-07", alert_days_before: 3, completed: false, completed_at: null,                    created_at: "2026-06-10T00:00:00Z" },
    ],
  },
  {
    id: "qr2",
    hive_id: H5,
    user_id: "demo",
    grafting_date: "2026-03-15",
    rearing_type: "natural" as RearingType,
    status: "success" as RearingStatus,
    notes: "Élevage naturel — cellules royales spontanées gérées.",
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-04-20T00:00:00Z",
    hives: { name: "Taghia", apiary_id: A2 },
    queen_rearing_stages: [
      { id: "qrs5", queen_rearing_id: "qr2", stage_name: "Operculation cellule royale", estimated_date: "2026-03-20", alert_days_before: 1, completed: true, completed_at: "2026-03-20T00:00:00Z", created_at: "2026-03-15T00:00:00Z" },
      { id: "qrs6", queen_rearing_id: "qr2", stage_name: "Naissance de la reine",       estimated_date: "2026-03-31", alert_days_before: 1, completed: true, completed_at: "2026-03-31T00:00:00Z", created_at: "2026-03-15T00:00:00Z" },
      { id: "qrs7", queen_rearing_id: "qr2", stage_name: "Vol de fécondation",          estimated_date: "2026-04-06", alert_days_before: 3, completed: true, completed_at: "2026-04-07T00:00:00Z", created_at: "2026-03-15T00:00:00Z" },
      { id: "qrs8", queen_rearing_id: "qr2", stage_name: "Ponte observée",              estimated_date: "2026-04-11", alert_days_before: 3, completed: true, completed_at: "2026-04-12T00:00:00Z", created_at: "2026-03-15T00:00:00Z" },
    ],
  },
];

// ─── Splits ──────────────────────────────────────────────────────────────────

export const DEMO_SPLITS = [
  {
    id: "sp1",
    source_hive_id: H1,
    new_hive_id: H7,
    user_id: "demo",
    split_date: "2026-05-10",
    split_type: "walk_away" as SplitType,
    queen_status: "queen_cell" as SplitQueenStatus,
    outcome: "success" as SplitOutcome,
    notes: "Division de prévention d'essaimage. Ruche Zahara très forte.",
    created_at: "2026-05-10T00:00:00Z",
  },
  {
    id: "sp2",
    source_hive_id: H3,
    new_hive_id: null,
    user_id: "demo",
    split_date: "2026-06-15",
    split_type: "artificial_swarm" as SplitType,
    queen_status: "virgin_queen" as SplitQueenStatus,
    outcome: null,
    notes: "Reine vierge en attente de fécondation — résultat à confirmer.",
    created_at: "2026-06-15T00:00:00Z",
  },
];

export const DEMO_SPLITS_HIVE_MAP: Record<string, string> = {
  [H1]: "Zahara",
  [H2]: "Nour",
  [H3]: "Baraka",
  [H4]: "Asni",
  [H5]: "Taghia",
  [H6]: "Imilchil",
  [H7]: "Asilah",
  [H8]: "Moulay Bousselham",
  [H9]: "Kenitra",
};

// ─── Dashboard stats & charts ─────────────────────────────────────────────────

export const DEMO_STATS = {
  total_hives: 8,
  total_apiaries: 3,
  hives_needing_attention: 2, // H3 and H7 not visited in 14+ days
  treatments_ending_soon: 1,  // T2 (oxalic acid) ends July 6
};

export const DEMO_VISITS_CHART_DATA = [
  { week: "W11", visits: 2 },
  { week: "W10", visits: 1 },
  { week: "W9",  visits: 2 },
  { week: "W8",  visits: 1 },
  { week: "W7",  visits: 2 },
  { week: "W6",  visits: 2 },
  { week: "W5",  visits: 2 },
  { week: "W4",  visits: 2 },
  { week: "W3",  visits: 1 },
  { week: "W2",  visits: 2 },
  { week: "W1",  visits: 2 },
  { week: "W0",  visits: 4 },
];

export const DEMO_HARVEST_CHART_DATA = [
  { apiary: "Rucher du Souss",        kg: 205 },
  { apiary: "Rucher de l'Atlas",      kg: 62  },
  { apiary: "Rucher Côte Atlantique", kg: 45  },
];

export const DEMO_TASKS = [
  { label: "Treatment ending: Acide oxalique — Imilchil", date: "2026-07-06", type: "treatment" as const },
  { label: "Treatment ending: Apiguard — Zahara",         date: "2026-07-20", type: "treatment" as const },
];

export const DEMO_QUEEN_ALERTS = [
  {
    rearing_id: "qr1",
    stage_id:   "qrs3",
    stage_name: "Vol de fécondation",
    hive_name:  "Baraka",
    estimated_date: "2026-07-02",
    days_away: 0,
  },
];

export const DEMO_VARROA_ALERTS = [
  { hive_id: H6, hive_name: "Imilchil", pct: 4.0, overdue: false },
  { hive_id: H1, hive_name: "Zahara",   pct: 3.0, overdue: false },
];

export const DEMO_FEEDING_SUGGESTIONS: { hive_id: string; hive_name: string; days_since: number }[] = [];
