import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getStageState } from "@/lib/queen-rearing";
import type { QueenRearingWithDetails, QueenRearingStage } from "@/types";

export const metadata = { title: "Élevage des reines" };

const STATUS_LABELS: Record<string, string> = {
  in_progress: "En cours",
  success:     "Succès",
  failure:     "Échec",
};

const STATUS_VARIANTS: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  success:     "bg-green-100 text-green-800 border-green-200",
  failure:     "bg-red-100 text-red-800 border-red-200",
};

const TYPE_LABELS: Record<string, string> = {
  natural:  "Naturel",
  grafting: "Greffage",
  division: "Division",
};

function nextStage(stages: QueenRearingStage[] | undefined) {
  if (!stages) return null;
  const today = new Date();
  return stages
    .filter((s) => !s.completed && new Date(s.estimated_date) >= today)
    .sort((a, b) => new Date(a.estimated_date).getTime() - new Date(b.estimated_date).getTime())[0] ?? null;
}

export default async function QueenRearingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("queen_rearings")
    .select("*, hives(name, apiary_id), queen_rearing_stages(*)")
    .eq("user_id", user!.id)
    .order("grafting_date", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data: rearings } = await query;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" aria-hidden="true" />
            Élevage des reines
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivez chaque élevage de bout en bout, de la greffe à la ponte.
          </p>
        </div>
        <Link href="/queen-rearing/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvel élevage
          </Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all",         label: "Tous" },
          { value: "in_progress", label: "En cours" },
          { value: "success",     label: "Succès" },
          { value: "failure",     label: "Échec" },
        ].map((f) => {
          const active = (status ?? "all") === f.value;
          return (
            <Link key={f.value} href={f.value === "all" ? "/queen-rearing" : `/queen-rearing?status=${f.value}`}>
              <button
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            </Link>
          );
        })}
      </div>

      {/* List */}
      {!rearings || rearings.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun élevage enregistré.</p>
          <Link href="/queen-rearing/new" className="mt-4 inline-block">
            <Button size="sm">Commencer un élevage</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(rearings as QueenRearingWithDetails[]).map((r) => {
            const next = nextStage(r.queen_rearing_stages);
            const hiveName = (r.hives as { name: string } | null)?.name ?? "Ruche inconnue";
            const completedCount = (r.queen_rearing_stages ?? []).filter((s) => s.completed).length;
            const totalCount = (r.queen_rearing_stages ?? []).length;

            return (
              <Link key={r.id} href={`/queen-rearing/${r.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">{hiveName}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_VARIANTS[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[r.rearing_type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        J0 : {formatDate(r.grafting_date)} · {completedCount}/{totalCount} étapes
                      </p>
                    </div>

                    {next && (
                      <div className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${
                        getStageState(next) === "upcoming_soon"
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : getStageState(next) === "overdue"
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-border bg-muted/50 text-muted-foreground"
                      }`}>
                        <p className="font-medium">{next.stage_name}</p>
                        <p className="opacity-75">{formatDate(next.estimated_date)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
