"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./sidebar";
import { SyncIndicator } from "./sync-indicator";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6">
      <MobileSidebar />

      {title && (
        <h1 className="text-lg font-semibold hidden md:block">{title}</h1>
      )}

      <div className="flex-1" />

      <SyncIndicator />

      <LanguageSwitcher />

      <Button
        variant="ghost"
        size="icon"
        aria-label={t("notifications")}
        className="relative"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>
    </header>
  );
}
