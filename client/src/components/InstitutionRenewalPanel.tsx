import { useEffect, useState } from "react";
import { Bell, Clock3, Mail, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";
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

export function InstitutionRenewalPanel({ institutionId }: { institutionId: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const preferencesQuery = trpc.institutionProducts.getRenewalPreferences.useQuery({ institutionId });
  const notificationsQuery = trpc.institutionProducts.getRenewalNotifications.useQuery({ institutionId, limit: 50 });
  const [selectedProduct, setSelectedProduct] = useState<ProductKey>("iers");
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState<number[]>([30, 14, 7, 0]);
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

  const selectedPreference = preferencesQuery.data?.find((preference) => preference.productKey === selectedProduct);
  useEffect(() => {
    if (!selectedPreference) return;
    setInAppEnabled(selectedPreference.inAppEnabled);
    const parsed = selectedPreference.reminderDays.split(",").map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 365);
    setReminderDays(parsed.length ? parsed : [30, 14, 7, 0]);
  }, [selectedPreference]);

  const toggleReminder = (day: number) => setReminderDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => b - a));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Renewal notifications</CardTitle>
        <CardDescription>In-app reminders are available now. External email and SMS delivery remain disabled until a verified sender and consent workflow are configured; renewal reminders must never be used as emergency dispatch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">{PRODUCTS.map((product) => <Button key={product.key} type="button" size="sm" variant={selectedProduct === product.key ? "default" : "outline"} onClick={() => setSelectedProduct(product.key)}>{product.label}</Button>)}</div>
        <div className="rounded-lg border p-4">
          <p className="font-medium">{selectedProduct === "iers" ? "IERS" : "CPD Portal"} reminders</p>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={inAppEnabled} onChange={(event) => setInAppEnabled(event.target.checked)} />Enable in-app renewal reminders</label>
          <div className="mt-4 flex flex-wrap gap-2">{[30, 14, 7, 0].map((day) => <Button key={day} type="button" size="sm" variant={reminderDays.includes(day) ? "secondary" : "outline"} onClick={() => toggleReminder(day)}>{day === 0 ? "Due / past due" : `${day} days before`}</Button>)}</div>
          <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => updatePreferences.mutate({ institutionId, productKey: selectedProduct, inAppEnabled, emailEnabled: false, smsEnabled: false, reminderDays })} disabled={updatePreferences.isPending}>{updatePreferences.isPending ? "Saving…" : "Save reminder settings"}</Button><span className="flex items-center text-xs text-muted-foreground"><Mail className="mr-1 h-3 w-3" />Email off</span><span className="flex items-center text-xs text-muted-foreground"><MessageSquare className="mr-1 h-3 w-3" />SMS off</span></div>
        </div>
        {user?.role === "admin" && <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20"><p className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100"><ShieldCheck className="h-4 w-4" />Platform-admin renewal processor</p><p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">Run the deterministic processor after a scheduled deployment or from an approved background job. It is idempotent and writes only in-app notices.</p><Button className="mt-3" size="sm" onClick={() => processNotifications.mutate()} disabled={processNotifications.isPending}><RefreshCw className="mr-2 h-4 w-4" />{processNotifications.isPending ? "Processing…" : "Process renewal notices"}</Button></div>}
        <div className="rounded-lg border"><div className="border-b px-4 py-3 text-sm font-medium">Recent delivery history</div>{notificationsQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading renewal notices…</p> : !notificationsQuery.data?.length ? <p className="p-4 text-sm text-muted-foreground">No renewal notices have been generated.</p> : <div className="divide-y">{notificationsQuery.data.map((notice) => <div key={notice.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{notice.title}</p><p className="text-xs text-muted-foreground">{notice.notificationType.replaceAll("_", " ")} · {notice.channel} · {new Date(notice.createdAt).toLocaleString()}</p></div><Badge variant={notice.status === "sent" ? "default" : notice.status === "failed" ? "destructive" : "secondary"}>{notice.status}</Badge></div>)}</div>}</div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />Reminder windows are calculated from each product subscription’s recorded renewal date. They do not change access or interrupt active IERS activations.</p>
      </CardContent>
    </Card>
  );
}

export default InstitutionRenewalPanel;
