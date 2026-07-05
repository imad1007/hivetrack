"use client";

import { useLayoutEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Apiary } from "@/types";

// Fix Leaflet's default icon paths broken by webpack/turbopack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom honey-colored marker
function createHiveIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 40px; height: 40px;
      background: #f59e0b;
      border: 3px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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
  const mapRef = useRef<LeafletMap | null>(null);

  // Leaflet's map.remove() does not clear _leaflet_id on the container DOM node.
  // Running this before MapContainer's useEffect prevents the "already initialized"
  // error on HMR reloads and React StrictMode double-invocations.
  useLayoutEffect(() => {
    document.querySelectorAll<HTMLElement>(".leaflet-container").forEach((el) => {
      delete (el as unknown as Record<string, unknown>)._leaflet_id;
    });
    return () => {
      if (mapRef.current) {
        try {
          const container = mapRef.current.getContainer();
          mapRef.current.remove();
          delete (container as unknown as Record<string, unknown>)._leaflet_id;
        } catch {
          // map was already removed by react-leaflet
        }
        mapRef.current = null;
      }
    };
  }, []);

  const center: [number, number] =
    apiaries.length > 0
      ? [apiaries[0].lat, apiaries[0].lng]
      : [48.8566, 2.3522];

  const zoom = apiaries.length > 0 ? 10 : 5;
  const hiveIcon = createHiveIcon();

  return (
    <div className="flex-1 relative">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {apiaries.map((apiary) => (
          <Marker
            key={apiary.id}
            position={[apiary.lat, apiary.lng]}
            icon={hiveIcon}
          >
            <Popup minWidth={180}>
              <div className="p-1 space-y-2">
                <p className="font-semibold text-sm">{apiary.name}</p>
                <p className="text-xs text-gray-500">
                  {apiary.hive_count} active hive{apiary.hive_count !== 1 ? "s" : ""}
                </p>
                {apiary.environment_type && (
                  <span className="inline-block text-xs bg-gray-100 rounded-full px-2 py-0.5 capitalize">
                    {apiary.environment_type}
                  </span>
                )}
                <div className="pt-1">
                  <a
                    href={`/apiaries/${apiary.id}`}
                    className="block w-full text-center text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-md px-3 py-2 font-medium transition-colors"
                  >
                    Open Apiary
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* No apiaries overlay */}
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
