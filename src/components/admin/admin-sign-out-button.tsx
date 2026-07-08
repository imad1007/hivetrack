"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AdminSignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className={className ?? "flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"}
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
