"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Hexagon,
  FlaskConical,
  Wheat,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { isRTL, type Locale } from "@/i18n/config";

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const router = useRouter();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/dashboard",     label: t("dashboard"),    icon: LayoutDashboard },
    { href: "/apiaries",      label: t("apiaries"),     icon: MapPin },
    { href: "/hives",         label: t("hives"),        icon: Hexagon },
    { href: "/treatments",    label: t("treatments"),   icon: FlaskConical },
    { href: "/harvests",      label: t("harvests"),     icon: Wheat },
    { href: "/queen-rearing", label: t("queenRearing"), icon: Crown },
    { href: "/feeding",       label: t("feeding"),      icon: Utensils },
    { href: "/settings",      label: t("settings"),     icon: Settings },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold"
          onClick={onNavClick}
        >
          <span className="text-2xl">🐝</span>
          <span className="text-primary">HiveTrack</span>
        </Link>
      </div>

      {/* Nav — plain overflow-y-auto, no Radix ScrollArea */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} onClick={onNavClick} />
          ))}
        </nav>
      </div>

      {/* Sign out */}
      <div className="shrink-0 border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {t("signOut")}
        </Button>
      </div>
    </div>
  );
}

/* ─── Desktop sidebar ─────────────────────────────────────────────────────── */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card h-screen sticky top-0">
      <SidebarNav />
    </aside>
  );
}

/* ─── Mobile hamburger + drawer (portal) ─────────────────────────────────── */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);

  // Wait until client mount before using portal
  useEffect(() => { setMounted(true); }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const drawer = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          [rtl ? "right" : "left"]: 0,
          width: "min(288px, 85vw)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "hsl(var(--card))",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Close button */}
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <SidebarNav onNavClick={() => setOpen(false)} />
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
