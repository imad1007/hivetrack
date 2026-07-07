import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiary_id = searchParams.get("apiary_id");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();
  let query = db.from("hives").select("*, queens(*)").eq("user_id", user.id);
  if (apiary_id) query = query.eq("apiary_id", apiary_id);
  query = query.order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();

  const body = await request.json();
  const { apiary_id, name, type, color_code } = body;

  if (!apiary_id || !name) {
    return NextResponse.json({ error: "apiary_id and name are required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("hives")
    .insert({ apiary_id, user_id: user.id, name, type: type ?? "langstroth", color_code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
