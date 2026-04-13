import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiary_id = searchParams.get("apiary_id");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();
  let query = db
    .from("harvests")
    .select("*, apiaries(name)")
    .eq("user_id", user.id)
    .order("harvest_date", { ascending: false });

  if (apiary_id) query = query.eq("apiary_id", apiary_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { apiary_id, total_weight_kg, harvest_date } = body;

  if (!apiary_id || total_weight_kg === undefined || !harvest_date) {
    return NextResponse.json(
      { error: "apiary_id, total_weight_kg, harvest_date are required" },
      { status: 400 }
    );
  }

  const db = await createServiceClient();

  const { count: hiveCount } = await db
    .from("hives")
    .select("id", { count: "exact", head: true })
    .eq("apiary_id", apiary_id)
    .eq("status", "active");

  const avg_yield_per_hive =
    hiveCount && hiveCount > 0 ? total_weight_kg / hiveCount : null;

  const { data, error } = await db
    .from("harvests")
    .insert({ ...body, user_id: user.id, avg_yield_per_hive })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
