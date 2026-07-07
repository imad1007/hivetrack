import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await createServiceClient();

  const { data: userHives } = await db.from("hives").select("id").eq("user_id", user.id);
  const hiveIds = userHives?.map((h) => h.id) ?? [];

  const [apiaries, hives, visits, treatments, feedings, harvests, swarms] = await Promise.all([
    db.from("apiaries").select("*").eq("user_id", user.id),
    db.from("hives").select("*").eq("user_id", user.id),
    db.from("visits").select("*").eq("user_id", user.id),
    hiveIds.length > 0
      ? db.from("treatments").select("*").in("hive_id", hiveIds)
      : Promise.resolve({ data: [] }),
    hiveIds.length > 0
      ? db.from("feedings").select("*").in("hive_id", hiveIds)
      : Promise.resolve({ data: [] }),
    db.from("harvests").select("*").eq("user_id", user.id),
    hiveIds.length > 0
      ? db.from("swarms").select("*").in("hive_id", hiveIds)
      : Promise.resolve({ data: [] }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    apiaries: apiaries.data ?? [],
    hives: hives.data ?? [],
    visits: visits.data ?? [],
    treatments: treatments.data ?? [],
    feedings: feedings.data ?? [],
    harvests: harvests.data ?? [],
    swarms: swarms.data ?? [],
  };

  if (format === "csv") {
    const sections = Object.entries(exportData)
      .filter(([k]) => !["exported_at", "user_id"].includes(k))
      .map(([key, rows]) => `### ${key}\n${toCSV(rows as Record<string, unknown>[])}`);

    return new NextResponse(sections.join("\n\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hivetrack-export-${Date.now()}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hivetrack-export-${Date.now()}.json"`,
    },
  });
}
