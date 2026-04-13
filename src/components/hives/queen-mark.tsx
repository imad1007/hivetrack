import { getQueenMarkColor } from "@/lib/queen-colors";
import { cn } from "@/lib/utils";

interface QueenMarkProps {
  year: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function QueenMark({ year, size = "md", showLabel = false }: QueenMarkProps) {
  const { hex, name } = getQueenMarkColor(year);

  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  const borderColor = name === "White" ? "#d1d5db" : "transparent";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("rounded-full inline-block shrink-0 border", sizeClass)}
        style={{ backgroundColor: hex, borderColor }}
        role="img"
        aria-label={`Queen mark: ${name} (${year})`}
        title={`${name} — ${year}`}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {name} ({year})
        </span>
      )}
    </span>
  );
}
