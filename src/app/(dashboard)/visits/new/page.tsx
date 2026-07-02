import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VisitForm } from "@/components/visits/visit-form";

export const metadata = { title: "Log Visit" };

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ hive_id?: string }>;
}) {
  const { hive_id } = await searchParams;
  if (!hive_id) redirect("/hives");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: hive } = await supabase
    .from("hives")
    .select("id, name, apiary_id, apiaries(lat, lng, name)")
    .eq("id", hive_id)
    .eq("user_id", user?.id ?? "demo")
    .single();

  if (!hive) redirect("/hives");

  const apiary = hive.apiaries as unknown as { lat: number; lng: number; name: string } | null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log Visit — {hive.name}</h1>
      <VisitForm
        hiveId={hive_id}
        hiveName={hive.name}
        apiaryLat={apiary?.lat}
        apiaryLng={apiary?.lng}
      />
    </div>
  );
}
