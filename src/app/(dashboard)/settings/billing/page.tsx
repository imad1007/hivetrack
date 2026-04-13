"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Check, Zap, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "For hobbyist beekeepers",
    features: ["2 apiaries", "10 hives", "Basic visit logging", "Mobile-friendly"],
    icon: "🐝",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39/mo",
    description: "For serious beekeepers",
    features: ["10 apiaries", "Unlimited hives", "CSV/JSON export", "QR codes", "Priority charts"],
    icon: "🏆",
    badge: "Most Popular",
  },
  {
    id: "scale",
    name: "Scale",
    price: "$69/mo",
    description: "For professional apiaries",
    features: ["Unlimited apiaries", "Unlimited hives", "All Pro features", "Team members (3)", "Priority support"],
    icon: "🏭",
  },
] as const;

export default function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: "pro" | "scale") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        throw new Error(json.error ?? "Failed to start checkout");
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Checkout failed", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        throw new Error(json.error ?? "Failed to open portal");
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Portal failed", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose the plan that fits your apiary.</p>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 flex items-center gap-2 text-green-700 dark:text-green-400">
          <Check className="h-5 w-5" aria-hidden="true" />
          <span>Subscription activated! Welcome to the next level of beekeeping.</span>
        </div>
      )}
      {canceled && (
        <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          Checkout was canceled. No changes were made.
        </div>
      )}

      {/* Pricing grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={plan.id === "pro" ? "border-primary ring-1 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{plan.icon}</span>
                {plan.badge && <Badge variant="default" className="text-xs">{plan.badge}</Badge>}
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold">{plan.price}</div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.id !== "free" && (
                <Button
                  className="w-full"
                  variant={plan.id === "pro" ? "default" : "outline"}
                  disabled={loading === plan.id}
                  onClick={() => handleUpgrade(plan.id as "pro" | "scale")}
                >
                  {loading === plan.id ? "Redirecting…" : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer portal */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Manage your subscription</p>
            <p className="text-sm text-muted-foreground">Update payment method, cancel, or view invoices.</p>
          </div>
          <Button variant="outline" onClick={handlePortal} disabled={loading === "portal"} className="gap-2 shrink-0">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            {loading === "portal" ? "Opening…" : "Billing Portal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
