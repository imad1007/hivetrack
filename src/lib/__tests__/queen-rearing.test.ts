/**
 * Unit tests for queen-rearing business logic.
 * Run with:  npx vitest   (install: npm install -D vitest)
 */
import { describe, it, expect } from "vitest";
import {
  generateQueenRearingStages,
  getUpcomingStageAlerts,
  getStageState,
} from "../queen-rearing";

// ─── generateQueenRearingStages ───────────────────────────────────────────────

describe("generateQueenRearingStages", () => {
  const J0 = new Date("2024-01-01"); // Monday, Jan 1

  it("returns exactly 4 stages", () => {
    expect(generateQueenRearingStages(J0)).toHaveLength(4);
  });

  it("stage 0 (Operculation) is J+5 → 2024-01-06", () => {
    const stages = generateQueenRearingStages(J0);
    expect(stages[0].stage_name).toBe("Operculation cellule royale");
    expect(stages[0].estimated_date).toBe("2024-01-06");
  });

  it("stage 1 (Naissance) is J+16 → 2024-01-17", () => {
    const stages = generateQueenRearingStages(J0);
    expect(stages[1].stage_name).toBe("Naissance de la reine");
    expect(stages[1].estimated_date).toBe("2024-01-17");
  });

  it("stage 2 (Vol fécondation) is J+22 → 2024-01-23", () => {
    const stages = generateQueenRearingStages(J0);
    expect(stages[2].stage_name).toBe("Vol de fécondation");
    expect(stages[2].estimated_date).toBe("2024-01-23");
  });

  it("stage 3 (Ponte observée) is J+27 → 2024-01-28", () => {
    const stages = generateQueenRearingStages(J0);
    expect(stages[3].stage_name).toBe("Ponte observée");
    expect(stages[3].estimated_date).toBe("2024-01-28");
  });

  it("defaults alert_days_before to 1", () => {
    const stages = generateQueenRearingStages(J0);
    stages.forEach((s) => expect(s.alert_days_before).toBe(1));
  });

  it("accepts custom alertDaysBefore", () => {
    const stages = generateQueenRearingStages(J0, 3);
    stages.forEach((s) => expect(s.alert_days_before).toBe(3));
  });

  it("handles month boundary correctly (Dec 30 + 5 = Jan 4)", () => {
    const stages = generateQueenRearingStages(new Date("2023-12-30"));
    expect(stages[0].estimated_date).toBe("2024-01-04");
  });

  it("handles leap year (Feb 27 + 5 = Mar 3)", () => {
    const stages = generateQueenRearingStages(new Date("2024-02-27")); // 2024 is leap
    expect(stages[0].estimated_date).toBe("2024-03-03");
  });
});

// ─── getUpcomingStageAlerts ───────────────────────────────────────────────────

describe("getUpcomingStageAlerts", () => {
  const TODAY = new Date("2024-01-10");

  function makeRearing(overrides: {
    stages: { id: string; stage_name: string; estimated_date: string; alert_days_before: number; completed: boolean }[]
  }) {
    return {
      id: "rearing-1",
      hive_name: "Ruche Alpha",
      ...overrides,
    };
  }

  it("returns alert for stage due today (daysAway=0)", () => {
    const rearing = makeRearing({
      stages: [{ id: "s1", stage_name: "Naissance de la reine", estimated_date: "2024-01-10", alert_days_before: 1, completed: false }],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].days_away).toBe(0);
  });

  it("returns alert for stage within alert_days_before window", () => {
    const rearing = makeRearing({
      stages: [{ id: "s1", stage_name: "Ponte observée", estimated_date: "2024-01-11", alert_days_before: 2, completed: false }],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].days_away).toBe(1);
  });

  it("does NOT return alert for stage outside alert window", () => {
    const rearing = makeRearing({
      stages: [{ id: "s1", stage_name: "Vol de fécondation", estimated_date: "2024-01-15", alert_days_before: 1, completed: false }],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts).toHaveLength(0);
  });

  it("does NOT return alert for completed stage", () => {
    const rearing = makeRearing({
      stages: [{ id: "s1", stage_name: "Operculation cellule royale", estimated_date: "2024-01-10", alert_days_before: 1, completed: true }],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts).toHaveLength(0);
  });

  it("returns overdue stage (daysAway < 0) as alert", () => {
    const rearing = makeRearing({
      stages: [{ id: "s1", stage_name: "Ponte observée", estimated_date: "2024-01-08", alert_days_before: 1, completed: false }],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].days_away).toBe(-2);
  });

  it("sorts by days_away ascending (most urgent first)", () => {
    const rearing = makeRearing({
      stages: [
        { id: "s1", stage_name: "Ponte observée",    estimated_date: "2024-01-11", alert_days_before: 2, completed: false },
        { id: "s2", stage_name: "Naissance",          estimated_date: "2024-01-08", alert_days_before: 1, completed: false },
      ],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts[0].days_away).toBeLessThanOrEqual(alerts[1]?.days_away ?? Infinity);
  });

  it("includes hive_name in alert", () => {
    const rearing = makeRearing({
      stages: [{ id: "s1", stage_name: "Naissance de la reine", estimated_date: "2024-01-10", alert_days_before: 1, completed: false }],
    });
    const alerts = getUpcomingStageAlerts([rearing], TODAY);
    expect(alerts[0].hive_name).toBe("Ruche Alpha");
  });
});

// ─── getStageState ────────────────────────────────────────────────────────────

describe("getStageState", () => {
  const TODAY = new Date("2024-01-10");

  it("returns 'completed' when stage is completed", () => {
    expect(getStageState({ completed: true, estimated_date: "2024-01-10" }, TODAY)).toBe("completed");
  });

  it("returns 'overdue' when date is in the past", () => {
    expect(getStageState({ completed: false, estimated_date: "2024-01-05" }, TODAY)).toBe("overdue");
  });

  it("returns 'upcoming_soon' when date is within 3 days", () => {
    expect(getStageState({ completed: false, estimated_date: "2024-01-12" }, TODAY)).toBe("upcoming_soon");
  });

  it("returns 'future' when date is more than 3 days away", () => {
    expect(getStageState({ completed: false, estimated_date: "2024-01-20" }, TODAY)).toBe("future");
  });

  it("returns 'upcoming_soon' on the day itself (daysAway=0)", () => {
    expect(getStageState({ completed: false, estimated_date: "2024-01-10" }, TODAY)).toBe("upcoming_soon");
  });
});
