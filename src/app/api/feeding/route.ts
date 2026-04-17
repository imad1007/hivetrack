import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hive_id     = searchParams.get("hive_id");
  const apiary_id   = searchParams.get("apiary_id");
  const start_date  = searchParams.get("start_date");
  const end_date    = searchParams.get("end_date");
  const food_type   = searchParams.get("food_type");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();

  // Fetch all hive IDs owned by user for security scoping
  const { data: ownedHives } = await db
    .from("hives")
    .select("id")
    .eq("user_id", user.id);
  const ownedHiveIds = (ownedHives ?? []).map((h) => h.id);

  const { data: ownedApiaries } = await db
    .from("apiaries")
    .select("id")
    .eq("user_id", user.id);
  const ownedApiaryIds = (ownedApiaries ?? []).map((a) => a.id);

  let query = db
    .from("feedings")
    .select("*, hives(name, apiary_id), apiaries(name)")
    .order("feeding_date", { ascending: false });

  if (hive_id) {
    query = query.eq("hive_id", hive_id);
  } else if (apiary_id) {
    query = query.eq("apiary_id", apiary_id);
  } else {
    // Return all feedings for user's hives + apiaries
    query = query.or(
      `hive_id.in.(${ownedHiveIds.join(",")}),apiary_id.in.(${ownedApiaryIds.join(",")})`
    );
  }

  if (start_date) query = query.gte("feeding_date", start_date);
  if (end_date)   query = query.lte("feeding_date", end_date);
  if (food_type)  query = query.eq("food_type", food_type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    feeding_session_type,
    hive_id,
    apiary_id,
    food_type,
    quantity,
    unit,
    feeding_date,
    notes,
  } = body;

  if (!feeding_session_type || !food_type || !quantity || !unit || !feeding_date) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants" },
      { status: 400 }
    );
  }

  if (feeding_session_type === "individual" && !hive_id) {
    return NextResponse.json({ error: "hive_id requis pour alimentation individuelle" }, { status: 400 });
  }
  if (feeding_session_type === "collective" && !apiary_id) {
    return NextResponse.json({ error: "apiary_id requis pour alimentation collective" }, { status: 400 });
  }

  const db = createServiceClient();

  // Verify ownership
  if (hive_id) {
    const { data: hive } = await db.from("hives").select("id").eq("id", hive_id).eq("user_id", user.id).single();
    if (!hive) return NextResponse.json({ error: "Ruche introuvable" }, { status: 404 });
  }
  if (apiary_id) {
    const { data: apiary } = await db.from("apiaries").select("id").eq("id", apiary_id).eq("user_id", user.id).single();
    if (!apiary) return NextResponse.json({ error: "Rucher introuvable" }, { status: 404 });
  }

  const { data, error } = await db
    .from("feedings")
    .insert({
      feeding_session_type,
      hive_id:   feeding_session_type === "individual" ? hive_id   : null,
      apiary_id: feeding_session_type === "collective" ? apiary_id : null,
      food_type,
      quantity,
      unit,
      feeding_date,
      notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
