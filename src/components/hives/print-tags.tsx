"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

export interface HiveTagData {
  id: string;
  name: string;
  qr_code_token: string;
  apiaryName?: string;
  color_code?: string | null;
}

interface Props {
  hives: HiveTagData[];
  appUrl: string;
}

export function PrintHiveTags({ hives, appUrl }: Props) {
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
          width: 180,
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

  const handlePrint = useCallback(() => window.print(), []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Generating QR codes…</span>
      </div>
    );
  }

  return (
    <>
      {/* Print trigger — hidden when printing */}
      <div className="no-print mb-6">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print {hives.length === 1 ? "Tag" : `${hives.length} Tags`}
        </Button>
      </div>

      {/* Tag grid — only visible when printing (and in preview here) */}
      <div className="tag-grid">
        {hives.map((hive) => (
          <div key={hive.id} className="hive-tag">
            {/* Colour dot */}
            {hive.color_code && (
              <div
                className="color-dot"
                style={{ backgroundColor: hive.color_code }}
                aria-hidden="true"
              />
            )}
            {/* QR Code */}
            {qrMap[hive.id] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrMap[hive.id]}
                alt={`QR code for ${hive.name}`}
                className="qr-img"
              />
            )}
            {/* Labels */}
            <p className="tag-name">{hive.name}</p>
            {hive.apiaryName && <p className="tag-apiary">{hive.apiaryName}</p>}
          </div>
        ))}
      </div>

      {/* Print-specific styles */}
      <style>{`
        .tag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 160px);
          gap: 16px;
        }
        .hive-tag {
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px 8px 10px;
          page-break-inside: avoid;
          break-inside: avoid;
          background: #fff;
        }
        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-bottom: 6px;
        }
        .qr-img {
          width: 140px;
          height: 140px;
        }
        .tag-name {
          font-size: 13px;
          font-weight: 600;
          margin-top: 6px;
          text-align: center;
          color: #111;
          word-break: break-word;
        }
        .tag-apiary {
          font-size: 10px;
          color: #6b7280;
          text-align: center;
          margin-top: 2px;
        }
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .tag-grid, .tag-grid * { visibility: visible; }
          .tag-grid {
            position: fixed;
            top: 0;
            left: 0;
            padding: 12mm;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
