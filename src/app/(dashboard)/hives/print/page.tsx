import { createClient } from "@/lib/supabase/server";
import { PrintHiveTags } from "@/components/hives/print-tags";
import { DEMO_HIVES_WITH_DETAILS } from "@/lib/demo-data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Print Hive Tags" };

type HiveRow = { id: string; name: string; qr_code_token: string; apiaryName?: string; color_code?: string | null };

export default async function PrintTagsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id: filterHiveId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let hives: HiveRow[];

  if (!user) {
    hives = DEMO_HIVES_WITH_DETAILS
      .filter((h) => h.status === "active" && (!filterHiveId || h.id === filterHiveId))
      .map((h) => ({
        id: h.id,
        name: h.name,
        qr_code_token: h.qr_code_token,
        apiaryName: (h.apiaries as { name: string } | null)?.name,
        color_code: h.color_code,
      }));
  } else {
    let query = supabase
      .from("hives")
      .select("id, name, qr_code_token, color_code, apiaries(name)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (filterHiveId) query = query.eq("id", filterHiveId);
    else query = query.order("name");

    const { data } = await query;
    hives = (data ?? []).map((h) => ({
      id: h.id,
      name: h.name,
      qr_code_token: h.qr_code_token,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiaryName: (h.apiaries as any)?.name as string | undefined,
      color_code: h.color_code,
    }));
  }

  const backHref = filterHiveId ? `/hives/${filterHiveId}` : "/hives";
  const title = filterHiveId && hives.length === 1 ? `Tag: ${hives[0].name}` : "Print Hive Tags";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="no-print flex items-center gap-3">
        <Link href={backHref} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" aria-label="Back" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hives.length} {hives.length === 1 ? "hive" : "hives"} — one QR tag per hive
          </p>
        </div>
      </div>

      <PrintHiveTags hives={hives} appUrl={appUrl} />
    </div>
  );
}
