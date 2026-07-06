import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HiveCard } from "@/components/hives/hive-card";
import { DEMO_APIARIES_ENRICHED, DEMO_HIVES_WITH_DETAILS, DEMO_LAST_VISIT_MAP } from "@/lib/demo-data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demoApiary = DEMO_APIARIES_ENRICHED.find((a) => a.id === id);
  if (demoApiary) return { title: demoApiary.name };
  const supabase = await createClient();
  const { data } = await supabase.from("apiaries").select("name").eq("id", id).single();
  return { title: data?.name ?? "Apiary" };
}

export default async function ApiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiary: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hives: any[] = [];
  let lastVisitMap: Record<string, string> = {};

  if (!user) {
    apiary = DEMO_APIARIES_ENRICHED.find((a) => a.id === id);
    if (!apiary) notFound();
    hives = DEMO_HIVES_WITH_DETAILS.filter((h) => h.apiary_id === id);
    lastVisitMap = DEMO_LAST_VISIT_MAP;
  } else {
    const { data: apiaryData } = await supabase
      .from("apiaries")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!apiaryData) notFound();
    apiary = apiaryData;

    const { data: hivesData } = await supabase
      .from("hives")
      .select("*, queens(*)")
      .eq("apiary_id", id)
      .order("created_at");

    hives = hivesData ?? [];

    const { data: lastVisits } = await supabase
      .from("visits")
      .select("hive_id, visited_at")
      .in("hive_id", hives.map((h) => h.id))
      .order("visited_at", { ascending: false });

    for (const v of lastVisits ?? []) {
      if (!lastVisitMap[v.hive_id]) lastVisitMap[v.hive_id] = v.visited_at;
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/apiaries">
            <Button variant="ghost" size="sm" className="gap-2 mb-2 h-9 px-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Apiaries
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{apiary.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {apiary.lat.toFixed(4)}, {apiary.lng.toFixed(4)}
            </span>
            {apiary.environment_type && (
              <Badge variant="outline" className="capitalize">{apiary.environment_type}</Badge>
            )}
            {apiary.water_nearby && <Badge variant="info">Water nearby</Badge>}
          </div>
        </div>
        <Link href={`/hives/new?apiary_id=${id}`}>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Hive
          </Button>
        </Link>
      </div>

      {/* Hive grid */}
      {hives && hives.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hives.map((hive) => (
            <HiveCard
              key={hive.id}
              hive={hive}
              lastVisitAt={lastVisitMap[hive.id]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No hives in this apiary yet.</p>
          <Link href={`/hives/new?apiary_id=${id}`} className="mt-4 inline-block">
            <Button className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add First Hive
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
