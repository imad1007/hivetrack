import { createClient } from "@/lib/supabase/server";
import { Download, User, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    .eq("user_id", user?.id ?? "demo")
    .single();

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

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" aria-hidden="true" />
            {t("exportData")}
          </CardTitle>
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
    </div>
  );
}
