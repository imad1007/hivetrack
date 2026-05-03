import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkDARViolation } from "@/lib/dar-engine";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();

  // Verify ownership via hive
  const { data: existing } = await db
    .from("treatments")
    .select("id, hive_id, hives(user_id)")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hiveOwner = (existing.hives as unknown as { user_id: string } | null)?.user_id;
  if (hiveOwner !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await db.from("treatments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();
  const body = await request.json();

  const { data: existing } = await db
    .from("treatments")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.planned_harvest_date) {
    const merged = { ...existing, ...body };
    const dar = checkDARViolation(merged, new Date(body.planned_harvest_date));
    if (dar.blocked) {
      return NextResponse.json(
        { warning: "HARVEST_BLOCKED", days_remaining: dar.daysRemaining, message: dar.message },
        { status: 200 }
      );
    }
  }

  const { data, error } = await db
    .from("treatments")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
