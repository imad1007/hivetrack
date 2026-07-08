import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card h-screen sticky top-0">
        <div className="flex h-16 shrink-0 items-center border-b px-4 gap-2">
          <span className="text-lg font-bold text-primary">HiveTrack</span>
          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
            Admin
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <AdminNavLink href="/admin" label="Overview" icon={<LayoutDashboard className="h-4 w-4" />} exact />
          <AdminNavLink href="/admin/users" label="Beekeepers" icon={<Users className="h-4 w-4" />} />
        </nav>

        <div className="shrink-0 border-t p-3 text-xs text-muted-foreground space-y-2">
          <p className="px-2 truncate">{user.email}</p>
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex md:hidden h-14 items-center border-b px-4 gap-3 bg-card">
          <span className="font-bold text-primary">HiveTrack</span>
          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">Admin</span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <Link href="/admin" className="rounded px-2 py-1 hover:bg-accent">Overview</Link>
            <Link href="/admin/users" className="rounded px-2 py-1 hover:bg-accent">Beekeepers</Link>
            <AdminSignOutButton className="rounded px-2 py-1 hover:bg-accent text-muted-foreground flex items-center gap-1" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

