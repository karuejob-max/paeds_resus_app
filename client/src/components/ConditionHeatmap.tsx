/**
 * Condition Heatmap Component
 *
 * Admin dashboard showing facility-level condition practice patterns:
 * - Which conditions are being practiced most
 * - Provider engagement per condition
 * - Training gaps (conditions with zero practice)
 * - Trends over time
 * - CSV export for reporting
 */

import React, { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Clock, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ConditionHeatmapProps {
  institutionId: string;
  daysBack?: number;
}

export function ConditionHeatmap({ institutionId, daysBack = 30 }: ConditionHeatmapProps) {
  const { data: heatmapData, isLoading } = trpc.resusSessionAnalytics.getFacilityConditionHeatmap.useQuery({
    institutionId,
    daysBack,
  });

  // Color scale for heatmap intensity
  const getHeatmapColor = (sessions: number, maxSessions: number) => {
    const intensity = sessions / maxSessions;
    if (intensity >= 0.8) return '#16a34a'; // green
    if (intensity >= 0.6) return '#84cc16'; // lime
    if (intensity >= 0.4) return '#fbbf24'; // amber
    if (intensity >= 0.2) return '#fb923c'; // orange
    return '#fca5a5'; // red
  };

  const maxSessions = useMemo(() => {
    if (!heatmapData?.heatmap) return 1;
    return Math.max(...heatmapData.heatmap.map((c) => c.validSessions), 1);
  }, [heatmapData]);

  const chartData = useMemo(() => {
    if (!heatmapData?.heatmap) return [];
    return heatmapData.heatmap.slice(0, 15).map((condition) => ({
      name: condition.label,
      sessions: condition.validSessions,
      providers: condition.providersCount,
      duration: condition.averageDuration,
    }));
  }, [heatmapData]);

  const exportToCSV = () => {
    if (!heatmapData?.heatmap) return;

    const headers = ['Condition', 'Sessions', 'Providers', 'Avg Duration (min)', 'Last Practiced', 'Days Since', 'Trend'];
    const rows = heatmapData.heatmap.map((c) => [
      c.label,
      c.validSessions,
      c.providersCount,
      (c.averageDuration / 60).toFixed(1),
      c.lastPracticed || 'Never',
      c.daysSinceLast || 'N/A',
      c.trend || 'stable',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `condition-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Heatmap exported to CSV');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Condition Practice Heatmap</CardTitle>
          <CardDescription>Loading facility data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!heatmapData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Condition Practice Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const topConditions = heatmapData.heatmap.slice(0, 5);
  const trainingGaps = heatmapData.heatmap.filter((c) => c.validSessions === 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl">Condition Practice Heatmap</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {heatmapData.institutionName} — Last {daysBack} days
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="text-left md:text-right">
              <div className="text-2xl md:text-3xl font-bold text-primary">{heatmapData.totalValidSessions}</div>
              <p className="text-xs md:text-sm text-muted-foreground">total sessions</p>
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          <div className="p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs font-medium text-blue-900">Conditions</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-blue-600">{heatmapData.conditionsTracked}</p>
          </div>

          <div className="p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <Users className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs font-medium text-green-900">Avg Providers</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-green-600">
              {Math.round(
                heatmapData.heatmap.reduce((sum, c) => sum + c.providersCount, 0) /
                  Math.max(heatmapData.conditionsTracked, 1)
              )}
            </p>
          </div>

          <div className="p-2 md:p-3 bg-amber-50 border border-amber-200 rounded-lg col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 md:gap-2 mb-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-medium text-amber-900">Avg Duration</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-amber-600">
              {Math.round(
                heatmapData.heatmap.reduce((sum, c) => sum + c.averageDuration, 0) /
                  Math.max(heatmapData.conditionsTracked, 1) /
                  60
              )}{' '}
              min
            </p>
          </div>
        </div>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <div className="space-y-2 overflow-x-auto">
            <h3 className="font-medium text-xs md:text-sm">Top Conditions by Session Count</h3>
            <ResponsiveContainer width="100%" height={250} minWidth={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [value, 'Sessions']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="sessions" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getHeatmapColor(entry.sessions, maxSessions)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top conditions table */}
        <div className="space-y-2">
          <h3 className="font-medium text-xs md:text-sm">Top 5 Practiced Conditions</h3>
          <div className="space-y-2">
            {topConditions.map((condition) => (
              <div
                key={condition.condition}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getHeatmapColor(
                        condition.validSessions,
                        maxSessions
                      ),
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs md:text-sm truncate">{condition.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {condition.providersCount} provider{condition.providersCount !== 1 ? 's' : ''} • {Math.round(condition.averageDuration / 60)} min
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs md:text-sm w-fit">{condition.validSessions} sessions</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Training gaps */}
        {trainingGaps.length > 0 && (
          <div className="p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs md:text-sm text-red-900">Training Gaps</p>
                <p className="text-xs text-red-800 mt-1">
                  {trainingGaps.length} condition{trainingGaps.length !== 1 ? 's' : ''} with no practice in the last {daysBack} days:
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {trainingGaps.slice(0, 5).map((cond) => (
                    <Badge key={cond.condition} variant="outline" className="text-red-700 border-red-300 text-xs">
                      {cond.label}
                    </Badge>
                  ))}
                  {trainingGaps.length > 5 && (
                    <Badge variant="outline" className="text-red-700 border-red-300 text-xs">
                      +{trainingGaps.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
