import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

const FOOD_TYPE_LABELS: Record<string, string> = {
  light_syrup:    "Sirop léger (1:1)",
  heavy_syrup:    "Sirop épais (2:1)",
  protein_paste:  "Pâte protéinée",
  candi:          "Candi",
  // legacy
  syrup_1_1:      "Sirop 1:1",
  syrup_2_1:      "Sirop 2:1",
  fondant:        "Fondant",
  pollen_sub:     "Substitut de pollen",
  other:          "Autre",
};

interface Props {
  hiveId?: string;
  apiaryId?: string;
  limit?: number;
}

export async function FeedingHistory({ hiveId, apiaryId, limit = 20 }: Props) {
  if (!hiveId && !apiaryId) return null;

  const supabase = await createClient();

  let query = supabase
    .from("feedings")
    .select("*")
    .order("feeding_date", { ascending: false })
    .limit(limit);

  if (hiveId)   query = query.eq("hive_id",   hiveId);
  if (apiaryId) query = query.eq("apiary_id", apiaryId);

  const { data: feedings } = await query;
  if (!feedings || feedings.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Date</th>
            <th className="text-left px-4 py-2 font-medium">Type</th>
            <th className="text-right px-4 py-2 font-medium">Quantité</th>
            {apiaryId && <th className="text-left px-4 py-2 font-medium">Mode</th>}
          </tr>
        </thead>
        <tbody>
          {feedings.map((f) => {
            const foodLabel = FOOD_TYPE_LABELS[f.food_type ?? f.type ?? ""] ?? "—";
            const qty = f.quantity
              ? `${f.quantity} ${f.unit ?? ""}`
              : f.quantity_liters
              ? `${f.quantity_liters} L`
              : "—";

            return (
              <tr key={f.id} className="border-t">
                <td className="px-4 py-2">{formatDate(f.feeding_date)}</td>
                <td className="px-4 py-2">{foodLabel}</td>
                <td className="px-4 py-2 text-right">{qty}</td>
                {apiaryId && (
                  <td className="px-4 py-2 capitalize text-muted-foreground text-xs">
                    {f.feeding_session_type === "collective" ? "Collectif" : "Individuel"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
