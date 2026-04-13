import type { Treatment, DARResult } from "@/types";
import { addDays, daysBetween } from "./utils";

/**
 * DAR = Délai Avant Récolte (Withdrawal Period Before Harvest)
 *
 * A treatment blocks harvest if the planned harvest date falls
 * within the withdrawal period that starts after treatment.end_date.
 *
 * Safe harvest window opens at: end_date + withdrawal_days
 */
export function checkDARViolation(
  treatment: Treatment,
  plannedHarvestDate: Date
): DARResult {
  const safeDate = addDays(new Date(treatment.end_date), treatment.withdrawal_days);
  const daysRemaining = daysBetween(plannedHarvestDate, safeDate);

  if (plannedHarvestDate < safeDate) {
    return {
      blocked: true,
      daysRemaining: Math.max(0, daysRemaining),
      message: `Harvest blocked: withdrawal period ends on ${safeDate.toLocaleDateString("en-GB")}. ${Math.max(0, daysRemaining)} days remaining.`,
    };
  }

  return {
    blocked: false,
    daysRemaining: 0,
    message: "Harvest is safe — withdrawal period has elapsed.",
  };
}

/**
 * Check multiple treatments against a harvest date.
 * Returns the most restrictive (longest remaining) violation, if any.
 */
export function checkAllDARViolations(
  treatments: Treatment[],
  plannedHarvestDate: Date
): DARResult & { treatmentId?: string; productName?: string } {
  let worst: (DARResult & { treatmentId?: string; productName?: string }) = {
    blocked: false,
    daysRemaining: 0,
    message: "All withdrawal periods have elapsed.",
  };

  for (const t of treatments) {
    const result = checkDARViolation(t, plannedHarvestDate);
    if (result.blocked && result.daysRemaining > worst.daysRemaining) {
      worst = { ...result, treatmentId: t.id, productName: t.product_name };
    }
  }

  return worst;
}
