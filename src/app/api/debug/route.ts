import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  // Quick env check — no dependencies, always returns JSON
  const envCheck = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    app_url: process.env.NEXT_PUBLIC_APP_URL ?? "NOT SET",
    node_env: process.env.NODE_ENV,
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      error: "Missing env vars",
      env: envCheck,
    });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [
    "profiles", "apiaries", "hives", "queens", "visits",
    "treatments", "feedings", "swarms", "harvests",
    "queen_lines", "visit_templates", "sync_queue",
  ];

  const results: Record<string, { exists: boolean; error?: string }> = {};
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    results[table] = error
      ? { exists: false, error: error.message }
      : { exists: true };
  }

  // Try a raw insert into apiaries to see if service role can write
  const testUserId = "00000000-0000-0000-0000-000000000000";
  const { error: insertError } = await supabase
    .from("apiaries")
    .insert({ user_id: testUserId, name: "__debug_test__", lat: 0, lng: 0 });

  // Clean up test row immediately
  await supabase
    .from("apiaries")
    .delete()
    .eq("name", "__debug_test__");

  // Decode JWT payload (middle part) to check the role claim
  function decodeJwtRole(token: string) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(Buffer.from(payload, "base64").toString()).role ?? "unknown";
    } catch {
      return "invalid_jwt";
    }
  }

  return NextResponse.json({
    env: envCheck,
    keys: {
      url_prefix: url?.slice(0, 30),
      service_key_role: decodeJwtRole(serviceKey),
      anon_key_role: decodeJwtRole(anonKey ?? ""),
      keys_are_same: serviceKey === anonKey,
    },
    all_tables_exist: Object.values(results).every((r) => r.exists),
    tables: results,
    service_role_insert_test: insertError
      ? { ok: false, error: insertError.message, code: insertError.code }
      : { ok: true },
  });
}
