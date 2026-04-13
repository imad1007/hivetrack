"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Apiary } from "@/types";

interface EnrichedApiary extends Apiary {
  hive_count: number;
}

// Dynamically import the actual map to avoid SSR issues with Leaflet
const ApiaryLeafletMap = dynamic(() => import("./apiary-leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
      Loading map…
    </div>
  ),
});

export function ApiaryMapPage({ apiaries }: { apiaries: EnrichedApiary[] }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Apiaries</h1>
        <Link href="/apiaries/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Apiary
          </Button>
        </Link>
      </div>

      <ApiaryLeafletMap apiaries={apiaries} />
    </div>
  );
}
