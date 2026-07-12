import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PAGE_BODY_MUTED } from "@/lib/readable-surfaces";

// ─── helpers ────────────────────────────────────────────────────────────────

const BODY_TEXT = "text-sm text-slate-800 dark:text-slate-200";
const NOTE_TEXT = "text-xs text-slate-700 dark:text-slate-300";
const EMPTY_TEXT = "text-sm text-slate-700 dark:text-slate-300";

const DOMAIN_LABEL: Record<string, string> = {
  RECOGNITION: "Recognition",
  ESCALATION: "Escalation",
  VASCULAR_ACCESS: "Vascular access",
  TREATMENT: "Treatment",
  REFERRAL: "Referral",
  MONITORING: "Monitoring",
  COMMUNICATION: "Communication",
  RESOURCE_AVAILABILITY: "Resource availability",
};

const CONFIDENCE_BADGE: Record<string, string> = {
  SIGNAL: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  CANDIDATE: "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100",
  CONFIRMED: "bg-blue-200 text-blue-950 dark:bg-blue-900 dark:text-blue-100",
  ESTABLISHED: "bg-red-200 text-red-950 dark:bg-red-900 dark:text-red-100",
  CANDIDATE_SUCCESS: "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100",
  EMERGING_SUCCESS: "bg-teal-200 text-teal-950 dark:bg-teal-900 dark:text-teal-100",
  VALIDATED_SUCCESS: "bg-green-200 text-green-950 dark:bg-green-900 dark:text-green-100",
  STANDARD_PRACTICE: "bg-green-300 text-green-950 dark:bg-green-800 dark:text-green-100",
};

/**
 * Failure Pattern Atlas — the first real surface over the Failure Pattern
 * Knowledge Base (FPKB). Reads the 28 seeded failure modes and 10 success
 * factors (migration 0058) plus any confirmed patterns.
 *
 * Honest about current state: patterns require supporting observations
 * linked via kb_pattern_observations, which nothing writes to yet (the
 * automated detector is a separate, scoped piece of future work — see
 * docs/WORK_STATUS.md). Until that exists, this page mostly shows the
 * taxonomy itself, not yet confirmed cross-provider patterns. That's the
 * honest state of Stage 6 of the holistic loop — showing it as "coming
 * soon" would be a placebo; showing the real (mostly-empty) pattern list
 * is the truth the platform's own governing principles require.
 */
export default function FailurePatternAtlas() {
  const [track, setTrack] = useState<"FAILURE" | "SUCCESS">("FAILURE");

  const failureModesQ = trpc.fpkb.listFailureModes.useQuery({ includeRetired: false });
  const successFactorsQ = trpc.fpkb.listSuccessFactors.useQuery({ includeRetired: false });
  const patternsQ = trpc.fpkb.listPatterns.useQuery({ track, knowledgeStatus: "ACTIVE" });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <BookOpen className="h-6 w-6" />
          Failure Pattern Atlas
        </h1>
        <p className={PAGE_BODY_MUTED}>
          The shared taxonomy of known failure modes and success factors across Paeds Resus's
          participating providers and facilities — the Book of the Unforgotten made operational.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className={BODY_TEXT}>
          Confirmed patterns require 5+ independent observations before appearing here (Signal
          threshold) — see the Observation Architecture. As Care Signal reporting volume grows,
          this list grows with it.
        </AlertDescription>
      </Alert>

      <Tabs value={track} onValueChange={(v) => setTrack(v as "FAILURE" | "SUCCESS")}>
        <TabsList>
          <TabsTrigger value="FAILURE" className="flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" /> Failure patterns
          </TabsTrigger>
          <TabsTrigger value="SUCCESS" className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Success patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value={track} className="space-y-3 mt-4">
          {patternsQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !patternsQ.data?.length ? (
            <p className={EMPTY_TEXT}>
              No confirmed {track === "FAILURE" ? "failure" : "success"} patterns yet — none have
              crossed the observation threshold. This is expected while Care Signal v3 volume is
              still building.
            </p>
          ) : (
            patternsQ.data.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                      {p.patternName}
                    </CardTitle>
                    <Badge className={CONFIDENCE_BADGE[p.confidenceLevel] ?? ""}>
                      {p.confidenceLevel.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <CardDescription className={NOTE_TEXT}>
                    {DOMAIN_LABEL[p.primaryDomain] ?? p.primaryDomain} ·{" "}
                    {p.supportingObservationCount} supporting observation
                    {p.supportingObservationCount === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={BODY_TEXT}>{p.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <div>
        <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
          Known taxonomy — {track === "FAILURE" ? "failure modes" : "success factors"}
        </h2>
        {(track === "FAILURE" ? failureModesQ : successFactorsQ).isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {(track === "FAILURE" ? failureModesQ.data : successFactorsQ.data)?.map((m: any) => (
              <Card key={m.id}>
                <CardContent className="pt-4">
                  <p className={BODY_TEXT + " font-medium"}>
                    {m.failureModeName ?? m.successFactorName}
                  </p>
                  <p className={NOTE_TEXT}>
                    {DOMAIN_LABEL[m.failureDomain ?? m.successDomain] ?? m.failureDomain ?? m.successDomain}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
