import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Seasonal Tasks" };

const SEASONS = [
  {
    name: "Spring",
    months: [3, 4, 5],
    color: "text-green-700 dark:text-green-400",
    bg: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/10",
    tasks: [
      { category: "Inspection",   text: "First full inspection — assess winter survival and colony strength" },
      { category: "Inspection",   text: "Check for winter starvation; feed 1:1 syrup if stores are low" },
      { category: "Varroa",       text: "First varroa count of the season (alcohol wash recommended)" },
      { category: "Swarm Mgmt",   text: "Begin weekly inspections for queen cells as population builds" },
      { category: "Swarm Mgmt",   text: "Add supers or brood boxes before colonies run out of space" },
      { category: "Equipment",    text: "Clean and repair over-wintered equipment; assemble new hive boxes" },
      { category: "Queen",        text: "Replace failing queens identified during winter inspection" },
      { category: "Feeding",      text: "Protein supplement (pollen substitute) to stimulate brood rearing" },
    ],
  },
  {
    name: "Summer",
    months: [6, 7, 8],
    color: "text-amber-700 dark:text-amber-400",
    bg: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/10",
    tasks: [
      { category: "Inspection",   text: "Weekly inspections during peak swarm season (June–July)" },
      { category: "Swarm Mgmt",   text: "Check for swarm cells; split crowded colonies proactively" },
      { category: "Varroa",       text: "Mid-season varroa count — treat if ≥3% before new bees are raised" },
      { category: "Harvest",      text: "Harvest honey when frames are ≥80% capped and moisture <18%" },
      { category: "Inspection",   text: "Ensure adequate water source near apiary during heat" },
      { category: "Queen",        text: "Requeen colonies with poor temper, low production, or failing queens" },
      { category: "Swarm Mgmt",   text: "Record and track all splits in HiveTrack" },
      { category: "Equipment",    text: "Add supers promptly during main nectar flow" },
    ],
  },
  {
    name: "Autumn",
    months: [9, 10, 11],
    color: "text-orange-700 dark:text-orange-400",
    bg: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/10",
    tasks: [
      { category: "Varroa",       text: "Critical: varroa count in late summer before winter bees are raised" },
      { category: "Varroa",       text: "Treat for varroa (oxalic acid, Apiguard, etc.) to protect winter bees" },
      { category: "Feeding",      text: "Feed 2:1 heavy syrup to build up stores to 18–20 kg" },
      { category: "Inspection",   text: "Final colony assessment — unify weak colonies to prevent loss" },
      { category: "Harvest",      text: "Remove and extract remaining supers before temperatures drop" },
      { category: "Equipment",    text: "Install mouse guards on hive entrances" },
      { category: "Equipment",    text: "Reduce entrances to prevent robbing and cold drafts" },
      { category: "Equipment",    text: "Strap or weight hive lids against autumn winds" },
    ],
  },
  {
    name: "Winter",
    months: [12, 1, 2],
    color: "text-blue-700 dark:text-blue-400",
    bg: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/10",
    tasks: [
      { category: "Inspection",   text: "Minimal disturbance — only brief checks on mild days (>10°C / 50°F)" },
      { category: "Inspection",   text: "Heft hives monthly to assess food weight (light = starvation risk)" },
      { category: "Feeding",      text: "Emergency fondant / candy board if stores run low" },
      { category: "Varroa",       text: "Oxalic acid trickle or vaporization treatment when colony is broodless" },
      { category: "Equipment",    text: "Check entrance for blockages (snow, dead bees, mice)" },
      { category: "Planning",     text: "Review season records; order new queens, equipment, treatments" },
      { category: "Planning",     text: "Plan splits and requeen schedule for next spring" },
      { category: "Planning",     text: "Order beeswax, labels, jars for next honey season" },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Varroa:     "bg-red-100 text-red-700 border-red-200",
  "Swarm Mgmt":"bg-amber-100 text-amber-700 border-amber-200",
  Inspection: "bg-blue-100 text-blue-700 border-blue-200",
  Feeding:    "bg-purple-100 text-purple-700 border-purple-200",
  Queen:      "bg-yellow-100 text-yellow-700 border-yellow-200",
  Harvest:    "bg-green-100 text-green-700 border-green-200",
  Equipment:  "bg-slate-100 text-slate-700 border-slate-200",
  Planning:   "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function SeasonalTasksPage() {
  const currentMonth = new Date().getMonth() + 1; // 1-based

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
          Seasonal Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Month-by-month beekeeping checklist. Current season is highlighted.
        </p>
      </div>

      <div className="space-y-4">
        {SEASONS.map((season) => {
          const isCurrentSeason = season.months.includes(currentMonth);
          return (
            <Card key={season.name} className={isCurrentSeason ? season.bg : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${isCurrentSeason ? season.color : ""}`}>
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  {season.name}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({season.months.map((m) => new Date(2000, m - 1).toLocaleString("en", { month: "short" })).join(", ")})
                  </span>
                  {isCurrentSeason && (
                    <Badge variant="success" className="ml-auto">Current season</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" role="list">
                  {season.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${CATEGORY_COLORS[task.category] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {task.category}
                        </span>
                        <span className="text-sm">{task.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
