"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import type { Hive } from "@/types";

export default function NewSplitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preHiveId = searchParams.get("hive_id") ?? "";

  const [hives, setHives] = useState<Hive[]>([]);
  const [sourceHiveId, setSourceHiveId] = useState(preHiveId);
  const [newHiveId, setNewHiveId] = useState("__none__");
  const [splitDate, setSplitDate] = useState(new Date().toISOString().split("T")[0]);
  const [splitType, setSplitType] = useState("walk_away");
  const [queenStatus, setQueenStatus] = useState("queen_cell");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHives, setLoadingHives] = useState(true);

  useEffect(() => {
    fetch("/api/hives")
      .then((r) => r.json())
      .then((j) => setHives(j.data ?? []))
      .catch(() => toast({ title: "Error", description: "Could not load hives", variant: "destructive" }))
      .finally(() => setLoadingHives(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceHiveId) {
      toast({ title: "Error", description: "Select a source hive", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_hive_id: sourceHiveId,
          new_hive_id: (newHiveId && newHiveId !== "__none__") ? newHiveId : null,
          split_date: splitDate,
          split_type: splitType,
          queen_status: queenStatus,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error");
      toast({ title: "Split recorded", variant: "success" });
      router.push("/splits");
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href="/splits">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Hive Splits
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <GitFork className="h-6 w-6 text-violet-500" aria-hidden="true" />
        Record Hive Split
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Log a colony split for swarm prevention or apiary expansion.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Source hive *</Label>
            <Select value={sourceHiveId} onValueChange={setSourceHiveId} disabled={loadingHives}>
              <SelectTrigger><SelectValue placeholder="Select hive" /></SelectTrigger>
              <SelectContent>
                {hives.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>New hive (optional)</Label>
            <Select value={newHiveId} onValueChange={setNewHiveId} disabled={loadingHives}>
              <SelectTrigger><SelectValue placeholder="— none yet —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None yet —</SelectItem>
                {hives.filter((h) => h.id !== sourceHiveId).map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Split type *</Label>
          <Select value={splitType} onValueChange={setSplitType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="walk_away">Walk-away split</SelectItem>
              <SelectItem value="artificial_swarm">Artificial swarm</SelectItem>
              <SelectItem value="nucleus">Nucleus colony</SelectItem>
              <SelectItem value="cut_down">Cut-down split</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Queen status *</Label>
          <Select value={queenStatus} onValueChange={setQueenStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="queen_cell">Queen cell(s) present</SelectItem>
              <SelectItem value="virgin_queen">Virgin queen introduced</SelectItem>
              <SelectItem value="mated_queen">Mated queen introduced</SelectItem>
              <SelectItem value="queenless">Queenless — will raise own queen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Split date</Label>
          <Input type="date" value={splitDate} onChange={(e) => setSplitDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Frames moved, observations, queen status…"
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading || loadingHives}>
          {loading ? "Saving…" : "Record Split"}
        </Button>
      </form>
    </div>
  );
}
