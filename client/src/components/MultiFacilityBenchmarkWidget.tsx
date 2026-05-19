/**
 * MultiFacilityBenchmarkWidget
 *
 * Phase 5.4 — Anonymised multi-facility resource gap benchmarking.
 *
 * Shows:
 *   - Platform-wide top resource gaps (all facilities, anonymised, ≥5 events threshold)
 *   - This provider's top gaps
 *   - Gaps unique to this provider (local procurement priority)
 *   - Widespread gaps this provider also reports (systemic issue)
 *
 * Used in: CareSignal page, HospitalAdminDashboard
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Globe, Building2, TrendingUp, Info, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Timeframe = 'week' | 'month' | 'quarter' | 'year';

interface GapItem {
  intervention: string;
  count: number;
}

function GapBar({ item, max, color }: { item: GapItem; max: number; color: string }) {
  const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium truncate">{item.intervention}</span>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">{item.count}×</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MultiFacilityBenchmarkWidget() {
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [exportTimeframe, setExportTimeframe] = useState<Timeframe>('quarter');

  const { data, isLoading, error } = trpc.careSignalEvents.getMultiFacilityBenchmark.useQuery(
    { timeframe, limit: 10 },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: mohData, isFetching: mohFetching, refetch: fetchMOH } =
    trpc.careSignalEvents.getMOHExportData.useQuery(
      { timeframe: exportTimeframe },
      { enabled: false, staleTime: 0 }
    );

  const platformMax = data?.platformWide?.[0]?.count ?? 1;
  const myMax = data?.myFacility?.[0]?.count ?? 1;

  // Build and download CSV from MOH export data
  function downloadMOHCSV(rows: typeof mohData extends { rows: infer R } | undefined ? R : never) {
    if (!rows || rows.length === 0) {
      alert('No data available for the selected timeframe (minimum 5 reports per gap required).');
      return;
    }
    const header = 'Intervention,Reports,Severity,First Reported,Last Reported,Timeframe';
    const lines = rows.map(r =>
      `"${r.intervention}",${r.count},${r.severity},${r.firstSeen},${r.lastSeen},${r.timeframe}`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaedsResus_ResourceGaps_MOH_${exportTimeframe}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleMOHExport() {
    const result = await fetchMOH();
    if (result.data) downloadMOHCSV(result.data.rows);
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-600" />
              Multi-Facility Resource Gap Benchmark
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Anonymised comparison across all platform providers. Minimum 5 reports before a gap
              appears in platform data.
            </CardDescription>
          </div>
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Could not load benchmark data.
          </p>
        )}

        {data && !isLoading && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-background border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{data.totalMyEvents}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your resource gap reports</p>
              </div>
              <div className="rounded-lg bg-background border p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.totalPlatformEvents}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Platform-wide reports</p>
              </div>
            </div>

            {/* Platform-wide top gaps */}
            {data.platformWide.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Platform-wide top gaps (anonymised)
                </h4>
                {data.platformWide.map((item) => (
                  <GapBar key={item.intervention} item={item} max={platformMax} color="bg-blue-500" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/40 border border-dashed p-4 text-center">
                <Info className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Not enough platform data yet (minimum 5 reports per gap required).
                </p>
              </div>
            )}

            {/* My facility gaps */}
            {data.myFacility.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Your reported gaps
                </h4>
                {data.myFacility.map((item) => (
                  <GapBar key={item.intervention} item={item} max={myMax} color="bg-amber-500" />
                ))}
              </div>
            )}

            {/* Insights */}
            {(data.uniqueToMe.length > 0 || data.widespreadGaps.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Insights
                </h4>

                {data.widespreadGaps.length > 0 && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 p-3">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1.5">
                      Systemic gaps — also reported widely across the platform:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.widespreadGaps.map((g) => (
                        <Badge key={g.intervention} variant="destructive" className="text-xs">
                          {g.intervention}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Escalate to county/national procurement — this is not isolated to your facility.
                    </p>
                  </div>
                )}

                {data.uniqueToMe.length > 0 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 p-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1.5">
                      Local gaps — unique to your facility:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.uniqueToMe.map((g) => (
                        <Badge key={g.intervention} variant="outline" className="text-xs border-amber-400">
                          {g.intervention}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Prioritise local procurement or stock management for these items.
                    </p>
                  </div>
                )}
              </div>
            )}

            {data.myFacility.length === 0 && data.platformWide.length === 0 && (
              <div className="rounded-lg bg-muted/40 border border-dashed p-6 text-center">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No resource gap data yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the "Not Available" button in ResusGPS when a recommended intervention
                  cannot be performed. Data will appear here automatically.
                </p>
              </div>
            )}
           </>
        )}

        {/* MOH Export section — always visible */}
        <div className="border-t pt-4 mt-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            MOH / County Export
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Download anonymised resource gap data as CSV for Ministry of Health or county procurement reporting.
          </p>
          <div className="flex items-center gap-2">
            <Select value={exportTimeframe} onValueChange={(v) => setExportTimeframe(v as Timeframe)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last month</SelectItem>
                <SelectItem value="quarter">Last quarter</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={handleMOHExport}
              disabled={mohFetching}
            >
              <Download className="h-3.5 w-3.5" />
              {mohFetching ? 'Generating…' : 'Download CSV'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
