import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatWidget } from "@/components/chat/chat-widget";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = isAdminEmail(user.email);
  if (isAdmin) redirect("/admin");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
