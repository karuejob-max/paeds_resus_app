import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, CheckCircle2, Loader2, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminInstitutionalPayments() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "card">("bank_transfer");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();
  const isAdmin = isAuthenticated && (user as { role?: string })?.role === "admin";

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/login");
    if (!loading && isAuthenticated && !isAdmin) setLocation("/");
  }, [loading, isAuthenticated, isAdmin, setLocation]);

  const orders = trpc.institutionalLifeSupport.listPendingInstitutionalOrders.useQuery(undefined, { enabled: isAdmin });
  const confirm = trpc.institutionalLifeSupport.confirmManualIlsPayment.useMutation({
    onSuccess: async () => {
      toast.success("Payment recorded and ILSP access activated");
      setSelectedOrder(null);
      setReference("");
      setReason("");
      await utils.institutionalLifeSupport.listPendingInstitutionalOrders.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><Shield className="h-5 w-5" /><p className="text-sm text-muted-foreground">Platform finance controls</p></div>
            <h1 className="text-2xl md:text-3xl font-semibold">Institutional payments</h1>
            <p className="text-muted-foreground">Record verified bank-transfer or card settlement for institutional ILSP orders.</p>
          </div>
          <Button variant="outline" onClick={() => orders.refetch()} disabled={orders.isFetching}><RefreshCw className={orders.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /><span className="ml-2">Refresh</span></Button>
        </div>
        <Alert><Building2 className="h-4 w-4" /><AlertTitle>Controlled confirmation</AlertTitle><AlertDescription>Confirm only after finance has verified the settlement. Every confirmation records the reference, reason, and acting administrator.</AlertDescription></Alert>
        {orders.isError && <Alert variant="destructive"><AlertTitle>Could not load pending orders</AlertTitle><AlertDescription>{orders.error.message}</AlertDescription></Alert>}
        <Card>
          <CardHeader><CardTitle>Pending ILSP orders</CardTitle><CardDescription>Automated M-Pesa orders are not shown here unless they remain pending and ready for payment.</CardDescription></CardHeader>
          <CardContent>
            {orders.isLoading ? <p className="text-muted-foreground">Loading…</p> : !orders.data?.length ? <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" />No pending institutional ILSP orders.</div> : <div className="space-y-3">{orders.data.map((order) => <div key={order.id} className="rounded-lg border p-4 space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{order.companyName} · Order #{order.id}</p><p className="text-sm text-muted-foreground">{order.providerCount} providers · Training {new Date(order.trainingDate).toLocaleDateString()}</p></div><Badge variant="outline">KES {Number(order.totalAmountKes).toLocaleString()}</Badge></div>{selectedOrder === order.id ? <form className="grid gap-3 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); confirm.mutate({ orderId: order.id, paymentMethod, transactionReference: reference, reason }); }}><div><Label htmlFor={`method-${order.id}`}>Method</Label><select id={`method-${order.id}`} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "bank_transfer" | "card")} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="bank_transfer">Bank transfer</option><option value="card">Card</option></select></div><div><Label htmlFor={`ref-${order.id}`}>Transaction reference</Label><Input id={`ref-${order.id}`} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Bank/card reference" required minLength={3} /></div><div><Label htmlFor={`reason-${order.id}`}>Reason</Label><Input id={`reason-${order.id}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Finance verification note" required minLength={3} /></div><div className="flex items-end gap-2"><Button type="submit" disabled={confirm.isPending}>{confirm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm payment"}</Button><Button type="button" variant="ghost" onClick={() => setSelectedOrder(null)}>Cancel</Button></div></form> : <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order.id)}>Record manual payment</Button>}</div>)}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

