import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCheckoutSession, createOrRetrieveCustomer, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json();
  if (!plan || !["pro", "scale"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const db = await createServiceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const customerId = await createOrRetrieveCustomer(
    user.id,
    user.email!,
    profile?.stripe_customer_id ?? undefined
  );

  if (!profile?.stripe_customer_id) {
    await db
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = await createCheckoutSession(
    customerId,
    STRIPE_PRICES[plan as "pro" | "scale"],
    `${appUrl}/settings/billing?success=true`,
    `${appUrl}/settings/billing?canceled=true`
  );

  return NextResponse.json({ data: { url } });
}
