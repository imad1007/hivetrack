/**
 * Seed script — creates a realistic demo beekeeper account for presentations.
 * Run: node scripts/seed-demo-beekeeper.mjs
 *
 * Credentials created:
 *   Email:    demo.beekeeper@hivetrack.app
 *   Password: HiveDemo2024!
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ── Load .env.local manually ──────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL = "demo.beekeeper@hivetrack.app";
const DEMO_PASSWORD = "HiveDemo2024!";

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function dateOnly(iso) {
  return iso.slice(0, 10);
}
function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("🐝  HiveTrack — Demo Beekeeper Seed Script\n");

  // ── 1. Create or reuse auth user ──────────────────────────────────────────
  console.log("Creating user account…");
  const { data: existingList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = existingList?.users?.find((u) => u.email === DEMO_EMAIL);

  let userId;
  if (existing) {
    userId = existing.id;
    // Unban if banned
    await supabase.auth.admin.updateUserById(userId, { ban_duration: "none", password: DEMO_PASSWORD });
    console.log(`  ✓ Reusing existing user (${userId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Ahmed Benali" },
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    userId = data.user.id;
    console.log(`  ✓ Created user (${userId})`);
  }

  // ── 2. Upsert profile ─────────────────────────────────────────────────────
  await supabase.from("profiles").upsert({ user_id: userId, full_name: "Ahmed Benali" }, { onConflict: "user_id" });
  console.log("  ✓ Profile upserted");

  // ── 3. Clear previous demo data for this user ─────────────────────────────
  console.log("\nClearing previous data for this user…");
  const { data: oldHives } = await supabase.from("hives").select("id").eq("user_id", userId);
  if (oldHives?.length) {
    const ids = oldHives.map((h) => h.id);
    await supabase.from("varroa_checks").delete().in("hive_id", ids);
    await supabase.from("hive_splits").delete().eq("user_id", userId);
    await supabase.from("queen_rearings").delete().eq("user_id", userId);
    await supabase.from("feedings").delete().in("hive_id", ids);
    await supabase.from("treatments").delete().in("hive_id", ids);
    await supabase.from("visits").delete().in("hive_id", ids);
    await supabase.from("queens").delete().in("hive_id", ids);
  }
  await supabase.from("harvests").delete().eq("user_id", userId);
  await supabase.from("hives").delete().eq("user_id", userId);
  await supabase.from("apiaries").delete().eq("user_id", userId);
  console.log("  ✓ Cleared");

  // ── 4. Apiaries ───────────────────────────────────────────────────────────
  console.log("\nInserting apiaries…");
  const { data: apiaries } = await supabase.from("apiaries").insert([
    {
      user_id: userId, name: "Rucher Saidia",
      lat: 35.087, lng: -2.228, altitude: 18,
      environment_type: "agricultural", exposure: "SE",
      water_nearby: true,
    },
    {
      user_id: userId, name: "Rucher Berkane Est",
      lat: 34.935, lng: -2.285, altitude: 252,
      environment_type: "agricultural", exposure: "S",
      water_nearby: false,
    },
    {
      user_id: userId, name: "Rucher Beni Snassen",
      lat: 34.980, lng: -2.520, altitude: 580,
      environment_type: "mountain", exposure: "SW",
      water_nearby: true,
    },
  ]).select();
  const [ap1, ap2, ap3] = apiaries;
  console.log(`  ✓ 3 apiaries`);

  // ── 5. Hives ──────────────────────────────────────────────────────────────
  console.log("Inserting hives…");
  const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6", "#F97316"];
  const HIVE_DEFS = [
    // Apiary 1 — Rucher Saidia (5 hives)
    { apiary_id: ap1.id, name: "Saidia-01", type: "langstroth", color_code: COLORS[0], status: "active" },
    { apiary_id: ap1.id, name: "Saidia-02", type: "langstroth", color_code: COLORS[1], status: "active" },
    { apiary_id: ap1.id, name: "Saidia-03", type: "dadant",     color_code: COLORS[2], status: "active" },
    { apiary_id: ap1.id, name: "Saidia-04", type: "langstroth", color_code: COLORS[3], status: "active" },
    { apiary_id: ap1.id, name: "Saidia-05", type: "langstroth", color_code: COLORS[4], status: "dead"   },
    // Apiary 2 — Rucher Berkane Est (6 hives)
    { apiary_id: ap2.id, name: "Berkane-01", type: "langstroth", color_code: COLORS[0], status: "active" },
    { apiary_id: ap2.id, name: "Berkane-02", type: "langstroth", color_code: COLORS[1], status: "active" },
    { apiary_id: ap2.id, name: "Berkane-03", type: "dadant",     color_code: COLORS[2], status: "active" },
    { apiary_id: ap2.id, name: "Berkane-04", type: "langstroth", color_code: COLORS[3], status: "active" },
    { apiary_id: ap2.id, name: "Berkane-05", type: "langstroth", color_code: COLORS[5], status: "active" },
    { apiary_id: ap2.id, name: "Berkane-06", type: "dadant",     color_code: COLORS[4], status: "active" },
    // Apiary 3 — Rucher Beni Snassen (4 hives)
    { apiary_id: ap3.id, name: "Snassen-01", type: "langstroth", color_code: COLORS[1], status: "active" },
    { apiary_id: ap3.id, name: "Snassen-02", type: "langstroth", color_code: COLORS[2], status: "active" },
    { apiary_id: ap3.id, name: "Snassen-03", type: "dadant",     color_code: COLORS[0], status: "active" },
    { apiary_id: ap3.id, name: "Snassen-04", type: "langstroth", color_code: COLORS[5], status: "sold"   },
  ].map((h) => ({ ...h, user_id: userId }));

  const { data: hives } = await supabase.from("hives").insert(HIVE_DEFS).select();
  console.log(`  ✓ ${hives.length} hives`);

  const activeHives = hives.filter((h) => h.status === "active");

  // ── 6. Queens ─────────────────────────────────────────────────────────────
  console.log("Inserting queens…");
  const MARK_COLORS_BY_YEAR = { 2021: "white", 2022: "yellow", 2023: "red", 2024: "green", 2025: "blue" };
  const queenRows = activeHives.map((h, i) => {
    const year = [2023, 2023, 2024, 2024, 2024, 2024, 2025, 2025, 2025, 2025, 2024, 2023, 2024][i % 13];
    return {
      hive_id: h.id,
      mark_color: MARK_COLORS_BY_YEAR[year],
      mark_year: year,
      breed: pick(["Apis mellifera intermissa", "Apis mellifera sahariensis", "Hybride locale"]),
      origin: pick(["Sélection ORMVAM", "Rucher local", "Marché apicole Berkane"]),
      introduced_at: daysAgo(pick([30, 60, 120, 180, 240, 365])),
      status: "present",
    };
  });
  await supabase.from("queens").insert(queenRows);
  console.log(`  ✓ ${queenRows.length} queens`);

  // ── 7. Visits ─────────────────────────────────────────────────────────────
  console.log("Inserting visits…");
  const visitRows = [];
  // Generate ~10 months of visits per active hive (bi-weekly in season, monthly off-season)
  const visitSchedule = [
    { daysAgo: 300, season: "winter" },
    { daysAgo: 270, season: "winter" },
    { daysAgo: 240, season: "spring" },
    { daysAgo: 225, season: "spring" },
    { daysAgo: 210, season: "spring" },
    { daysAgo: 195, season: "spring" },
    { daysAgo: 180, season: "preswarm" },
    { daysAgo: 165, season: "preswarm" },
    { daysAgo: 150, season: "flow" },
    { daysAgo: 135, season: "flow" },
    { daysAgo: 120, season: "flow" },
    { daysAgo: 105, season: "postharvest" },
    { daysAgo: 90,  season: "postharvest" },
    { daysAgo: 75,  season: "treatment" },
    { daysAgo: 60,  season: "treatment" },
    { daysAgo: 45,  season: "prep" },
    { daysAgo: 30,  season: "prep" },
    { daysAgo: 14,  season: "prep" },
    { daysAgo: 7,   season: "prep" },
  ];

  const seasonData = {
    winter:      { brood: [2,4],   stores: [4,7],  pollen: [1,2], queenSeen: 0.5, behavior: ["calm","calm","nervous"] },
    spring:      { brood: [5,8],   stores: [3,6],  pollen: [3,5], queenSeen: 0.8, behavior: ["calm","calm"] },
    preswarm:    { brood: [7,10],  stores: [2,4],  pollen: [4,6], queenSeen: 0.7, behavior: ["nervous","calm","calm"] },
    flow:        { brood: [6,9],   stores: [6,10], pollen: [3,5], queenSeen: 0.85, behavior: ["calm","calm"] },
    postharvest: { brood: [4,7],   stores: [3,5],  pollen: [2,4], queenSeen: 0.75, behavior: ["calm","calm","nervous"] },
    treatment:   { brood: [3,6],   stores: [4,7],  pollen: [1,3], queenSeen: 0.8, behavior: ["calm","calm"] },
    prep:        { brood: [2,5],   stores: [5,8],  pollen: [1,2], queenSeen: 0.7, behavior: ["calm"] },
  };

  for (const hive of activeHives) {
    for (const slot of visitSchedule) {
      const sd = seasonData[slot.season];
      const queenSeen = Math.random() < sd.queenSeen;
      visitRows.push({
        hive_id: hive.id,
        user_id: userId,
        visited_at: daysAgo(slot.daysAgo + Math.floor(Math.random() * 2)),
        behavior: pick(sd.behavior),
        brood_frames: Math.floor(randomBetween(...sd.brood)),
        stores_frames: Math.floor(randomBetween(...sd.stores)),
        pollen_frames: Math.floor(randomBetween(...sd.pollen)),
        queen_seen: queenSeen,
        queen_laying: queenSeen ? Math.random() > 0.1 : false,
        space_needed: slot.season === "flow" && Math.random() > 0.4,
        notes: pick([
          null, null, null,
          "Colonie bien développée, reine active.",
          "Quelques cellules royales observées, à surveiller.",
          "Bon cadre de couvain operculé.",
          "Réserves suffisantes pour la saison.",
          "Population en forte croissance.",
          "Signes de miellée active.",
        ]),
      });
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < visitRows.length; i += 100) {
    await supabase.from("visits").insert(visitRows.slice(i, i + 100));
  }
  console.log(`  ✓ ${visitRows.length} visits`);

  // ── 8. Treatments ─────────────────────────────────────────────────────────
  console.log("Inserting treatments…");
  const treatmentRows = [];
  for (const hive of activeHives) {
    // Autumn Apivar treatment (Sep-Oct)
    treatmentRows.push({
      hive_id: hive.id,
      product_name: "Apivar",
      amm_code: "FR/AMM/2002/0066",
      dosage: "2 lanières / colonie",
      start_date: dateOnly(daysAgo(85)),
      end_date: dateOnly(daysAgo(43)),
      withdrawal_days: 56,
      notes: "Traitement varroa automne. Infestation initiale >3%.",
    });
    // Spring oxalic acid dribble (Feb)
    treatmentRows.push({
      hive_id: hive.id,
      product_name: "Acide oxalique (Oxybee)",
      amm_code: "FR/AMM/2015/0003",
      dosage: "5 ml / intervalle de cadres occupé",
      start_date: dateOnly(daysAgo(260)),
      end_date: dateOnly(daysAgo(260)),
      withdrawal_days: 0,
      notes: "Traitement hivernal par léchage sur essaim sans couvain.",
    });
  }
  await supabase.from("treatments").insert(treatmentRows);
  console.log(`  ✓ ${treatmentRows.length} treatments`);

  // ── 9. Varroa checks ──────────────────────────────────────────────────────
  console.log("Inserting varroa checks…");
  const varroaRows = [];
  const varroaDates = [300, 240, 180, 120, 90, 60, 30];
  for (const hive of activeHives) {
    for (const d of varroaDates) {
      const isPreTreatment = d > 90 && d < 200;
      const mites = isPreTreatment
        ? Math.floor(randomBetween(3, 9))
        : Math.floor(randomBetween(0, 2));
      varroaRows.push({
        hive_id: hive.id,
        user_id: userId,
        check_date: dateOnly(daysAgo(d)),
        method: pick(["alcohol_wash", "sugar_roll", "alcohol_wash"]),
        mites_counted: mites,
        bees_sampled: 100,
        notes: mites >= 3
          ? "Taux élevé — traitement requis."
          : mites > 0
            ? "Taux acceptable. Surveillance continue."
            : "Aucun varroa détecté.",
      });
    }
  }
  await supabase.from("varroa_checks").insert(varroaRows);
  console.log(`  ✓ ${varroaRows.length} varroa checks`);

  // ── 10. Feedings ──────────────────────────────────────────────────────────
  console.log("Inserting feedings…");
  const feedingRows = [];
  // Collective autumn feeding per apiary
  for (const ap of [ap1, ap2, ap3]) {
    feedingRows.push({
      apiary_id: ap.id,
      type: "syrup_2_1",
      food_type: "heavy_syrup",
      quantity: 15,
      unit: "L",
      feeding_date: dateOnly(daysAgo(55)),
      feeding_session_type: "collective",
      notes: "Nourrissement stimulant avant hivernage — sirop 2:1 sucre/eau.",
    });
    feedingRows.push({
      apiary_id: ap.id,
      type: "syrup_1_1",
      food_type: "light_syrup",
      quantity: 10,
      unit: "L",
      feeding_date: dateOnly(daysAgo(230)),
      feeding_session_type: "collective",
      notes: "Nourrissement stimulant de printemps — sirop 1:1.",
    });
  }
  // Individual fondant for weak hives
  for (const hive of activeHives.slice(0, 4)) {
    feedingRows.push({
      hive_id: hive.id,
      type: "fondant",
      food_type: "candi",
      quantity: 1,
      unit: "kg",
      feeding_date: dateOnly(daysAgo(40)),
      feeding_session_type: "individual",
      notes: "Candi hivernal pour compléter réserves.",
    });
  }
  await supabase.from("feedings").insert(feedingRows);
  console.log(`  ✓ ${feedingRows.length} feedings`);

  // ── 11. Harvests ──────────────────────────────────────────────────────────
  console.log("Inserting harvests…");
  const harvestRows = [
    // Spring harvest — orange blossom (April)
    { apiary_id: ap1.id, user_id: userId, harvest_date: dateOnly(daysAgo(200)), flora_type: "fleur d'oranger", total_weight_kg: 48.5, humidity_percent: 17.2, avg_yield_per_hive: 9.7, notes: "Excellente miellée d'oranger. Miel clair et très parfumé." },
    { apiary_id: ap2.id, user_id: userId, harvest_date: dateOnly(daysAgo(198)), flora_type: "fleur d'oranger", total_weight_kg: 72.0, humidity_percent: 17.5, avg_yield_per_hive: 12.0, notes: "Meilleure récolte du rucher. Météo favorable." },
    { apiary_id: ap3.id, user_id: userId, harvest_date: dateOnly(daysAgo(202)), flora_type: "thym sauvage", total_weight_kg: 36.0, humidity_percent: 16.8, avg_yield_per_hive: 9.0, notes: "Miel de thym — couleur ambrée, arôme puissant." },
    // Summer harvest — eucalyptus/jujube (July)
    { apiary_id: ap1.id, user_id: userId, harvest_date: dateOnly(daysAgo(140)), flora_type: "eucalyptus", total_weight_kg: 31.5, humidity_percent: 18.1, avg_yield_per_hive: 6.3, notes: "Miellée estivale eucalyptus. Humidité à surveiller." },
    { apiary_id: ap2.id, user_id: userId, harvest_date: dateOnly(daysAgo(138)), flora_type: "jujubier", total_weight_kg: 54.0, humidity_percent: 17.0, avg_yield_per_hive: 9.0, notes: "Miel de jujube — très demandé localement." },
    { apiary_id: ap3.id, user_id: userId, harvest_date: dateOnly(daysAgo(142)), flora_type: "mélange montagne", total_weight_kg: 24.0, humidity_percent: 16.5, avg_yield_per_hive: 6.0, notes: "Polyflore de montagne. Qualité premium." },
  ];
  await supabase.from("harvests").insert(harvestRows);
  console.log(`  ✓ ${harvestRows.length} harvests`);

  // ── 12. Hive splits ───────────────────────────────────────────────────────
  console.log("Inserting hive splits…");
  const splitRows = [
    {
      source_hive_id: hives[1].id, // Saidia-02
      new_hive_id: hives[11].id,   // Snassen-01 (new colony from split)
      user_id: userId,
      split_date: dateOnly(daysAgo(185)),
      split_type: "artificial_swarm",
      queen_status: "queen_cell",
      outcome: "success",
      notes: "Essaimage artificiel de printemps. Colonie fille bien établie.",
    },
    {
      source_hive_id: hives[6].id, // Berkane-01
      new_hive_id: hives[12].id,   // Snassen-02
      user_id: userId,
      split_date: dateOnly(daysAgo(170)),
      split_type: "nucleus",
      queen_status: "mated_queen",
      outcome: "success",
      notes: "Division sur reine fécondée de sélection ORMVAM.",
    },
    {
      source_hive_id: hives[8].id, // Berkane-03
      new_hive_id: null,
      user_id: userId,
      split_date: dateOnly(daysAgo(155)),
      split_type: "walk_away",
      queen_status: "queen_cell",
      outcome: "failure",
      notes: "Division walk-away — cellule royale n'a pas abouti. Colonie fusionnée.",
    },
  ];
  await supabase.from("hive_splits").insert(splitRows);
  console.log(`  ✓ ${splitRows.length} splits`);

  // ── 13. Queen rearings ────────────────────────────────────────────────────
  console.log("Inserting queen rearings…");
  const rearingRows = [
    {
      hive_id: hives[6].id, // Berkane-01 (best colony)
      user_id: userId,
      grafting_date: dateOnly(daysAgo(190)),
      rearing_type: "grafting",
      status: "success",
      notes: "Élevage de reines par transfert larvaire. 8 cellules royales obtenues sur 10 greffées.",
    },
    {
      hive_id: hives[7].id, // Berkane-02
      user_id: userId,
      grafting_date: dateOnly(daysAgo(120)),
      rearing_type: "natural",
      status: "success",
      notes: "Élevage naturel — cellules royales de remplacement lors d'une inspection.",
    },
  ];
  await supabase.from("queen_rearings").insert(rearingRows);
  console.log(`  ✓ ${rearingRows.length} queen rearings`);

  // ── Done ──────────────────────────────────────────────────────────────────
  const totalHoney = harvestRows.reduce((s, h) => s + h.total_weight_kg, 0);
  console.log(`
✅  Demo beekeeper created successfully!

  Email:    ${DEMO_EMAIL}
  Password: ${DEMO_PASSWORD}
  Name:     Ahmed Benali

  Data inserted:
    • 3 apiaries (Saidia, Berkane Est, Beni Snassen)
    • ${hives.length} hives (13 active, 1 dead, 1 sold)
    • ${queenRows.length} queens
    • ${visitRows.length} visits (across ~10 months)
    • ${treatmentRows.length} treatments (Apivar + Oxalic acid)
    • ${varroaRows.length} varroa checks
    • ${feedingRows.length} feedings
    • ${harvestRows.length} harvests → ${totalHoney} kg honey total
    • ${splitRows.length} hive splits
    • ${rearingRows.length} queen rearings
`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
