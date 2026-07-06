import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";
import { fetchUserDetail } from "@/lib/admin-data";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Hexagon,
  MapPin,
  Wheat,
  Activity,
  FlaskConical,
  Ban,
  CheckCircle2,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserActionButtons } from "@/components/admin/user-action-buttons";


function fmtDate(s: string | null) {
  if (!s) return "Never";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard");

  const { id } = await params;

  const detail = await fetchUserDetail(id);
  if (!detail) notFound();

  const { user: u, apiaries, hives, harvests, visits, treatments, stats } = detail;

  const totalHarvests = harvests.reduce((s, h) => s + (h.honey_kg ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Beekeepers
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl font-bold text-amber-700 dark:text-amber-300 uppercase shrink-0">
          {(u.full_name || u.email).slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{u.full_name || "Unnamed user"}</h1>
            {u.is_banned ? (
              <span className="flex items-center gap-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 font-medium">
                <Ban className="h-3 w-3" /> Disabled
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-0.5 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{u.email}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Joined {fmtDate(u.created_at)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last seen {fmtDate(u.last_sign_in_at)}</span>
          </div>
        </div>
        <UserActionButtons userId={u.id} isBanned={u.is_banned} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={<MapPin className="h-4 w-4 text-amber-500" />} label="Apiaries" value={stats.apiary_count} />
        <MiniStat icon={<Hexagon className="h-4 w-4 text-amber-500" />} label="Hives" value={stats.hive_count} />
        <MiniStat icon={<Wheat className="h-4 w-4 text-amber-500" />} label="Honey" value={`${stats.honey_kg} kg`} />
        <MiniStat icon={<Activity className="h-4 w-4 text-amber-500" />} label="Visits" value={stats.visit_count} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Apiaries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Apiaries ({stats.apiary_count})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {apiaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No apiaries yet.</p>
            ) : (
              apiaries.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{hives.filter((h) => h.apiary_id === a.id).length} hives</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Hives */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Hexagon className="h-4 w-4" /> Hives ({stats.hive_count})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-52 overflow-y-auto">
            {hives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hives yet.</p>
            ) : (
              hives.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium">{h.name}</span>
                  <div className="flex items-center gap-2">
                    {h.colony_strength != null && (
                      <span className="text-xs text-muted-foreground">strength {h.colony_strength}/5</span>
                    )}
                    <StatusDot status={h.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent harvests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wheat className="h-4 w-4" /> Harvests — {totalHarvests.toFixed(1)} kg total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-52 overflow-y-auto">
            {harvests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No harvests yet.</p>
            ) : (
              harvests.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm">{fmtDate(h.harvest_date)}</span>
                  <div className="flex items-center gap-2">
                    {h.honey_type && <span className="text-xs text-muted-foreground capitalize">{h.honey_type}</span>}
                    <span className="text-sm font-semibold text-amber-600">{h.honey_kg} kg</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent visits + treatments */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Visits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {visits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No visits logged.</p>
              ) : (
                visits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm">{fmtDateTime(v.visited_at)}</span>
                    {v.overall_health && (
                      <HealthBadge health={v.overall_health} />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Recent Treatments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {treatments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No treatments logged.</p>
              ) : (
                treatments.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm font-medium">{t.product_name}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(t.applied_at)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <p className="text-lg font-bold leading-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-500",
    weak: "bg-amber-400",
    queenless: "bg-red-500",
    dead: "bg-slate-400",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${map[status] ?? "bg-slate-300"}`}
      title={status}
    />
  );
}

function HealthBadge({ health }: { health: string }) {
  const map: Record<string, string> = {
    excellent: "text-green-600 bg-green-50 dark:bg-green-900/20",
    good: "text-green-500 bg-green-50 dark:bg-green-900/20",
    fair: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    poor: "text-red-600 bg-red-50 dark:bg-red-900/20",
    critical: "text-red-700 bg-red-50 dark:bg-red-900/20",
  };
  return (
    <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium capitalize ${map[health] ?? "text-muted-foreground"}`}>
      {health}
    </span>
  );
}
