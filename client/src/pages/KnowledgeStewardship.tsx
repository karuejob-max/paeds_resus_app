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
 * Knowledge Stewardship approval gate (gap-analysis #3).
 *
 * North Star v2.0 names Knowledge Stewardship as a non-negotiable governance
 * role: no recommendation ships without its sign-off. This page is that
 * gate's UI — draft a pattern + recommendation, then a (potentially
 * different) reviewer approves or rejects it. Every decision writes to the
 * append-only kb_governance_audit table.
 *
 * Honest note: there's no automated pattern-detection algorithm yet (that's
 * a separate, larger gap-list item), so everything drafted here today is
 * manually curated from clinical expertise, not mined from observation
 * volume. The form makes you say why in `curationRationale` — this isn't
 * hidden from future reviewers.
 */
export default function KnowledgeStewardship() {
  const utils = trpc.useUtils();
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [showNewPattern, setShowNewPattern] = useState(false);
  const [showNewRecommendation, setShowNewRecommendation] = useState(false);

  const pendingQ = trpc.fpkb.listPendingRecommendations.useQuery();
  const auditQ = trpc.fpkb.listGovernanceAudit.useQuery({ limit: 50 });
  const patternsQ = trpc.fpkb.listPatterns.useQuery({ knowledgeStatus: "ACTIVE" });

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
          <TabsTrigger value="draft">Draft new</TabsTrigger>
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
