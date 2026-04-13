import type { QueenColorResult } from "@/types";

/**
 * International queen marking color standard:
 * Year ending in 0 or 5 → Blue
 * Year ending in 1 or 6 → White
 * Year ending in 2 or 7 → Yellow
 * Year ending in 3 or 8 → Red
 * Year ending in 4 or 9 → Green
 *
 * Mnemonic: "Will You Raise Good Bees" (White, Yellow, Red, Green, Blue)
 */
const COLOR_MAP: Record<number, { color: string; name: string; hex: string }> = {
  0: { color: "blue",   name: "Blue",   hex: "#3B82F6" },
  5: { color: "blue",   name: "Blue",   hex: "#3B82F6" },
  1: { color: "white",  name: "White",  hex: "#F8FAFC" },
  6: { color: "white",  name: "White",  hex: "#F8FAFC" },
  2: { color: "yellow", name: "Yellow", hex: "#EAB308" },
  7: { color: "yellow", name: "Yellow", hex: "#EAB308" },
  3: { color: "red",    name: "Red",    hex: "#EF4444" },
  8: { color: "red",    name: "Red",    hex: "#EF4444" },
  4: { color: "green",  name: "Green",  hex: "#22C55E" },
  9: { color: "green",  name: "Green",  hex: "#22C55E" },
};

export function getQueenMarkColor(year: number): QueenColorResult {
  const digit = year % 10;
  return COLOR_MAP[digit] ?? { color: "gray", name: "Unknown", hex: "#6B7280" };
}

export function getQueenMarkColorFromString(markColor: string): QueenColorResult {
  const name = markColor.toLowerCase();
  const entry = Object.values(COLOR_MAP).find((c) => c.name.toLowerCase() === name);
  return entry ?? { color: "gray", name: markColor, hex: "#6B7280" };
}
