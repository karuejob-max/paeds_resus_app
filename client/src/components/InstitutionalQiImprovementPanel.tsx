import { useEffect, useMemo, useState } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const reviewerRoles = new Set(["iers_chair", "iers_coordinator", "iers_reviewer", "iers_governance"]);
const outcomes = ["effective", "partially_effective", "not_effective", "insufficient_evidence"] as const;

type Props = { institutionId: number; roleKeys?: string[] };

function parseTags(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean))] : [];
  } catch {
    return [];
  }
}

export default function InstitutionalQiImprovementPanel({ institutionId, roleKeys = [] }: Props) {
  const canReview = roleKeys.some(role => reviewerRoles.has(role));
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [relationshipType, setRelationshipType] = useState<"discussion" | "improvement_response" | "follow_up">("discussion");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<(typeof outcomes)[number]>("insufficient_evidence");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [measureValue, setMeasureValue] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const utils = trpc.useUtils();
  const reports = trpc.institutionalQi.listReports.useQuery({ institutionalAccountId: institutionId, limit: 100 });
  const failureModes = trpc.institutionalQi.listFailureModes.useQuery({ institutionalAccountId: institutionId }, { enabled: canReview });
  const sessions = trpc.institutionalQi.listLinkableCpdSessions.useQuery({ institutionalAccountId: institutionId }, { enabled: canReview });
  const links = trpc.institutionalQi.listCpdLinks.useQuery({ institutionalAccountId: institutionId, reportId: selectedReportId ?? 0 }, { enabled: canReview && selectedReportId !== null });
  const measurement = trpc.institutionalQi.getMeasurementSummary.useQuery({ institutionalAccountId: institutionId, reportId: selectedReportId ?? 0 }, { enabled: selectedReportId !== null });
  const selectedReport = useMemo(() => reports.data?.find(report => report.id === selectedReportId) ?? null, [reports.data, selectedReportId]);

  useEffect(() => {
    setSelectedTags(parseTags(selectedReport?.failureModeCodes));
  }, [selectedReport?.failureModeCodes]);

  const linkSession = trpc.institutionalQi.linkCpdSession.useMutation({
    onSuccess: async () => { toast.success("CPD session linked to the QI report"); setSelectedEventId(""); await utils.institutionalQi.listCpdLinks.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const updateTags = trpc.institutionalQi.updateFailureModeTags.useMutation({
    onSuccess: async () => { toast.success("Failure-mode tags updated"); await utils.institutionalQi.listReports.invalidate(); await utils.institutionalQi.getMeasurementSummary.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const addReview = trpc.institutionalQi.addEffectivenessReview.useMutation({
    onSuccess: async () => { toast.success("Effectiveness review recorded"); setEvidenceSummary(""); setMeasureValue(""); setFollowUpRequired(false); await utils.institutionalQi.getMeasurementSummary.invalidate(); },
    onError: error => toast.error(error.message),
  });

  return (
    <Card className="border-teal-200 bg-teal-50/30 dark:border-teal-900 dark:bg-teal-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Link2 className="h-4 w-4 text-teal-700" />QI improvement bridge</CardTitle>
        <CardDescription>Connect a QI improvement record to a CPD discussion without exposing confidential RCA narratives. Attendance or quiz completion is never treated as proof that an action worked.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(15rem,22rem)_minmax(0,1fr)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Select a QI record</p>
            {reports.isLoading ? <p className="text-sm text-muted-foreground">Loading records…</p> : reports.data?.length ? reports.data.map(report => <button type="button" key={report.id} onClick={() => setSelectedReportId(report.id)} className={`block w-full rounded-lg border p-3 text-left text-sm ${selectedReportId === report.id ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40" : "hover:bg-muted"}`}><span className="block font-medium">{report.title}</span><span className="mt-1 block text-xs text-muted-foreground">{report.reportType.replaceAll("_", " ")} · {report.status.replaceAll("_", " ")}</span></button>) : <p className="text-sm text-muted-foreground">No QI records are available.</p>}
          </div>
          <div className="space-y-4">
            {!selectedReport ? <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Choose a QI record to review its safe improvement metadata and bridge links.</div> : <>
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{selectedReport.title}</span><Badge variant="outline">{selectedReport.status.replaceAll("_", " ")}</Badge><Badge variant="outline">{selectedReport.confidentialityLevel.replaceAll("_", " ")}</Badge></div>
              <div className="grid gap-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Baseline</p><p className="font-medium">{measurement.data?.baselineMeasure ?? "Not recorded"}</p></div><div><p className="text-xs text-muted-foreground">Target</p><p className="font-medium">{measurement.data?.targetMeasure ?? "Not recorded"}</p></div><div><p className="text-xs text-muted-foreground">Numerator / denominator</p><p className="font-medium">{measurement.data ? `${measurement.data.numerator ?? "—"} / ${measurement.data.denominator ?? "—"}` : "—"}</p></div><div><p className="text-xs text-muted-foreground">Data source</p><p className="font-medium">{measurement.data?.dataSource ?? "Not recorded"}</p></div></div>
              <div><p className="mb-2 text-sm font-semibold">Linked CPD sessions</p>{links.data?.length ? <div className="space-y-2">{links.data.map(link => <div key={link.id} className="rounded-md border p-2 text-sm"><span className="font-medium">{link.sessionName}</span><span className="ml-2 text-xs text-muted-foreground">{link.eventDate} · {link.relationshipType.replaceAll("_", " ")}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No CPD session is linked yet.</p>}</div>
              <div><p className="mb-2 text-sm font-semibold">Effectiveness reviews</p>{measurement.data?.reviews.length ? <div className="space-y-2">{measurement.data.reviews.map((review, index) => <div key={`${review.reviewDate}-${index}`} className="rounded-md border p-2 text-sm"><Badge variant="outline">{review.outcome.replaceAll("_", " ")}</Badge><span className="ml-2 text-xs text-muted-foreground">{review.measureValue ?? "No measure"} · {review.followUpRequired ? "follow-up required" : "no follow-up marked"}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No effectiveness review recorded.</p>}</div>
            </>}
          </div>
        </div>
        {!canReview ? <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-background p-3 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Only an IERS reviewer, governance, coordinator, or chair can create links, apply failure-mode tags, or record effectiveness reviews. QI narratives remain outside this CPD bridge.</div> : selectedReport ? <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2"><p className="text-sm font-semibold">Link CPD session</p><select className="min-h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedEventId} onChange={event => setSelectedEventId(event.target.value)}><option value="">Choose a session</option>{sessions.data?.map(session => <option key={session.id} value={session.id}>{session.name} · {session.eventDate}</option>)}</select><select className="min-h-10 w-full rounded-md border bg-background px-3 text-sm" value={relationshipType} onChange={event => setRelationshipType(event.target.value as typeof relationshipType)}><option value="discussion">Discussion</option><option value="improvement_response">Improvement response</option><option value="follow_up">Follow-up</option></select><Button className="w-full" disabled={!selectedEventId || linkSession.isPending} onClick={() => linkSession.mutate({ institutionalAccountId: institutionId, reportId: selectedReport.id, cpdEventId: Number(selectedEventId), relationshipType })}>Link session</Button></div>
          <div className="space-y-2"><p className="text-sm font-semibold">Failure-mode tags</p><select multiple className="min-h-32 w-full rounded-md border bg-background p-2 text-sm" value={selectedTags} onChange={event => setSelectedTags(Array.from(event.target.selectedOptions, option => option.value))}>{failureModes.data?.map(mode => <option key={mode.code} value={mode.code}>{mode.code} · {mode.name}</option>)}</select><Button variant="outline" className="w-full" disabled={updateTags.isPending} onClick={() => updateTags.mutate({ institutionalAccountId: institutionId, reportId: selectedReport.id, failureModeCodes: selectedTags })}>Save tags</Button></div>
          <div className="space-y-2"><p className="text-sm font-semibold">Record effectiveness review</p><select className="min-h-10 w-full rounded-md border bg-background px-3 text-sm" value={outcome} onChange={event => setOutcome(event.target.value as typeof outcome)}>{outcomes.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select><Textarea value={evidenceSummary} onChange={event => setEvidenceSummary(event.target.value)} placeholder="Evidence summary (not a CPD attendance claim)" className="min-h-20" /><Input value={measureValue} onChange={event => setMeasureValue(event.target.value)} inputMode="decimal" placeholder="Measured value (optional)" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={followUpRequired} onChange={event => setFollowUpRequired(event.target.checked)} />Follow-up required</label><Button className="w-full" disabled={evidenceSummary.trim().length < 10 || addReview.isPending} onClick={() => addReview.mutate({ institutionalAccountId: institutionId, reportId: selectedReport.id, outcome, evidenceSummary, measureValue: measureValue ? Number(measureValue) : undefined, followUpRequired })}>Record review</Button></div>
        </div> : null}
      </CardContent>
    </Card>
  );
}
