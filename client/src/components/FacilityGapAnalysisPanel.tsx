import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp } from "lucide-react";

const GAP_PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-900 border-red-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-blue-100 text-blue-900 border-blue-200",
};

/**
 * Gap-analysis #5: facility-level rollup of Care Signal gaps, the
 * institutional counterpart to an individual provider's own gap analysis.
 * Extracted from client/src/pages/InstitutionalPortal.tsx (2026-08-08) --
 * that page is not routed anywhere, so this had zero reachable UI despite
 * the backend (institution.getFacilityGapAnalysis) being fully built.
 */
export function FacilityGapAnalysisPanel({ institutionId }: { institutionId: number }) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter" | "year">("month");
  const q = trpc.institution.getFacilityGapAnalysis.useQuery({ institutionId, timeframe });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Care Signal Gaps — your facility
          </h3>
          <p className="text-sm text-slate-500">
            Aggregated across every provider reporting at your registered facility, not just one individual.
          </p>
        </div>
        <div className="flex gap-1">
          {(["week", "month", "quarter", "year"] as const).map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? "default" : "outline"}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading…</div>
      ) : q.data?.suppressed ? (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600">
              {q.data.totalEvents} event{q.data.totalEvents === 1 ? "" : "s"} reported this {timeframe}.
            </p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{q.data.suppressionReason}</p>
          </CardContent>
        </Card>
      ) : !q.data || q.data.totalEvents === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No Care Signal events reported at your facility yet this {timeframe}.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{q.data.totalEvents}</p>
              <p className="text-xs text-slate-500">Total events</p>
            </CardContent></Card>
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{q.data.uniqueReporters}</p>
              <p className="text-xs text-slate-500">Reporting providers</p>
            </CardContent></Card>
            {q.data.byFacility.length > 1 && (
              <Card><CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{q.data.byFacility.length}</p>
                <p className="text-xs text-slate-500">Facilities reporting</p>
              </CardContent></Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Gap categories</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {q.data.gaps.map((g) => (
                <div key={g.category} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                  <span>{g.category}</span>
                  <span className="text-slate-500">{g.count} ({g.percentage}%)</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {q.data.byFacility.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">By facility</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.byFacility.map((f) => (
                  <div key={f.facilityId} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                    <span>{f.facilityName}</span>
                    <span className="text-slate-500">{f.eventCount} events</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {q.data.recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recommended actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.recommendations.map((r, i) => (
                  <div key={i} className={`rounded-lg border p-3 text-sm ${GAP_PRIORITY_BADGE[r.priority]}`}>
                    <p className="font-medium text-xs mb-1">{r.gap}</p>
                    <p className="text-xs leading-relaxed">{r.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
