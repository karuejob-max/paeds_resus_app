/**
 * Facility Training Gaps Dashboard
 * 
 * Institutional intelligence: Shows which conditions haven't been practiced recently,
 * identifies staff training needs, and recommends targeted interventions.
 * 
 * Strategic alignment: Pillar C (institutional improvement) + Pillar B mastery
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Users, Calendar, Download } from 'lucide-react';

export default function FacilityTrainingGaps() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<30 | 60 | 90>(30);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  // Mock data - in production, this would come from tRPC
  const trainingGaps = [
    {
      condition: 'Anaphylaxis',
      lastPracticed: 45,
      staffCount: 12,
      riskLevel: 'critical',
      recommendation: 'Schedule mandatory training within 7 days',
    },
    {
      condition: 'Tension Pneumothorax',
      lastPracticed: 38,
      staffCount: 8,
      riskLevel: 'high',
      recommendation: 'Organize group practice session',
    },
    {
      condition: 'Septic Shock',
      lastPracticed: 15,
      staffCount: 24,
      riskLevel: 'low',
      recommendation: 'Continue current training schedule',
    },
    {
      condition: 'Hypovolemic Shock',
      lastPracticed: 52,
      staffCount: 10,
      riskLevel: 'critical',
      recommendation: 'Urgent intervention required',
    },
  ];

  const staffEngagement = {
    totalStaff: 45,
    activeLastWeek: 32,
    activeLastMonth: 38,
    avgSessionsPerWeek: 2.3,
    avgConditionsPerStaff: 8.5,
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'low':
        return '✅';
      default:
        return '📊';
    }
  };

  const handleExportReport = () => {
    // In production, generate PDF with facility report
    console.log('Exporting facility report...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Training Gaps Analysis</h1>
          <p className="text-muted-foreground">
            Identify conditions needing urgent training focus
          </p>
        </div>
        <Button onClick={handleExportReport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Staff Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffEngagement.totalStaff}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active (Last Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffEngagement.activeLastWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((staffEngagement.activeLastWeek / staffEngagement.totalStaff) * 100)}% engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Sessions/Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffEngagement.avgSessionsPerWeek}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Conditions/Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffEngagement.avgConditionsPerStaff}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Training Gap Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground mt-1">Critical conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Gaps by Timeframe */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions Not Practiced</CardTitle>
          <CardDescription>
            Conditions with no practice activity in selected timeframe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timeframe selector */}
          <div className="flex gap-2">
            {[30, 60, 90].map((days) => (
              <Button
                key={days}
                variant={selectedTimeframe === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(days as 30 | 60 | 90)}
              >
                Last {days} days
              </Button>
            ))}
          </div>

          {/* Gaps list */}
          <div className="space-y-3">
            {trainingGaps.map((gap) => (
              <div
                key={gap.condition}
                className={`p-4 rounded-lg border ${getRiskColor(gap.riskLevel)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getRiskIcon(gap.riskLevel)}</span>
                      <h3 className="font-semibold">{gap.condition}</h3>
                      <Badge variant="outline" className="text-xs">
                        {gap.lastPracticed} days ago
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{gap.recommendation}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {gap.staffCount} staff affected
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Last: {gap.lastPracticed} days
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCondition(gap.condition)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facility Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Benchmark</CardTitle>
          <CardDescription>
            How your facility compares to similar-sized hospitals (anonymized)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium">Avg Sessions/Week</span>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {staffEngagement.avgSessionsPerWeek} <span className="text-sm text-muted-foreground">vs 2.1 avg</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="font-medium">Staff Engagement</span>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {Math.round((staffEngagement.activeLastWeek / staffEngagement.totalStaff) * 100)}%
                  <span className="text-sm text-muted-foreground"> vs 68% avg</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="font-medium">Critical Gaps</span>
              <div className="text-right">
                <div className="font-bold text-lg">
                  2 <span className="text-sm text-muted-foreground">vs 1.3 avg</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <strong>Immediate:</strong> Schedule mandatory training for Anaphylaxis and Tension Pneumothorax
          </p>
          <p className="text-sm">
            <strong>This Week:</strong> Increase staff engagement to 75% by promoting streak challenges
          </p>
          <p className="text-sm">
            <strong>This Month:</strong> Implement weekly condition rotation to ensure balanced practice
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
