import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Hive Splits" };

const SPLIT_TYPE_LABELS: Record<string, string> = {
  walk_away:       "Walk-away",
  artificial_swarm:"Artificial swarm",
  nucleus:         "Nucleus",
  cut_down:        "Cut-down",
};

const QUEEN_STATUS_LABELS: Record<string, string> = {
  queen_cell:    "Queen cell",
  virgin_queen:  "Virgin queen",
  mated_queen:   "Mated queen",
  queenless:     "Queenless",
};

export default async function SplitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: splits } = await supabase
    .from("hive_splits")
    .select("*")
    .eq("user_id", user!.id)
    .order("split_date", { ascending: false });

  // Fetch hive names in one query
  const { data: hives } = await supabase.from("hives").select("id, name").eq("user_id", user!.id);
  const hiveMap = Object.fromEntries((hives ?? []).map((h) => [h.id, h.name]));

  const pending = (splits ?? []).filter((s) => !s.outcome).length;
  const successful = (splits ?? []).filter((s) => s.outcome === "success").length;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
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
    </div>
  );
}
