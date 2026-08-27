import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  Minus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type Period = "week" | "month" | "quarter" | "year";
type Direction = "up" | "down" | "stable";

type ComparisonMetric = {
  key: string;
  label: string;
  unit: string;
  current: number;
  previous: number;
  delta: number;
  percentage: number | null;
  direction: Direction;
  dataQuality: "complete" | "email_match" | "point_in_time";
  lowerIsBetter: boolean;
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

const DATA_QUALITY_LABELS = {
  complete: "Direct platform record",
  email_match: "Attendance matched by account email",
  point_in_time: "Point-in-time certificate record",
} as const;

function formatMetricValue(metric: ComparisonMetric, value: number): string {
  if (metric.unit === "points") return `${value.toFixed(1)} pts`;
  return `${value} ${metric.unit}`;
}

function metricIsImproving(metric: ComparisonMetric): boolean | null {
  if (metric.direction === "stable") return null;
  return metric.lowerIsBetter
    ? metric.direction === "down"
    : metric.direction === "up";
}

function formatChange(metric: ComparisonMetric): string {
  if (metric.delta === 0) return "No change";
  const sign = metric.delta > 0 ? "+" : "";
  const percentage =
    metric.percentage == null
      ? ""
      : ` (${sign}${metric.percentage.toFixed(0)}%)`;
  return `${sign}${metric.delta.toFixed(metric.unit === "points" ? 1 : 0)}${percentage}`;
}

function DirectionIcon({ metric }: { metric: ComparisonMetric }) {
  const improving = metricIsImproving(metric);
  if (improving === null)
    return <Minus className="h-4 w-4 text-slate-500" aria-hidden="true" />;
  return improving ? (
    <ArrowUpRight className="h-4 w-4 text-emerald-600" aria-hidden="true" />
  ) : (
    <ArrowDownRight className="h-4 w-4 text-amber-600" aria-hidden="true" />
  );
}

function MetricCard({ metric }: { metric: ComparisonMetric }) {
  const improving = metricIsImproving(metric);
  const statusClass =
    improving === true
      ? "border-emerald-200 bg-emerald-50/50"
      : improving === false
        ? "border-amber-200 bg-amber-50/50"
        : "border-border bg-card";

  return (
    <Card className={statusClass}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium text-foreground">
            {metric.label}
          </CardTitle>
          <DirectionIcon metric={metric} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatMetricValue(metric, metric.current)}
            </p>
            <p className="text-xs text-muted-foreground">Current period</p>
          </div>
          <Badge
            variant="outline"
            className={
              improving === true
                ? "border-emerald-300 text-emerald-700"
                : improving === false
                  ? "border-amber-300 text-amber-700"
                  : ""
            }
          >
            {improving === true
              ? "Improving"
              : improving === false
                ? "Needs attention"
                : "Stable"}
          </Badge>
        </div>
        <div className="flex items-center justify-between border-t border-border/70 pt-2 text-xs">
          <span className="text-muted-foreground">Previous period</span>
          <span className="font-medium text-foreground">
            {formatMetricValue(metric, metric.previous)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Change</span>
          <span className="font-semibold text-foreground">
            {formatChange(metric)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {DATA_QUALITY_LABELS[metric.dataQuality]}
        </p>
      </CardContent>
    </Card>
  );
}

export function PerformanceDashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("month");
  const comparisonQuery = trpc.performance.getMySelfComparison.useQuery(
    { period },
    { enabled: !!user?.id }
  );
  const recentEventsQuery = trpc.performance.getRecentEvents.useQuery(
    { userId: user?.id, limit: 8 },
    { enabled: !!user?.id }
  );

  const comparison = comparisonQuery.data;
  const metrics = (comparison?.metrics ?? []) as ComparisonMetric[];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <BarChart3 className="h-4 w-4" />
                Private professional growth
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                My progress
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                See how your activity is changing compared with your own
                previous period. This view never ranks you against colleagues.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void comparisonQuery.refetch();
                void recentEventsQuery.refetch();
              }}
              disabled={
                comparisonQuery.isFetching || recentEventsQuery.isFetching
              }
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${comparisonQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div
            className="mt-6 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Comparison period"
          >
            {PERIODS.map(option => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  period === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {comparisonQuery.isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your progress comparison…
            </CardContent>
          </Card>
        ) : comparisonQuery.error ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-medium text-amber-900">
                  Your progress is temporarily unavailable
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  No performance conclusion is drawn when the underlying records
                  cannot be loaded. Try refreshing again shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !comparison ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No comparison data is available yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {comparison.window.isPartial
                        ? "Period to date"
                        : "Completed period"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {comparison.window.currentLabel}
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Compared with
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {comparison.window.previousLabel}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map(metric => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent personal activity
                  </CardTitle>
                  <CardDescription>
                    Events recorded against your account. These are evidence of
                    activity, not a clinical ranking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentEventsQuery.isLoading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      recent activity…
                    </div>
                  ) : recentEventsQuery.data &&
                    recentEventsQuery.data.length > 0 ? (
                    <div className="space-y-3">
                      {recentEventsQuery.data.map((event: any) => (
                        <div
                          key={event.id}
                          className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {String(event.eventType).replaceAll("_", " ")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {event.severity ? (
                            <Badge variant="outline">{event.severity}</Badge>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-sm text-muted-foreground">
                      No recent personal events are recorded yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> How to read this
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {comparison.notes.map((note: string) => (
                    <p key={note} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {note}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/30">
              <CardContent className="flex items-start gap-3 py-5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700 dark:text-slate-300" />
                <div>
                  <p className="font-medium text-foreground">
                    Private by design
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This page compares you with your own previous activity.
                    Institution support analytics, where authorized, live in the
                    Institutional Portal and do not appear here as named peer
                    rankings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
