import { useMemo } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { institutionId: number | null };

export default function IersReadinessTemplateAdminPanel({ institutionId }: Props) {
  const query = trpc.iersReadiness.getInstitutionTemplates.useQuery({ institutionId: institutionId ?? 0 }, { enabled: Boolean(institutionId), staleTime: 30_000 });
  const utils = trpc.useUtils();
  const approve = trpc.iersReadiness.approveInstitutionTemplate.useMutation({
    onSuccess: async () => {
      toast.success("Readiness template approved and activated.");
      await utils.iersReadiness.getInstitutionTemplates.invalidate({ institutionId: institutionId ?? 0 });
    },
    onError: (error) => toast.error(error.message),
  });
  const active = useMemo(() => query.data?.find((entry) => entry.template.status === "active"), [query.data]);

  if (!institutionId) return null;
  return <Card className="border-amber-200 bg-amber-50/20">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-amber-700" /> UTL readiness checklist governance</CardTitle>
      <CardDescription>An active universal all-ages baseline is provisioned automatically for every institution. Review local formulations, quantities, locations, and applicable age/setting modules before relying on the checklist operationally. This is a readiness verification tool, not a dosing or clinical-guidance source.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {query.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading templates…</p>}
      {query.isError && <p className="text-sm text-destructive">Checklist governance could not be loaded. Refresh and try again.</p>}
      {active && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm"><p className="font-semibold">Active universal baseline: {active.template.templateName} · {active.template.templateVersion}</p><p className="mt-1 text-xs text-muted-foreground">{active.itemCount} active items, including {active.criticalItemCount} critical gates. It is available now; local governance may later supersede it with a facility-specific version.</p></div>}
      {!query.isLoading && !query.isError && (query.data ?? []).map((entry) => <div key={entry.template.id} className="rounded-lg border bg-white p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{entry.template.templateName} · {entry.template.templateVersion}</p><p className="text-xs text-muted-foreground">{entry.itemCount} active items · {entry.criticalItemCount} critical gates · effective {new Date(entry.template.effectiveFrom).toLocaleDateString()}</p></div><Badge variant={entry.template.status === "active" ? "default" : "secondary"}>{entry.template.status}</Badge></div>
        <p className="text-xs text-muted-foreground">The template includes universal, neonatal, infant/child, adolescent/adult, maternity, and trauma modules. Local formulations, quantities, storage locations, and enabled modules must be checked against facility policy before a facility-specific replacement is approved.</p>
        {entry.template.status === "draft" && <Button type="button" size="sm" onClick={() => approve.mutate({ institutionId, templateId: entry.template.id })} disabled={approve.isPending}>Approve and activate after local review</Button>}
      </div>)}
    </CardContent>
  </Card>;
}
