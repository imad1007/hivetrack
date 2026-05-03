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
    .from("varroa_checks")
    .select("*")
    .eq("user_id", user.id)
    .order("check_date", { ascending: false });

  if (hive_id) query = query.eq("hive_id", hive_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { hive_id, check_date, method, mites_counted, bees_sampled, notes } = await request.json();

  if (!hive_id || !method || mites_counted === undefined || mites_counted === null) {
    return NextResponse.json({ error: "hive_id, method, mites_counted are required" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: hive } = await db.from("hives").select("id").eq("id", hive_id).eq("user_id", user.id).single();
  if (!hive) return NextResponse.json({ error: "Hive not found" }, { status: 404 });

  const { data, error } = await db
    .from("varroa_checks")
    .insert({ hive_id, user_id: user.id, check_date, method, mites_counted, bees_sampled: bees_sampled ?? 100, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
