"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Hexagon, MapPin, AlertTriangle, FlaskConical, Calendar, Crown, Utensils, Bell } from "lucide-react";
import type { StageAlert } from "@/lib/queen-rearing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  state?: "normal" | "warning" | "danger";
  href?: string;
  attentionLabel: string;
}

function MetricCard({ title, value, icon: Icon, state = "normal", href, attentionLabel }: MetricCardProps) {
  const stateClass = {
    normal: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  }[state];

  const bgClass = {
    normal: "bg-card",
    warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  }[state];

  const content = (
    <Card className={bgClass}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${stateClass}`}>{value}</p>
          </div>
          <div className={`rounded-full p-3 ${state === "warning" ? "bg-amber-100 dark:bg-amber-900/30" : state === "danger" ? "bg-red-100 dark:bg-red-900/30" : "bg-primary/10"}`}>
            <Icon className={`h-6 w-6 ${stateClass}`} aria-hidden="true" />
          </div>
        </div>
        {state !== "normal" && (
          <p className={`text-xs mt-2 font-medium ${stateClass}`}>
            {attentionLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block hover:opacity-90 transition-opacity">{content}</Link>;
  }
  return content;
}

interface DashboardClientProps {
  stats: {
    total_hives: number;
    total_apiaries: number;
    hives_needing_attention: number;
    treatments_ending_soon: number;
  };
  visitsChartData: { week: string; visits: number }[];
  harvestChartData: { apiary: string; kg: number }[];
  tasks: { label: string; date: string; type: "treatment" | "queen" | "feeding" }[];
  queenAlerts: StageAlert[];
  feedingSuggestions: { hive_id: string; hive_name: string; days_since: number }[];
}

export function DashboardClient({ stats, visitsChartData, harvestChartData, tasks, queenAlerts, feedingSuggestions }: DashboardClientProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label={t("title")}>
        <MetricCard title={t("activeHives")} value={stats.total_hives} icon={Hexagon} href="/hives" attentionLabel={t("requiresAttention")} />
        <MetricCard title={t("apiaries")} value={stats.total_apiaries} icon={MapPin} href="/apiaries" attentionLabel={t("requiresAttention")} />
        <MetricCard
          title={t("needVisit")}
          value={stats.hives_needing_attention}
          icon={AlertTriangle}
          state={stats.hives_needing_attention > 0 ? "warning" : "normal"}
          href="/hives"
          attentionLabel={t("requiresAttention")}
        />
        <MetricCard
          title={t("treatmentsEnding")}
          value={stats.treatments_ending_soon}
          icon={FlaskConical}
          state={stats.treatments_ending_soon > 0 ? "danger" : "normal"}
          href="/treatments"
          attentionLabel={t("requiresAttention")}
        />
      </div>

      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              {t("actionsNextDays")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" role="list">
              {tasks.map((task, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="text-sm">{task.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={task.type === "treatment" ? "danger" : "warning"}>
                      {task.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(task.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Queen rearing + feeding alerts */}
      {(queenAlerts.length > 0 || feedingSuggestions.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Bell className="h-5 w-5" aria-hidden="true" />
              Alertes &amp; rappels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queenAlerts.map((a) => (
              <Link key={a.stage_id} href={`/queen-rearing/${a.rearing_id}`}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white dark:bg-card p-3 hover:border-amber-400 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Crown className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <span className="text-sm truncate">
                      <span className="font-medium">{a.stage_name}</span>
                      {" — "}{a.hive_name}
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border ${
                    a.days_away < 0
                      ? "bg-red-100 text-red-700 border-red-200"
                      : a.days_away === 0
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>
                    {a.days_away < 0 ? `${Math.abs(a.days_away)}j de retard` : a.days_away === 0 ? "Aujourd'hui" : `Dans ${a.days_away}j`}
                  </span>
                </div>
              </Link>
            ))}
            {feedingSuggestions.map((s) => (
              <Link key={s.hive_id} href={`/feeding/new`}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white dark:bg-card p-3 hover:border-amber-400 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Utensils className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <span className="text-sm truncate">
                      Alimentation recommandée — <span className="font-medium">{s.hive_name}</span>
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">
                    {s.days_since >= 999 ? "Jamais nourrie" : `${s.days_since}j sans nourrissage`}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("visitsPerWeek")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={visitsChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("harvestPerApiary")}</CardTitle>
          </CardHeader>
          <CardContent>
            {harvestChartData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                {t("noHarvests")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={harvestChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="apiary" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" unit="kg" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(val) => [`${val}kg`, "Harvest"]}
                  />
                  <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
