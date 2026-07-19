import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, ShieldX, ScrollText, Plus, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";

const BODY_TEXT = "text-sm text-slate-800 dark:text-slate-200";
const NOTE_TEXT = "text-xs text-slate-700 dark:text-slate-300";

const DOMAINS = [
  "RECOGNITION", "ESCALATION", "VASCULAR_ACCESS", "TREATMENT",
  "REFERRAL", "MONITORING", "COMMUNICATION", "RESOURCE_AVAILABILITY",
] as const;

const RECOMMENDATION_TYPES = [
  "TRAINING", "PROCUREMENT", "PROTOCOL", "STAFFING",
  "RESUSGPS_UPDATE", "CURRICULUM_UPDATE", "CARE_SIGNAL_RULE", "INSTITUTIONAL_PROCESS", "OTHER",
] as const;

const AUDIENCES = [
  "INDIVIDUAL_PROVIDER", "FACILITY", "NETWORK", "MINISTRY", "CURRICULUM_TEAM", "RESUSGPS_TEAM",
] as const;

/**
 * Knowledge Stewardship approval gate (gap-analysis #3), now also home to
 * the Pattern review queue (gap-analysis #12, FPKB_SCHEMA_V1.md §7.4).
 *
 * North Star v2.0 names Knowledge Stewardship as a non-negotiable governance
 * role: no recommendation ships without its sign-off. This page is that
 * gate's UI — draft a pattern + recommendation, then a (potentially
 * different) reviewer approves or rejects it. Every decision writes to the
 * append-only kb_governance_audit table.
 *
 * Pattern detection is automated (gap-analysis #9) and confidence downgrade
 * runs on a daily schedule (gap-analysis #12) — the Review queue tab below
 * is where a human gets first chance to intervene on a pattern that's
 * overdue for reconfirmation, before the automated fallback silently
 * downgrades it. See server/lib/fpkb-pattern-detector.ts's
 * runConfidenceDowngrade doc comment for the full two-clock design.
 */
