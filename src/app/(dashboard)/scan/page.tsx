import { QRScanner } from "@/components/scanner/qr-scanner";

export const metadata = { title: "Scan Hive" };

export default function ScanPage() {
  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Hive</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Point your camera at a hive QR tag to open its record instantly.
        </p>
      </div>
      <QRScanner />
    </div>
  );
}
