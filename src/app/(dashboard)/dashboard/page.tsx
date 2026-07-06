import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";
import { getUpcomingStageAlerts } from "@/lib/queen-rearing";
import type { RearingWithStages } from "@/lib/queen-rearing";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const {
      DEMO_STATS, DEMO_VISITS_CHART_DATA, DEMO_HARVEST_CHART_DATA,
      DEMO_TASKS, DEMO_QUEEN_ALERTS, DEMO_VARROA_ALERTS, DEMO_FEEDING_SUGGESTIONS,
      DEMO_APIARIES_ENRICHED,
    } = await import("@/lib/demo-data");
    const firstApiary = DEMO_APIARIES_ENRICHED[0];
    return (
      <DashboardClient
        stats={DEMO_STATS}
        visitsChartData={DEMO_VISITS_CHART_DATA}
        harvestChartData={DEMO_HARVEST_CHART_DATA}
        tasks={DEMO_TASKS}
        queenAlerts={DEMO_QUEEN_ALERTS}
        feedingSuggestions={DEMO_FEEDING_SUGGESTIONS}
        varroaAlerts={DEMO_VARROA_ALERTS}
        weatherLocation={{ lat: firstApiary.lat, lng: firstApiary.lng, name: firstApiary.name }}
      />
    );
  }

  // Fetch first apiary for weather coordinates
  const { data: firstApiaryData } = await supabase
    .from("apiaries")
    .select("name, lat, lng")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const [, visitsRes, harvestsRes, treatmentsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/stats/overview`, {
      headers: { Cookie: "" }, // Will be populated via server auth
      cache: "no-store",
    }).catch(() => null),

    // Visits per week (last 12 weeks)
    supabase
      .from("visits")
      .select("visited_at")
      .eq("user_id", user.id)
      .gte("visited_at", new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString())
      .order("visited_at"),

    // Harvests this season grouped by apiary
    supabase
      .from("harvests")
      .select("apiary_id, total_weight_kg, harvest_date, apiaries(name)")
      .eq("user_id", user.id)
      .gte("harvest_date", `${new Date().getFullYear()}-01-01`)
      .order("harvest_date"),

    // Treatments ending within 14 days
    supabase
      .from("treatments")
      .select("*, hives(name, apiary_id)")
      .in(
        "hive_id",
        (await supabase.from("hives").select("id").eq("user_id", user.id)).data?.map((h) => h.id) ?? []
      )
      .lte("end_date", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date"),
  ]);

  // Direct DB stats (bypass the HTTP call which needs auth cookies forwarding)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const today = new Date().toISOString().split("T")[0];

  const [totalHivesRes, totalApiariesRes, treatEndingSoonRes] = await Promise.all([
    supabase.from("hives").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
    supabase.from("apiaries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("treatments")
      .select("id", { count: "exact", head: true })
      .in("hive_id", (await supabase.from("hives").select("id").eq("user_id", user.id)).data?.map((h) => h.id) ?? [])
      .gte("end_date", today)
      .lte("end_date", sevenDaysFromNow.toISOString().split("T")[0]),
  ]);

  // Hives needing attention
  const { data: allHives } = await supabase.from("hives").select("id").eq("user_id", user.id).eq("status", "active");
  let hivesNeedingAttention = 0;
  for (const hive of allHives ?? []) {
    const { data: lv } = await supabase.from("visits").select("visited_at").eq("hive_id", hive.id).order("visited_at", { ascending: false }).limit(1).maybeSingle();
    if (!lv || new Date(lv.visited_at) < fourteenDaysAgo) hivesNeedingAttention++;
  }

  const stats = {
    total_hives: totalHivesRes.count ?? 0,
    total_apiaries: totalApiariesRes.count ?? 0,
    hives_needing_attention: hivesNeedingAttention,
    treatments_ending_soon: treatEndingSoonRes.count ?? 0,
  };

  // Build visits-per-week chart data
  const weeklyVisits: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = `W${Math.floor(i)}`;
    weeklyVisits[key] = 0;
  }
  for (const v of visitsRes.data ?? []) {
    const weekIndex = Math.floor((Date.now() - new Date(v.visited_at).getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weekIndex < 12) {
      const key = `W${weekIndex}`;
      weeklyVisits[key] = (weeklyVisits[key] ?? 0) + 1;
    }
  }
  const visitsChartData = Object.entries(weeklyVisits)
    .reverse()
    .map(([week, count]) => ({ week, visits: count }));

  // Build harvest-per-apiary chart data
  const harvestByApiary: Record<string, number> = {};
  for (const h of harvestsRes.data ?? []) {
    const name = (h.apiaries as unknown as { name: string } | null)?.name ?? h.apiary_id;
    harvestByApiary[name] = (harvestByApiary[name] ?? 0) + h.total_weight_kg;
  }
  const harvestChartData = Object.entries(harvestByApiary).map(([apiary, kg]) => ({ apiary, kg }));

  // Upcoming tasks
  const tasks: { label: string; date: string; type: "treatment" | "queen" | "feeding" }[] = [];
  for (const t of treatmentsRes.data ?? []) {
    const hiveName = (t.hives as { name: string } | null)?.name ?? "Unknown hive";
    tasks.push({
      label: `Treatment ending: ${t.product_name} — ${hiveName}`,
      date: t.end_date,
      type: "treatment",
    });
  }

  // Queen rearing alerts — in_progress rearings with stages in alert window
  const { data: rearingsRaw } = await supabase
    .from("queen_rearings")
    .select("id, hives(name), queen_rearing_stages(id, stage_name, estimated_date, alert_days_before, completed)")
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  const rearingsForAlerts: RearingWithStages[] = (rearingsRaw ?? []).map((r) => ({
    id: r.id,
    hive_name: (r.hives as unknown as { name: string } | null)?.name ?? "Ruche inconnue",
    stages: (r.queen_rearing_stages as RearingWithStages["stages"]) ?? [],
  }));
  const queenAlerts = getUpcomingStageAlerts(rearingsForAlerts);

  // Varroa alerts — active hives with mite count ≥3% OR no check in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const varroaAlerts: { hive_id: string; hive_name: string; pct: number | null; overdue: boolean }[] = [];
  const { data: activeHivesFull } = await supabase.from("hives").select("id, name").eq("user_id", user.id).eq("status", "active");
  for (const hive of activeHivesFull ?? []) {
    const { data: latest } = await supabase
      .from("varroa_checks")
      .select("check_date, mites_counted, bees_sampled")
      .eq("hive_id", hive.id)
      .order("check_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const pct = latest ? (latest.mites_counted / latest.bees_sampled) * 100 : null;
    const overdue = !latest || latest.check_date < thirtyDaysAgo;
    if (pct !== null && pct >= 3) {
      varroaAlerts.push({ hive_id: hive.id, hive_name: hive.name, pct, overdue });
    }
  }

  // Feeding suggestions — hives with no feeding in 30 days during Nov–Feb
  const currentMonth = new Date().getMonth() + 1; // 1-based
  const isDearth = currentMonth >= 11 || currentMonth <= 2;
  const feedingSuggestions: { hive_id: string; hive_name: string; days_since: number }[] = [];
  if (isDearth) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    for (const hive of allHives ?? []) {
      const { data: lastFeed } = await supabase
        .from("feedings")
        .select("feeding_date")
        .eq("hive_id", hive.id)
        .order("feeding_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!lastFeed || lastFeed.feeding_date < thirtyDaysAgo) {
        const daysSince = lastFeed
          ? Math.floor((Date.now() - new Date(lastFeed.feeding_date).getTime()) / 86_400_000)
          : 999;
        const { data: hiveInfo } = await supabase.from("hives").select("name").eq("id", hive.id).single();
        feedingSuggestions.push({ hive_id: hive.id, hive_name: hiveInfo?.name ?? "Ruche", days_since: daysSince });
      }
    }
  }

  return (
    <DashboardClient
      stats={stats}
      visitsChartData={visitsChartData}
      harvestChartData={harvestChartData}
      tasks={tasks}
      queenAlerts={queenAlerts}
      feedingSuggestions={feedingSuggestions}
      varroaAlerts={varroaAlerts}
      weatherLocation={
        firstApiaryData
          ? { lat: firstApiaryData.lat, lng: firstApiaryData.lng, name: firstApiaryData.name }
          : undefined
      }
    />
  );
}
