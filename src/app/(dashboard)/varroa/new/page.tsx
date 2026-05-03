"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import type { Hive } from "@/types";

const METHOD_INFO: Record<string, { label: string; defaultSample: number; tip: string }> = {
  alcohol_wash:  { label: "Alcohol Wash",        defaultSample: 100, tip: "Most accurate. ~300 bees (½ cup), count mites in alcohol." },
  sugar_roll:    { label: "Sugar Roll",           defaultSample: 100, tip: "Non-lethal. ~300 bees with powdered sugar, shake & count." },
  drone_brood:   { label: "Drone Brood Uncap",   defaultSample: 100, tip: "Uncap 100 drone cells, count mites on pupae." },
  sticky_board:  { label: "Sticky Board (24h)",  defaultSample: 1,   tip: "Count natural mite fall over 24h. Divide by hive frames." },
};

export default function NewVarroaCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preHiveId = searchParams.get("hive_id") ?? "";

  const [hives, setHives] = useState<Hive[]>([]);
  const [hiveId, setHiveId] = useState(preHiveId);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("alcohol_wash");
  const [mitesCounted, setMitesCounted] = useState("");
  const [beesSampled, setBeesSampled] = useState("100");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHives, setLoadingHives] = useState(true);

  useEffect(() => {
    fetch("/api/hives")
      .then((r) => r.json())
      .then((j) => setHives((j.data ?? []).filter((h: Hive) => h.status === "active")))
      .catch(() => toast({ title: "Error", description: "Could not load hives", variant: "destructive" }))
      .finally(() => setLoadingHives(false));
  }, []);

  function handleMethodChange(m: string) {
    setMethod(m);
    setBeesSampled(String(METHOD_INFO[m]?.defaultSample ?? 100));
  }

  const mites = parseInt(mitesCounted) || 0;
  const bees  = parseInt(beesSampled)  || 100;
  const pct   = bees > 0 ? (mites / bees) * 100 : 0;
  const hasCount = mitesCounted !== "";

  const pctConfig = pct >= 3
    ? { color: "text-red-600", bg: "border-red-200 bg-red-50 dark:bg-red-950/20", label: "⚠ Treatment needed immediately" }
    : pct >= 2
    ? { color: "text-amber-600", bg: "border-amber-200 bg-amber-50 dark:bg-amber-950/20", label: "⚠ Watch closely — approaching threshold" }
    : { color: "text-green-600", bg: "border-green-200 bg-green-50 dark:bg-green-950/20", label: "✓ Below treatment threshold" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hiveId) {
      toast({ title: "Error", description: "Select a hive", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/varroa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hive_id: hiveId, check_date: checkDate, method, mites_counted: mites, bees_sampled: bees, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error");
      toast({ title: "Check recorded", variant: "success" });
      router.push("/varroa");
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href="/varroa">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Varroa Monitoring
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <Bug className="h-6 w-6 text-red-500" aria-hidden="true" />
        Log Varroa Check
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Record a mite count to track infestation levels.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="hive">Hive *</Label>
          <Select value={hiveId} onValueChange={setHiveId} disabled={loadingHives}>
            <SelectTrigger id="hive">
              <SelectValue placeholder={loadingHives ? "Loading…" : "Select hive"} />
            </SelectTrigger>
            <SelectContent>
              {hives.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="method">Method *</Label>
          <Select value={method} onValueChange={handleMethodChange}>
            <SelectTrigger id="method"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(METHOD_INFO).map(([v, { label }]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{METHOD_INFO[method]?.tip}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mites">Mites counted *</Label>
            <Input
              id="mites"
              type="number"
              min="0"
              value={mitesCounted}
              onChange={(e) => setMitesCounted(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bees">Bees / cells sampled</Label>
            <Input
              id="bees"
              type="number"
              min="1"
              value={beesSampled}
              onChange={(e) => setBeesSampled(e.target.value)}
            />
          </div>
        </div>

        {/* Live result */}
        {hasCount && (
          <div className={`rounded-xl border p-4 text-center ${pctConfig.bg}`}>
            <p className={`text-4xl font-bold ${pctConfig.color}`}>{pct.toFixed(1)}%</p>
            <p className={`text-sm font-medium mt-1 ${pctConfig.color}`}>{pctConfig.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{mites} mites per {bees} bees/cells</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="date">Check date</Label>
          <Input id="date" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Colony observations, treatment plan…"
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading || loadingHives}>
          {loading ? "Saving…" : "Save Check"}
        </Button>
      </form>
    </div>
  );
}
