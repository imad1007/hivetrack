import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id, stageId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { completed } = await request.json();

  const db = createServiceClient();

  // Verify rearing belongs to user
  const { data: rearing } = await db
    .from("queen_rearings")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!rearing) return NextResponse.json({ error: "Élevage introuvable" }, { status: 404 });

  const { data, error } = await db
    .from("queen_rearing_stages")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", stageId)
    .eq("queen_rearing_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
