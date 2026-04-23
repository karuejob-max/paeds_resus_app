/**
 * SafeTruthPanel — Hospital Admin view of parent-submitted Safe Truth data
 *
 * Roadmap Phase 4 implementation:
 *   - Surfaces aggregated parent feedback to the hospital admin
 *   - Shows top system gaps, outcome breakdown, and average delay
 *   - Provides actionable QI signals, not raw individual stories
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SafeTruthPanelProps {
  hospitalId: number;
}

// ─── Gap Labels ──────────────────────────────────────────────────────────────

const GAP_LABELS: Record<string, string> = {
  communication: "Communication gaps",
  equipment: "Missing equipment / supplies",
  staffing: "Insufficient staffing",
  training: "Staff unsure of next steps",
  protocols: "Unclear protocols",
  "family-support": "Inadequate family support",
  "follow-up": "Unclear discharge / follow-up",
  "registration-before-triage": "Registration before triage",
  "registration-desk": "Delay at registration desk",
  "billing-cashier": "Delay at billing / cashier",
  "waiting-room": "Delay in waiting room",
  "casualty-queue": "Delay in casualty queue",
  "ward-handover": "Delay during ward handover",
  "lab-imaging": "Delay waiting for lab / imaging",
  gate: "Delay at gate / security",
};

function gapLabel(gap: string): string {
  return GAP_LABELS[gap] ?? gap;
}

// ─── Outcome Labels ───────────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<string, string> = {
  discharged: "bg-green-100 text-green-800 border-green-200",
  referred: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "passed-away": "bg-red-100 text-red-800 border-red-200",
};

const OUTCOME_LABELS: Record<string, string> = {
  discharged: "Discharged home",
  referred: "Transferred",
  "passed-away": "Passed away",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SafeTruthPanel({ hospitalId }: SafeTruthPanelProps) {
  const { data, isLoading, error } = trpc.parentSafeTruth.getHospitalSafeTruthSummary.useQuery(
    { hospitalId, months: 3 },
    { enabled: !!hospitalId }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>Failed to load Safe Truth data. Please refresh.</AlertDescription>
      </Alert>
    );
  }

  const totalSubmissions = data?.totalSubmissions ?? 0;
  const outcomes = data?.outcomes ?? {};
  const topGaps = data?.topGaps ?? [];
  const avgDelayMinutes = data?.avgDelayMinutes ?? null;
  const recentSubmissions = data?.recentSubmissions ?? [];

  const totalOutcomes = Object.values(outcomes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Safe Truth — Parent Feedback
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregated, anonymized feedback from parents about their child's care journey at your
          facility. Last 3 months.
        </p>
      </div>

      {totalSubmissions === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-medium text-muted-foreground">No submissions yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When parents submit their Safe Truth stories and link them to your facility, the
              aggregated patterns will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalSubmissions}</p>
                    <p className="text-xs text-muted-foreground">Stories submitted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {avgDelayMinutes !== null ? `${avgDelayMinutes}m` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg. arrival-to-treatment time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{topGaps.length}</p>
                    <p className="text-xs text-muted-foreground">Distinct gap types reported</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outcome Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Outcome Breakdown
              </CardTitle>
              <CardDescription>
                How children's journeys ended, as reported by parents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(outcomes).map(([outcome, count]) => (
                  <div
                    key={outcome}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                      OUTCOME_COLORS[outcome] ?? "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <span>{OUTCOME_LABELS[outcome] ?? outcome}</span>
                    <span className="font-bold">{count}</span>
                    {totalOutcomes > 0 && (
                      <span className="text-xs opacity-70">
                        ({Math.round((count / totalOutcomes) * 100)}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top System Gaps */}
          {topGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Top System Gaps Reported
                </CardTitle>
                <CardDescription>
                  Ranked by frequency. These are the patterns parents consistently experience.
                  Each one is a fixable system problem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topGaps.map(({ gap, count }, index) => {
                    const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;
                    const isHigh = pct >= 40;
                    const isMed = pct >= 20 && pct < 40;
                    return (
                      <div key={gap} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-mono text-xs w-5">
                              {index + 1}.
                            </span>
                            <span className="font-medium">{gapLabel(gap)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{count} reports</span>
                            <Badge
                              variant="outline"
                              className={
                                isHigh
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : isMed
                                  ? "border-orange-300 text-orange-700 bg-orange-50"
                                  : "border-muted text-muted-foreground"
                              }
                            >
                              {pct}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 ml-7">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isHigh ? "bg-red-500" : isMed ? "bg-orange-400" : "bg-primary/50"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Submissions Summary */}
          {recentSubmissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Recent Submissions
                </CardTitle>
                <CardDescription>
                  Anonymized summary of the 10 most recent stories. No individual is identifiable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {recentSubmissions.map((s: any) => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            s.childOutcome === "discharged"
                              ? "bg-green-500"
                              : s.childOutcome === "referred"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm text-muted-foreground truncate">
                          {OUTCOME_LABELS[s.childOutcome] ?? s.childOutcome}
                          {s.totalDurationMinutes
                            ? ` · ${s.totalDurationMinutes}m total`
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.communicationGaps > 0 && (
                          <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                            Comm. gap
                          </Badge>
                        )}
                        {s.interventionDelays > 0 && (
                          <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                            Intervention delay
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString("en-KE", {
                                day: "numeric",
                                month: "short",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QI Prompt */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Suggested next action</p>
                  {topGaps.length > 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      Your most reported gap is{" "}
                      <strong>"{gapLabel(topGaps[0].gap)}"</strong> — reported in{" "}
                      {Math.round((topGaps[0].count / totalSubmissions) * 100)}% of stories.
                      Convene a brief team huddle to identify the root cause and assign an owner.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Review the gap data above and identify the single highest-frequency issue to
                      address in your next team meeting.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
