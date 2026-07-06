import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, GitFork, QrCode, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SplitsHiveQr } from "@/components/splits/splits-hive-qr";
import type { HiveQrInfo } from "@/components/splits/splits-hive-qr";
import { headers } from "next/headers";

export const metadata = { title: "Hive Splits" };

const SPLIT_TYPE_LABELS: Record<string, string> = {
  walk_away:        "Walk-away",
  artificial_swarm: "Artificial swarm",
  nucleus:          "Nucleus",
  cut_down:         "Cut-down",
};

const QUEEN_STATUS_LABELS: Record<string, string> = {
  queen_cell:   "Queen cell",
  virgin_queen: "Virgin queen",
  mated_queen:  "Mated queen",
  queenless:    "Queenless",
};

const PROGRAMME_PHASES = [
  {
    season: "Spring — March to April",
    colorClass: "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800",
    badge: "Colony Multiplication",
    badgeColor: "bg-green-600",
    goal: "Multiply colonies before the main nectar flow (thyme, citrus, jujube).",
    method: "Artificial swarm or nucleus split from colonies with ≥ 7 frames of bees.",
    steps: [
      "Select the strongest donor colony (7+ brood frames).",
      "Transfer 3 frames of sealed brood, nurse bees, and stores to a new hive box.",
      "Add a ripe queen cell or introduce a mated queen to the new colony.",
      "Register the new hive in HiveTrack and scan its QR tag.",
      "Leave the original colony to raise a new queen (walk-away) or add a spare.",
    ],
  },
  {
    season: "Pre-swarm — May to June",
    colorClass: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800",
    badge: "Swarm Prevention",
    badgeColor: "bg-amber-500",
    goal: "Prevent colony loss from natural swarming during peak build-up.",
    method: "Walk-away split when queen cells appear; relieve congestion.",
    steps: [
      "Inspect every 9 days — look for queen cells on the bottom bars.",
      "When queen cells are found, perform an immediate walk-away split.",
      "Move the old queen + 2 frames of bees to a nuc box.",
      "Allow the original colony to raise its own queen from the remaining cells.",
      "Record split type as 'Walk-away' and queen status as 'Queen cell' in HiveTrack.",
    ],
  },
  {
    season: "Post-Harvest — August to September",
    colorClass: "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800",
    badge: "Season Preparation",
    badgeColor: "bg-blue-600",
    goal: "Grow apiary size ahead of the autumn and winter buildup.",
    method: "Nucleus split with purchased mated queens for reliable establishment.",
    steps: [
      "Split from colonies that have fully recovered from honey harvest.",
      "Introduce a commercially mated Saharan or Atlas queen to the new colony.",
      "Feed the new colony with 1:1 sugar syrup for 2 weeks.",
      "Monitor acceptance — inspect after 5 days without opening the hive.",
      "Record queen introduction date and expected first brood inspection in HiveTrack.",
    ],
  },
];

