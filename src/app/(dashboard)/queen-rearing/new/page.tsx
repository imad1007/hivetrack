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
import type { Hive } from "@/types";

export default function NewQueenRearingPage() {
  const router = useRouter();
  const [hives, setHives] = useState<Hive[]>([]);
  const [hiveId, setHiveId] = useState("");
  const [graftingDate, setGraftingDate] = useState(new Date().toISOString().split("T")[0]);
  const [rearingType, setRearingType] = useState("grafting");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHives, setLoadingHives] = useState(true);

  useEffect(() => {
    fetch("/api/hives")
      .then((r) => r.json())
      .then((j) => setHives((j.data ?? []).filter((h: Hive) => h.status === "active")))
      .catch(() => toast({ title: "Erreur", description: "Impossible de charger les ruches", variant: "destructive" }))
      .finally(() => setLoadingHives(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hiveId) {
      toast({ title: "Erreur", description: "Sélectionnez une ruche", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/queen-rearing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hive_id: hiveId, grafting_date: graftingDate, rearing_type: rearingType, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast({ title: "Élevage créé", description: "Les 4 étapes ont été générées automatiquement.", variant: "success" });
      router.push(`/queen-rearing/${json.data.id}`);
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Échec", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href="/queen-rearing">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-1">Nouvel élevage de reines</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Les 4 étapes de suivi seront générées automatiquement à partir de la date de greffe (J0).
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hive selector */}
        <div className="space-y-2">
          <Label htmlFor="hive">Ruche *</Label>
          <Select value={hiveId} onValueChange={setHiveId} disabled={loadingHives}>
            <SelectTrigger id="hive">
              <SelectValue placeholder={loadingHives ? "Chargement…" : "Sélectionner une ruche"} />
            </SelectTrigger>
            <SelectContent>
              {hives.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grafting date */}
        <div className="space-y-2">
          <Label htmlFor="grafting_date">Date de greffe (J0) *</Label>
          <Input
            id="grafting_date"
            type="date"
            value={graftingDate}
            onChange={(e) => setGraftingDate(e.target.value)}
            required
          />
        </div>

        {/* Rearing type */}
        <div className="space-y-2">
          <Label htmlFor="rearing_type">Type d&apos;élevage *</Label>
          <Select value={rearingType} onValueChange={setRearingType}>
            <SelectTrigger id="rearing_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grafting">Greffage</SelectItem>
              <SelectItem value="natural">Naturel</SelectItem>
              <SelectItem value="division">Division</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, lignée utilisée…"
            rows={3}
          />
        </div>

        {/* Generated stages preview */}
        {graftingDate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/20">
            <p className="font-semibold text-amber-800 dark:text-amber-400 mb-2">Étapes générées automatiquement</p>
            {[
              { label: "Operculation cellule royale", offset: 5 },
              { label: "Naissance de la reine",       offset: 16 },
              { label: "Vol de fécondation",          offset: 22 },
              { label: "Ponte observée",              offset: 27 },
            ].map(({ label, offset }) => {
              const d = new Date(graftingDate);
              d.setDate(d.getDate() + offset);
              return (
                <div key={label} className="flex justify-between text-amber-700 dark:text-amber-300 py-0.5">
                  <span>J+{offset} — {label}</span>
                  <span className="font-medium">{d.toLocaleDateString("fr-FR")}</span>
                </div>
              );
            })}
          </div>
        )}

        <Button type="submit" className="w-full h-12" disabled={loading || loadingHives}>
          {loading ? "Création…" : "Créer l'élevage"}
        </Button>
      </form>
    </div>
  );
}
