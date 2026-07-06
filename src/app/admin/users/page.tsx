import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";
import { fetchAllUsers } from "@/lib/admin-data";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard");

  const data = await fetchAllUsers();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
          <Users className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Beekeepers</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.stats.total_users} registered · ${data.stats.active_users} active · ${data.stats.banned_users} disabled` : "Loading…"}
          </p>
        </div>
      </div>

      {data ? (
        <UsersTable initialUsers={data.users} />
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          Failed to load users. Check server logs.
        </div>
      )}
    </div>
  );
}
