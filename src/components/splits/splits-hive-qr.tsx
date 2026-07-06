"use client";

import { useEffect, useState } from "react";
import { Loader2, QrCode } from "lucide-react";
import Link from "next/link";

export interface HiveQrInfo {
  id: string;
  name: string;
  qr_code_token: string;
  color_code?: string | null;
}

interface Props {
  hives: HiveQrInfo[];
  appUrl: string;
}

export function SplitsHiveQr({ hives, appUrl }: Props) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const QRCode = (await import("qrcode")).default;
      const map: Record<string, string> = {};
      for (const hive of hives) {
        const url = `${appUrl}/h/${hive.qr_code_token}`;
        map[hive.id] = await QRCode.toDataURL(url, {
          width: 140,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
      }
      if (!cancelled) {
        setQrMap(map);
        setLoading(false);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [hives, appUrl]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Generating QR codes…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {hives.map((hive) => (
        <Link
          key={hive.id}
          href={`/hives/print?id=${hive.id}`}
          title="Click to print tag"
          className="flex flex-col items-center rounded-xl border bg-card p-3 hover:border-violet-400 transition-colors"
        >
          {hive.color_code && (
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{ backgroundColor: hive.color_code }}
            />
          )}
          {qrMap[hive.id] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrMap[hive.id]} alt={`QR for ${hive.name}`} className="w-28 h-28" />
          ) : (
            <QrCode className="w-28 h-28 text-muted-foreground/30" />
          )}
          <p className="text-xs font-semibold mt-2 text-center">{hive.name}</p>
        </Link>
      ))}
    </div>
  );
}
