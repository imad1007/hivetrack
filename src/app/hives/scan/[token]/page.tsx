import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ScanRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = await createClient();

  // Look up hive by QR token (public query, but hive is still RLS-protected)
  const { data: hive } = await supabase
    .from("hives")
    .select("id, user_id")
    .eq("qr_code_token", token)
    .maybeSingle();

  if (!hive) {
    // Token not found — redirect to login with a message
    redirect("/login?error=qr_not_found");
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated — go to login and come back
    redirect(`/login?redirect=/hives/${hive.id}`);
  }

  // Authenticated — redirect directly to the hive
  redirect(`/hives/${hive.id}`);
}
