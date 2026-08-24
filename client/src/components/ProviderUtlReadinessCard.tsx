import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ItemStatus = "present_and_functional" | "present_not_tested" | "missing" | "expired" | "damaged" | "insufficient_quantity" | "inaccessible" | "not_applicable" | "not_observed";

type Props = { teamId: number; shiftUtlRosterId?: number | null };

const STATUS_OPTIONS: Array<[ItemStatus, string]> = [
  ["present_and_functional", "Present and functional"],
  ["present_not_tested", "Present; not tested"],
  ["missing", "Missing"],
  ["expired", "Expired"],
  ["damaged", "Damaged"],
  ["insufficient_quantity", "Insufficient quantity"],
  ["inaccessible", "Inaccessible"],
  ["not_applicable", "Not applicable"],
  ["not_observed", "Not observed"],
];

function displayStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProviderUtlReadinessCard({ teamId, shiftUtlRosterId }: Props) {
  const [open, setOpen] = useState(false);
  const [attested, setAttested] = useState(false);
  const [generalNote, setGeneralNote] = useState("");
  const [itemStates, setItemStates] = useState<Record<number, { itemStatus: ItemStatus; note: string }>>({});
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  const readinessQuery = trpc.iersReadiness.getForMyUtl.useQuery({ teamId, shiftUtlRosterId: shiftUtlRosterId ?? undefined }, { staleTime: 15_000, enabled: open });
  const utils = trpc.useUtils();
  const submitMutation = trpc.iersReadiness.submitForMyUtl.useMutation({
    onSuccess: async (result) => {
      toast.success(`Readiness check saved: ${displayStatus(result.status)}.`);
      setAttested(false);
      setClientRequestId(crypto.randomUUID());
      await utils.iersReadiness.getForMyUtl.invalidate({ teamId, shiftUtlRosterId: shiftUtlRosterId ?? undefined });
    },
    onError: (error) => toast.error(error.message),
  });

  const items = readinessQuery.data?.items ?? [];
  useEffect(() => {
    const next: Record<number, { itemStatus: ItemStatus; note: string }> = {};
    for (const item of items) next[item.id] = { itemStatus: "not_observed", note: "" };
    for (const item of readinessQuery.data?.latestCheck?.items ?? []) next[item.templateItemId] = { itemStatus: item.itemStatus as ItemStatus, note: item.note ?? "" };
    setItemStates(next);
  }, [readinessQuery.data?.latestCheck?.id, items]);

  const hasAllItems = items.length > 0 && items.every((item) => itemStates[item.id]?.itemStatus);
  const criticalGapCount = useMemo(() => items.filter((item) => item.isCritical && itemStates[item.id]?.itemStatus !== "present_and_functional").length, [items, itemStates]);
  const readinessLabel = criticalGapCount > 0 ? "Not ready / escalate" : "Ready or ready with non-critical gaps";

  return (
    <Card className="border-amber-200 bg-amber-50/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-amber-700" /> Crash-cart readiness</CardTitle>
            <CardDescription className="mt-1">UTL-only physical check. This records equipment readiness; it does not replace clinical guidance or prove overall clinical readiness.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>{open ? "Hide check" : "Open check"}</Button>
        </div>
      </CardHeader>
      {open && <CardContent className="space-y-4">
        {readinessQuery.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading the approved facility checklist…</p>}
        {readinessQuery.isError && <p className="text-sm text-destructive">The readiness checklist could not be loaded. Refresh and try again.</p>}
        {!readinessQuery.isLoading && !readinessQuery.isError && !readinessQuery.data?.template && <div className="rounded-lg border border-dashed bg-white p-3 text-sm text-muted-foreground">No approved UTL checklist is active for this institution yet. An institutional administrator and the local resuscitation/pharmacy governance process must approve the facility template before it can be used.</div>}
        {readinessQuery.data?.template && <>
          <div className="rounded-lg border bg-white p-3 text-sm">
            <p className="font-semibold">{readinessQuery.data.template.templateName} · {readinessQuery.data.template.templateVersion}</p>
            <p className="mt-1 text-xs text-muted-foreground">Complete every item from the fixed template version. Critical failures cannot be reported as ready.</p>
            {readinessQuery.data.latestCheck && <p className="mt-2"><Badge variant={readinessQuery.data.latestCheck.status === "not_ready" ? "destructive" : "secondary"}>{displayStatus(readinessQuery.data.latestCheck.status)}</Badge> <span className="ml-2 text-xs text-muted-foreground">Last check {new Date(readinessQuery.data.latestCheck.checkedAt).toLocaleString()}</span></p>}
          </div>
          <div className="space-y-3">
            {items.map((item) => {
              const state = itemStates[item.id] ?? { itemStatus: "not_observed" as ItemStatus, note: "" };
              return <div key={item.id} className="rounded-lg border bg-white p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-medium">{item.itemLabel}</p><p className="text-xs text-muted-foreground">{item.category} · {item.ageBand.replaceAll("_", " ")} · {item.urgency}</p></div>{item.isCritical && <Badge variant="destructive">Critical</Badge>}</div>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={state.itemStatus} onChange={(event) => setItemStates((previous) => ({ ...previous, [item.id]: { ...state, itemStatus: event.target.value as ItemStatus } }))}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                {(state.itemStatus !== "present_and_functional" || item.requiresExpiryCheck || item.requiresFunctionCheck) && <Textarea value={state.note} onChange={(event) => setItemStates((previous) => ({ ...previous, [item.id]: { ...state, note: event.target.value } }))} placeholder="Optional factual note: quantity, expiry, function check, or location issue" rows={2} />}
              </div>;
            })}
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-700" /> {readinessLabel}</p><p className="mt-1 text-xs">A critical gap will notify the department ERCo. It will not be silently ignored or treated as a clinical clearance.</p></div>
          <Textarea value={generalNote} onChange={(event) => setGeneralNote(event.target.value)} placeholder="Optional overall factual note" rows={2} />
          <label className="flex items-start gap-2 rounded-lg border bg-white p-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" /><span>I physically checked the listed items and am reporting their observed state.</span></label>
          <Button type="button" onClick={() => submitMutation.mutate({ teamId, shiftUtlRosterId: shiftUtlRosterId ?? undefined, templateId: readinessQuery.data!.template!.id, clientRequestId, attestation: "I physically checked the listed items and am reporting their observed state.", generalNote: generalNote || undefined, items: items.map((item) => ({ templateItemId: item.id, itemStatus: itemStates[item.id]?.itemStatus ?? "not_observed", note: itemStates[item.id]?.note || undefined })) })} disabled={!attested || !hasAllItems || submitMutation.isPending}>{submitMutation.isPending ? "Saving…" : "Submit readiness check"}</Button>
        </>}
      </CardContent>}
    </Card>
  );
}
