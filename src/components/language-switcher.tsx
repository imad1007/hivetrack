"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { setLocale } from "@/app/actions/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface LanguageSwitcherProps {
  /** "icon" = globe icon button (for header), "full" = button group (for settings) */
  variant?: "icon" | "full";
}

export function LanguageSwitcher({ variant = "icon" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  if (variant === "full") {
    return (
      <div className="flex flex-wrap gap-2">
        {locales.map((l) => (
          <Button
            key={l}
            variant={l === locale ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect(l)}
            disabled={isPending}
            className="gap-2"
          >
            {l === locale && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {localeNames[l]}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change language"
          disabled={isPending}
        >
          <Languages className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleSelect(l)}
            className="flex items-center gap-2"
          >
            {l === locale && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
            {l !== locale && <span className="w-3.5" />}
            {localeNames[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
