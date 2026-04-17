/**
 * Queen-rearing business logic.
 * Pure functions — no I/O, fully unit-testable.
 */

// ─── Stage definitions ───────────────────────────────────────────────────────

export interface QueenRearingStageCreate {
  stage_name: string;
  estimated_date: string; // ISO date string "YYYY-MM-DD"
  alert_days_before: number;
}

const STAGE_DEFINITIONS = [
  { stage_name: "Operculation cellule royale", day_offset: 5 },
  { stage_name: "Naissance de la reine",       day_offset: 16 },
  { stage_name: "Vol de fécondation",          day_offset: 22 },
  { stage_name: "Ponte observée",              day_offset: 27 },
] as const;

/** Returns the ISO date string for a given day offset from a base date. */
function addDaysToDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Generates the 4 standard queen-rearing stages from J0 (grafting date).
 *
 * Stage schedule:
 *   J+5  — Operculation cellule royale
 *   J+16 — Naissance de la reine
 *   J+22 — Vol de fécondation (midpoint of J+20–J+25)
 *   J+27 — Ponte observée     (midpoint of J+25–J+30)
 */
export function generateQueenRearingStages(
  graftingDate: Date,
  alertDaysBefore = 1
): QueenRearingStageCreate[] {
  return STAGE_DEFINITIONS.map(({ stage_name, day_offset }) => ({
    stage_name,
    estimated_date: addDaysToDate(graftingDate, day_offset),
    alert_days_before: alertDaysBefore,
  }));
}

// ─── Alert computation ───────────────────────────────────────────────────────

export interface RearingWithStages {
  id: string;
  hive_name: string;
  stages: {
    id: string;
    stage_name: string;
    estimated_date: string;
    alert_days_before: number;
    completed: boolean;
  }[];
}

export interface StageAlert {
  rearing_id: string;
  stage_id: string;
  stage_name: string;
  hive_name: string;
  estimated_date: string;
  days_away: number;
}

/**
 * Returns all uncompleted stages whose alert window has started.
 * A stage enters its alert window when: today >= estimated_date - alert_days_before
 *
 * Results are sorted by days_away ascending (most urgent first).
 */
export function getUpcomingStageAlerts(
  rearings: RearingWithStages[],
  today: Date = new Date()
): StageAlert[] {
  const todayMs = new Date(today.toISOString().split("T")[0]).getTime();
  const alerts: StageAlert[] = [];

  for (const rearing of rearings) {
    for (const stage of rearing.stages) {
      if (stage.completed) continue;

      const stageMs = new Date(stage.estimated_date).getTime();
      const daysAway = Math.round((stageMs - todayMs) / 86_400_000);
      const windowStart = daysAway - stage.alert_days_before;

      // Alert fires when within the window (daysAway <= alert_days_before)
      // and stage hasn't passed yet (daysAway >= 0) OR is overdue (daysAway < 0)
      if (daysAway <= stage.alert_days_before) {
        alerts.push({
          rearing_id: rearing.id,
          stage_id: stage.id,
          stage_name: stage.stage_name,
          hive_name: rearing.hive_name,
          estimated_date: stage.estimated_date,
          days_away: daysAway,
        });
      }

      void windowStart; // suppress unused var lint
    }
  }

  return alerts.sort((a, b) => a.days_away - b.days_away);
}

// ─── Stage display helpers ───────────────────────────────────────────────────

export type StageState = "completed" | "overdue" | "upcoming_soon" | "future";

export function getStageState(stage: {
  completed: boolean;
  estimated_date: string;
}, today: Date = new Date()): StageState {
  if (stage.completed) return "completed";
  const todayMs = new Date(today.toISOString().split("T")[0]).getTime();
  const stageMs = new Date(stage.estimated_date).getTime();
  const daysAway = Math.round((stageMs - todayMs) / 86_400_000);
  if (daysAway < 0)  return "overdue";
  if (daysAway <= 3) return "upcoming_soon";
  return "future";
}

export const STAGE_STATE_COLORS: Record<StageState, string> = {
  completed:     "bg-green-100 border-green-300 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400",
  overdue:       "bg-red-100 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400",
  upcoming_soon: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
  future:        "bg-muted/50 border-border text-muted-foreground",
};
