import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [statsRes, visitsRes, harvestsRes, treatmentsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/stats/overview`, {
      headers: { Cookie: "" }, // Will be populated via server auth
      cache: "no-store",
    }).catch(() => null),

    // Visits per week (last 12 weeks)
    supabase
      .from("visits")
      .select("visited_at")
      .eq("user_id", user!.id)
      .gte("visited_at", new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString())
      .order("visited_at"),

    // Harvests this season grouped by apiary
    supabase
      .from("harvests")
      .select("apiary_id, total_weight_kg, harvest_date, apiaries(name)")
      .eq("user_id", user!.id)
      .gte("harvest_date", `${new Date().getFullYear()}-01-01`)
      .order("harvest_date"),

    // Treatments ending within 14 days
    supabase
      .from("treatments")
      .select("*, hives(name, apiary_id)")
      .in(
        "hive_id",
        (await supabase.from("hives").select("id").eq("user_id", user!.id)).data?.map((h) => h.id) ?? []
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
    supabase.from("hives").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active"),
    supabase.from("apiaries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase
      .from("treatments")
      .select("id", { count: "exact", head: true })
      .in("hive_id", (await supabase.from("hives").select("id").eq("user_id", user!.id)).data?.map((h) => h.id) ?? [])
      .gte("end_date", today)
      .lte("end_date", sevenDaysFromNow.toISOString().split("T")[0]),
  ]);

  // Hives needing attention
  const { data: allHives } = await supabase.from("hives").select("id").eq("user_id", user!.id).eq("status", "active");
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
    const name = (h.apiaries as { name: string } | null)?.name ?? h.apiary_id;
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

  return (
    <DashboardClient
      stats={stats}
      visitsChartData={visitsChartData}
      harvestChartData={harvestChartData}
      tasks={tasks}
    />
  );
}
