"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toaster";
import { QueenRearingTimeline } from "@/components/queen-rearing/queen-rearing-timeline";
import { formatDate } from "@/lib/utils";
import type { QueenRearingWithDetails } from "@/types";

const STATUS_CONFIG = {
  in_progress: { label: "En cours",  color: "text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800" },
  success:     { label: "Succès",    color: "text-green-700 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800" },
  failure:     { label: "Échec",     color: "text-red-700 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800" },
};

const TYPE_LABELS: Record<string, string> = {
  natural:  "Naturel",
  grafting: "Greffage",
  division: "Division",
};

export default function QueenRearingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rearing, setRearing] = useState<QueenRearingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch(`/api/queen-rearing/${id}`)
      .then((r) => r.json())
      .then((j) => {
        setRearing(j.data);
        setNotes(j.data?.notes ?? "");
      })
      .catch(() => toast({ title: "Erreur", description: "Impossible de charger l'élevage", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: "success" | "failure") {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/queen-rearing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setRearing((prev) => prev ? { ...prev, status: json.data.status } : prev);
      toast({ title: "Statut mis à jour", variant: "success" });
    } catch {
      toast({ title: "Erreur", description: "Mise à jour impossible", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/queen-rearing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast({ title: "Notes enregistrées", variant: "success" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Chargement…</p>
      </div>
    );
  }

  if (!rearing) {
    router.push("/queen-rearing");
    return null;
  }

  const hiveName = (rearing.hives as { name: string } | null)?.name ?? "Ruche inconnue";
  const statusCfg = STATUS_CONFIG[rearing.status];
  const stages = rearing.queen_rearing_stages ?? [];
  const completedCount = stages.filter((s) => s.completed).length;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/queen-rearing">
          <Button variant="ghost" size="sm" className="gap-2 mb-2 h-9 px-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Élevage des reines
          </Button>
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Crown className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <h1 className="text-2xl font-bold">{hiveName}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {TYPE_LABELS[rearing.rearing_type]} · J0 : {formatDate(rearing.grafting_date)} · {completedCount}/{stages.length} étapes
            </p>
          </div>

          {rearing.status === "in_progress" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                disabled={updatingStatus}
                onClick={() => updateStatus("success")}
              >
                <Check className="h-4 w-4" />
                Succès
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                disabled={updatingStatus}
                onClick={() => updateStatus("failure")}
              >
                <X className="h-4 w-4" />
                Échec
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chronologie des étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <QueenRearingTimeline
            rearingId={rearing.id}
            graftingDate={rearing.grafting_date}
            stages={stages}
          />
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes, observations, comportement de la reine…"
            rows={4}
          />
          {rearing.photo_url && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Photo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rearing.photo_url}
                alt="Photo de l'élevage"
                className="rounded-lg max-h-48 object-contain border"
              />
            </div>
          )}
          <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
            {savingNotes ? "Enregistrement…" : "Enregistrer les notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
