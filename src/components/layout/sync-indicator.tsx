"use client";

import { useSync } from "@/hooks/use-sync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { online, syncing, pendingCount, lastSynced } = useSync();

  if (!online) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400" role="status" aria-live="polite">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Offline</span>
        {pendingCount > 0 && (
          <span className="bg-amber-100 dark:bg-amber-900/30 rounded-full px-1.5 py-0.5 font-medium">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status" aria-live="polite">
        <RefreshCw className={cn("h-4 w-4 animate-spin")} aria-hidden="true" />
        <span className="hidden sm:inline">Syncing…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400" role="status">
      <Wifi className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline sr-only">Online</span>
      {lastSynced && (
        <span className="hidden sm:inline text-muted-foreground">
          Synced {lastSynced}
        </span>
      )}
    </div>
  );
}
