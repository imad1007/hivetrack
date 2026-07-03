import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiveCard } from "@/components/hives/hive-card";
import { getTranslations } from "next-intl/server";

export const metadata = { title: "Hives" };

export default async function HivesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("hives");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hives: any[] | null;
  let lastVisitMap: Record<string, string>;

  if (!user) {
    const { DEMO_HIVES_WITH_DETAILS, DEMO_LAST_VISIT_MAP } = await import("@/lib/demo-data");
    hives = DEMO_HIVES_WITH_DETAILS;
    lastVisitMap = DEMO_LAST_VISIT_MAP;
  } else {
    const { data: hivesData } = await supabase
      .from("hives")
      .select("*, queens(*), apiaries(name, id)")
      .eq("user_id", user.id)
      .order("created_at");
    hives = hivesData;

    const { data: lastVisits } = await supabase
      .from("visits")
      .select("hive_id, visited_at")
      .in("hive_id", (hivesData ?? []).map((h) => h.id))
      .order("visited_at", { ascending: false });

    lastVisitMap = {};
    for (const v of lastVisits ?? []) {
      if (!lastVisitMap[v.hive_id]) lastVisitMap[v.hive_id] = v.visited_at;
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Link href="/hives/print">
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print All Tags
            </Button>
          </Link>
          <Link href="/hives/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("addHive")}
            </Button>
          </Link>
        </div>
      </div>

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
          <p className="text-muted-foreground">{t("noHives")}</p>
          <Link href="/apiaries/new" className="mt-4 inline-block">
            <Button>{t("createApiary")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
