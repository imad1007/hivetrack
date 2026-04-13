import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      error: "Missing env vars",
      has_url: !!url,
      has_service_key: !!serviceKey,
      has_anon_key: !!anonKey,
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
    env: {
      has_url: !!url,
      url_prefix: url?.slice(0, 30),
      service_key_role: decodeJwtRole(serviceKey),   // should be "service_role"
      anon_key_role: decodeJwtRole(anonKey ?? ""),    // should be "anon"
      keys_are_same: serviceKey === anonKey,
    },
    all_tables_exist: Object.values(results).every((r) => r.exists),
    tables: results,
    service_role_insert_test: insertError
      ? { ok: false, error: insertError.message, code: insertError.code }
      : { ok: true },
  });
}
