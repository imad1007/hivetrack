import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, QrCode, ChevronDown, Crown, Bug, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QueenMark } from "@/components/hives/queen-mark";
import { formatDate, formatDateTime, daysBetween, addDays } from "@/lib/utils";
import { computeSwarmRisk, swarmRiskColor } from "@/lib/swarm-risk";
import { Separator } from "@/components/ui/separator";
import { FeedingHistory } from "@/components/feeding/feeding-history";
import type { Visit, Treatment } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("hives").select("name").eq("id", id).single();
  return { title: data?.name ?? "Hive" };
}

function VisitRow({ visit }: { visit: Visit }) {
  const risk = computeSwarmRisk(visit);
  const riskClass = swarmRiskColor(risk.level);

  return (
    <details className="group rounded-lg border p-4 cursor-pointer">
      <summary className="flex items-center justify-between gap-3 list-none">
        <div className="flex items-center gap-3 min-w-0">
          {visit.weather_json?.icon && (
            <Image
              src={visit.weather_json.icon}
              alt={visit.weather_json.condition}
              width={32}
              height={32}
              className="shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm">{formatDateTime(visit.visited_at)}</p>
            {visit.behavior && (
              <p className="text-xs text-muted-foreground capitalize">{visit.behavior}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {risk.level !== "low" && (
            <Badge className={riskClass}>
              {risk.level} swarm risk
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" aria-hidden="true" />
        </div>
      </summary>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Brood frames</p>
          <p className="font-semibold">{visit.brood_frames ?? "—"}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Stores frames</p>
          <p className="font-semibold">{visit.stores_frames ?? "—"}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Pollen frames</p>
          <p className="font-semibold">{visit.pollen_frames ?? "—"}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">Queen seen</p>
          <p className="font-semibold">{visit.queen_seen ? (visit.queen_laying ? "Yes, laying" : "Yes") : "Not seen"}</p>
        </div>
      </div>

      {visit.swarm_signs && visit.swarm_signs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {visit.swarm_signs.map((s) => (
            <Badge key={s} variant="warning" className="capitalize">{s.replace("_", " ")}</Badge>
          ))}
        </div>
      )}

      {visit.notes && (
        <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{visit.notes}</p>
      )}

      {visit.photos_urls && visit.photos_urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {visit.photos_urls.map((url, i) => (
            <Image
              key={i}
              src={url}
              alt={`Visit photo ${i + 1}`}
              width={80}
              height={80}
              className="rounded-md object-cover h-20 w-20"
            />
          ))}
        </div>
      )}
    </details>
  );
}

function TreatmentRow({ treatment }: { treatment: Treatment }) {
  const endDate = new Date(treatment.end_date);
  const safeDate = addDays(endDate, treatment.withdrawal_days);
  const today = new Date();
  const daysToEnd = daysBetween(today, endDate);
  const totalDays = daysBetween(new Date(treatment.start_date), endDate);
  const elapsed = daysBetween(new Date(treatment.start_date), today);
  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const critical = daysToEnd <= 7 && daysToEnd >= 0;

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${critical ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{treatment.product_name}</p>
          {treatment.amm_code && <p className="text-xs text-muted-foreground">AMM: {treatment.amm_code}</p>}
        </div>
        <Badge variant={critical ? "danger" : "outline"}>
          {daysToEnd < 0 ? "Ended" : `${daysToEnd}d left`}
        </Badge>
      </div>
      <Progress
        value={progress}
        className={`h-2 ${critical ? "[&>div]:bg-red-500" : ""}`}
        aria-label={`Treatment progress: ${Math.round(progress)}%`}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Started {formatDate(treatment.start_date)}</span>
        <span>Ends {formatDate(treatment.end_date)}</span>
      </div>
      {treatment.withdrawal_days > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Harvest safe from: {formatDate(safeDate)}
        </p>
      )}
    </div>
  );
}

// ─── Varroa section ──────────────────────────────────────────────────────────

async function VarroaSection({ hiveId }: { hiveId: string }) {
  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("varroa_checks")
    .select("id, check_date, method, mites_counted, bees_sampled")
    .eq("hive_id", hiveId)
    .order("check_date", { ascending: false })
    .limit(5);

  const latest = checks?.[0];
  const pct = latest ? (latest.mites_counted / latest.bees_sampled) * 100 : null;
  const pctColor = pct === null ? "" : pct >= 3 ? "text-red-600" : pct >= 2 ? "text-amber-600" : "text-green-600";

  return (
    <section aria-label="Varroa monitoring">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Bug className="h-4 w-4 text-red-500" aria-hidden="true" />
          Varroa
          {pct !== null && (
            <span className={`text-sm font-bold ${pctColor}`}>{pct.toFixed(1)}%</span>
          )}
        </h2>
        <Link href={`/varroa/new?hive_id=${hiveId}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3 w-3" aria-hidden="true" />
            Log Check
          </Button>
        </Link>
      </div>
      {!checks || checks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No varroa checks recorded.</p>
      ) : (
        <div className="space-y-1.5">
          {checks.map((c) => {
            const p = (c.mites_counted / c.bees_sampled) * 100;
            const color = p >= 3 ? "text-red-600" : p >= 2 ? "text-amber-600" : "text-green-600";
            return (
              <div key={c.id} className="flex items-center justify-between text-sm rounded-md border px-3 py-2">
                <span className="text-muted-foreground">{formatDate(c.check_date)} · {c.method.replace(/_/g, " ")}</span>
                <span className={`font-semibold ${color}`}>{p.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Splits section ───────────────────────────────────────────────────────────

async function SplitsSection({ hiveId }: { hiveId: string }) {
  const supabase = await createClient();
  const { data: splits } = await supabase
    .from("hive_splits")
    .select("id, split_date, split_type, outcome, source_hive_id, new_hive_id")
    .or(`source_hive_id.eq.${hiveId},new_hive_id.eq.${hiveId}`)
    .order("split_date", { ascending: false })
    .limit(5);

  if (!splits || splits.length === 0) return null;

  return (
    <section aria-label="Hive splits">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <GitFork className="h-4 w-4 text-violet-500" aria-hidden="true" />
          Splits
        </h2>
        <Link href={`/splits/new?hive_id=${hiveId}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3 w-3" aria-hidden="true" />
            New Split
          </Button>
        </Link>
      </div>
      <div className="space-y-1.5">
        {splits.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm rounded-md border px-3 py-2">
            <span className="text-muted-foreground">{formatDate(s.split_date)} · {s.split_type.replace(/_/g, " ")}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              s.outcome === "success"     ? "bg-green-50 text-green-700 border-green-200" :
              s.outcome === "failure"     ? "bg-red-50 text-red-700 border-red-200" :
              s.outcome === "merged_back" ? "bg-slate-50 text-slate-700 border-slate-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {s.outcome ?? "pending"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Queen rearing section (embedded in hive detail) ─────────────────────────

async function QueenRearingSection({ hiveId }: { hiveId: string }) {
  const supabase = await createClient();
  const { data: rearings } = await supabase
    .from("queen_rearings")
    .select("id, grafting_date, rearing_type, status, queen_rearing_stages(id, stage_name, estimated_date, completed)")
    .eq("hive_id", hiveId)
    .order("grafting_date", { ascending: false })
    .limit(5);

  const TYPE_LABELS: Record<string, string> = { natural: "Naturel", grafting: "Greffage", division: "Division" };
  const STATUS_COLORS: Record<string, string> = {
    in_progress: "bg-amber-100 text-amber-800 border-amber-200",
    success:     "bg-green-100 text-green-800 border-green-200",
    failure:     "bg-red-100 text-red-800 border-red-200",
  };
  const STATUS_LABELS: Record<string, string> = { in_progress: "En cours", success: "Succès", failure: "Échec" };

  return (
    <section aria-label="Élevage des reines">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Élevage des reines
        </h2>
        <Link href={`/queen-rearing/new`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3 w-3" aria-hidden="true" />
            Nouvel élevage
          </Button>
        </Link>
      </div>
      {!rearings || rearings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun élevage enregistré pour cette ruche.</p>
      ) : (
        <div className="space-y-2">
          {rearings.map((r) => {
            const completed = (r.queen_rearing_stages ?? []).filter((s: { completed: boolean }) => s.completed).length;
            const total = (r.queen_rearing_stages ?? []).length;
            return (
              <Link key={r.id} href={`/queen-rearing/${r.id}`}>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:border-primary/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{TYPE_LABELS[r.rearing_type]} — J0 : {formatDate(r.grafting_date)}</p>
                    <p className="text-xs text-muted-foreground">{completed}/{total} étapes complétées</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function HiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: hive } = await supabase
    .from("hives")
    .select("*, queens(*), apiaries(name, id)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!hive) notFound();

  const [visitsRes, treatmentsRes] = await Promise.all([
    supabase.from("visits").select("*").eq("hive_id", id).order("visited_at", { ascending: false }),
    supabase.from("treatments").select("*").eq("hive_id", id).order("start_date", { ascending: false }),
  ]);

  const { data: profile } = await supabase.from("profiles").select("plan_tier").eq("user_id", user!.id).single();

  const activeQueen = (hive.queens as { status: string; mark_year: number; breed: string; mark_color: string }[])?.find((q) => q.status === "present");
  const activeTreatments = (treatmentsRes.data ?? []).filter((t) => new Date(t.end_date) >= new Date());

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/apiaries/${(hive.apiaries as { id: string } | null)?.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-2 h-9 px-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {(hive.apiaries as { name: string } | null)?.name ?? "Apiaries"}
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-5 h-5 rounded-full border border-border"
              style={{ backgroundColor: hive.color_code ?? "#F59E0B" }}
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold">{hive.name}</h1>
            <Badge variant={hive.status === "active" ? "success" : hive.status === "dead" ? "danger" : "secondary"}>
              {hive.status}
            </Badge>
          </div>
          {activeQueen && (
            <div className="flex items-center gap-2 mt-2">
              <QueenMark year={activeQueen.mark_year} showLabel size="md" />
              {activeQueen.breed && <span className="text-sm text-muted-foreground">{activeQueen.breed}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {profile?.plan_tier !== "free" && (
            <a href={`/api/hives/${id}/qr`} download>
              <Button variant="outline" size="sm" className="gap-2">
                <QrCode className="h-4 w-4" aria-hidden="true" />
                QR Code
              </Button>
            </a>
          )}
          <Link href={`/visits/new?hive_id=${id}`}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Log Visit
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Active Treatments */}
      {activeTreatments.length > 0 && (
        <section aria-label="Active treatments">
          <h2 className="font-semibold mb-3">Active Treatments</h2>
          <div className="space-y-3">
            {activeTreatments.map((t) => (
              <TreatmentRow key={t.id} treatment={t} />
            ))}
          </div>
        </section>
      )}

      {/* Visit Timeline */}
      <section aria-label="Visit history">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Visit History</h2>
          <span className="text-sm text-muted-foreground">{visitsRes.data?.length ?? 0} visits</span>
        </div>
        {visitsRes.data && visitsRes.data.length > 0 ? (
          <div className="space-y-3">
            {visitsRes.data.map((v) => (
              <VisitRow key={v.id} visit={v} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">No visits recorded yet.</p>
            <Link href={`/visits/new?hive_id=${id}`} className="mt-3 inline-block">
              <Button size="sm">Log First Visit</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Feeding Log */}
      <section aria-label="Historique des nourrissages">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Nourrissages</h2>
          <Link href="/feeding/new">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3 w-3" aria-hidden="true" />
              Nourrir
            </Button>
          </Link>
        </div>
        <FeedingHistory hiveId={id} />
      </section>

      {/* Varroa Monitoring */}
      <VarroaSection hiveId={id} />

      <Separator />

      {/* Hive Splits */}
      <SplitsSection hiveId={id} />

      {/* Queen Rearing History */}
      <QueenRearingSection hiveId={id} />

      {/* All Treatments */}
      {treatmentsRes.data && treatmentsRes.data.length > 0 && (
        <section aria-label="All treatments">
          <h2 className="font-semibold mb-3">Treatment History</h2>
          <div className="space-y-3">
            {treatmentsRes.data.map((t) => (
              <TreatmentRow key={t.id} treatment={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
