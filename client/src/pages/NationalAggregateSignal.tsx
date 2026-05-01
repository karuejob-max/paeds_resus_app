/**
 * NationalAggregateSignal — National Paediatric Emergency Surveillance Dashboard
 *
 * This is the MOH-facing view of the Care Signal data spine.
 * It aggregates anonymised provider reports across all facilities and regions
 * to produce a national picture of paediatric emergency patterns, system gaps,
 * and provider engagement.
 *
 * Access: Admin-only (platform admin role).
 *
 * This page is the first step toward WHO/CDC/Harvard benchmarking capability.
 * It is designed to be exportable as a PDF or CSV for Ministry of Health reporting.
 *
 * PSOT Reference: §20 (Global Vision), §21 (Care Signal Strategy)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Globe, Users, AlertTriangle, TrendingUp, Download, Building2,
  Activity, ShieldAlert, FileBarChart, Loader2,
} from "lucide-react";

const OUTCOME_COLORS: Record<string, string> = {
  survived: "#22c55e",
  survived_with_disability: "#f59e0b",
  died: "#ef4444",
  transferred: "#3b82f6",
  unknown: "#94a3b8",
};

const GAP_LABELS: Record<string, string> = {
  no_defibrillator: "No Defibrillator",
  no_epinephrine: "No Epinephrine",
  no_iv_access: "No IV Access",
  delayed_recognition: "Delayed Recognition",
  no_oxygen: "No Oxygen",
  no_bag_mask: "No Bag-Mask",
  no_suction: "No Suction",
  inadequate_staffing: "Inadequate Staffing",
  no_blood_products: "No Blood Products",
  no_monitoring: "No Monitoring",
  communication_failure: "Communication Failure",
  delayed_transport: "Delayed Transport",
  other: "Other",
};

type Timeframe = "7d" | "30d" | "90d" | "365d";

export default function NationalAggregateSignal() {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  const { data: metrics, isLoading } = trpc.careSignalEvents.getAdminMetrics.useQuery(
    { timeframe },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: eventsUnderReview } = trpc.careSignalEvents.getEventsUnderReview.useQuery(
    { limit: 5, offset: 0 },
    { staleTime: 60_000 }
  );

  const outcomeData = metrics
    ? Object.entries(metrics.outcomeBreakdown).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
        fill: OUTCOME_COLORS[name] ?? "#94a3b8",
      }))
    : [];

  const gapData = metrics
    ? Object.entries(metrics.gapBreakdown)
        .map(([key, count]) => ({ name: GAP_LABELS[key] ?? key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  const facilityData = metrics?.topFacilities ?? [];

  const survivalRate =
    metrics && metrics.totalSubmissions > 0
      ? Math.round(
          ((Number(metrics.outcomeBreakdown["survived"] ?? 0)) /
            Number(metrics.totalSubmissions)) *
            100
        )
      : null;

  const handleExportCSV = () => {
    if (!metrics) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Submissions", metrics.totalSubmissions],
      ["Submissions This Month", metrics.submissionsThisMonth],
      ["Unique Providers", metrics.uniqueProviders],
      ["Under Review", metrics.underReviewCount],
      ["Survival Rate (%)", survivalRate ?? "N/A"],
      ["", ""],
      ["Outcome", "Count"],
      ...Object.entries(metrics.outcomeBreakdown).map(([k, v]) => [k, v]),
      ["", ""],
      ["System Gap", "Reports"],
      ...Object.entries(metrics.gapBreakdown).map(([k, v]) => [GAP_LABELS[k] ?? k, v]),
      ["", ""],
      ["Facility", "Submissions"],
      ...metrics.topFacilities.map((f) => [f.facilityName, f.count]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `care-signal-national-${timeframe}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b bg-card px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">National Paediatric Emergency Signal</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Anonymised, provider-sourced surveillance of paediatric emergency patterns across
                Kenya. This data is collected in real time from frontline providers — it is not
                retrospective audit data.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!metrics}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !metrics ? (
          <div className="text-center py-20 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Unable to load national metrics. Check your connection and try again.</p>
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileBarChart className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Reports</span>
                  </div>
                  <p className="text-3xl font-bold">{metrics.totalSubmissions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.submissionsThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Active Providers</span>
                  </div>
                  <p className="text-3xl font-bold">{metrics.uniqueProviders.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">reporting in this period</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Survival Rate</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {survivalRate !== null ? `${survivalRate}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">of reported cases</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Under Review</span>
                  </div>
                  <p className="text-3xl font-bold">{metrics.underReviewCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">awaiting institutional review</p>
                </CardContent>
              </Card>
            </div>

            {/* Outcome Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Outcome Distribution</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Reported outcomes across all paediatric emergency cases in this period.
                  </p>
                </CardHeader>
                <CardContent>
                  {outcomeData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                      No outcome data yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={outcomeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {outcomeData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} cases`, ""]} />
                        <Legend
                          formatter={(value) => (
                            <span className="text-xs capitalize">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top System Gaps */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top System Gaps Reported</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Resources and system failures most frequently cited by providers.
                    This is the data that drives procurement and policy decisions.
                  </p>
                </CardHeader>
                <CardContent>
                  {gapData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                      No gap data yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={gapData} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={130}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Reporting Facilities */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Top Reporting Facilities</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Facilities with the highest Care Signal submission volume. High volume indicates
                  strong QI culture; low volume from known high-acuity facilities may indicate
                  under-reporting.
                </p>
              </CardHeader>
              <CardContent>
                {facilityData.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    Facility-level data will appear here once providers include facility information
                    in their reports.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {facilityData.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                          <span className="text-sm font-medium">{f.facilityName}</span>
                        </div>
                        <Badge variant="secondary">{f.count} reports</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Under Review Queue Preview */}
            {eventsUnderReview && eventsUnderReview.events.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-base">Recent Events Under Review</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = "/admin/care-signal-review"}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {eventsUnderReview.events.slice(0, 3).map((e) => (
                      <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {(e.eventType ?? "unknown").replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-KE", {
                              day: "numeric", month: "short", year: "numeric"
                            }) : "Unknown date"}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                          Under Review
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Methodology Note */}
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-1">About this data</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All data is anonymised at source. No patient identifiers are stored or transmitted.
                      Reports are submitted voluntarily by registered providers within 24 hours of a
                      paediatric emergency event. This is provider-reported surveillance data — it
                      reflects events that providers chose to report, not a complete census of all
                      paediatric emergencies. Outcome data should be interpreted in the context of
                      case mix and reporting completeness at each facility.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      For MOH reporting, WHO benchmarking, or academic research access, contact the
                      Paeds Resus platform administrator to request a formal data export.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
