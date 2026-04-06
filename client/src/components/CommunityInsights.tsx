/**
 * Community Insights Dashboard
 * 
 * Integrates Safe-Truth parent/guardian voice into institutional analytics.
 * Shows facility leaders what parents/guardians report about care gaps,
 * distinct from Care Signal staff reporting.
 * 
 * Strategic alignment: Pillar 5 (community voice) + institutional partnership
 * Reduces preventable mortality by surfacing system gaps that clinical staff miss
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Heart, Clock, TrendingUp, Users, MessageCircle } from 'lucide-react';

interface CareGapReport {
  id: number;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reportCount: number;
  lastReported: string;
  affectedChildren: number;
  recommendedAction: string;
}

interface CommunityInsightsProps {
  institutionId: number;
}

export function CommunityInsights({ institutionId }: CommunityInsightsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Fetch community insights data
  const { data: insights, isLoading } = trpc.communityInsights.getInsights.useQuery({
    institutionId,
    timeRange,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading community insights...</div>;
  }

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const severityIcons = {
    critical: <AlertCircle className="w-5 h-5 text-red-600" />,
    high: <AlertCircle className="w-5 h-5 text-orange-600" />,
    medium: <Clock className="w-5 h-5 text-yellow-600" />,
    low: <Heart className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Voice & Care Gaps</h2>
          <p className="text-sm text-gray-600 mt-1">
            What parents and guardians are telling us about care at your facility
          </p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-3xl font-bold">{insights?.totalReports || 0}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Gaps</p>
                <p className="text-3xl font-bold text-red-600">{insights?.criticalGaps || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Children Affected</p>
                <p className="text-3xl font-bold">{insights?.childrenAffected || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolution Rate</p>
                <p className="text-3xl font-bold">{insights?.resolutionRate || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Care Gap Categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Gaps</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {insights?.gapReports?.map((gap: CareGapReport) => (
            <Card key={gap.id} className={`border-l-4 ${
              gap.severity === 'critical' ? 'border-l-red-500' :
              gap.severity === 'high' ? 'border-l-orange-500' :
              gap.severity === 'medium' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {severityIcons[gap.severity]}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{gap.category}</h4>
                        <Badge className={severityColors[gap.severity]}>
                          {gap.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{gap.description}</p>
                      <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 mb-2">
                        <div>
                          <p className="font-medium">Reports</p>
                          <p className="text-lg font-bold text-gray-900">{gap.reportCount}</p>
                        </div>
                        <div>
                          <p className="font-medium">Children Affected</p>
                          <p className="text-lg font-bold text-gray-900">{gap.affectedChildren}</p>
                        </div>
                        <div>
                          <p className="font-medium">Last Reported</p>
                          <p className="text-gray-900">{gap.lastReported}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 border border-gray-200">
                        <p className="font-medium mb-1">Recommended Action:</p>
                        <p>{gap.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="critical" className="space-y-3 mt-4">
          {insights?.gapReports
            ?.filter((gap: CareGapReport) => gap.severity === 'critical')
            .map((gap: CareGapReport) => (
              <Card key={gap.id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {severityIcons[gap.severity]}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{gap.category}</h4>
                      <p className="text-sm text-gray-700 mb-2">{gap.description}</p>
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ {gap.reportCount} reports from {gap.affectedChildren} children
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gap Trends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights?.trends?.map((trend: any, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{trend.category}</span>
                    <span className="text-sm font-bold text-gray-900">{trend.percentage}%</span>
                  </div>
                  <Progress value={trend.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommended Actions</CardTitle>
              <CardDescription>
                Prioritized by impact and feasibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights?.recommendedActions?.map((action: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">{action.title}</h5>
                      <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded">Impact: {action.impact}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">Timeline: {action.timeline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