export default async function SplitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let splits: any[] | null;
  let hiveMap: Record<string, string>;
  let hiveQrData: HiveQrInfo[] = [];

  if (!user) {
    const { DEMO_SPLITS, DEMO_SPLITS_HIVE_MAP, DEMO_HIVES_WITH_DETAILS } = await import("@/lib/demo-data");
    splits = DEMO_SPLITS;
    hiveMap = DEMO_SPLITS_HIVE_MAP;

    const splitHiveIds = new Set<string>(
      splits.flatMap((s) => [s.source_hive_id, s.new_hive_id].filter(Boolean))
    );
    hiveQrData = DEMO_HIVES_WITH_DETAILS
      .filter((h) => splitHiveIds.has(h.id))
      .map((h) => ({ id: h.id, name: h.name, qr_code_token: h.qr_code_token, color_code: h.color_code }));
  } else {
    const { data: splitsData } = await supabase
      .from("hive_splits")
      .select("*")
      .eq("user_id", user.id)
      .order("split_date", { ascending: false });
    splits = splitsData ?? null;

    const { data: hives } = await supabase
      .from("hives")
      .select("id, name, qr_code_token, color_code")
      .eq("user_id", user.id);
    hiveMap = Object.fromEntries((hives ?? []).map((h) => [h.id, h.name]));

    const splitHiveIds = new Set<string>(
      (splits ?? []).flatMap((s) => [s.source_hive_id, s.new_hive_id].filter(Boolean))
    );
    hiveQrData = (hives ?? [])
      .filter((h) => splitHiveIds.has(h.id))
      .map((h) => ({
        id: h.id,
        name: h.name,
        qr_code_token: h.qr_code_token ?? "",
        color_code: h.color_code,
      }));
  }

  const pending    = (splits ?? []).filter((s) => !s.outcome).length;
  const successful = (splits ?? []).filter((s) => s.outcome === "success").length;

  const headersList = await headers();
  const host  = headersList.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const appUrl = `${proto}://${host}`;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitFork className="h-6 w-6 text-violet-500" aria-hidden="true" />
            Hive Splits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track colony splits for swarm prevention and expansion.
          </p>
        </div>
        <Link href="/splits/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Split
          </Button>
        </Link>
      </div>

      {/* ── Split Programme ──────────────────────────────────────────────────── */}
      <details className="rounded-xl border overflow-hidden group">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-muted/40 hover:bg-muted/60 transition-colors list-none">
          <span className="font-semibold text-sm flex items-center gap-2">
            <GitFork className="h-4 w-4 text-violet-500" />
            Split Programme — ORMVAM Berkane
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="px-4 pb-5 pt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The hive-split programme follows the seasonal calendar established for the Oriental Region
            (Berkane province) under the ORMVAM beekeeping development plan. Each phase targets a
            specific objective aligned with local floral resources and climate conditions.
          </p>

          <div className="space-y-3">
            {PROGRAMME_PHASES.map((phase) => (
              <div key={phase.season} className={`rounded-lg border p-4 ${phase.colorClass}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-sm">{phase.season}</span>
                  <span className={`text-xs text-white rounded-full px-2 py-0.5 ${phase.badgeColor}`}>
                    {phase.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>Goal:</strong> {phase.goal}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Method:</strong> {phase.method}
                </p>
                <ol className="text-xs space-y-1 list-decimal list-inside text-foreground/80">
                  {phase.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground italic">
            Source: ORMVAM Beekeeping Development Programme, Berkane 2026 — Essaimage/Division module.
          </p>
        </div>
      </details>

      {/* Summary */}
      {(splits ?? []).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border p-4 text-center">
            <p className="text-3xl font-bold">{splits?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Total splits</p>
          </div>
          <div className="rounded-xl border p-4 text-center border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <p className="text-3xl font-bold text-green-600">{successful}</p>
            <p className="text-xs text-muted-foreground mt-1">Successful</p>
          </div>
          <div className="rounded-xl border p-4 text-center border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-3xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending outcome</p>
          </div>
        </div>
      )}

      {/* Splits table */}
      {!splits || splits.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <GitFork className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-muted-foreground">No splits recorded yet.</p>
          <Link href="/splits/new" className="mt-4 inline-block">
            <Button size="sm">Record First Split</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Source → New</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Queen</th>
                <th className="text-left px-4 py-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.split_date)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{hiveMap[s.source_hive_id] ?? "—"}</span>
                    {s.new_hive_id && (
                      <span className="text-muted-foreground"> → {hiveMap[s.new_hive_id] ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                    {SPLIT_TYPE_LABELS[s.split_type] ?? s.split_type}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {QUEEN_STATUS_LABELS[s.queen_status] ?? s.queen_status}
                  </td>
                  <td className="px-4 py-3">
                    {s.outcome === "success"     && <Badge variant="success">Success</Badge>}
                    {s.outcome === "failure"     && <Badge variant="danger">Failed</Badge>}
                    {s.outcome === "merged_back" && <Badge variant="secondary">Merged back</Badge>}
                    {!s.outcome                  && <Badge variant="outline">Pending</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Hive QR Tags ─────────────────────────────────────────────────────── */}
      {hiveQrData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold">Hive QR Tags</h2>
            <span className="text-xs text-muted-foreground">— click a tag to print it</span>
          </div>
          <SplitsHiveQr hives={hiveQrData} appUrl={appUrl} />
        </div>
      )}

    </div>
  );
}
