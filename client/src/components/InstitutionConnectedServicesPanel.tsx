import { useEffect, useState } from "react";
import { ExternalLink, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ServiceStatus = "connected" | "transitional" | "compatibility" | "pilot" | "retired";
type PrivacyClass = "institutional_aggregate" | "provider_workflow" | "accountless_public" | "individual_learning" | "mixed_review_required";

function dateLabel(value: Date | string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString();
}

function privacyLabel(value: PrivacyClass | string | null | undefined): string {
  return (value ?? "mixed_review_required").replaceAll("_", " ");
}

export function InstitutionConnectedServicesPanel({ institutionId }: { institutionId: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.institutionProducts.getConnectedServices.useQuery({ institutionId });
  const { data: safeTruthPolicy } = trpc.institutionProducts.getSafeTruthGovernancePolicy.useQuery({ institutionId });
  const { data: serviceEvents } = trpc.institutionProducts.listConnectedServiceEvents.useQuery({ institutionId }, { enabled: user?.role === "admin" });
  const [selectedServiceKey, setSelectedServiceKey] = useState("safe_truth");
  const [status, setStatus] = useState<ServiceStatus>("transitional");
  const [privacyClass, setPrivacyClass] = useState<PrivacyClass>("accountless_public");
  const [owner, setOwner] = useState("");
  const [reviewLabel, setReviewLabel] = useState("");
  const [routeKey, setRouteKey] = useState("");
  const [reason, setReason] = useState("");
  const service = services?.find((item) => item.serviceKey === selectedServiceKey);
  const updateService = trpc.institutionProducts.updateConnectedService.useMutation({
    onSuccess: async () => {
      toast.success("Connected Service governance updated");
      setReason("");
      await Promise.all([
        utils.institutionProducts.getConnectedServices.invalidate({ institutionId }),
        utils.institutionProducts.listConnectedServiceEvents.invalidate({ institutionId }),
      ]);
    },
    onError: (error) => toast.error(error.message || "Could not update Connected Service"),
  });
  const updateSafeTruth = trpc.institutionProducts.updateSafeTruthGovernancePolicy.useMutation({
    onSuccess: async () => {
      toast.success("Safe Truth boundary saved");
      setReason("");
      await utils.institutionProducts.getSafeTruthGovernancePolicy.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not save Safe Truth boundary"),
  });

  useEffect(() => {
    if (!service) return;
    setStatus(service.lifecycleStatus as ServiceStatus);
    setPrivacyClass((service.privacyClass as PrivacyClass | undefined) ?? "mixed_review_required");
    setOwner(service.owner ?? "");
    setReviewLabel(service.reviewLabel ?? "");
    setRouteKey(service.routeKey ?? "");
  }, [service]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Connected Services</CardTitle>
        <CardDescription>Adjacent capabilities remain visible, owned, privacy-classified, and reviewable here. Connected Services never silently inherit IERS or CPD permissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading connected services…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {(services ?? []).map((item) => (
              <div key={item.serviceKey} className="rounded-lg border border-dashed p-4">
                <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{item.displayName}</div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><Badge variant={item.lifecycleStatus === "retired" ? "destructive" : "outline"}>{item.lifecycleStatus}</Badge></div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground"><p><span className="font-medium text-foreground">Owner:</span> {item.owner}</p><p><span className="font-medium text-foreground">Privacy:</span> {privacyLabel(item.privacyClass)}</p><p><span className="font-medium text-foreground">Entitlement:</span> {item.entitlementProductKey ?? "Separate / review required"}</p><p><span className="font-medium text-foreground">Last reviewed:</span> {dateLabel(item.lastReviewedAt)} · <span className="font-medium text-foreground">Next:</span> {dateLabel(item.nextReviewAt)}</p><p><span className="font-medium text-foreground">Review:</span> {item.reviewLabel ?? "Not recorded"}</p></div>
                {item.routeKey && <Button asChild variant="ghost" size="sm" className="mt-3 px-0"><a href={item.routeKey}>Open current service <ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button>}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Safe Truth boundary</div><p className="mt-1 text-sm text-muted-foreground">This public submission route is accountless and is not emergency dispatch. It must not be used to expose institutional rosters, patient identifiers, or provider-linked analytics.</p><div className="mt-3 grid gap-2 text-xs sm:grid-cols-3"><span>State: <strong>{privacyLabel(safeTruthPolicy?.boundaryStatus)}</strong></span><span>Route: <strong>{safeTruthPolicy?.allowedRoute ?? "/parent-safe-truth"}</strong></span><span>Version: <strong>{safeTruthPolicy?.policyVersion ?? "1.0"}</strong></span></div>{user?.role === "admin" && <div className="mt-3"><Button size="sm" variant="outline" onClick={() => updateSafeTruth.mutate({ institutionId, boundaryStatus: "accountless_public", allowedRoute: "/parent-safe-truth", institutionalAnalyticsAllowed: false, patientIdentifiersAllowed: false, providerLinkageAllowed: false, policyVersion: safeTruthPolicy?.policyVersion ?? "1.0", notes: "Accountless public safety reporting; no emergency dispatch or institutional analytics.", reason: "Reconfirm accountless public Safe Truth boundary" })} disabled={updateSafeTruth.isPending}>{updateSafeTruth.isPending ? "Saving…" : "Reconfirm boundary"}</Button></div>}</div>

        {user?.role === "admin" && service && <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20"><p className="font-semibold text-amber-950 dark:text-amber-100">Platform-admin service governance</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="space-y-1 sm:col-span-2"><Label>Service</Label><Select value={selectedServiceKey} onValueChange={setSelectedServiceKey}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(services ?? []).map((item) => <SelectItem key={item.serviceKey} value={item.serviceKey}>{item.displayName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Lifecycle</Label><Select value={status} onValueChange={(value) => setStatus(value as ServiceStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["connected", "transitional", "compatibility", "pilot", "retired"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Privacy class</Label><Select value={privacyClass} onValueChange={(value) => setPrivacyClass(value as PrivacyClass)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["institutional_aggregate", "provider_workflow", "accountless_public", "individual_learning", "mixed_review_required"] as const).map((value) => <SelectItem key={value} value={value}>{privacyLabel(value)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Owner</Label><Input value={owner} onChange={(event) => setOwner(event.target.value)} /></div><div className="space-y-1"><Label>Route</Label><Input value={routeKey} onChange={(event) => setRouteKey(event.target.value)} /></div><div className="space-y-1 sm:col-span-2"><Label>Review note</Label><Input value={reviewLabel} onChange={(event) => setReviewLabel(event.target.value)} /></div><div className="space-y-1 sm:col-span-2"><Label>Audit reason</Label><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="At least 3 characters" /></div></div><Button className="mt-3" size="sm" onClick={() => updateService.mutate({ institutionId, serviceKey: selectedServiceKey, lifecycleStatus: status, privacyClass, owner: owner.trim(), routeKey: routeKey.trim() || undefined, reviewLabel: reviewLabel.trim() || undefined, enabled: true, reason: reason.trim() })} disabled={reason.trim().length < 3 || owner.trim().length < 3 || updateService.isPending}>{updateService.isPending ? "Saving…" : "Save service governance"}</Button></div>}

        {user?.role === "admin" && !!serviceEvents?.length && <div className="rounded-lg border"><div className="border-b px-4 py-3 text-sm font-medium">Recent service governance events</div><div className="divide-y">{serviceEvents.slice(0, 8).map((event) => <div key={event.id} className="p-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">{event.eventType}</span> · {event.previousStatus ?? "new"} → {event.currentStatus ?? "—"} · {event.reason ?? "No reason recorded"}</div>)}</div></div>}
      </CardContent>
    </Card>
  );
}

export default InstitutionConnectedServicesPanel;
