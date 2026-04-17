"use client";

import { useState, useTransition } from "react";
import { Check, Clock, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getStageState, STAGE_STATE_COLORS } from "@/lib/queen-rearing";
import type { QueenRearingStage } from "@/types";

interface Props {
  rearingId: string;
  graftingDate: string;
  stages: QueenRearingStage[];
}

const STATE_ICONS = {
  completed:     Check,
  overdue:       AlertTriangle,
  upcoming_soon: Clock,
  future:        Circle,
};

export function QueenRearingTimeline({ rearingId, graftingDate, stages }: Props) {
  const [localStages, setLocalStages] = useState(stages);
  const [, startTransition] = useTransition();

  const sorted = [...localStages].sort(
    (a, b) => new Date(a.estimated_date).getTime() - new Date(b.estimated_date).getTime()
  );

  async function toggleStage(stage: QueenRearingStage) {
    const newCompleted = !stage.completed;

    // Optimistic update
    setLocalStages((prev) =>
      prev.map((s) =>
        s.id === stage.id
          ? { ...s, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : undefined }
          : s
      )
    );

    startTransition(async () => {
      try {
        await fetch(`/api/queen-rearing/${rearingId}/stages/${stage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: newCompleted }),
        });
      } catch {
        // Revert on error
        setLocalStages(stages);
      }
    });
  }

  return (
    <div className="space-y-2">
      {/* J0 marker */}
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
          J0
        </div>
        <div>
          <p className="text-sm font-semibold">Greffe / Transfert</p>
          <p className="text-xs text-muted-foreground">{formatDate(graftingDate)}</p>
        </div>
      </div>

      {/* Connector + stages */}
      {sorted.map((stage, i) => {
        const state = getStageState(stage);
        const Icon = STATE_ICONS[state];
        const colorClass = STAGE_STATE_COLORS[state];
        const offsetDay = [5, 16, 22, 27][i] ?? "?";

        return (
          <div key={stage.id} className="flex gap-4">
            {/* Vertical connector */}
            <div className="flex flex-col items-center">
              <div className="w-px flex-1 bg-border" />
              <button
                type="button"
                onClick={() => toggleStage(stage)}
                aria-label={`Marquer "${stage.stage_name}" comme ${stage.completed ? "non terminé" : "terminé"}`}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-110",
                  colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            </div>

            {/* Stage card */}
            <div
              className={cn(
                "mb-2 flex-1 rounded-xl border p-3 transition-colors",
                colorClass
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-snug">{stage.stage_name}</p>
                  <p className="mt-0.5 text-xs opacity-75">J+{offsetDay} — {formatDate(stage.estimated_date)}</p>
                  {stage.completed && stage.completed_at && (
                    <p className="mt-0.5 text-xs opacity-60">
                      Complété le {formatDate(stage.completed_at)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {state === "completed"     ? "Terminé"
                  : state === "overdue"      ? "En retard"
                  : state === "upcoming_soon" ? "Bientôt"
                  :                            "À venir"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
