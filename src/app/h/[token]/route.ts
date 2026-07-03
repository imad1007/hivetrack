import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const base = new URL(request.url).origin;
  return NextResponse.redirect(`${base}/hives/scan/${token}`, 301);
}
