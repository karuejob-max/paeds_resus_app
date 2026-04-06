/**
 * Condition Heatmap Component
 *
 * Admin dashboard showing facility-level condition practice patterns:
 * - Which conditions are being practiced most
 * - Provider engagement per condition
 * - Training gaps (conditions with zero practice)
 * - Trends over time
 */

import React, { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Condition Practice Heatmap</CardTitle>
            <CardDescription>
              {heatmapData.institutionName} — Last {daysBack} days
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{heatmapData.totalValidSessions}</div>
            <p className="text-sm text-muted-foreground">total sessions</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-900">Conditions Tracked</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{heatmapData.conditionsTracked}</p>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-900">Avg Providers/Condition</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(
                heatmapData.heatmap.reduce((sum, c) => sum + c.providersCount, 0) /
                  Math.max(heatmapData.conditionsTracked, 1)
              )}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-medium text-amber-900">Avg Duration</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">
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
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Top Conditions by Session Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                  formatter={(value) => [value, 'Sessions']}
                />
                <Legend />
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
          <h3 className="font-medium text-sm">Top 5 Practiced Conditions</h3>
          <div className="space-y-2">
            {topConditions.map((condition, idx) => (
              <div
                key={condition.condition}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: getHeatmapColor(
                        condition.validSessions,
                        maxSessions
                      ),
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{condition.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {condition.providersCount} provider{condition.providersCount !== 1 ? 's' : ''} •{' '}
                      {condition.averageDuration}s avg
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{condition.validSessions} sessions</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Training gaps */}
        {trainingGaps.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-red-900">Training Gaps</p>
                <p className="text-xs text-red-800 mt-1">
                  {trainingGaps.length} condition{trainingGaps.length !== 1 ? 's' : ''} with no practice in the last {daysBack} days:
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {trainingGaps.slice(0, 5).map((cond) => (
                    <Badge key={cond.condition} variant="outline" className="text-red-700 border-red-300">
                      {cond.label}
                    </Badge>
                  ))}
                  {trainingGaps.length > 5 && (
                    <Badge variant="outline" className="text-red-700 border-red-300">
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
