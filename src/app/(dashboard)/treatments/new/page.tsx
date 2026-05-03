"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import type { Hive } from "@/types";

export default function NewTreatmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preHiveId = searchParams.get("hive_id") ?? "";

  const [hives, setHives] = useState<Hive[]>([]);
  const [loadingHives, setLoadingHives] = useState(true);
  const [loading, setLoading] = useState(false);

  const [hiveId, setHiveId] = useState(preHiveId);
  const [productName, setProductName] = useState("");
  const [ammCode, setAmmCode] = useState("");
  const [dosage, setDosage] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [withdrawalDays, setWithdrawalDays] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/hives")
      .then((r) => r.json())
      .then((j) => setHives((j.data ?? []).filter((h: Hive) => h.status === "active")))
      .catch(() => toast({ title: "Error", description: "Could not load hives", variant: "destructive" }))
      .finally(() => setLoadingHives(false));
  }, []);

  const daysLeft = endDate && startDate
    ? Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / 86_400_000)
    : null;

  const harvestSafeDate = endDate && parseInt(withdrawalDays) > 0
    ? new Date(new Date(endDate).getTime() + parseInt(withdrawalDays) * 86_400_000)
        .toISOString().split("T")[0]
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hiveId) {
      toast({ title: "Error", description: "Select a hive", variant: "destructive" });
      return;
    }
    if (!endDate || endDate < startDate) {
      toast({ title: "Error", description: "End date must be on or after start date", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hive_id: hiveId,
          product_name: productName.trim(),
          amm_code: ammCode.trim() || null,
          dosage: dosage.trim() || null,
          start_date: startDate,
          end_date: endDate,
          withdrawal_days: parseInt(withdrawalDays) || 0,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error");
      toast({ title: "Treatment logged", variant: "success" });
      router.push("/treatments");
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href="/treatments">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Treatments
        </Button>
      </Link>

      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-primary" aria-hidden="true" />
        Log Treatment
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Record a treatment to track its duration, active substance, and the harvest withdrawal period.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hive */}
        <div className="space-y-2">
          <Label htmlFor="hive">Hive *</Label>
          <Select value={hiveId} onValueChange={setHiveId} disabled={loadingHives}>
            <SelectTrigger id="hive">
              <SelectValue placeholder={loadingHives ? "Loading…" : "Select hive"} />
            </SelectTrigger>
            <SelectContent>
              {hives.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product */}
        <div className="space-y-2">
          <Label htmlFor="product">Product name *</Label>
          <Input
            id="product"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Apivar, Oxalic acid, Thymol…"
            required
          />
        </div>

        {/* AMM code + dosage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amm">AMM / Registration code</Label>
            <Input
              id="amm"
              value={ammCode}
              onChange={(e) => setAmmCode(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 1 strip/hive"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start">Start date *</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End date *</Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Withdrawal */}
        <div className="space-y-2">
          <Label htmlFor="withdrawal">Withdrawal period (days)</Label>
          <Input
            id="withdrawal"
            type="number"
            min="0"
            value={withdrawalDays}
            onChange={(e) => setWithdrawalDays(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Days after treatment ends before honey can be harvested. 0 if none.
          </p>
        </div>

        {/* Live summary */}
        {endDate && (
          <div className={`rounded-xl border p-4 space-y-1.5 text-sm ${
            daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
              ? "border-red-200 bg-red-50 dark:bg-red-950/20"
              : "border-muted bg-muted/30"
          }`}>
            {daysLeft !== null && daysLeft >= 0 && (
              <p><span className="font-medium">Duration remaining:</span> {daysLeft} day{daysLeft !== 1 ? "s" : ""}</p>
            )}
            {daysLeft !== null && daysLeft < 0 && (
              <p className="text-muted-foreground">Treatment already ended — will be logged as past.</p>
            )}
            {harvestSafeDate && (
              <p className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Harvest safe from: <span className="font-medium">{harvestSafeDate}</span>
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Application method, colony response, observations…"
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading || loadingHives}>
          {loading ? "Saving…" : "Save Treatment"}
        </Button>
      </form>
    </div>
  );
}
