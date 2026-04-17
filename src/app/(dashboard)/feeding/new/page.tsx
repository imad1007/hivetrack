"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { Hive, Apiary } from "@/types";

type Step = "choose" | "form";
type Mode = "collective" | "individual";

const FOOD_OPTIONS = [
  { value: "light_syrup",   label: "Sirop léger (1:1)" },
  { value: "heavy_syrup",   label: "Sirop épais (2:1)" },
  { value: "protein_paste", label: "Pâte protéinée" },
  { value: "candi",         label: "Candi" },
];

// Basic validation
function validateFeedingForm(values: {
  target: string;
  food_type: string;
  quantity: string;
  unit: string;
  date: string;
}): string | null {
  if (!values.target)    return "Sélectionnez une cible (ruche ou rucher)";
  if (!values.food_type) return "Sélectionnez un type d'aliment";
  if (!values.quantity || isNaN(Number(values.quantity)) || Number(values.quantity) <= 0)
    return "La quantité doit être un nombre positif";
  if (!values.unit)      return "Sélectionnez une unité";
  if (!values.date)      return "La date est obligatoire";
  return null;
}

export default function NewFeedingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [mode, setMode] = useState<Mode>("collective");
  const [hives, setHives] = useState<Hive[]>([]);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form fields
  const [targetId, setTargetId] = useState("");
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("L");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/hives").then((r) => r.json()),
      fetch("/api/apiaries").then((r) => r.json()),
    ])
      .then(([h, a]) => {
        setHives((h.data ?? []).filter((hive: Hive) => hive.status === "active"));
        setApiaries(a.data ?? []);
      })
      .catch(() => toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" }))
      .finally(() => setLoadingData(false));
  }, []);

  function handleModeSelect(selected: Mode) {
    setMode(selected);
    setTargetId("");
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateFeedingForm({ target: targetId, food_type: foodType, quantity, unit, date });
    if (validationError) {
      toast({ title: "Validation", description: validationError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const body = {
        feeding_session_type: mode,
        hive_id:   mode === "individual" ? targetId : undefined,
        apiary_id: mode === "collective"  ? targetId : undefined,
        food_type:     foodType,
        quantity:      Number(quantity),
        unit,
        feeding_date:  date,
        notes:         notes || undefined,
      };

      const res = await fetch("/api/feeding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast({ title: "Nourrissage enregistré", variant: "success" });
      router.push("/feeding");
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Échec", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Choose mode ──────────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <Link href="/feeding">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-1">Enregistrer un nourrissage</h1>
        <p className="text-sm text-muted-foreground mb-8">Choisissez le type de nourrissage.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeSelect("collective")}
            className={cn(
              "group rounded-2xl border-2 p-6 text-left transition-all hover:border-primary hover:shadow-md",
              "border-border bg-white dark:bg-card"
            )}
          >
            <Users className="mb-3 h-8 w-8 text-blue-500 group-hover:text-primary transition-colors" aria-hidden="true" />
            <h2 className="font-bold text-lg">Collectif</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nourrissage de toutes les ruches d&apos;un rucher en même temps.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Exemple : nourrisseur de champ</p>
          </button>

          <button
            onClick={() => handleModeSelect("individual")}
            className={cn(
              "group rounded-2xl border-2 p-6 text-left transition-all hover:border-primary hover:shadow-md",
              "border-border bg-white dark:bg-card"
            )}
          >
            <Hexagon className="mb-3 h-8 w-8 text-amber-500 group-hover:text-primary transition-colors" aria-hidden="true" />
            <h2 className="font-bold text-lg">Individuel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nourrissage ciblé sur une seule ruche.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Exemple : ruche faible, hivernage</p>
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Form ─────────────────────────────────────────────────────────────
  const targetList = mode === "collective" ? apiaries : hives;
  const targetLabel = mode === "collective" ? "Rucher" : "Ruche";

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <button onClick={() => setStep("choose")}>
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2" asChild>
          <span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </span>
        </Button>
      </button>
      <h1 className="text-2xl font-bold mb-1">
        Nourrissage {mode === "collective" ? "collectif" : "individuel"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {mode === "collective" ? "Alimenter toutes les ruches d'un rucher." : "Alimenter une ruche spécifique."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target selector */}
        <div className="space-y-2">
          <Label htmlFor="target">{targetLabel} *</Label>
          <Select value={targetId} onValueChange={setTargetId} disabled={loadingData}>
            <SelectTrigger id="target">
              <SelectValue placeholder={loadingData ? "Chargement…" : `Sélectionner ${mode === "collective" ? "un rucher" : "une ruche"}`} />
            </SelectTrigger>
            <SelectContent>
              {targetList.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Food type */}
        <div className="space-y-2">
          <Label htmlFor="food_type">Type d&apos;aliment *</Label>
          <Select value={foodType} onValueChange={setFoodType}>
            <SelectTrigger id="food_type">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity + unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unité *</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Litres (L)</SelectItem>
                <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="feeding_date">Date *</Label>
          <Input
            id="feeding_date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, conditions météo…"
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading || loadingData}>
          {loading ? "Enregistrement…" : "Enregistrer le nourrissage"}
        </Button>
      </form>
    </div>
  );
}
