"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Props {
  hiveId: string;
  token: string;
  appUrl: string;
}

export function HiveQrDisplay({ hiveId, token, appUrl }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(`${appUrl}/h/${token}`, {
        width: 120,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      }).then((url) => {
        if (!cancelled) setDataUrl(url);
      });
    });
    return () => { cancelled = true; };
  }, [token, appUrl]);

  return (
    <Link
      href={`/hives/print?id=${hiveId}`}
      title="Click to print QR tag"
      className="flex flex-col items-center gap-1 rounded-xl border bg-white dark:bg-card p-2 hover:border-primary/60 transition-colors"
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Hive QR code" className="w-24 h-24" />
      ) : (
        <div className="w-24 h-24 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <span className="text-[10px] text-muted-foreground">Print tag</span>
    </Link>
  );
}
