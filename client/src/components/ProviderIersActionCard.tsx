import { useState } from "react";
import { CheckCircle2, ClipboardList, Flag, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProviderIersActionCard() {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(undefined, { staleTime: 30_000, retry: 1 });
  const utils = trpc.useUtils();
  const institutionId = membershipsQuery.data?.find((membership) => membership.membershipStatus === "active")?.institutionalAccountId;
  const actionsQuery = trpc.iers.listActions.useQuery(institutionId ? { institutionId } : undefined as never, { enabled: Boolean(institutionId), staleTime: 15_000, retry: 1 });
  const updateAction = trpc.iers.updateAction.useMutation({
    onSuccess: async () => {
      toast.success("Readiness action updated.");
      if (institutionId) await utils.iers.listActions.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message || "Could not update readiness action."),
  });

  if (!institutionId || membershipsQuery.isLoading || membershipsQuery.isError || !actionsQuery.data?.length) return null;

  const activeActions = actionsQuery.data.filter((action) => !["closed", "cancelled"].includes(action.status));
  if (activeActions.length === 0) return null;

  return (
    <Card className="border-amber-200 overflow-hidden">
      <CardHeader className="bg-amber-50 border-b border-amber-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-950 text-base"><ClipboardList className="h-5 w-5" /> My Readiness Actions</CardTitle>
        <CardDescription className="text-amber-900/80">Your reported gaps remain visible until a leader verifies the closure evidence.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {activeActions.map((action) => (
          <div key={action.id} className="rounded-lg border border-amber-100 p-3 space-y-2">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm text-slate-900">{action.title}</p><p className="text-xs text-slate-600 mt-1">{action.gapDescription}</p></div><Badge variant="outline" className="border-amber-200 text-amber-800 shrink-0">{label(action.status)}</Badge></div>
            <div className="flex flex-wrap gap-2">
              {action.status === "open" && <Button size="sm" variant="outline" disabled={updateAction.isPending} onClick={() => updateAction.mutate({ institutionId, actionId: action.id, status: "in_progress" })}><Loader2 className="h-4 w-4 mr-2" />Start work</Button>}
              {!["awaiting_verification"].includes(action.status) && <Button size="sm" variant="outline" disabled={updateAction.isPending} onClick={() => updateAction.mutate({ institutionId, actionId: action.id, status: "awaiting_verification", closureNote: notes[action.id]?.trim() || "Work completed; leader verification requested." })}><CheckCircle2 className="h-4 w-4 mr-2" />Request verification</Button>}
              {action.status !== "blocked" && <Button size="sm" variant="outline" className="border-red-200 text-red-700" disabled={updateAction.isPending} onClick={() => updateAction.mutate({ institutionId, actionId: action.id, status: "blocked", closureNote: notes[action.id]?.trim() || "Blocked; escalation required." })}><Flag className="h-4 w-4 mr-2" />Mark blocked</Button>}
            </div>
            <Textarea value={notes[action.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [action.id]: event.target.value }))} rows={2} placeholder="Add progress, closure evidence, or the blocker" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
