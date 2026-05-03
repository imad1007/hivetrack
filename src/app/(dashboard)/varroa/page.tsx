import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Bug, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Varroa Monitoring" };

const METHOD_LABELS: Record<string, string> = {
  alcohol_wash: "Alcohol wash",
  sugar_roll:   "Sugar roll",
  drone_brood:  "Drone brood",
  sticky_board: "Sticky board",
};

function varroaStatus(pct: number) {
  if (pct >= 3) return { label: "Treat now",     color: "text-red-600 dark:text-red-400",   bg: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",   variant: "danger"   as const };
  if (pct >= 2) return { label: "Watch closely", color: "text-amber-600 dark:text-amber-400", bg: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20", variant: "warning" as const };
  return         { label: "OK",          color: "text-green-600 dark:text-green-400",  bg: "",                                                                    variant: "success"  as const };
}

export default async function VarroaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: hives } = await supabase
    .from("hives")
    .select("id, name, color_code")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .order("name");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Fetch latest varroa check per hive (one query per hive — acceptable for typical fleet sizes)
  type CheckRow = { check_date: string; mites_counted: number; bees_sampled: number; method: string } | null;
  const checksMap: Record<string, CheckRow> = {};
  for (const hive of hives ?? []) {
    const { data } = await supabase
      .from("varroa_checks")
      .select("check_date, mites_counted, bees_sampled, method")
      .eq("hive_id", hive.id)
      .order("check_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    checksMap[hive.id] = data;
  }

  const hivesAboveThreshold = Object.values(checksMap).filter(
    (c) => c && (c.mites_counted / c.bees_sampled) * 100 >= 3
  ).length;

  const hivesOverdue = (hives ?? []).filter(
    (h) => !checksMap[h.id] || checksMap[h.id]!.check_date < thirtyDaysAgo
  ).length;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-red-500" aria-hidden="true" />
            Varroa Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track mite loads. Treat when ≥3% (alcohol wash / sugar roll).
          </p>
        </div>
        <Link href="/varroa/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Log Check
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold">{hives?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Active hives</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${hivesAboveThreshold > 0 ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : ""}`}>
          <p className={`text-3xl font-bold ${hivesAboveThreshold > 0 ? "text-red-600" : ""}`}>{hivesAboveThreshold}</p>
          <p className="text-xs text-muted-foreground mt-1">Need treatment (≥3%)</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${hivesOverdue > 0 ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20" : ""}`}>
          <p className={`text-3xl font-bold ${hivesOverdue > 0 ? "text-amber-600" : ""}`}>{hivesOverdue}</p>
          <p className="text-xs text-muted-foreground mt-1">Not checked (30d+)</p>
        </div>
      </div>

      {/* Per-hive list */}
      {!hives || hives.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">No active hives found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {hives.map((hive) => {
            const check = checksMap[hive.id];
            const pct = check ? (check.mites_counted / check.bees_sampled) * 100 : null;
            const status = pct !== null ? varroaStatus(pct) : null;
            const isOverdue = !check || check.check_date < thirtyDaysAgo;

            return (
              <div key={hive.id} className={`rounded-lg border p-4 flex items-center justify-between gap-3 ${status?.bg ?? ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hive.color_code ?? "#F59E0B" }} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{hive.name}</p>
                    {check ? (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(check.check_date)} · {METHOD_LABELS[check.method] ?? check.method}
                        {" · "}{check.mites_counted}/{check.bees_sampled} mites
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No checks recorded</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pct !== null ? (
                    <>
                      <span className={`text-xl font-bold ${status!.color}`}>{pct.toFixed(1)}%</span>
                      <Badge variant={status!.variant}>{status!.label}</Badge>
                    </>
                  ) : (
                    <Badge variant="secondary">No data</Badge>
                  )}
                  {isOverdue && <Clock className="h-4 w-4 text-amber-500 shrink-0" aria-label="Check overdue" />}
                  <Link href={`/varroa/new?hive_id=${hive.id}`}>
                    <Button variant="outline" size="sm">Check</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
