import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";
import { fetchAllUsers } from "@/lib/admin-data";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Hexagon, Wheat, Activity, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard");

  const data = await fetchAllUsers();
  if (!data) {
    return <div className="p-8 text-muted-foreground">Failed to load admin data.</div>;
  }

  const { users, stats } = data;

  // Top 5 honey producers
  const topProducers = [...users]
    .sort((a, b) => b.honey_kg - a.honey_kg)
    .slice(0, 5)
    .filter((u) => u.honey_kg > 0);

  // Recent signups (last 5)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide metrics and quick insights</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Beekeepers"
          value={stats.total_users}
          sub={`${stats.active_users} active · ${stats.banned_users} disabled`}
          icon={<Users className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Total Hives"
          value={stats.total_hives}
          sub="across all users"
          icon={<Hexagon className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Total Honey"
          value={`${stats.total_honey_kg} kg`}
          sub="all harvests combined"
          icon={<Wheat className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Total Visits"
          value={stats.total_visits}
          sub="hive inspections logged"
          icon={<Activity className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Avg Hives / User"
          value={stats.total_users > 0 ? (stats.total_hives / stats.total_users).toFixed(1) : "0"}
          sub="hives per beekeeper"
          icon={<Hexagon className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          title="Avg Honey / User"
          value={stats.total_users > 0 ? `${(stats.total_honey_kg / stats.total_users).toFixed(1)} kg` : "0 kg"}
          sub="honey per beekeeper"
          icon={<Wheat className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top honey producers */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Top Honey Producers</CardTitle>
            <Link href="/admin/users" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No harvest data yet.</p>
            ) : (
              topProducers.map((u, i) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.hive_count} hives</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">{u.honey_kg} kg</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent signups */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Signups</CardTitle>
            <Link href="/admin/users" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                  {(u.full_name || u.email).slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                {u.is_banned && (
                  <span className="text-[10px] rounded-full bg-red-100 text-red-600 px-2 py-0.5 font-medium">Disabled</span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: { title: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

