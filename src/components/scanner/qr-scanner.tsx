"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Search } from "lucide-react";

function extractToken(text: string): string | null {
  // Handle full URL: https://…/h/TOKEN  or  https://…/hives/scan/TOKEN
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "h" && parts[1]) return parts[1];
    if (parts[0] === "hives" && parts[1] === "scan" && parts[2]) return parts[2];
  } catch {
    // Not a URL — treat as raw UUID token
    if (/^[0-9a-f-]{32,}$/i.test(text.trim())) return text.trim();
  }
  return null;
}

export function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [manual, setManual]     = useState("");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const router = useRouter();

  // Cleanup on unmount
  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  async function startScan() {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-viewfinder");
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const token = extractToken(decoded);
          if (token) {
            scanner.stop().then(() => {
              setScanning(false);
              router.push(`/hives/scan/${token}`);
            });
          }
        },
        undefined
      );
    } catch (err: unknown) {
      setScanning(false);
      const msg = ((err as Error)?.message ?? "").toLowerCase();
      if (msg.includes("permission") || msg.includes("notallowed") || msg.includes("denied")) {
        setError(
          "Camera access was denied. Allow camera access in your browser settings, or use manual entry below."
        );
      } else {
        setError("Could not start the camera. Try manual entry below.");
      }
    }
  }

  async function stopScan() {
    try { await scannerRef.current?.stop(); } catch {}
    setScanning(false);
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    const token = manual.trim();
    if (token) router.push(`/hives/scan/${token}`);
  }

  return (
    <div className="space-y-6">
      {/* Camera viewfinder — html5-qrcode mounts into this div */}
      <div
        id="qr-viewfinder"
        className={scanning ? "rounded-xl overflow-hidden border" : "hidden"}
      />

      {!scanning && (
        <button
          onClick={startScan}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-16 text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Camera className="h-14 w-14" aria-hidden="true" />
          <span className="text-lg font-semibold">Tap to Open Camera</span>
          <span className="text-sm text-muted-foreground">Point at a hive QR tag</span>
        </button>
      )}

      {scanning && (
        <Button variant="outline" className="w-full gap-2" onClick={stopScan}>
          <X className="h-4 w-4" aria-hidden="true" />
          Stop Camera
        </Button>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {/* Manual fallback */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">
          Or enter a hive token manually
        </p>
        <form onSubmit={handleManual} className="flex gap-2">
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste token or hive scan code…"
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Go">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
