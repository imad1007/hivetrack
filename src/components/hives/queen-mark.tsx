import { getQueenMarkColor } from "@/lib/queen-colors";
import { cn } from "@/lib/utils";

interface QueenMarkProps {
  year: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showAge?: boolean;
}

export function QueenMark({ year, size = "md", showLabel = false, showAge = false }: QueenMarkProps) {
  const { hex, name } = getQueenMarkColor(year);
  const currentYear = new Date().getFullYear();
  const ageYears = currentYear - year;

  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  const borderColor = name === "White" ? "#d1d5db" : "transparent";

  const ageLabel = ageYears === 0 ? "New" : ageYears === 1 ? "1 year" : `${ageYears} years`;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("rounded-full inline-block shrink-0 border", sizeClass)}
        style={{ backgroundColor: hex, borderColor }}
        role="img"
        aria-label={`Queen mark: ${name} (${year})`}
        title={`${name} — ${year} · ${ageLabel} old`}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          <span style={{ color: hex === "#F8FAFC" ? "#6b7280" : hex }} className="font-medium">{name}</span>
          {" · "}{ageLabel} old
        </span>
      )}
      {showAge && !showLabel && (
        <span className="text-sm text-muted-foreground">{ageLabel} old</span>
      )}
    </span>
  );
}
