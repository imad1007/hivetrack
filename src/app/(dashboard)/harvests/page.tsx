import { createClient } from "@/lib/supabase/server";
import { Wheat, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Harvests" };

export default async function HarvestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*, apiaries(name)")
    .eq("user_id", user!.id)
    .order("harvest_date", { ascending: false });

  const totalKg = (harvests ?? []).reduce((sum, h) => sum + h.total_weight_kg, 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Harvests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total: {totalKg.toFixed(1)} kg this season
          </p>
        </div>
        <Link href="/harvests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Log Harvest
          </Button>
        </Link>
      </div>

      {harvests && harvests.length > 0 ? (
        <div className="space-y-3">
          {harvests.map((h) => {
            const apiary = h.apiaries as { name: string } | null;
            return (
              <Card key={h.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-lg">{h.total_weight_kg} kg</p>
                        {h.flora_type && <Badge variant="outline">{h.flora_type}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apiary?.name} · {formatDate(h.harvest_date)}
                      </p>
                      {h.humidity_percent !== null && h.humidity_percent !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Humidity: {h.humidity_percent}%
                        </p>
                      )}
                      {h.avg_yield_per_hive && (
                        <p className="text-xs text-muted-foreground">
                          Avg per hive: {h.avg_yield_per_hive.toFixed(1)} kg
                        </p>
                      )}
                    </div>
                    <Wheat className="h-6 w-6 text-honey-500 shrink-0 mt-1" aria-hidden="true" />
                  </div>
                  {h.notes && (
                    <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{h.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Wheat className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="font-medium">No harvests recorded</p>
            <p className="text-sm text-muted-foreground mt-1">
              Log your first harvest when the honey is ready!
            </p>
            <Link href="/harvests/new" className="mt-4 inline-block">
              <Button>Log First Harvest</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
