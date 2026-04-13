import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkQRAccess } from "@/lib/plan-guard";
import QRCode from "qrcode";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("plan_tier")
    .eq("user_id", user.id)
    .single();

  const accessError = checkQRAccess(profile?.plan_tier ?? "free");
  if (accessError) return accessError;

  const { data: hive, error } = await db
    .from("hives")
    .select("qr_code_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.hivetrack.io";
  const qrUrl = `${appUrl}/hives/scan/${hive.qr_code_token}`;

  const pngBuffer = await QRCode.toBuffer(qrUrl, {
    type: "png",
    width: 300,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="hive-${id}-qr.png"`,
    },
  });
}