export default function KnowledgeStewardship() {
  const utils = trpc.useUtils();
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [showNewPattern, setShowNewPattern] = useState(false);
  const [showNewRecommendation, setShowNewRecommendation] = useState(false);

  const pendingQ = trpc.fpkb.listPendingRecommendations.useQuery();
  const auditQ = trpc.fpkb.listGovernanceAudit.useQuery({ limit: 50 });
  const patternsQ = trpc.fpkb.listPatterns.useQuery({ knowledgeStatus: "ACTIVE" });
  const reviewQueueQ = trpc.fpkb.listPatternReviewQueue.useQuery();

  const [reviewOutcomes, setReviewOutcomes] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const completeReview = trpc.fpkb.completePatternReview.useMutation({
    onSuccess: () => {
      void utils.fpkb.listPatternReviewQueue.invalidate();
      void utils.fpkb.listPatterns.invalidate();
      void utils.fpkb.listGovernanceAudit.invalidate();
    },
  });

  const decide = trpc.fpkb.decideRecommendation.useMutation({
    onSuccess: () => {
      void utils.fpkb.listPendingRecommendations.invalidate();
      void utils.fpkb.listGovernanceAudit.invalidate();
    },
  });

  const [patternForm, setPatternForm] = useState({
    patternTrack: "FAILURE" as "FAILURE" | "SUCCESS",
    patternCode: "",
    patternName: "",
    primaryDomain: "RECOGNITION" as (typeof DOMAINS)[number],
    description: "",
    curationRationale: "",
  });
  const createPattern = trpc.fpkb.createPattern.useMutation({
    onSuccess: () => {
      void utils.fpkb.listPatterns.invalidate();
      setShowNewPattern(false);
      setPatternForm({
        patternTrack: "FAILURE", patternCode: "", patternName: "",
        primaryDomain: "RECOGNITION", description: "", curationRationale: "",
      });
    },
  });

  const [recForm, setRecForm] = useState({
    sourcePatternId: "",
    recommendationCode: "",
    recommendationType: "TRAINING" as (typeof RECOMMENDATION_TYPES)[number],
    recommendationText: "",
    targetAudience: "INDIVIDUAL_PROVIDER" as (typeof AUDIENCES)[number],
    evidenceBasisNotes: "",
  });
  const createRecommendation = trpc.fpkb.createRecommendation.useMutation({
    onSuccess: () => {
      void utils.fpkb.listPendingRecommendations.invalidate();
      setShowNewRecommendation(false);
      setRecForm({
        sourcePatternId: "", recommendationCode: "", recommendationType: "TRAINING",
        recommendationText: "", targetAudience: "INDIVIDUAL_PROVIDER", evidenceBasisNotes: "",
      });
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <ShieldCheck className="h-6 w-6" />
          Knowledge Stewardship
        </h1>
        <p className={NOTE_TEXT + " mt-1"}>
          The governance gate North Star requires: no pattern, recommendation, or content change
          reaches providers without explicit sign-off here.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="reviewQueue">
            Review queue{reviewQueueQ.data?.tasks.length ? ` (${reviewQueueQ.data.tasks.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="draft">Draft new</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="h-4 w-4 mr-1" />Audit trail</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !pendingQ.data?.length ? (
            <p className={NOTE_TEXT}>Nothing pending review right now.</p>
          ) : (
            pendingQ.data.map((rec) => (
              <Card key={rec.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                      {rec.recommendationCode}
                    </CardTitle>
                    <Badge variant="outline">{rec.recommendationType.replace(/_/g, " ")}</Badge>
                  </div>
                  <CardDescription className={NOTE_TEXT}>
                    Target: {rec.targetAudience.replace(/_/g, " ")} · Confidence at draft:{" "}
                    {rec.confidenceLevelAtGeneration.replace(/_/g, " ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className={BODY_TEXT}>{rec.recommendationText}</p>
                  <Textarea
                    placeholder="Decision notes (required for reject, optional for approve)…"
                    value={decisionNotes[rec.id] ?? ""}
                    onChange={(e) => setDecisionNotes((s) => ({ ...s, [rec.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        decide.mutate({ recommendationId: rec.id, decision: "APPROVED", notes: decisionNotes[rec.id] })
                      }
                      disabled={decide.isPending}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        decide.mutate({ recommendationId: rec.id, decision: "REJECTED", notes: decisionNotes[rec.id] })
                      }
                      disabled={decide.isPending || !decisionNotes[rec.id]?.trim()}
                    >
                      <ShieldX className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewQueue" className="space-y-3 mt-4">
          <p className={NOTE_TEXT}>
            Patterns overdue for reconfirmation, per the daily concept-drift job (gap-analysis #12). Resolving one
            here before the automated fallback fires is exactly how this is supposed to work — a pattern that's
            still valid just hasn't had fresh submissions lately.
          </p>
          {reviewQueueQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !reviewQueueQ.data?.tasks.length ? (
            <p className={NOTE_TEXT}>No open review tasks right now.</p>
          ) : (
            reviewQueueQ.data.tasks.map((task) => {
              const daysOverdue = Math.max(
                0,
                Math.round((Date.now() - new Date(task.reviewDueAt).getTime()) / 86_400_000)
              );
              return (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                        {task.patternCode} — {task.patternName}
                      </CardTitle>
                      <Badge variant={task.reviewStatus === "IN_PROGRESS" ? "destructive" : "outline"}>
                        {task.reviewStatus === "IN_PROGRESS" ? `${daysOverdue}d overdue` : "Scheduled"}
                      </Badge>
                    </div>
                    <CardDescription className={NOTE_TEXT}>
                      {task.patternTrack} · Confidence: {task.confidenceLevel.replace(/_/g, " ")} · Last reconfirmed:{" "}
                      {task.lastConfirmedAt ? new Date(task.lastConfirmedAt).toLocaleDateString() : "never"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={reviewOutcomes[task.id] ?? ""}
                      onValueChange={(v) => setReviewOutcomes((s) => ({ ...s, [task.id]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an outcome…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFIDENCE_MAINTAINED">Still valid — maintain confidence</SelectItem>
                        <SelectItem value="CONFIDENCE_UPGRADED">Upgrade confidence</SelectItem>
                        <SelectItem value="CONFIDENCE_DOWNGRADED">Downgrade one level now</SelectItem>
                        <SelectItem value="PATTERN_RETIRED">Retire this pattern</SelectItem>
                        <SelectItem value="PATTERN_SPLIT">Split into multiple patterns</SelectItem>
                        <SelectItem value="DEFERRED_TO_NEXT_CYCLE">Defer to next cycle</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Review notes (optional)…"
                      value={reviewNotes[task.id] ?? ""}
                      onChange={(e) => setReviewNotes((s) => ({ ...s, [task.id]: e.target.value }))}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      disabled={!reviewOutcomes[task.id] || completeReview.isPending}
                      onClick={() =>
                        completeReview.mutate({
                          reviewScheduleId: task.id,
                          outcome: reviewOutcomes[task.id] as
                            | "CONFIDENCE_MAINTAINED"
                            | "CONFIDENCE_UPGRADED"
                            | "CONFIDENCE_DOWNGRADED"
                            | "PATTERN_RETIRED"
                            | "PATTERN_SPLIT"
                            | "DEFERRED_TO_NEXT_CYCLE",
                          notes: reviewNotes[task.id],
                        })
                      }
                    >
                      Submit review
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className={BODY_TEXT}>
              No automated pattern-detection exists yet — everything drafted here is manually
              curated from clinical expertise. Say so honestly in the rationale field; a future
              reviewer needs to know this wasn't mined from observation data.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Dialog open={showNewPattern} onOpenChange={setShowNewPattern}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="h-4 w-4 mr-1" /> New pattern</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Draft a new pattern</DialogTitle>
                  <DialogDescription>Manually curated — not observation-derived yet.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Select value={patternForm.patternTrack} onValueChange={(v) => setPatternForm((f) => ({ ...f, patternTrack: v as "FAILURE" | "SUCCESS" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAILURE">Failure</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Pattern code (e.g. sepsis-recognition-delay)" value={patternForm.patternCode} onChange={(e) => setPatternForm((f) => ({ ...f, patternCode: e.target.value }))} />
                  <Input placeholder="Pattern name" value={patternForm.patternName} onChange={(e) => setPatternForm((f) => ({ ...f, patternName: e.target.value }))} />
                  <Select value={patternForm.primaryDomain} onValueChange={(v) => setPatternForm((f) => ({ ...f, primaryDomain: v as typeof patternForm.primaryDomain }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Description" value={patternForm.description} onChange={(e) => setPatternForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                  <Textarea placeholder="Curation rationale — why record this without observation data yet?" value={patternForm.curationRationale} onChange={(e) => setPatternForm((f) => ({ ...f, curationRationale: e.target.value }))} rows={2} />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createPattern.mutate(patternForm)}
                    disabled={createPattern.isPending || !patternForm.patternCode || !patternForm.patternName || !patternForm.description || !patternForm.curationRationale}
                  >
                    Create pattern
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewRecommendation} onOpenChange={setShowNewRecommendation}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="h-4 w-4 mr-1" /> New recommendation</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Draft a recommendation</DialogTitle>
                  <DialogDescription>Goes to Pending review — never auto-approved.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Select value={recForm.sourcePatternId} onValueChange={(v) => setRecForm((f) => ({ ...f, sourcePatternId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Source pattern" /></SelectTrigger>
                    <SelectContent>
                      {patternsQ.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.patternName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Recommendation code" value={recForm.recommendationCode} onChange={(e) => setRecForm((f) => ({ ...f, recommendationCode: e.target.value }))} />
                  <Select value={recForm.recommendationType} onValueChange={(v) => setRecForm((f) => ({ ...f, recommendationType: v as typeof recForm.recommendationType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECOMMENDATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={recForm.targetAudience} onValueChange={(v) => setRecForm((f) => ({ ...f, targetAudience: v as typeof recForm.targetAudience }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Recommendation text" value={recForm.recommendationText} onChange={(e) => setRecForm((f) => ({ ...f, recommendationText: e.target.value }))} rows={3} />
                  <Textarea placeholder="Evidence basis notes" value={recForm.evidenceBasisNotes} onChange={(e) => setRecForm((f) => ({ ...f, evidenceBasisNotes: e.target.value }))} rows={2} />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createRecommendation.mutate(recForm)}
                    disabled={createRecommendation.isPending || !recForm.sourcePatternId || !recForm.recommendationCode || !recForm.recommendationText || !recForm.evidenceBasisNotes}
                  >
                    Draft recommendation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className={BODY_TEXT}>
              Only APPROVED recommendations can have an intervention committed against them.
              Outcomes are never auto-labelled — a human records what actually happened.
            </AlertDescription>
          </Alert>
          <InterventionsPanel />
        </TabsContent>

        <TabsContent value="audit" className="space-y-2 mt-4">
          {auditQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !auditQ.data?.length ? (
            <p className={NOTE_TEXT}>No governance actions recorded yet.</p>
          ) : (
            auditQ.data.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className={BODY_TEXT}>{a.actionType.replace(/_/g, " ")} — {a.entityType.replace(/_/g, " ")}</p>
                    {a.reasoning ? <p className={NOTE_TEXT}>{a.reasoning}</p> : null}
                  </div>
                  <span className={NOTE_TEXT}>{new Date(a.createdAt).toLocaleString()}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Interventions panel (gap-analysis #6) ────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  PLANNED: "bg-slate-200 text-slate-900",
  IN_PROGRESS: "bg-blue-200 text-blue-950",
  COMPLETED: "bg-green-200 text-green-950",
  ABANDONED: "bg-red-200 text-red-950",
};

function InterventionsPanel() {
  const utils = trpc.useUtils();
  const approvedQ = trpc.fpkb.listApprovedRecommendations.useQuery();
  const interventionsQ = trpc.fpkb.listInterventions.useQuery();
  const implementationsQ = trpc.fpkb.listImplementations.useQuery();

  const [showNewIntervention, setShowNewIntervention] = useState(false);
  const [outcomeTarget, setOutcomeTarget] = useState<string | null>(null);

  const [form, setForm] = useState({
    recommendationId: "",
    committingEntityType: "FACILITY" as "FACILITY" | "NETWORK" | "MINISTRY" | "TRAINING_INSTITUTION" | "OTHER",
    committingEntityId: "",
    interventionScope: "HOSPITAL_WIDE" as "ED_ONLY" | "WARD" | "HOSPITAL_WIDE" | "NETWORK" | "NATIONAL",
    interventionDescription: "",
    definedOutcomeMeasure: "",
    evaluationWindowMonths: 6,
  });
  const createIntervention = trpc.fpkb.createIntervention.useMutation({
    onSuccess: () => {
      void utils.fpkb.listInterventions.invalidate();
      setShowNewIntervention(false);
      setForm({
        recommendationId: "", committingEntityType: "FACILITY", committingEntityId: "",
        interventionScope: "HOSPITAL_WIDE", interventionDescription: "", definedOutcomeMeasure: "",
        evaluationWindowMonths: 6,
      });
    },
  });

  const [outcomeForm, setOutcomeForm] = useState({
    implementationFidelity: "HIGH" as "HIGH" | "PARTIAL" | "LOW" | "NOT_IMPLEMENTED",
    outcomeLabel: "EVALUATION_PENDING" as "IMPROVED" | "NO_IMPROVEMENT" | "WORSENED" | "EVALUATION_PENDING",
    outcomeEvidenceNotes: "",
  });
  const recordOutcome = trpc.fpkb.recordImplementationOutcome.useMutation({
    onSuccess: () => {
      void utils.fpkb.listInterventions.invalidate();
      void utils.fpkb.listImplementations.invalidate();
      setOutcomeTarget(null);
      setOutcomeForm({ implementationFidelity: "HIGH", outcomeLabel: "EVALUATION_PENDING", outcomeEvidenceNotes: "" });
    },
  });

  const implementationFor = (interventionId: string) =>
    implementationsQ.data?.find((i: any) => i.interventionId === interventionId);

  return (
    <div className="space-y-3">
      <Dialog open={showNewIntervention} onOpenChange={setShowNewIntervention}>
        <DialogTrigger asChild>
          <Button variant="outline"><Plus className="h-4 w-4 mr-1" /> Commit new intervention</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit to an intervention</DialogTitle>
            <DialogDescription>Only against APPROVED recommendations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={form.recommendationId} onValueChange={(v) => setForm((f) => ({ ...f, recommendationId: v }))}>
              <SelectTrigger><SelectValue placeholder="Approved recommendation" /></SelectTrigger>
              <SelectContent>
                {approvedQ.data?.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.recommendationCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!approvedQ.isLoading && approvedQ.data?.length === 0 && (
              <p className={NOTE_TEXT}>No approved recommendations yet — approve one in "Pending review" first.</p>
            )}
            <Select value={form.committingEntityType} onValueChange={(v) => setForm((f) => ({ ...f, committingEntityType: v as typeof form.committingEntityType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["FACILITY", "NETWORK", "MINISTRY", "TRAINING_INSTITUTION", "OTHER"] as const).map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Committing entity ID (e.g. facility ID)" value={form.committingEntityId} onChange={(e) => setForm((f) => ({ ...f, committingEntityId: e.target.value }))} />
            <Select value={form.interventionScope} onValueChange={(v) => setForm((f) => ({ ...f, interventionScope: v as typeof form.interventionScope }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["ED_ONLY", "WARD", "HOSPITAL_WIDE", "NETWORK", "NATIONAL"] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="What will be done, concretely?" value={form.interventionDescription} onChange={(e) => setForm((f) => ({ ...f, interventionDescription: e.target.value }))} rows={3} />
            <Textarea placeholder="Defined outcome measure — how will you know it worked?" value={form.definedOutcomeMeasure} onChange={(e) => setForm((f) => ({ ...f, definedOutcomeMeasure: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => createIntervention.mutate(form)}
              disabled={createIntervention.isPending || !form.recommendationId || !form.committingEntityId || !form.interventionDescription || !form.definedOutcomeMeasure}
            >
              Commit intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {interventionsQ.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !interventionsQ.data?.length ? (
        <p className={NOTE_TEXT}>No interventions committed yet.</p>
      ) : (
        interventionsQ.data.map((iv: any) => {
          const impl = implementationFor(iv.id);
          return (
            <Card key={iv.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                    {iv.committingEntityType.replace(/_/g, " ")} · {iv.interventionScope.replace(/_/g, " ")}
                  </CardTitle>
                  <Badge className={STATUS_BADGE[iv.interventionStatus] ?? ""}>{iv.interventionStatus}</Badge>
                </div>
                <CardDescription className={NOTE_TEXT}>{iv.definedOutcomeMeasure}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={BODY_TEXT}>{iv.interventionDescription}</p>
                {impl ? (
                  <div className="rounded-lg border p-2 text-xs">
                    <p className={NOTE_TEXT}>
                      Outcome: <span className="font-medium">{(impl.outcomeLabel ?? "UNKNOWN").replace(/_/g, " ")}</span> · Fidelity: {impl.implementationFidelity}
                    </p>
                    <p className={NOTE_TEXT}>{impl.outcomeEvidenceNotes}</p>
                  </div>
                ) : (
                  <Dialog open={outcomeTarget === iv.id} onOpenChange={(open) => setOutcomeTarget(open ? iv.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Record outcome</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record what actually happened</DialogTitle>
                        <DialogDescription>Never auto-labelled — say what you observed.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Select value={outcomeForm.implementationFidelity} onValueChange={(v) => setOutcomeForm((f) => ({ ...f, implementationFidelity: v as typeof outcomeForm.implementationFidelity }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["HIGH", "PARTIAL", "LOW", "NOT_IMPLEMENTED"] as const).map((v) => (
                              <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={outcomeForm.outcomeLabel} onValueChange={(v) => setOutcomeForm((f) => ({ ...f, outcomeLabel: v as typeof outcomeForm.outcomeLabel }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["IMPROVED", "NO_IMPROVEMENT", "WORSENED", "EVALUATION_PENDING"] as const).map((v) => (
                              <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea placeholder="Evidence notes — what did you actually observe?" value={outcomeForm.outcomeEvidenceNotes} onChange={(e) => setOutcomeForm((f) => ({ ...f, outcomeEvidenceNotes: e.target.value }))} rows={3} />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => recordOutcome.mutate({ interventionId: iv.id, ...outcomeForm })}
                          disabled={recordOutcome.isPending || !outcomeForm.outcomeEvidenceNotes.trim()}
                        >
                          Record outcome
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
