import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hive_id = searchParams.get("hive_id");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hive_id) return NextResponse.json({ error: "hive_id is required" }, { status: 400 });

  const db = await createServiceClient();
  const { data, error } = await db
    .from("treatments")
    .select("*")
    .eq("hive_id", hive_id)
    .order("start_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { hive_id, product_name, start_date, end_date, withdrawal_days } = body;

  if (!hive_id || !product_name || !start_date || !end_date) {
    return NextResponse.json(
      { error: "hive_id, product_name, start_date, end_date are required" },
      { status: 400 }
    );
  }

  const db = await createServiceClient();

  // Verify hive ownership
  const { data: hive } = await db
    .from("hives")
    .select("id")
    .eq("id", hive_id)
    .eq("user_id", user.id)
    .single();

  if (!hive) return NextResponse.json({ error: "Hive not found" }, { status: 404 });

  const { data, error } = await db
    .from("treatments")
    .insert({ ...body, withdrawal_days: withdrawal_days ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
