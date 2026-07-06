"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  isBanned: boolean;
}

export function UserActionButtons({ userId, isBanned }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function toggleBan() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isBanned ? "unban" : "ban" }),
    });
    setLoading(false);
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  const busy = isPending || loading;

  return (
    <Button
      variant={isBanned ? "outline" : "destructive"}
      size="sm"
      className="gap-1.5"
      onClick={toggleBan}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isBanned ? (
        <><CheckCircle2 className="h-4 w-4" /> Enable account</>
      ) : (
        <><Ban className="h-4 w-4" /> Disable account</>
      )}
    </Button>
  );
}
