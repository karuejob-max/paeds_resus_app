import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Download,
  ArrowRight,
  FileText,
  Activity,
  ShieldAlert,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// ─── helpers ────────────────────────────────────────────────────────────────

const OUTCOME_STYLE: Record<string, string> = {
  survived: "bg-blue-100 text-blue-700",
  neurologically_intact: "bg-green-100 text-green-700",
  poor_outcome: "bg-red-100 text-red-700",
  died: "bg-red-200 text-red-900",
  unknown: "bg-slate-100 text-slate-600",
};

const GAP_COLORS: Record<string, string> = {
  "Training Gap": "bg-blue-600",
  "Equipment Gap": "bg-orange-500",
  "Communication Gap": "bg-purple-500",
  "Protocol Gap": "bg-teal-500",
  "Staffing Gap": "bg-rose-500",
  "Medication Gap": "bg-amber-500",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-blue-100 text-blue-800",
};

function StatCard({
  label,
  value,
  sub,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        )}
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function CareSignalAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();

  // ── live data — shapes match the backend exactly ──
  const statsQ = trpc.careSignalEvents.getEventStats.useQuery();
  const historyQ = trpc.careSignalEvents.getEventHistory.useQuery({
    limit: 20,
    offset: 0,
  });
  const gapQ = trpc.careSignalEvents.getGapAnalysis.useQuery({ timeframe: "month" });

  const stats = statsQ.data;
  const history = historyQ.data?.events ?? [];
  const gaps = gapQ.data?.gaps ?? [];

  // Derive outcome distribution from history (since getEventStats doesn't return byOutcome)
  const outcomeCounts: Record<string, number> = {};
  for (const e of history) {
    if (e.outcome) outcomeCounts[e.outcome] = (outcomeCounts[e.outcome] ?? 0) + 1;
  }
  const outcomeDistribution = Object.entries(outcomeCounts).map(([rawLabel, count]) => ({
    rawLabel,
    label: rawLabel.replace(/_/g, " "),
    count,
  }));
  const historyTotal = historyQ.data?.total ?? 0;

  const totalEvents = stats?.totalEvents ?? 0;
  const neurointactPct =
    totalEvents > 0
      ? Math.round(((stats?.successfulOutcomes ?? 0) / totalEvents) * 100)
      : 0;

  // Derive recommendations from most common gap in stats
  const mostCommonGap = stats?.mostCommonGap ?? "";
  const hasGapData = mostCommonGap && mostCommonGap !== "N/A";

  // ── export handler ──
  const handleExport = () => {
    const rows = history.map((e) => ({
      date: new Date(e.eventDate).toLocaleDateString(),
      type: e.eventType,
      outcome: e.outcome,
      gaps: Array.isArray(e.systemGaps) ? e.systemGaps.join("; ") : "",
    }));
    const csv = [
      "Date,Event Type,Outcome,System Gaps",
      ...rows.map((r) => `${r.date},${r.type},${r.outcome},"${r.gaps}"`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `care-signal-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Care Signal Analytics</h1>
            <p className="text-lg text-slate-600">
              Incident analysis and system gap identification for continuous quality improvement
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setLocation("/care-signal")}
          >
            <FileText className="w-4 h-4" />
            Report an Incident
          </Button>
        </div>

        {/* Error state */}
        {statsQ.error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Could not load analytics data. Please refresh or try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total Events"
            value={totalEvents}
            sub="All time"
            color="text-blue-600"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Successful Outcomes"
            value={`${neurointactPct}%`}
            sub="Survived or neurointact"
            color="text-green-600"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="This Month"
            value={stats?.thisMonthCount ?? 0}
            sub="Events submitted"
            color="text-purple-600"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Streak"
            value={`${stats?.streakMonths ?? 0} mo`}
            sub="Consecutive months reporting"
            color="text-orange-600"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Gap Types"
            value={gaps.length}
            sub="Distinct categories"
            color="text-teal-600"
            loading={gapQ.isLoading}
          />
        </div>

        {/* Empty state */}
        {!statsQ.isLoading && totalEvents === 0 && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6 flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">No events submitted yet</p>
                <p className="text-sm text-blue-700">
                  Start reporting incidents and near-misses to see analytics here. Every
                  submission builds the safety signal that drives quality improvement.
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setLocation("/care-signal")}
                >
                  Submit your first event
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="incidents">My Events</TabsTrigger>
            <TabsTrigger value="recommendations">Insights</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Outcome Distribution
                </CardTitle>
                <CardDescription>
                  Based on your {historyTotal} submitted event{historyTotal !== 1 ? "s" : ""} (most recent 20 shown)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyQ.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : outcomeDistribution.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No outcome data yet. Submit events to see distribution.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {outcomeDistribution.map((o) => (
                      <div key={o.rawLabel}>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm capitalize">{o.label}</span>
                          <span className="text-sm font-bold">
                            {o.count} (
                            {history.length > 0
                              ? Math.round((o.count / history.length) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              o.rawLabel === "neurologically_intact"
                                ? "bg-green-500"
                                : o.rawLabel === "survived"
                                ? "bg-blue-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${
                                history.length > 0
                                  ? (o.count / history.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary stats card */}
            {stats && totalEvents > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Your Reporting Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.avgChildAge} mo</p>
                    <p className="text-sm text-slate-500 mt-1">Avg child age</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 capitalize">
                      {stats.mostCommonEventType !== "N/A"
                        ? stats.mostCommonEventType.replace(/_/g, " ")
                        : "—"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Most common event</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.lastMonthCount}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Last month submissions</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Gap Analysis Tab ── */}
          <TabsContent value="gaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  System Gaps by Category
                </CardTitle>
                <CardDescription>
                  Derived from system gaps you reported in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gapQ.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : gaps.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No gap data yet. Report incidents with system gaps to populate this view.
                  </p>
                ) : (
                  (gaps as { category: string; count: number; percentage: number }[]).map((gap) => (
                    <div key={gap.category}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{gap.category}</span>
                        <span className="text-sm font-bold">
                          {gap.count} ({gap.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            GAP_COLORS[gap.category] ?? "bg-blue-600"
                          }`}
                          style={{ width: `${gap.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Gap category legend */}
            <Card>
              <CardHeader>
                <CardTitle>Gap Categories Explained</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Training Gap",
                    color: "border-blue-500",
                    desc: "Staff lack knowledge or skills in specific clinical areas",
                  },
                  {
                    label: "Equipment Gap",
                    color: "border-orange-500",
                    desc: "Inadequate or missing equipment during the emergency",
                  },
                  {
                    label: "Medication Gap",
                    color: "border-amber-500",
                    desc: "Required medications unavailable or incorrectly dosed",
                  },
                  {
                    label: "Communication Gap",
                    color: "border-purple-500",
                    desc: "Poor information flow between team members or departments",
                  },
                  {
                    label: "Protocol Gap",
                    color: "border-teal-500",
                    desc: "Unclear or absent protocols guiding the response",
                  },
                  {
                    label: "Staffing Gap",
                    color: "border-rose-500",
                    desc: "Insufficient staff available during the emergency",
                  },
                ].map((g) => (
                  <div key={g.label} className={`border-l-4 ${g.color} pl-4`}>
                    <p className="font-medium">{g.label}</p>
                    <p className="text-sm text-slate-600">{g.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── My Events Tab ── */}
          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Your Submitted Events
                </CardTitle>
                <CardDescription>
                  Your personal Care Signal history — confidential
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyQ.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 mb-4">
                      You have not submitted any events yet.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setLocation("/care-signal")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Report your first incident
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((event) => {
                      const gaps: string[] = Array.isArray(event.systemGaps)
                        ? event.systemGaps
                        : [];
                      return (
                        <div
                          key={event.id}
                          className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-900 capitalize">
                                {event.eventType.replace(/_/g, " ")}
                              </h4>
                              <p className="text-xs text-slate-500">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(event.eventDate).toLocaleDateString("en-KE", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <Badge
                              className={
                                OUTCOME_STYLE[event.outcome] ?? "bg-slate-100 text-slate-600"
                              }
                            >
                              {event.outcome.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          {gaps.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {gaps.map((g: string, i: number) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs border-slate-300"
                                >
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={
                                event.status === "reviewed"
                                  ? "border-green-300 text-green-700"
                                  : "border-slate-300 text-slate-500"
                              }
                            >
                              {event.status}
                            </Badge>
                            {event.isAnonymous && (
                              <span className="text-xs text-slate-400">Anonymous</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Insights Tab ── */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Personalised Insights
                </CardTitle>
                <CardDescription>
                  Based on your submission history and reported gaps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsQ.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : totalEvents === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 mb-2">No insights yet.</p>
                    <p className="text-sm text-slate-400">
                      Submit events with system gaps to receive personalised insights.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Streak insight */}
                    {(stats?.streakMonths ?? 0) > 0 && (
                      <div className="border rounded-lg p-4 border-green-200 bg-green-50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-green-900">Reporting Streak</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                            POSITIVE
                          </span>
                        </div>
                        <p className="text-sm text-green-800">
                          You have reported for {stats?.streakMonths} consecutive month
                          {(stats?.streakMonths ?? 0) !== 1 ? "s" : ""}. Consistent reporting
                          is the foundation of quality improvement. Keep it going.
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium text-green-600 mt-2">
                          <ArrowRight className="w-3 h-3" />
                          Aim for at least 1 submission every month to maintain your Fellowship Pillar C streak.
                        </div>
                      </div>
                    )}

                    {/* Most common gap insight */}
                    {hasGapData && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">
                            Most Reported Gap: {mostCommonGap}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                            MEDIUM
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">
                          You have consistently reported {mostCommonGap.toLowerCase()} as a
                          system gap. This pattern suggests a systemic issue at your facility
                          that warrants escalation to your quality improvement team.
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-2">
                          <ArrowRight className="w-3 h-3" />
                          Document this gap in your facility QI log and request a root cause analysis.
                        </div>
                      </div>
                    )}

                    {/* Outcome insight */}
                    {totalEvents >= 3 && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">Outcome Pattern</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                            INFO
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">
                          {neurointactPct >= 50
                            ? `${neurointactPct}% of your reported cases had successful outcomes. Your facility is performing at or above expected levels for neurologically intact survival.`
                            : `${neurointactPct}% of your reported cases had successful outcomes. This is below the target threshold. Consider reviewing your chain-of-survival compliance and CPR quality metrics.`}
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-2">
                          <ArrowRight className="w-3 h-3" />
                          {neurointactPct >= 50
                            ? "Share your practices with peers through the Fellowship programme."
                            : "Review your ResusGPS sessions for patterns in missed chain-of-survival steps."}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle>Export Your Data</CardTitle>
                <CardDescription>
                  Download your personal event history as CSV for your records or QI work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
                  onClick={handleExport}
                  disabled={history.length === 0}
                >
                  <Download className="w-4 h-4" />
                  {history.length === 0
                    ? "No data to export yet"
                    : `Export ${history.length} event${history.length !== 1 ? "s" : ""} as CSV`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
