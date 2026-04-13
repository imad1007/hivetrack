"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";

const HIVE_COLORS = [
  { hex: "#F59E0B", name: "Amber" },
  { hex: "#EF4444", name: "Red" },
  { hex: "#22C55E", name: "Green" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#A855F7", name: "Purple" },
  { hex: "#F97316", name: "Orange" },
  { hex: "#FFFFFF", name: "White" },
  { hex: "#1F2937", name: "Dark" },
];

export default function NewHivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiaryId = searchParams.get("apiary_id") ?? "";

  const [name, setName] = useState("");
  const [type, setType] = useState("langstroth");
  const [colorCode, setColorCode] = useState(HIVE_COLORS[0].hex);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiaryId) { toast({ title: "Error", description: "Apiary ID is required", variant: "destructive" }); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/hives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiary_id: apiaryId, name, type, color_code: colorCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create hive");
      toast({ title: "Hive created", description: name, variant: "success" });
      router.push(`/hives/${json.data.id}`);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href={apiaryId ? `/apiaries/${apiaryId}` : "/hives"}>
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Hive</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="hive_name">Name *</Label>
          <Input id="hive_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hive #1" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hive_type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="hive_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="langstroth">Langstroth</SelectItem>
              <SelectItem value="dadant">Dadant</SelectItem>
              <SelectItem value="warré">Warré</SelectItem>
              <SelectItem value="top-bar">Top-Bar</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Hive color">
            {HIVE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                role="radio"
                aria-checked={colorCode === c.hex}
                aria-label={c.name}
                onClick={() => setColorCode(c.hex)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  colorCode === c.hex ? "border-primary scale-110 shadow-md" : "border-border hover:border-primary/50"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Creating…" : "Create Hive"}
        </Button>
      </form>
    </div>
  );
}
