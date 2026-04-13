"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

export default function NewApiaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [altitude, setAltitude] = useState("");
  const [environment, setEnvironment] = useState("");
  const [waterNearby, setWaterNearby] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  function getLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/apiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          altitude: altitude ? parseFloat(altitude) : undefined,
          environment_type: environment || undefined,
          water_nearby: waterNearby,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create apiary");

      toast({ title: "Apiary created", description: name, variant: "success" });
      router.push(`/apiaries/${json.data.id}`);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <Link href="/apiaries">
        <Button variant="ghost" size="sm" className="gap-2 mb-4 h-9 px-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Apiaries
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Apiary</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Apiary" required />
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Location *</p>
              <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={geoLoading} className="gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {geoLoading ? "Getting…" : "Use GPS"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lat">Latitude *</Label>
                <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="48.8566" required type="number" step="any" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng">Longitude *</Label>
                <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="2.3522" required type="number" step="any" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="altitude">Altitude (m)</Label>
              <Input id="altitude" value={altitude} onChange={(e) => setAltitude(e.target.value)} placeholder="Optional" type="number" step="any" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="environment">Environment Type</Label>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger id="environment">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urban">Urban</SelectItem>
              <SelectItem value="suburban">Suburban</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
              <SelectItem value="forest">Forest</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="mountain">Mountain</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="water_nearby" className="cursor-pointer">Water source nearby?</Label>
          <Switch id="water_nearby" checked={waterNearby} onCheckedChange={setWaterNearby} />
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Creating…" : "Create Apiary"}
        </Button>
      </form>
    </div>
  );
}
