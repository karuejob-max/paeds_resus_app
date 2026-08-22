import { useEffect, useState } from "react";
import { Bell, Clock3, CreditCard, Mail, MessageSquare, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProductKey = "iers" | "cpd_portal";
const PRODUCTS: Array<{ key: ProductKey; label: string }> = [
  { key: "iers", label: "IERS" },
  { key: "cpd_portal", label: "CPD Portal" },
];

function localDateValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function InstitutionRenewalPanel({ institutionId }: { institutionId: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const preferencesQuery = trpc.institutionProducts.getRenewalPreferences.useQuery({ institutionId });
  const deliveryCapabilitiesQuery = trpc.institutionProducts.getRenewalDeliveryCapabilities.useQuery({ institutionId });
  const notificationsQuery = trpc.institutionProducts.getRenewalNotifications.useQuery({ institutionId, limit: 50 });
  const [selectedProduct, setSelectedProduct] = useState<ProductKey>("iers");
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([30, 14, 7, 0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amountKsh, setAmountKsh] = useState("");
  const [renewsAt, setRenewsAt] = useState(localDateValue(new Date(Date.now() + 365 * 86_400_000)));
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const updatePreferences = trpc.institutionProducts.updateRenewalPreferences.useMutation({
    onSuccess: () => {
      toast.success("Renewal notification preferences saved");
      void utils.institutionProducts.getRenewalPreferences.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not save renewal preferences"),
  });
  const processNotifications = trpc.institutionProducts.processRenewalNotifications.useMutation({
    onSuccess: (result) => {
      toast.success(`Renewal processor completed: ${result.sent} sent, ${result.skipped} skipped`);
      void utils.institutionProducts.getRenewalNotifications.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not process renewal notifications"),
  });
  const initiatePayment = trpc.institutionProducts.initiateInstitutionMpesaPayment.useMutation({
    onSuccess: (result) => {
      setCheckoutRequestId(result.checkoutRequestId);
      toast.success(result.duplicate ? "Existing M-Pesa request restored" : "M-Pesa prompt sent to the finance phone");
    },
    onError: (error) => toast.error(error.message || "Could not start M-Pesa payment"),
  });
  const paymentStatusQuery = trpc.institutionProducts.getInstitutionMpesaPaymentStatus.useQuery(
    { institutionId, checkoutRequestId: checkoutRequestId ?? "pending" },
    { enabled: Boolean(checkoutRequestId), refetchInterval: checkoutRequestId ? 5000 : false },
  );

  const selectedPreference = preferencesQuery.data?.find((preference) => preference.productKey === selectedProduct);
  useEffect(() => {
    if (!selectedPreference) return;
    setInAppEnabled(selectedPreference.inAppEnabled);
    setEmailEnabled(selectedPreference.emailEnabled && Boolean(deliveryCapabilitiesQuery.data?.emailConfigured));
    setSmsEnabled(selectedPreference.smsEnabled && Boolean(deliveryCapabilitiesQuery.data?.smsConfigured));
    const parsed = selectedPreference.reminderDays.split(",").map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 365);
    setReminderDays(parsed.length ? parsed : [30, 14, 7, 0]);
  }, [selectedPreference, deliveryCapabilitiesQuery.data?.emailConfigured, deliveryCapabilitiesQuery.data?.smsConfigured]);

  useEffect(() => {
    const status = paymentStatusQuery.data?.status;
    if (!checkoutRequestId || !status || status === "pending") return;
    if (status === "completed") {
      toast.success("Institutional M-Pesa payment verified and product access renewed");
      void utils.institutionProducts.getCatalog.invalidate({ institutionId });
    } else if (status === "failed") {
      toast.error(paymentStatusQuery.data?.failureReason || "Institutional M-Pesa payment failed");
    }
    setCheckoutRequestId(null);
  }, [checkoutRequestId, institutionId, paymentStatusQuery.data, utils.institutionProducts.getCatalog]);

  const toggleReminder = (day: number) => setReminderDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => b - a));
  const amountCents = Math.round(Number(amountKsh) * 100);
  const canStartPayment = Boolean(deliveryCapabilitiesQuery.data?.mpesaConfigured && /^254\d{9}$/.test(phoneNumber) && amountCents > 0 && renewsAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Renewal notifications and payments</CardTitle>
        <CardDescription>Renewal reminders are commercial notices only and must never be used as emergency dispatch. Email and SMS options appear only when a verified provider is configured on the server.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">{PRODUCTS.map((product) => <Button key={product.key} type="button" size="sm" variant={selectedProduct === product.key ? "default" : "outline"} onClick={() => setSelectedProduct(product.key)}>{product.label}</Button>)}</div>
        <div className="rounded-lg border p-4">
          <p className="font-medium">{selectedProduct === "iers" ? "IERS" : "CPD Portal"} reminders</p>
          <div className="mt-3 space-y-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inAppEnabled} onChange={(event) => setInAppEnabled(event.target.checked)} />Enable in-app renewal reminders</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} disabled={!deliveryCapabilitiesQuery.data?.emailConfigured} /><Mail className="h-3 w-3" />Enable email renewal reminders {deliveryCapabilitiesQuery.data?.emailConfigured ? "" : "(provider not configured)"}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={smsEnabled} onChange={(event) => setSmsEnabled(event.target.checked)} disabled={!deliveryCapabilitiesQuery.data?.smsConfigured} /><MessageSquare className="h-3 w-3" />Enable SMS renewal reminders {deliveryCapabilitiesQuery.data?.smsConfigured ? "" : "(provider not configured)"}</label></div>
          <div className="mt-4 flex flex-wrap gap-2">{[30, 14, 7, 0].map((day) => <Button key={day} type="button" size="sm" variant={reminderDays.includes(day) ? "secondary" : "outline"} onClick={() => toggleReminder(day)}>{day === 0 ? "Due / past due" : `${day} days before`}</Button>)}</div>
          <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => updatePreferences.mutate({ institutionId, productKey: selectedProduct, inAppEnabled, emailEnabled: emailEnabled && Boolean(deliveryCapabilitiesQuery.data?.emailConfigured), smsEnabled: smsEnabled && Boolean(deliveryCapabilitiesQuery.data?.smsConfigured), reminderDays })} disabled={updatePreferences.isPending}>{updatePreferences.isPending ? "Saving…" : "Save reminder settings"}</Button><span className="flex items-center text-xs text-muted-foreground"><Mail className="mr-1 h-3 w-3" />Email {deliveryCapabilitiesQuery.data?.emailConfigured ? "available" : "not configured"}</span><span className="flex items-center text-xs text-muted-foreground"><MessageSquare className="mr-1 h-3 w-3" />SMS {deliveryCapabilitiesQuery.data?.smsConfigured ? "available" : "not configured"}</span></div>
        </div>

        <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" />Pay or renew {selectedProduct === "iers" ? "IERS" : "CPD Portal"} by M-Pesa</p>
          <p className="mt-1 text-xs text-muted-foreground">The verified Daraja callback is the only event that activates access. An STK prompt alone never renews a product. Use a finance-authorized institutional phone and the approved contract amount.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Finance phone<input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value.replace(/\s/g, ""))} placeholder="2547XXXXXXXX" inputMode="numeric" /></label>
            <label className="text-sm">Amount (KES)<input className="mt-1 w-full rounded-md border bg-background px-3 py-2" type="number" min="1" value={amountKsh} onChange={(event) => setAmountKsh(event.target.value)} placeholder="Amount on contract" /></label>
            <label className="text-sm">Renewal date<input className="mt-1 w-full rounded-md border bg-background px-3 py-2" type="date" value={renewsAt} onChange={(event) => setRenewsAt(event.target.value)} /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3"><Button onClick={() => initiatePayment.mutate({ institutionId, productKey: selectedProduct, amountCents, renewsAt: new Date(`${renewsAt}T00:00:00`).toISOString(), phoneNumber, idempotencyKey: `institution-${institutionId}-${selectedProduct}-${Date.now()}` })} disabled={!canStartPayment || initiatePayment.isPending}><Smartphone className="mr-2 h-4 w-4" />{initiatePayment.isPending ? "Sending prompt…" : "Send M-Pesa prompt"}</Button><span className="text-xs text-muted-foreground">{deliveryCapabilitiesQuery.data?.mpesaConfigured ? "Daraja configured" : "Daraja provider not configured; payment start is disabled"}</span></div>
          {checkoutRequestId && <div className="mt-3 flex items-center gap-2 text-sm"><Badge variant={paymentStatusQuery.data?.status === "completed" ? "default" : paymentStatusQuery.data?.status === "failed" ? "destructive" : "secondary"}>{paymentStatusQuery.data?.status ?? "pending"}</Badge><span>Waiting for the verified M-Pesa callback…</span></div>}
        </div>

        {user?.role === "admin" && <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20"><p className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100"><ShieldCheck className="h-4 w-4" />Platform-admin renewal processor</p><p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">Run the deterministic processor after a scheduled deployment or from an approved background job. It is idempotent and records one delivery row per recipient and channel; active IERS events are never changed.</p><Button className="mt-3" size="sm" onClick={() => processNotifications.mutate()} disabled={processNotifications.isPending}><RefreshCw className="mr-2 h-4 w-4" />{processNotifications.isPending ? "Processing…" : "Process renewal notices"}</Button></div>}
        <div className="rounded-lg border"><div className="border-b px-4 py-3 text-sm font-medium">Recent delivery history</div>{notificationsQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading renewal notices…</p> : !notificationsQuery.data?.length ? <p className="p-4 text-sm text-muted-foreground">No renewal notices have been generated.</p> : <div className="divide-y">{notificationsQuery.data.map((notice) => <div key={notice.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{notice.title}</p><p className="text-xs text-muted-foreground">{notice.notificationType.replaceAll("_", " ")} · {notice.channel} · {new Date(notice.createdAt).toLocaleString()}</p></div><Badge variant={notice.status === "sent" ? "default" : notice.status === "failed" ? "destructive" : "secondary"}>{notice.status}</Badge></div>)}</div>}</div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />Reminder windows are calculated from each product subscription’s recorded renewal date. They do not change access or interrupt active IERS activations.</p>
      </CardContent>
    </Card>
  );
}

export default InstitutionRenewalPanel;
