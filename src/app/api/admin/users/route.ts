import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  plan_tier: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_banned: boolean;
  banned_until: string | null;
  apiary_count: number;
  hive_count: number;
  honey_kg: number;
  visit_count: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  total_hives: number;
  total_honey_kg: number;
  total_visits: number;
}

export async function GET(_req: NextRequest) {
  // Verify caller is admin
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();

  // 1. List all auth users
  const { data: authData, error: authErr } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
  const authUsers = authData.users;

  // 2. Fetch profiles
  const userIds = authUsers.map((u) => u.id);
  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, full_name, plan_tier")
    .in("user_id", userIds);

  const profileMap = new Map<string, { full_name: string; plan_tier: string }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.user_id, { full_name: p.full_name, plan_tier: p.plan_tier });
  }

  // 3. Aggregate stats per user (apiaries, hives, honey, visits)
  const [{ data: apiaryRows }, { data: hiveRows }, { data: harvestRows }, { data: visitRows }] =
    await Promise.all([
      service.from("apiaries").select("user_id").in("user_id", userIds),
      service.from("hives").select("user_id").in("user_id", userIds),
      service.from("harvests").select("user_id, honey_kg").in("user_id", userIds),
      service.from("visits").select("user_id").in("user_id", userIds),
    ]);

  const apiaryCount = new Map<string, number>();
  const hiveCount = new Map<string, number>();
  const honeyKg = new Map<string, number>();
  const visitCount = new Map<string, number>();

  for (const r of apiaryRows ?? []) apiaryCount.set(r.user_id, (apiaryCount.get(r.user_id) ?? 0) + 1);
  for (const r of hiveRows ?? []) hiveCount.set(r.user_id, (hiveCount.get(r.user_id) ?? 0) + 1);
  for (const r of harvestRows ?? []) honeyKg.set(r.user_id, (honeyKg.get(r.user_id) ?? 0) + (r.honey_kg ?? 0));
  for (const r of visitRows ?? []) visitCount.set(r.user_id, (visitCount.get(r.user_id) ?? 0) + 1);

  // 4. Merge and return
  const now = new Date();
  const users: AdminUser[] = authUsers.map((u) => {
    const prof = profileMap.get(u.id);
    const bannedUntil = ((u as unknown) as Record<string, unknown>).banned_until as string | null ?? null;
    const isBanned = Boolean(bannedUntil && new Date(bannedUntil) > now);
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: prof?.full_name ?? "",
      plan_tier: prof?.plan_tier ?? "free",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      is_banned: isBanned,
      banned_until: bannedUntil,
      apiary_count: apiaryCount.get(u.id) ?? 0,
      hive_count: hiveCount.get(u.id) ?? 0,
      honey_kg: Math.round((honeyKg.get(u.id) ?? 0) * 10) / 10,
      visit_count: visitCount.get(u.id) ?? 0,
    };
  });

  const stats: AdminStats = {
    total_users: users.length,
    active_users: users.filter((u) => !u.is_banned).length,
    banned_users: users.filter((u) => u.is_banned).length,
    total_hives: users.reduce((s, u) => s + u.hive_count, 0),
    total_honey_kg: Math.round(users.reduce((s, u) => s + u.honey_kg, 0) * 10) / 10,
    total_visits: users.reduce((s, u) => s + u.visit_count, 0),
  };

  return NextResponse.json({ users, stats });
}
