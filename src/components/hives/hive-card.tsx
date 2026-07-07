import Link from "next/link";
import { AlertTriangle, CheckCircle2, Hexagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QueenMark } from "./queen-mark";
import { daysBetween, formatDate } from "@/lib/utils";
import type { Hive, Queen } from "@/types";

interface HiveWithQueens extends Hive {
  queens?: Queen[];
}

interface HiveCardProps {
  hive: HiveWithQueens;
  lastVisitAt?: string;
}

export function HiveCard({ hive, lastVisitAt }: HiveCardProps) {
  const activeQueen = hive.queens?.find((q) => q.status === "present");
  const daysSinceVisit = lastVisitAt ? daysBetween(lastVisitAt, new Date()) : null;
  const needsVisit = daysSinceVisit === null || daysSinceVisit >= 14;

  const statusBadge = {
    active: { variant: "success" as const, label: "Active" },
    dead: { variant: "danger" as const, label: "Dead" },
    sold: { variant: "secondary" as const, label: "Sold" },
  }[hive.status];

  return (
    <Link href={`/hives/${hive.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-4 h-4 rounded-full shrink-0 border border-border"
                style={{ backgroundColor: hive.color_code ?? "#F59E0B" }}
                aria-hidden="true"
              />
              <span className="font-semibold truncate">{hive.name}</span>
            </div>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>

          {/* Queen info */}
          {activeQueen ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QueenMark year={activeQueen.mark_year} size="sm" showAge />
              {activeQueen.breed && <span className="truncate">{activeQueen.breed}</span>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No queen recorded</p>
          )}

          {/* Type badge */}
          <Badge variant="outline" className="text-xs capitalize">{hive.type}</Badge>

          {/* Visit indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {needsVisit ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {lastVisitAt ? `${daysSinceVisit}d since last visit` : "Never visited"}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                <span className="text-muted-foreground">
                  Visited {daysSinceVisit === 0 ? "today" : `${daysSinceVisit}d ago`}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
