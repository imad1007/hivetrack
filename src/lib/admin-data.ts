import { createServiceClient } from "@/lib/supabase/server";
import type { AdminUser, AdminStats } from "@/app/api/admin/users/route";

export async function fetchAllUsers(): Promise<{ users: AdminUser[]; stats: AdminStats }> {
  const service = createServiceClient();

  const { data: authData } = await service.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = authData?.users ?? [];

  const userIds = authUsers.map((u) => u.id);
  if (userIds.length === 0) {
    return { users: [], stats: { total_users: 0, active_users: 0, banned_users: 0, total_hives: 0, total_honey_kg: 0, total_visits: 0 } };
  }

  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, full_name, plan_tier")
    .in("user_id", userIds);

  const profileMap = new Map<string, { full_name: string; plan_tier: string }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.user_id, { full_name: p.full_name, plan_tier: p.plan_tier });
  }

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

  return { users, stats };
}

export async function fetchUserDetail(id: string) {
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
  if (authErr || !authUser) return null;

  const bannedUntil = ((authUser as unknown) as Record<string, unknown>).banned_until as string | null ?? null;
  const isBanned = Boolean(bannedUntil && new Date(bannedUntil) > new Date());

  return {
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
  };
}
