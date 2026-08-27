import { useEffect, useState } from "react";
import { FileText, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { enqueueOfflineCommand, getOfflineCommand, removeOfflineCommand, updateOfflineCommand } from "@/lib/offline/platformOfflineStore";

type Props = { teamId: number; assignmentId: number };

const PHASES = [["recognition", "Recognition"], ["activation", "Activation"], ["response", "Response"], ["stabilization", "Stabilization"], ["recovery_debrief", "Recovery / debrief"]] as const;
const CODES = [["equipment_gap", "Equipment gap"], ["role_clarity", "Role clarity"], ["communication_barrier", "Communication barrier"], ["task_completed", "Task completed"], ["escalation_made", "Escalation made"], ["access_delay", "Access delay"], ["medication_access_issue", "Medication access issue"], ["airway_access_issue", "Airway access issue"], ["handoff_issue", "Handoff issue"], ["other", "Other"]] as const;

type TargetedReportDraft = {
  activationEventId: number;
  reportPhase: string;
  observationCode: string;
  narrative: string;
  noPatientIdentifiersAcknowledged: boolean;
};

export default function ProviderIersTargetedReportCard({ teamId, assignmentId }: Props) {
  const [activationEventId, setActivationEventId] = useState("");
  const [reportPhase, setReportPhase] = useState("response");
  const [observationCode, setObservationCode] = useState("other");
  const [narrative, setNarrative] = useState("");
  const [noIdentifiers, setNoIdentifiers] = useState(false);
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [offlineDraft, setOfflineDraft] = useState<TargetedReportDraft | null>(null);
  const localDraftId = `targeted-report-${teamId}-${assignmentId}`;
  const activationsQuery = trpc.iersTargetedReports.listOpenActivationsForTeam.useQuery({ teamId }, { staleTime: 10_000, retry: 1 });
  const activationTeamQuery = trpc.iersTargetedReports.getActivationTeam.useQuery({ activationEventId: Number(activationEventId), teamId }, { enabled: Boolean(activationEventId) });
  const submit = trpc.iersTargetedReports.submitRoleReport.useMutation({
    onSuccess: async () => { toast.success("Targeted ERT role report submitted."); await removeOfflineCommand(localDraftId); setOfflineDraft(null); setNarrative(""); setNoIdentifiers(false); setClientRequestId(crypto.randomUUID()); },
    onError: (error) => toast.error(error.message),
  });
  const selectedActivation = activationsQuery.data?.find((activation) => String(activation.id) === activationEventId);

  useEffect(() => {
    const refreshOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", refreshOnline);
    window.addEventListener("offline", refreshOnline);
    return () => {
      window.removeEventListener("online", refreshOnline);
      window.removeEventListener("offline", refreshOnline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getOfflineCommand<TargetedReportDraft>(localDraftId).then((command) => {
      if (cancelled || !command || command.status === "acknowledged") return;
      setOfflineDraft(command.payload);
      setActivationEventId(String(command.payload.activationEventId));
      setReportPhase(command.payload.reportPhase);
      setObservationCode(command.payload.observationCode);
      setNarrative(command.payload.narrative);
      setNoIdentifiers(command.payload.noPatientIdentifiersAcknowledged);
    });
    return () => {
      cancelled = true;
    };
  }, [localDraftId]);

  const draftPayload: TargetedReportDraft = {
    activationEventId: Number(activationEventId),
    reportPhase,
    observationCode,
    narrative,
    noPatientIdentifiersAcknowledged: noIdentifiers,
  };

  const saveDraftOffline = async () => {
    if (!activationEventId || !noIdentifiers) {
      toast.error("Choose the activation and confirm that the report contains no patient identifiers before saving.");
      return;
    }
    try {
      await enqueueOfflineCommand({
        localEventId: localDraftId,
        aggregateType: "targeted_report",
        aggregateId: `${teamId}:${assignmentId}`,
        actionType: "review_and_submit_targeted_report",
        payload: draftPayload,
        clientCreatedAt: Date.now(),
      });
      await updateOfflineCommand(localDraftId, { status: "requires_review", lastError: "Offline draft requires live activation/team revalidation before submission." });
      setOfflineDraft(draftPayload);
      toast.success("Targeted report draft saved on this device. It is not yet submitted.");
    } catch {
      toast.error("This device could not save the targeted report draft.");
    }
  };

  return <Card className="border-indigo-200 bg-indigo-50/20">
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-indigo-700" /> Assigned-role report</CardTitle><CardDescription>Named, activation-linked operational observation. This is separate from anonymous Care/Code Signal and must contain no patient identifiers.</CardDescription></CardHeader>
    <CardContent className="space-y-3">
      {!isOnline && <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><WifiOff className="mt-0.5 h-4 w-4 shrink-0" />Offline mode can save a report draft only. Live activation and accepted-role checks are required before submission.</p>}
      {offlineDraft && <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">A local targeted-report draft is loaded. Review it against the current live activation before submitting.</p>}
      {activationsQuery.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4" /> Checking active pole activations…</p>}
      {!activationsQuery.isLoading && (activationsQuery.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No active pole activation is available for a targeted role report right now.</p>}
      {(activationsQuery.data ?? []).length > 0 && <>
        <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={activationEventId} onChange={(event) => setActivationEventId(event.target.value)}><option value="">Choose active activation</option>{activationsQuery.data?.map((activation) => <option key={activation.id} value={activation.id}>{activation.activationType} · {activation.status} · {activation.location}</option>)}</select>
        {selectedActivation && <div className="rounded-lg border bg-white p-3 text-xs"><p className="font-semibold">Current pole team</p><p className="mt-1 text-muted-foreground">Activation {selectedActivation.id} · {new Date(selectedActivation.triggeredAt).toLocaleString()}</p>{activationTeamQuery.data?.members.map((member) => <p key={member.id} className="mt-1">{member.providerName} · {member.roleKey} · {member.assignmentStatus}</p>)}</div>}
        <div className="grid gap-2 sm:grid-cols-2"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={reportPhase} onChange={(event) => setReportPhase(event.target.value)}>{PHASES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select className="h-9 rounded-md border bg-background px-3 text-sm" value={observationCode} onChange={(event) => setObservationCode(event.target.value)}>{CODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <Textarea value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Short factual observation from your assigned role; do not enter names, identifiers, or clinical details outside your role vantage point." rows={3} />
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={noIdentifiers} onChange={(event) => setNoIdentifiers(event.target.checked)} className="mt-1" /><span>I confirm this report contains no patient identifiers.</span></label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void saveDraftOffline()} disabled={!activationEventId || !noIdentifiers}>Save draft offline</Button>
          <Button type="button" onClick={() => submit.mutate({ activationEventId: Number(activationEventId), teamId, assignmentId, clientRequestId, reportPhase: reportPhase as "recognition" | "activation" | "response" | "stabilization" | "recovery_debrief", observationCode: observationCode as "equipment_gap" | "role_clarity" | "communication_barrier" | "task_completed" | "escalation_made" | "access_delay" | "medication_access_issue" | "airway_access_issue" | "handoff_issue" | "other", narrative: narrative || undefined, noPatientIdentifiersAcknowledged: true })} disabled={!isOnline || !activationEventId || !noIdentifiers || submit.isPending}>{submit.isPending ? "Submitting…" : "Submit targeted report"}</Button>
        </div>
      </>}
    </CardContent>
  </Card>;
}
