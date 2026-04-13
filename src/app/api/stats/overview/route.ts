import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const { count: totalHives } = await db
    .from("hives")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { count: totalApiaries } = await db
    .from("apiaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];

  const { data: activeHiveIds } = await db
    .from("hives")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const hiveIds = activeHiveIds?.map((h) => h.id) ?? [];

  const { count: treatmentsEndingSoon } = hiveIds.length > 0
    ? await db
        .from("treatments")
        .select("id", { count: "exact", head: true })
        .in("hive_id", hiveIds)
        .gte("end_date", today)
        .lte("end_date", sevenDaysStr)
    : { count: 0 };

  const hivesNeedingAttention: string[] = [];

  for (const hiveId of hiveIds) {
    const { data: latestVisit } = await db
      .from("visits")
      .select("visited_at")
      .eq("hive_id", hiveId)
      .order("visited_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestVisit || new Date(latestVisit.visited_at) < fourteenDaysAgo) {
      hivesNeedingAttention.push(hiveId);
    }
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { count: deadSinceWinter } = await db
    .from("hives")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "dead")
    .gte("updated_at", sixMonthsAgo.toISOString());

  const totalForRatio = (totalHives ?? 0) + (deadSinceWinter ?? 0);
  const mortalityRate =
    totalForRatio > 0 ? Math.round(((deadSinceWinter ?? 0) / totalForRatio) * 100) : 0;

  return NextResponse.json({
    data: {
      total_hives: totalHives ?? 0,
      total_apiaries: totalApiaries ?? 0,
      hives_needing_attention: hivesNeedingAttention.length,
      treatments_ending_soon: treatmentsEndingSoon ?? 0,
      overwintering_mortality_rate: mortalityRate,
      hive_ids_needing_attention: hivesNeedingAttention,
    },
  });
}
