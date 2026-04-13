import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Download, CreditCard, User, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/types";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const tier = profile?.plan_tier ?? "free";
  const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS];

  const planDesc =
    tier === "pro" ? t("proPlanDesc") :
    tier === "scale" ? t("scalePlanDesc") :
    t("freePlanDesc");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" aria-hidden="true" />
            {t("profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("name")}</p>
            <p className="font-medium">{profile?.full_name || t("notSet")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("email")}</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" aria-hidden="true" />
            {t("language")}
          </CardTitle>
          <CardDescription>{t("languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher variant="full" />
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              {t("plan")}
            </CardTitle>
            <Badge variant={tier === "scale" ? "default" : tier === "pro" ? "info" : "secondary"} className="capitalize">
              {tier}
            </Badge>
          </div>
          <CardDescription>{planDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">{t("plan")} — {t("name")}</p>
              <p className="font-semibold">{limits.apiaries === Infinity ? t("unlimited") : limits.apiaries}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Hives</p>
              <p className="font-semibold">{limits.hives === Infinity ? t("unlimited") : limits.hives}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">{t("exportData")}</p>
              <p className="font-semibold">{limits.export ? t("included") : t("notIncluded")}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">QR Codes</p>
              <p className="font-semibold">{limits.qr ? t("included") : t("notIncluded")}</p>
            </div>
          </div>

          <Link href="/settings/billing">
            <Button variant="outline" className="w-full gap-2">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              {t("manageBilling")}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Export */}
      {limits.export ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" aria-hidden="true" />
              {t("exportData")}
            </CardTitle>
            <CardDescription>{t("exportDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <a href="/api/export?format=csv" download>
              <Button variant="outline">{t("exportCsv")}</Button>
            </a>
            <a href="/api/export?format=json" download>
              <Button variant="outline">{t("exportJson")}</Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="font-medium">{t("exportRequiresPro")}</p>
            <Link href="/settings/billing" className="mt-3 inline-block">
              <Button size="sm">{t("upgradePlan")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
