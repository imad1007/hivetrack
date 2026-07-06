import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";

async function verifyAdmin() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

// GET /api/admin/users/[id] — detailed single-user view
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const service = createServiceClient();

  const [
    { data: authData, error: authErr },
    { data: profile },
    { data: apiaries },
    { data: hives },
    { data: harvests },
    { data: visits },
    { data: treatments },
  ] = await Promise.all([
    service.auth.admin.getUserById(id),
    service.from("profiles").select("full_name, plan_tier, created_at").eq("user_id", id).single(),
    service.from("apiaries").select("id, name, lat, lng, created_at").eq("user_id", id),
    service.from("hives").select("id, name, status, colony_strength, apiary_id").eq("user_id", id),
    service.from("harvests").select("id, honey_kg, harvest_date, honey_type").eq("user_id", id).order("harvest_date", { ascending: false }).limit(10),
    service.from("visits").select("id, visited_at, overall_health").eq("user_id", id).order("visited_at", { ascending: false }).limit(5),
    service.from("treatments").select("id, product_name, applied_at").eq("user_id", id).order("applied_at", { ascending: false }).limit(5),
  ]);

  const authUser = authData?.user ?? null;
  if (authErr || !authUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const bannedUntil = ((authUser as unknown) as Record<string, unknown>).banned_until as string | null ?? null;
  const isBanned = Boolean(bannedUntil && new Date(bannedUntil) > new Date());

  return NextResponse.json({
    user: {
      id: authUser.id,
      email: authUser.email ?? "",
      full_name: profile?.full_name ?? "",
      plan_tier: profile?.plan_tier ?? "free",
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      is_banned: isBanned,
      banned_until: bannedUntil,
    },
    apiaries: apiaries ?? [],
    hives: hives ?? [],
    harvests: harvests ?? [],
    visits: visits ?? [],
    treatments: treatments ?? [],
    stats: {
      apiary_count: (apiaries ?? []).length,
      hive_count: (hives ?? []).length,
      honey_kg: Math.round((harvests ?? []).reduce((s, h) => s + (h.honey_kg ?? 0), 0) * 10) / 10,
      visit_count: (visits ?? []).length,
      treatment_count: (treatments ?? []).length,
    },
  });
}

// PATCH /api/admin/users/[id] — { action: "ban" | "unban" | "update_plan", plan_tier?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { action: string; plan_tier?: string };
  const service = createServiceClient();

  if (body.action === "ban") {
    const { error } = await service.auth.admin.updateUserById(id, {
      ban_duration: "876000h",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, is_banned: true });
  }

  if (body.action === "unban") {
    const { error } = await service.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, is_banned: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
