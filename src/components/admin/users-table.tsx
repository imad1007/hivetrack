"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  Ban,
  CheckCircle2,
  ChevronRight,
  Hexagon,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUser } from "@/app/api/admin/users/route";

type SortKey = "created_at" | "honey_kg" | "hive_count" | "email" | "last_sign_in_at";

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = initialUsers
    .filter((u) => {
      const q = search.toLowerCase();
      if (q && !u.email.toLowerCase().includes(q) && !u.full_name.toLowerCase().includes(q)) return false;
      if (statusFilter === "active" && u.is_banned) return false;
      if (statusFilter === "disabled" && !u.is_banned) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sort === "honey_kg") return (a.honey_kg - b.honey_kg) * dir;
      if (sort === "hive_count") return (a.hive_count - b.hive_count) * dir;
      if (sort === "email") return a.email.localeCompare(b.email) * dir;
      if (sort === "last_sign_in_at") {
        return ((a.last_sign_in_at ?? "").localeCompare(b.last_sign_in_at ?? "")) * dir;
      }
      return (a.created_at.localeCompare(b.created_at)) * dir;
    });

  function cycleSort(key: SortKey) {
    if (sort === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("desc");
    }
  }

  async function toggleBan(user: AdminUser) {
    setActionLoading(user.id);
    const action = user.is_banned ? "unban" : "ban";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => cycleSort(k)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sort === k ? "text-amber-500" : ""}`} />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {initialUsers.length} users
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3"><SortBtn k="email" label="User" /></th>
              <th className="text-left px-4 py-3 hidden md:table-cell"><SortBtn k="hive_count" label="Hives" /></th>
              <th className="text-left px-4 py-3 hidden lg:table-cell"><SortBtn k="honey_kg" label="Honey" /></th>
              <th className="text-left px-4 py-3 hidden xl:table-cell"><SortBtn k="created_at" label="Joined" /></th>
              <th className="text-left px-4 py-3 hidden xl:table-cell"><SortBtn k="last_sign_in_at" label="Last seen" /></th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">No users match filters</td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase shrink-0">
                      {(u.full_name || u.email).slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[160px]">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</p>
                    </div>
                  </div>
                </td>
                {/* Hives */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Hexagon className="h-3.5 w-3.5" />
                    {u.hive_count}
                  </span>
                </td>
                {/* Honey */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wheat className="h-3.5 w-3.5" />
                    {u.honey_kg > 0 ? `${u.honey_kg} kg` : "—"}
                  </span>
                </td>
                {/* Joined */}
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">{fmtDate(u.created_at)}</td>
                {/* Last seen */}
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">{fmtDate(u.last_sign_in_at)}</td>
                {/* Status */}
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">Active</Badge>
                  )}
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-xs gap-1 ${u.is_banned ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"}`}
                      onClick={() => toggleBan(u)}
                      disabled={!!actionLoading || isPending}
                    >
                      {u.is_banned ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" />Enable</>
                      ) : (
                        <><Ban className="h-3.5 w-3.5" />Disable</>
                      )}
                    </Button>
                    <Link href={`/admin/users/${u.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPending && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">Refreshing…</p>
      )}
    </div>
  );
}
