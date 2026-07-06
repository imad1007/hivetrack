"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Apiary } from "@/types";

// Fix Leaflet's default icon paths broken by webpack/turbopack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeHiveIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:40px;height:40px;
      background:#f59e0b;
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,.3);
    "></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44],
  });
}

interface EnrichedApiary extends Apiary {
  hive_count: number;
}

export default function ApiaryLeafletMap({ apiaries }: { apiaries: EnrichedApiary[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Destroy any stale Leaflet instance on this container before creating a new one.
    // This is the only reliable place to do this — by the time this useEffect runs
    // we own the container and can safely mutate it.
    if ((container as unknown as Record<string, unknown>)._leaflet_id !== undefined) {
      delete (container as unknown as Record<string, unknown>)._leaflet_id;
    }

    const center: [number, number] =
      apiaries.length > 0 ? [apiaries[0].lat, apiaries[0].lng] : [34.0, -5.0];
    const zoom = apiaries.length > 0 ? 10 : 6;

    const map = L.map(container, { center, zoom });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const hiveIcon = makeHiveIcon();

    for (const apiary of apiaries) {
      const popup = L.popup({ minWidth: 180 }).setContent(`
        <div style="padding:4px 4px 8px;font-family:inherit">
          <p style="font-weight:600;font-size:14px;margin:0 0 4px">${apiary.name}</p>
          <p style="font-size:12px;color:#6b7280;margin:0 0 4px">
            ${apiary.hive_count} active hive${apiary.hive_count !== 1 ? "s" : ""}
          </p>
          ${apiary.environment_type
            ? `<span style="font-size:11px;background:#f3f4f6;border-radius:9999px;padding:2px 8px;text-transform:capitalize">
                ${apiary.environment_type}
               </span>`
            : ""}
          <div style="margin-top:8px">
            <a href="/apiaries/${apiary.id}"
               style="display:block;text-align:center;font-size:12px;font-weight:500;
                      background:#f59e0b;color:#fff;border-radius:6px;padding:6px 12px;
                      text-decoration:none">
              Open Apiary
            </a>
          </div>
        </div>
      `);

      L.marker([apiary.lat, apiary.lng], { icon: hiveIcon })
        .bindPopup(popup)
        .addTo(map);
    }

    return () => {
      map.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 relative">
      {/* Leaflet renders into this div imperatively */}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      {apiaries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <Card className="pointer-events-auto shadow-lg max-w-xs">
            <CardContent className="p-6 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="font-medium">No apiaries yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first apiary to see it on the map.
              </p>
              <Link href="/apiaries/new" className="mt-4 block">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Apiary
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
