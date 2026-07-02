import { createClient } from "@/lib/supabase/server";
import { ApiaryMapPage } from "./apiary-map-page";
import { DEMO_APIARIES_ENRICHED } from "@/lib/demo-data";

export const metadata = { title: "Apiaries" };

export default async function ApiariesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <ApiaryMapPage apiaries={DEMO_APIARIES_ENRICHED} />;

  const { data: apiaries } = await supabase
    .from("apiaries")
    .select("*, hives(id, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const enriched = (apiaries ?? []).map((a) => ({
    ...a,
    hive_count: (a.hives as { status: string }[])?.filter((h) => h.status === "active").length ?? 0,
  }));

  return <ApiaryMapPage apiaries={enriched} />;
}
