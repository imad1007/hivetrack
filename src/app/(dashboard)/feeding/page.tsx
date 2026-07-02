import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Feeding } from "@/types";

type FeedingRow = Feeding & { hives: { name: string } | null; apiaries: { name: string } | null };

export const metadata = { title: "Alimentation des colonies" };

const FOOD_LABELS: Record<string, string> = {
  light_syrup:   "Sirop léger (1:1)",
  heavy_syrup:   "Sirop épais (2:1)",
  protein_paste: "Pâte protéinée",
  candi:         "Candi",
};

export default async function FeedingPage({
  searchParams,
}: {
  searchParams: Promise<{ food_type?: string; mode?: string }>;
}) {
  const { food_type, mode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let feedings: FeedingRow[] | null;

  if (!user) {
    const { DEMO_FEEDINGS } = await import("@/lib/demo-data");
    let data = DEMO_FEEDINGS as unknown as FeedingRow[];
    if (food_type) data = data.filter((f) => f.food_type === food_type);
    if (mode === "collective") data = data.filter((f) => f.feeding_session_type === "collective");
    if (mode === "individual") data = data.filter((f) => f.feeding_session_type === "individual");
    feedings = data;
  } else {
    const [{ data: ownedHives }, { data: ownedApiaries }] = await Promise.all([
      supabase.from("hives").select("id").eq("user_id", user.id),
      supabase.from("apiaries").select("id").eq("user_id", user.id),
    ]);
    const hiveIds   = (ownedHives    ?? []).map((h) => h.id);
    const apiaryIds = (ownedApiaries ?? []).map((a) => a.id);

    if (hiveIds.length === 0 && apiaryIds.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Créez d&apos;abord un rucher et une ruche.</p>
        </div>
      );
    }

    let query = supabase
      .from("feedings")
      .select("*, hives(name), apiaries(name)")
      .order("feeding_date", { ascending: false })
      .limit(200);

    if (hiveIds.length > 0 && apiaryIds.length > 0) {
      query = query.or(`hive_id.in.(${hiveIds.join(",")}),apiary_id.in.(${apiaryIds.join(",")})`);
    } else if (hiveIds.length > 0) {
      query = query.in("hive_id", hiveIds);
    } else {
      query = query.in("apiary_id", apiaryIds);
    }

    if (food_type) query = query.eq("food_type", food_type);
    if (mode === "collective") query = query.eq("feeding_session_type", "collective");
    if (mode === "individual") query = query.eq("feeding_session_type", "individual");

    const { data } = await query;
    feedings = data as FeedingRow[] | null;
  }

  // Monthly stats for current month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthFeedings = (feedings ?? []).filter((f) => f.feeding_date >= monthStart && f.food_type);
  const monthStats: Record<string, number> = {};
  for (const f of monthFeedings) {
    if (!f.food_type || !f.quantity || !f.unit) continue;
    const key = `${f.food_type}_${f.unit}`;
    monthStats[key] = (monthStats[key] ?? 0) + f.quantity;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Utensils className="h-6 w-6 text-amber-500" aria-hidden="true" />
            Alimentation des colonies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique complet des nourrissements collectifs et individuels.
          </p>
        </div>
        <Link href="/feeding/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Enregistrer
          </Button>
        </Link>
      </div>

      {/* Monthly summary */}
      {Object.keys(monthStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ce mois-ci
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(monthStats).map(([key, qty]) => {
              const [ft, unit] = key.split("_");
              const lastUnderscoreIdx = key.lastIndexOf("_");
              const foodType = key.substring(0, lastUnderscoreIdx);
              const unitPart = key.substring(lastUnderscoreIdx + 1);
              return (
                <div key={key} className="rounded-xl border bg-muted/30 px-4 py-3 text-center min-w-[100px]">
                  <p className="text-2xl font-bold">{qty.toFixed(1)}<span className="text-sm font-normal ml-0.5">{unitPart}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{FOOD_LABELS[foodType] ?? foodType}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/feeding"><button className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!food_type && !mode ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>Tous</button></Link>
        {Object.entries(FOOD_LABELS).map(([val, label]) => (
          <Link key={val} href={`/feeding?food_type=${val}`}>
            <button className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${food_type === val ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          </Link>
        ))}
        <Link href="/feeding?mode=collective"><button className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${mode === "collective" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>Collectif</button></Link>
        <Link href="/feeding?mode=individual"><button className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${mode === "individual" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>Individuel</button></Link>
      </div>

      {/* List */}
      {!feedings || feedings.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <Utensils className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun nourrissage enregistré.</p>
          <Link href="/feeding/new" className="mt-4 inline-block">
            <Button size="sm">Premier nourrissage</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Cible</th>
                <th className="text-right px-4 py-2 font-medium">Quantité</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Mode</th>
              </tr>
            </thead>
            <tbody>
              {feedings.map((f) => {
                const foodLabel = FOOD_LABELS[f.food_type ?? ""] ?? f.type?.replace(/_/g, " ") ?? "—";
                const qty = f.quantity ? `${f.quantity} ${f.unit ?? ""}` : f.quantity_liters ? `${f.quantity_liters} L` : "—";
                const target = (f.hives as { name: string } | null)?.name ?? (f.apiaries as { name: string } | null)?.name ?? "—";
                return (
                  <tr key={f.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2.5">{formatDate(f.feeding_date)}</td>
                    <td className="px-4 py-2.5">{foodLabel}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{target}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{qty}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                        f.feeding_session_type === "collective"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {f.feeding_session_type === "collective" ? "Collectif" : "Individuel"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
