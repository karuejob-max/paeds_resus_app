import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ExternalLink, History, ShieldCheck } from "lucide-react";

type SubscriptionStatus = "trial" | "active" | "grace" | "past_due" | "expired" | "suspended" | "cancelled" | "legacy_unclassified" | "not_subscribed";

function statusLabel(status: SubscriptionStatus | undefined): string {
  switch (status) {
    case "active": return "Active";
    case "trial": return "Trial";
    case "grace": return "Grace period";
    case "past_due": return "Payment past due";
    case "expired": return "Expired — history preserved";
    case "suspended": return "Suspended";
    case "cancelled": return "Cancelled";
    case "legacy_unclassified": return "Legacy access — review pending";
    case "not_subscribed": return "Not subscribed";
    default: return "Status unavailable";
  }
}

function badgeVariant(status: SubscriptionStatus | undefined): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active" || status === "trial") return "default";
  if (status === "grace" || status === "past_due" || status === "legacy_unclassified") return "secondary";
  if (status === "expired" || status === "suspended" || status === "cancelled") return "destructive";
  return "outline";
}

function dateLabel(value: Date | string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString();
}

export function InstitutionProductAccessPanel({ institutionId }: { institutionId: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: catalog, isLoading } = trpc.institutionProducts.getCatalog.useQuery({ institutionId });
  const { data: history } = trpc.institutionProducts.listSubscriptionEvents.useQuery({ institutionId });
  const products = useMemo(() => (catalog ?? []).filter((item) => item.productKey === "iers" || item.productKey === "cpd_portal"), [catalog]);
  const [adminProduct, setAdminProduct] = useState<"iers" | "cpd_portal">("iers");
  const [adminStatus, setAdminStatus] = useState<SubscriptionStatus>("active");
  const [adminReason, setAdminReason] = useState("");
  const setStatus = trpc.institutionProducts.setSubscriptionStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.institutionProducts.getCatalog.invalidate({ institutionId }),
        utils.institutionProducts.listSubscriptionEvents.invalidate({ institutionId }),
      ]);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Product access and renewal</CardTitle>
        <CardDescription>IERS and CPD Portal are separate subscriptions. Access status is enforced server-side and history is preserved after expiry.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading product access…</p>}
        {!isLoading && products.length === 0 && <p className="text-sm text-muted-foreground">The product ledger is not available yet. Existing legacy access remains protected while the account is classified.</p>}
        {products.map((product) => {
          const status = product.subscriptionStatus as SubscriptionStatus | undefined;
          return (
            <div key={product.productKey} className="rounded-lg border p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="font-semibold">{product.displayName ?? product.productKey}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{product.description}</div>
                </div>
                <Badge variant={badgeVariant(status)}>{statusLabel(status)}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Renews: {dateLabel(product.renewsAt)}</span>
                <span>Expires: {dateLabel(product.expiresAt)}</span>
                <span>Plan: {product.planName ?? "Not assigned"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><a href="mailto:paedsresus254@gmail.com?subject=Institution%20product%20renewal"><CreditCard className="mr-2 h-4 w-4" />Request renewal</a></Button>
                <Link href={product.productKey === "iers" ? "/institution?section=iers&iersTab=command" : "/institution?section=learning&learningTab=cpd&cpdTab=overview"}>
                  <Button size="sm" variant="ghost">Open workspace <ExternalLink className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground"><History className="h-4 w-4" />{history?.length ?? 0} subscription event(s) recorded for this account.</div>
        {user?.role === "admin" && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100"><CreditCard className="h-4 w-4" />Platform-admin scenario control</div>
            <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">Use this only for an approved subscription change or controlled access test. It writes an auditable subscription event; it is not an institution self-service grant.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1"><Label>Product</Label><Select value={adminProduct} onValueChange={(value) => setAdminProduct(value as typeof adminProduct)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="iers">IERS</SelectItem><SelectItem value="cpd_portal">CPD Portal</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Status</Label><Select value={adminStatus} onValueChange={(value) => setAdminStatus(value as SubscriptionStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["trial", "active", "grace", "past_due", "expired", "suspended", "cancelled", "not_subscribed"] as const).map((value) => <SelectItem key={value} value={value}>{statusLabel(value)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1 sm:col-span-1"><Label>Reason</Label><Input value={adminReason} onChange={(event) => setAdminReason(event.target.value)} placeholder="At least 3 characters" /></div>
            </div>
            <Button className="mt-3" size="sm" disabled={adminReason.trim().length < 3 || setStatus.isPending} onClick={async () => { await setStatus.mutateAsync({ institutionId, productKey: adminProduct, subscriptionStatus: adminStatus, reason: adminReason.trim() }); setAdminReason(""); }}>{setStatus.isPending ? "Saving…" : "Apply status"}</Button>
            {setStatus.isError && <p className="mt-2 text-xs text-red-700">{setStatus.error.message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
