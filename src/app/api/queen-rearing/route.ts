import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateQueenRearingStages } from "@/lib/queen-rearing";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("queen_rearings")
    .select("*, hives(name, apiary_id), queen_rearing_stages(*)")
    .eq("user_id", user.id)
    .order("grafting_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { hive_id, grafting_date, rearing_type, notes } = await request.json();

  if (!hive_id || !grafting_date || !rearing_type) {
    return NextResponse.json(
      { error: "hive_id, grafting_date et rearing_type sont obligatoires" },
      { status: 400 }
    );
  }

  const db = createServiceClient();

  // Verify hive belongs to user
  const { data: hive } = await db
    .from("hives")
    .select("id")
    .eq("id", hive_id)
    .eq("user_id", user.id)
    .single();

  if (!hive) return NextResponse.json({ error: "Ruche introuvable" }, { status: 404 });

  // Create the rearing record
  const { data: rearing, error: rErr } = await db
    .from("queen_rearings")
    .insert({ hive_id, user_id: user.id, grafting_date, rearing_type, notes })
    .select()
    .single();

  if (rErr || !rearing) return NextResponse.json({ error: rErr?.message ?? "Erreur" }, { status: 500 });

  // Auto-generate stages
  const stages = generateQueenRearingStages(new Date(grafting_date));
  const { error: sErr } = await db
    .from("queen_rearing_stages")
    .insert(stages.map((s) => ({ ...s, queen_rearing_id: rearing.id })));

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  return NextResponse.json({ data: rearing }, { status: 201 });
}
