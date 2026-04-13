"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useWeather } from "@/hooks/use-weather";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import type { ColonyBehavior, SwarmSign } from "@/types";

interface VisitFormProps {
  hiveId: string;
  hiveName: string;
  apiaryLat?: number;
  apiaryLng?: number;
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full text-xl"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </Button>
        <span className="text-2xl font-bold min-w-[2ch] text-center" aria-live="polite">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full text-xl"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

const BEHAVIOR_OPTIONS: { value: ColonyBehavior; label: string; emoji: string }[] = [
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "nervous", label: "Nervous", emoji: "😤" },
  { value: "aggressive", label: "Aggressive", emoji: "😡" },
];

const SWARM_SIGN_OPTIONS: { value: SwarmSign; label: string }[] = [
  { value: "queen_cells", label: "Queen cells" },
  { value: "weight_loss", label: "Weight loss" },
  { value: "specific_buzzing", label: "Specific buzzing" },
];

export function VisitForm({ hiveId, hiveName, apiaryLat, apiaryLng }: VisitFormProps) {
  const router = useRouter();
  const { weather, loading: weatherLoading } = useWeather(apiaryLat, apiaryLng);

  const [visitedAt, setVisitedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [behavior, setBehavior] = useState<ColonyBehavior>("calm");
  const [broodFrames, setBroodFrames] = useState(0);
  const [storesFrames, setStoresFrames] = useState(0);
  const [pollenFrames, setPollenFrames] = useState(0);
  const [spaceNeeded, setSpaceNeeded] = useState(false);
  const [queenSeen, setQueenSeen] = useState(false);
  const [queenLaying, setQueenLaying] = useState(false);
  const [swarmSigns, setSwarmSigns] = useState<SwarmSign[]>([]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleSwarmSign(sign: SwarmSign) {
    setSwarmSigns((prev) =>
      prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]
    );
  }

  async function uploadPhotos(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `visits/${hiveId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("visit-photos").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("visit-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const photoUrls = await uploadPhotos(photos);

      const body = {
        hive_id: hiveId,
        visited_at: new Date(visitedAt).toISOString(),
        weather_json: weather ?? undefined,
        behavior,
        brood_frames: broodFrames,
        stores_frames: storesFrames,
        pollen_frames: pollenFrames,
        space_needed: spaceNeeded,
        queen_seen: queenSeen,
        queen_laying: queenSeen ? queenLaying : undefined,
        swarm_signs: swarmSigns,
        notes: notes || undefined,
        photos_urls: photoUrls,
      };

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save visit");
      }

      toast({ title: "Visit saved", description: `${hiveName} visit logged successfully.`, variant: "success" });
      router.push(`/hives/${hiveId}`);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Date/time */}
      <div className="space-y-2">
        <Label htmlFor="visited_at">Date & Time</Label>
        <input
          id="visited_at"
          type="datetime-local"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Weather badge */}
      <div className="space-y-2">
        <Label>Weather (auto-fetched)</Label>
        {weatherLoading ? (
          <p className="text-sm text-muted-foreground">Fetching weather…</p>
        ) : weather ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 w-fit">
            {weather.icon && (
              <Image src={weather.icon} alt={weather.condition} width={32} height={32} />
            )}
            <span className="font-medium">{weather.temp_c}°C</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground capitalize">{weather.condition}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground">{weather.wind_kph} km/h</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudSun className="h-4 w-4" aria-hidden="true" />
            Weather unavailable
          </div>
        )}
      </div>

      {/* Colony behavior */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Colony Behavior</legend>
        <div className="grid grid-cols-3 gap-3">
          {BEHAVIOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={behavior === opt.value}
              onClick={() => setBehavior(opt.value)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 min-h-[80px] transition-colors ${
                behavior === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Frame counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Stepper label="Brood Frames" value={broodFrames} onChange={setBroodFrames} />
        <Stepper label="Stores Frames" value={storesFrames} onChange={setStoresFrames} />
        <Stepper label="Pollen Frames" value={pollenFrames} onChange={setPollenFrames} />
      </div>

      {/* Queen seen */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="queen_seen" className="text-base cursor-pointer">
            Queen seen?
          </Label>
          <Switch
            id="queen_seen"
            checked={queenSeen}
            onCheckedChange={setQueenSeen}
            aria-label="Queen seen toggle"
          />
        </div>

        {queenSeen && (
          <div className="flex items-center justify-between rounded-lg border p-4 ml-4">
            <Label htmlFor="queen_laying" className="text-base cursor-pointer">
              Laying active?
            </Label>
            <Switch
              id="queen_laying"
              checked={queenLaying}
              onCheckedChange={setQueenLaying}
              aria-label="Queen laying toggle"
            />
          </div>
        )}
      </div>

      {/* Space needed */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <Label htmlFor="space_needed" className="text-base cursor-pointer">
          Space needed?
        </Label>
        <Switch
          id="space_needed"
          checked={spaceNeeded}
          onCheckedChange={setSpaceNeeded}
          aria-label="Space needed toggle"
        />
      </div>

      {/* Swarm signs */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Swarm Signs</legend>
        <div className="flex flex-wrap gap-3">
          {SWARM_SIGN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={swarmSigns.includes(opt.value)}
              onClick={() => toggleSwarmSign(opt.value)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium min-h-[44px] transition-colors ${
                swarmSigns.includes(opt.value)
                  ? "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "border-border hover:border-amber-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Anything notable about this visit…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label htmlFor="photos">Photos</Label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium"
          aria-label="Upload visit photos"
        />
        {photos.length > 0 && (
          <p className="text-sm text-muted-foreground">{photos.length} photo{photos.length > 1 ? "s" : ""} selected</p>
        )}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4 pt-4">
        <Button type="submit" className="w-full h-14 text-base" disabled={submitting}>
          {submitting ? "Saving visit…" : "Save Visit"}
        </Button>
      </div>
    </form>
  );
}
