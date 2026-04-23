/**
 * SafeTruthPanel — Hospital Admin QI Dashboard
 *
 * Surfaces the full parent-reported journey:
 *   1. Pre-hospital delays (decision, transport, ambulance, referral chain)
 *   2. In-hospital system gaps (registration, equipment, communication, etc.)
 *   3. Outcome breakdown and recent submissions table
 *
 * Data source: parentSafeTruth.getHospitalSafeTruthSummary
 */
import { useState } from "react";
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
  MapPin,
  Ambulance,
  Building2,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SafeTruthPanelProps {
  hospitalId: number;
}

// ─── Label Maps ──────────────────────────────────────────────────────────────

const GAP_LABELS: Record<string, string> = {
  communication: "Communication gaps",
  equipment: "Missing equipment / supplies",
  oxygen: "Oxygen unavailable",
  staffing: "Insufficient staffing",
  training: "Staff unsure of next steps",
  protocols: "Unclear protocols",
  billing: "Billing / payment barrier",
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

const TRANSPORT_LABELS: Record<string, string> = {
  "personal-vehicle": "Personal Vehicle",
  matatu: "Matatu / Minibus",
  "motorcycle-boda": "Motorcycle (Boda)",
  ambulance: "Ambulance",
  walking: "Walked",
  other: "Other",
};

const DECISION_DELAY_LABELS: Record<string, string> = {
  immediate: "Immediate (< 30 min)",
  "under-1h": "Under 1 hour",
  "1-6h": "1 – 6 hours",
  "6-24h": "6 – 24 hours",
  "over-24h": "Over 24 hours",
};

const REFERRAL_REASON_LABELS: Record<string, string> = {
  "no-equipment": "No Equipment",
  "no-specialist": "No Specialist",
  "no-blood": "No Blood",
  "no-icu": "No ICU / HDU",
  "no-oxygen": "No Oxygen",
  "no-drugs": "No Drugs",
  "capacity-full": "Facility Full",
  other: "Other",
};

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

// ─── Mini horizontal bar ─────────────────────────────────────────────────────

function MiniBar({
  label,
  count,
  total,
  color = "bg-red-500",
  index,
}: {
  label: string;
  count: number;
  total: number;
  color?: string;
  index?: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isHigh = pct >= 40;
  const isMed = pct >= 20 && pct < 40;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="text-muted-foreground font-mono text-xs w-5">{index + 1}.</span>
          )}
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{count}</span>
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
      <div className={`w-full bg-muted rounded-full h-1.5 ${index !== undefined ? "ml-7" : ""}`}>
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SafeTruthPanel({ hospitalId }: SafeTruthPanelProps) {
  const [months, setMonths] = useState(3);

  const { data, isLoading, error, refetch } =
    trpc.parentSafeTruth.getHospitalSafeTruthSummary.useQuery(
      { hospitalId, months },
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
  const ph = (data as any)?.preHospital ?? null;
  const totalOutcomes = Object.values(outcomes).reduce((a: number, b) => a + (b as number), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Safe Truth — Parent Journey Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Full journey data from parents: symptom onset → home decision → transport → prior
            facilities → your facility → outcome.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="text-sm border border-border rounded px-2 py-1 bg-background"
          >
            <option value={1}>Last 1 month</option>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded border border-border hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {totalSubmissions === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-medium text-muted-foreground">No submissions yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When parents complete the Safe Truth journey form and link it to your facility, the
              aggregated patterns will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Top KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <p className="text-xs text-muted-foreground">Avg in-hospital time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p
                      className={`text-2xl font-bold ${
                        ph?.avgPreHospitalDelayMinutes != null &&
                        ph.avgPreHospitalDelayMinutes > 120
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {ph?.avgPreHospitalDelayMinutes != null
                        ? `${ph.avgPreHospitalDelayMinutes}m`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg pre-hospital delay</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      ph?.priorFacilityRate > 40 ? "bg-orange-100" : "bg-green-100"
                    }`}
                  >
                    <Building2
                      className={`w-5 h-5 ${
                        ph?.priorFacilityRate > 40 ? "text-orange-600" : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-2xl font-bold ${
                        ph?.priorFacilityRate > 40 ? "text-orange-600" : ""
                      }`}
                    >
                      {ph?.priorFacilityRate != null ? `${ph.priorFacilityRate}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Came via referral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Outcome Breakdown ── */}
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
                    <span className="font-bold">{count as number}</span>
                    {totalOutcomes > 0 && (
                      <span className="text-xs opacity-70">
                        ({Math.round(((count as number) / totalOutcomes) * 100)}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════════════════════════
              PRE-HOSPITAL JOURNEY
          ════════════════════════════════════════════════════════════════ */}
          <SectionDivider label="Pre-Hospital Journey" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Decision Delay */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Time Before Seeking Care
                </CardTitle>
                <CardDescription className="text-xs">
                  How long after symptoms did the family decide to come?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!ph?.decisionDelayBreakdown?.length ? (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                ) : (
                  ph.decisionDelayBreakdown.map(
                    ({ band, count }: { band: string; count: number }) => (
                      <MiniBar
                        key={band}
                        label={DECISION_DELAY_LABELS[band] ?? band}
                        count={count}
                        total={totalSubmissions}
                        color={
                          band === "over-24h" || band === "6-24h"
                            ? "bg-red-500"
                            : band === "1-6h"
                            ? "bg-orange-400"
                            : "bg-green-500"
                        }
                      />
                    )
                  )
                )}
              </CardContent>
            </Card>

            {/* Transport Mode */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  Transport Mode
                </CardTitle>
                <CardDescription className="text-xs">
                  How did the child get to this facility?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!ph?.transportBreakdown?.length ? (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                ) : (
                  ph.transportBreakdown.map(
                    ({ mode, count }: { mode: string; count: number }) => (
                      <MiniBar
                        key={mode}
                        label={TRANSPORT_LABELS[mode] ?? mode}
                        count={count}
                        total={totalSubmissions}
                        color="bg-blue-500"
                      />
                    )
                  )
                )}
              </CardContent>
            </Card>

            {/* Ambulance Response */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-red-500" />
                  Ambulance Response
                </CardTitle>
                <CardDescription className="text-xs">
                  Of cases where an ambulance was called
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!ph?.ambulanceCalledCount ? (
                  <p className="text-xs text-muted-foreground">No ambulance calls reported</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ambulance called</span>
                      <span className="font-semibold">{ph.ambulanceCalledCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600 font-medium">Ambulance never arrived</span>
                      <span className="font-bold text-red-600">{ph.ambulanceNeverCameCount}</span>
                    </div>
                    {ph.ambulanceCalledCount > 0 && (
                      <div className="mt-2 p-2 rounded bg-red-50 border border-red-100">
                        <p className="text-xs text-red-700">
                          <strong>
                            {Math.round(
                              (ph.ambulanceNeverCameCount / ph.ambulanceCalledCount) * 100
                            )}
                            %
                          </strong>{" "}
                          of ambulance calls resulted in no response.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral Chain */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  Why Were They Referred Here?
                </CardTitle>
                <CardDescription className="text-xs">
                  Reason given at the prior facility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!ph?.referralReasonBreakdown?.length ? (
                  <p className="text-xs text-muted-foreground">No referral data yet</p>
                ) : (
                  ph.referralReasonBreakdown.map(
                    ({ reason, count }: { reason: string; count: number }) => (
                      <MiniBar
                        key={reason}
                        label={REFERRAL_REASON_LABELS[reason] ?? reason}
                        count={count}
                        total={totalSubmissions}
                        color="bg-purple-500"
                      />
                    )
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              IN-HOSPITAL GAPS
          ════════════════════════════════════════════════════════════════ */}
          <SectionDivider label="In-Hospital System Gaps" />

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
                  {topGaps.map(({ gap, count }: { gap: string; count: number }, index: number) => (
                    <MiniBar
                      key={gap}
                      label={GAP_LABELS[gap] ?? gap}
                      count={count}
                      total={totalSubmissions}
                      color={
                        (totalSubmissions > 0 ? count / totalSubmissions : 0) >= 0.4
                          ? "bg-red-500"
                          : (totalSubmissions > 0 ? count / totalSubmissions : 0) >= 0.2
                          ? "bg-orange-400"
                          : "bg-primary/50"
                      }
                      index={index}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════════════════════════════
              RECENT SUBMISSIONS TABLE
          ════════════════════════════════════════════════════════════════ */}
          <SectionDivider label="Recent Submissions" />

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
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          Date
                        </th>
                        <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          Outcome
                        </th>
                        <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          Pre-Hospital Delay
                        </th>
                        <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          Transport
                        </th>
                        <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          Prior Facility
                        </th>
                        <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">
                          In-Hospital
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentSubmissions.map((s: any) => (
                        <tr key={s.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                            {s.createdAt
                              ? new Date(s.createdAt).toLocaleDateString("en-KE", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                OUTCOME_COLORS[s.childOutcome] ??
                                "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {OUTCOME_LABELS[s.childOutcome] ?? s.childOutcome}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {s.preHospitalDelayMinutes != null
                              ? `${s.preHospitalDelayMinutes} min`
                              : s.decisionDelayBand
                              ? DECISION_DELAY_LABELS[s.decisionDelayBand] ?? s.decisionDelayBand
                              : "—"}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {s.transportMode
                              ? TRANSPORT_LABELS[s.transportMode] ?? s.transportMode
                              : "—"}
                          </td>
                          <td className="px-4 py-2">
                            {s.priorFacilityVisit ? (
                              <Badge
                                variant="outline"
                                className="text-xs border-orange-200 text-orange-700 bg-orange-50"
                              >
                                {s.referralReason
                                  ? REFERRAL_REASON_LABELS[s.referralReason] ?? s.referralReason
                                  : "Yes"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Direct</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {s.totalDurationMinutes != null
                              ? `${s.totalDurationMinutes} min`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── QI Suggested Action ── */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Suggested next action</p>
                  {topGaps.length > 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      Your most reported in-hospital gap is{" "}
                      <strong>"{GAP_LABELS[topGaps[0].gap] ?? topGaps[0].gap}"</strong> — reported
                      in{" "}
                      {Math.round((topGaps[0].count / totalSubmissions) * 100)}% of stories.
                      {ph?.priorFacilityRate > 40 && (
                        <>
                          {" "}
                          Additionally, <strong>{ph.priorFacilityRate}%</strong> of children
                          arrived via referral — review your referral network capacity.
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Review the pre-hospital and gap data above. Identify the single
                      highest-frequency issue and assign an owner in your next team meeting.
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
