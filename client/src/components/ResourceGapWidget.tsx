/**
 * ResourceGapWidget
 *
 * Surfaces real-world resource gap trends from ResusGPS sessions.
 * Data source: `resus_resource_gap` analytics events aggregated by the
 * `careSignalEvents.getResourceGapTrends` tRPC endpoint.
 *
 * Used on:
 *  - CareSignal page (provider view)
 *  - HospitalAdminDashboard (institutional admin view)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, PackageX, RefreshCcw } from "lucide-react";

type Timeframe = "week" | "month" | "quarter" | "year";

interface ResourceGapWidgetProps {
  /** Optional title override */
  title?: string;
  /** Optional description override */
  description?: string;
  /** Max items to display (default 8) */
  limit?: number;
  /** Whether to show the timeframe selector (default true) */
  showTimeframeSelector?: boolean;
  /** Compact mode: hides description and uses smaller padding */
  compact?: boolean;
}

export function ResourceGapWidget({
  title = "Resource Gap Trends",
  description = "Most frequently unavailable interventions captured from ResusGPS sessions",
  limit = 8,
  showTimeframeSelector = true,
  compact = false,
}: ResourceGapWidgetProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");

  const { data, isLoading, isError, refetch } = trpc.careSignalEvents.getResourceGapTrends.useQuery(
    { timeframe, limit },
    {
      staleTime: 5 * 60_000, // 5 min
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const gaps = data?.gaps ?? [];
  const totalEvents = data?.totalEvents ?? 0;
  const maxCount = gaps.length > 0 ? gaps[0].count : 1;

  // Severity colour based on relative frequency
  const severityColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.7) return "bg-red-500";
    if (ratio >= 0.4) return "bg-amber-400";
    return "bg-emerald-400";
  };

  const severityBadge = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.7) return "destructive" as const;
    if (ratio >= 0.4) return "secondary" as const;
    return "outline" as const;
  };

  const timeframeLabel: Record<Timeframe, string> = {
    week: "Last 7 days",
    month: "Last 30 days",
    quarter: "Last 90 days",
    year: "Last year",
  };

  return (
    <Card className={compact ? "shadow-none border-muted" : undefined}>
      <CardHeader className={compact ? "pb-2 pt-3 px-4" : "pb-3"}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : "text-base"}`}>
              <PackageX className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-amber-600`} />
              {title}
            </CardTitle>
            {!compact && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showTimeframeSelector && (
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                <SelectTrigger className="h-7 text-xs w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">7 days</SelectItem>
                  <SelectItem value="month">30 days</SelectItem>
                  <SelectItem value="quarter">90 days</SelectItem>
                  <SelectItem value="year">1 year</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? "px-4 pb-3" : undefined}>
        {isError ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Could not load resource gap data.</span>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : gaps.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No resource gaps recorded in {timeframeLabel[timeframe].toLowerCase()}.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Gaps are captured automatically when providers mark an intervention as "Not Available" in ResusGPS.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary line */}
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{totalEvents}</span> gap event{totalEvents !== 1 ? "s" : ""} recorded
              {" · "}{timeframeLabel[timeframe].toLowerCase()}
            </p>

            {/* Bar chart rows */}
            <ul className="space-y-2">
              {gaps.map(({ intervention, count }, idx) => (
                <li key={intervention} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">
                        {idx + 1}.
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {intervention}
                      </span>
                    </div>
                    <Badge variant={severityBadge(count)} className="text-xs shrink-0">
                      {count}×
                    </Badge>
                  </div>
                  {/* Relative frequency bar */}
                  <div className="ml-5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${severityColor(count)}`}
                      style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {/* Legend */}
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />High frequency
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />Low
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
