import type { Visit, SwarmRiskResult } from "@/types";

/**
 * Swarm risk scoring:
 * +40 – queen cells found (swarm_signs includes 'queen_cells')
 * +30 – space needed
 * +20 – weight loss noted (swarm_signs includes 'weight_loss')
 * +10 – nervous or aggressive behavior
 *
 * Score >= 60 → high
 * Score >= 30 → medium
 * Score < 30  → low
 */
export function computeSwarmRisk(visit: Visit): SwarmRiskResult {
  let score = 0;

  const signs = visit.swarm_signs ?? [];

  if (signs.includes("queen_cells")) score += 40;
  if (visit.space_needed) score += 30;
  if (signs.includes("weight_loss")) score += 20;
  if (visit.behavior === "nervous" || visit.behavior === "aggressive") score += 10;

  let level: SwarmRiskResult["level"];
  if (score >= 60) level = "high";
  else if (score >= 30) level = "medium";
  else level = "low";

  return { score, level };
}

export function swarmRiskColor(level: SwarmRiskResult["level"]): string {
  switch (level) {
    case "high":   return "text-red-600 bg-red-50 dark:bg-red-900/20";
    case "medium": return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    case "low":    return "text-green-600 bg-green-50 dark:bg-green-900/20";
  }
}
