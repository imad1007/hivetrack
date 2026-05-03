import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AlertCircle, CheckCircle2, FlaskConical, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDate, daysBetween, addDays } from "@/lib/utils";

export const metadata = { title: "Treatments" };

export default async function TreatmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: hiveIds } = await supabase.from("hives").select("id").eq("user_id", user!.id);
  const ids = (hiveIds ?? []).map((h) => h.id);

  const treatments = ids.length === 0 ? [] : (
    await supabase
      .from("treatments")
      .select("*, hives(id, name, apiary_id, apiaries(name))")
      .in("hive_id", ids)
      .order("end_date", { ascending: true })
  ).data ?? [];

  const today = new Date();
  const activeTreatments = treatments.filter((t) => new Date(t.end_date) >= today);
  const pastTreatments = treatments.filter((t) => new Date(t.end_date) < today);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Treatments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track varroa, disease, and preventive treatments. Withdrawal periods are enforced automatically.</p>
        </div>
        <Link href="/treatments/new">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Treatment
          </Button>
        </Link>
      </div>

      {/* Active count badge */}
      {activeTreatments.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="info">{activeTreatments.length} active treatment{activeTreatments.length > 1 ? "s" : ""}</Badge>
        </div>
      )}

      {/* DAR alerts */}
      {activeTreatments.some((t) => daysBetween(today, new Date(t.end_date)) <= 7) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <span>Treatments ending within 7 days — harvest may be blocked!</span>
          </div>
        </div>
      )}

      {/* Active treatments */}
      {activeTreatments.length > 0 ? (
        <section>
          <h2 className="font-semibold text-lg mb-3">Active Treatments</h2>
          <div className="space-y-4">
            {activeTreatments.map((t) => {
              const endDate = new Date(t.end_date);
              const startDate = new Date(t.start_date);
              const daysToEnd = daysBetween(today, endDate);
              const totalDays = daysBetween(startDate, endDate);
              const elapsed = daysBetween(startDate, today);
              const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
              const safeDate = addDays(endDate, t.withdrawal_days);
              const critical = daysToEnd <= 7;
              const hive = t.hives as { id: string; name: string; apiaries: { name: string } | null } | null;

              return (
                <Card key={t.id} className={critical ? "border-red-200 dark:border-red-800" : ""}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{t.product_name}</p>
                        {hive && (
                          <Link href={`/hives/${hive.id}`} className="text-sm text-primary hover:underline">
                            {hive.name} — {(hive.apiaries as { name: string } | null)?.name}
                          </Link>
                        )}
                        {t.amm_code && <p className="text-xs text-muted-foreground">AMM: {t.amm_code}</p>}
                      </div>
                      <Badge variant={critical ? "danger" : "info"}>
                        {critical ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" aria-hidden="true" />
                            {daysToEnd}d left
                          </span>
                        ) : `${daysToEnd}d left`}
                      </Badge>
                    </div>
                    <Progress
                      value={progress}
                      className={`h-2.5 ${critical ? "[&>div]:bg-red-500" : ""}`}
                      aria-label={`Treatment ${Math.round(progress)}% complete`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Started {formatDate(t.start_date)}</span>
                      <span>Ends {formatDate(t.end_date)}</span>
                    </div>
                    {t.withdrawal_days > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Harvest safe from: {formatDate(safeDate)} ({t.withdrawal_days}d withdrawal)
                      </p>
                    )}
                    {t.dosage && (
                      <p className="text-xs text-muted-foreground">Dosage: {t.dosage}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <p className="font-semibold text-lg">No active treatments</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
              Record a treatment to track active substances, withdrawal periods, and harvest safety dates.
            </p>
            <Link href="/treatments/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Log First Treatment
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Past treatments */}
      {pastTreatments.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-3 text-muted-foreground">Past Treatments</h2>
          <div className="space-y-2">
            {pastTreatments.map((t) => {
              const hive = t.hives as { id: string; name: string } | null;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.product_name}</p>
                    {hive && (
                      <Link href={`/hives/${hive.id}`} className="text-xs text-primary hover:underline">
                        {hive.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">Ended {formatDate(t.end_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
