import type { PlanTier } from "@/types";
import { PLAN_LIMITS } from "@/types";
import { NextResponse } from "next/server";

export function checkApiaryLimit(tier: PlanTier, currentCount: number) {
  const limit = PLAN_LIMITS[tier].apiaries;
  if (currentCount >= limit) {
    return NextResponse.json(
      {
        error: "PLAN_LIMIT_REACHED",
        message: `Your ${tier} plan allows a maximum of ${limit === Infinity ? "unlimited" : limit} apiaries. Please upgrade.`,
      },
      { status: 403 }
    );
  }
  return null;
}

export function checkHiveLimit(tier: PlanTier, currentCount: number) {
  const limit = PLAN_LIMITS[tier].hives;
  if (currentCount >= limit) {
    return NextResponse.json(
      {
        error: "PLAN_LIMIT_REACHED",
        message: `Your ${tier} plan allows a maximum of ${limit === Infinity ? "unlimited" : limit} hives. Please upgrade.`,
      },
      { status: 403 }
    );
  }
  return null;
}

export function checkExportAccess(tier: PlanTier) {
  if (!PLAN_LIMITS[tier].export) {
    return NextResponse.json(
      {
        error: "FEATURE_NOT_AVAILABLE",
        message: "Data export is available on the Pro and Scale plans.",
      },
      { status: 403 }
    );
  }
  return null;
}

export function checkQRAccess(tier: PlanTier) {
  if (!PLAN_LIMITS[tier].qr) {
    return NextResponse.json(
      {
        error: "FEATURE_NOT_AVAILABLE",
        message: "QR codes are available on the Pro and Scale plans.",
      },
      { status: 403 }
    );
  }
  return null;
}
