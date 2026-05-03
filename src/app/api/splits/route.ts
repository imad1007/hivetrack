import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hive_id = searchParams.get("hive_id");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  let query = db
    .from("hive_splits")
    .select("*")
    .eq("user_id", user.id)
    .order("split_date", { ascending: false });

  if (hive_id) {
    query = query.or(`source_hive_id.eq.${hive_id},new_hive_id.eq.${hive_id}`);
  }

  const { data: splits, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with hive names
  const { data: hives } = await db.from("hives").select("id, name").eq("user_id", user.id);
  const hiveMap = Object.fromEntries((hives ?? []).map((h) => [h.id, h.name]));

  const enriched = (splits ?? []).map((s) => ({
    ...s,
    source_hive_name: hiveMap[s.source_hive_id] ?? "Unknown",
    new_hive_name: s.new_hive_id ? (hiveMap[s.new_hive_id] ?? null) : null,
  }));

  return NextResponse.json({ data: enriched });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { source_hive_id, new_hive_id, split_date, split_type, queen_status, notes } = await request.json();

  if (!source_hive_id || !split_type || !queen_status) {
    return NextResponse.json({ error: "source_hive_id, split_type, queen_status are required" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: hive } = await db.from("hives").select("id").eq("id", source_hive_id).eq("user_id", user.id).single();
  if (!hive) return NextResponse.json({ error: "Source hive not found" }, { status: 404 });

  const { data, error } = await db
    .from("hive_splits")
    .insert({ source_hive_id, new_hive_id: new_hive_id || null, user_id: user.id, split_date, split_type, queen_status, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
