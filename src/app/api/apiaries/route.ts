import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkApiaryLimit } from "@/lib/plan-guard";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();
  const { data, error } = await db
    .from("apiaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[POST /api/apiaries] user.id:", user.id);
  console.log("[POST /api/apiaries] serviceKey defined:", !!serviceKey);
  console.log("[POST /api/apiaries] serviceKey prefix:", serviceKey?.slice(0, 20));

  const db = await createServiceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("plan_tier")
    .eq("user_id", user.id)
    .single();

  const { count } = await db
    .from("apiaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const limitError = checkApiaryLimit(profile?.plan_tier ?? "free", count ?? 0);
  if (limitError) return limitError;

  const body = await request.json();
  const { name, lat, lng, altitude, exposure, environment_type, water_nearby, polygon_geojson } = body;

  if (!name || lat === undefined || lng === undefined) {
    return NextResponse.json({ error: "name, lat, lng are required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("apiaries")
    .insert({ user_id: user.id, name, lat, lng, altitude, exposure, environment_type, water_nearby, polygon_geojson })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/apiaries]", error);
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
