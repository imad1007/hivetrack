"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";

interface Apiary { id: string; name: string; }

export default function NewHarvestPage() {
  const router = useRouter();
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [apiaryId, setApiaryId] = useState("");
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [humidityPercent, setHumidityPercent] = useState("");
  const [floraType, setFloraType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/apiaries").then((r) => r.json()).then((j) => setApiaries(j.data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/harvests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiary_id: apiaryId,
          harvest_date: harvestDate,
          total_weight_kg: parseFloat(totalWeightKg),
          humidity_percent: humidityPercent ? parseFloat(humidityPercent) : undefined,
          flora_type: floraType || undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast({ title: "Harvest logged", description: `${totalWeightKg} kg recorded`, variant: "success" });
      router.push("/harvests");
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href="/harvests">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Harvests
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-6">Log Harvest</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="apiary">Apiary *</Label>
          <Select value={apiaryId} onValueChange={setApiaryId} required>
            <SelectTrigger id="apiary">
              <SelectValue placeholder="Select apiary" />
            </SelectTrigger>
            <SelectContent>
              {apiaries.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="harvest_date">Harvest Date *</Label>
          <Input id="harvest_date" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Total Weight (kg) *</Label>
          <Input id="weight" type="number" step="0.1" min="0" value={totalWeightKg} onChange={(e) => setTotalWeightKg(e.target.value)} placeholder="0.0" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="humidity">Humidity (%)</Label>
          <Input id="humidity" type="number" step="0.1" min="0" max="100" value={humidityPercent} onChange={(e) => setHumidityPercent(e.target.value)} placeholder="17.5" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="flora">Flora Type</Label>
          <Input id="flora" value={floraType} onChange={(e) => setFloraType(e.target.value)} placeholder="Acacia, Lime, Wildflower…" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="harvest_notes">Notes</Label>
          <Textarea id="harvest_notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Saving…" : "Log Harvest"}
        </Button>
      </form>
    </div>
  );
}
