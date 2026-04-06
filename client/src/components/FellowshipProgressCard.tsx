/**
 * Fellowship Progress Card Component
 *
 * Displays provider's progress toward fellowship pillar B:
 * - Condition checklist (X/27 conditions with ≥3 cases)
 * - Distance to Fellow (percentage complete)
 * - Conditions in progress (< 3 cases)
 * - Recommended next conditions to practice
 */

import React, { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, AlertCircle, TrendingUp } from 'lucide-react';
import { ConditionRecommendation } from './ConditionRecommendation';

export function FellowshipProgressCard() {
  const { data: progressData, isLoading } = trpc.resusSessionAnalytics.getProviderFellowshipProgress.useQuery();
  const { data: allConditions } = trpc.fellowshipPathways.getAllConditions.useQuery();

  const percentComplete = useMemo(() => {
    if (!progressData) return 0;
    return progressData.fellowshipReadiness.pillarB.percentage;
  }, [progressData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fellowship Progress</CardTitle>
          <CardDescription>Loading your progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fellowship Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const { pillarB } = progressData.fellowshipReadiness;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl">Fellowship Progress — Pillar B</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              ResusGPS cases per taught condition (≥3 required)
            </CardDescription>
          </div>
          <div className="text-left md:text-right">
            <div className="text-2xl md:text-3xl font-bold text-primary">{pillarB.percentage}%</div>
            <p className="text-xs md:text-sm text-muted-foreground">
              {pillarB.achieved}/{pillarB.required} conditions
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recommendation section */}
        <ConditionRecommendation />

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={pillarB.percentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {pillarB.required - pillarB.achieved} conditions remaining
          </p>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="minimum" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger value="minimum" className="text-xs md:text-sm">
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Achieved</span>
              <span className="sm:hidden">Done</span>
              <span className="hidden md:inline"> ({progressData.totalConditionsAtMinimum})</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs md:text-sm">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Next</span>
              <span className="hidden md:inline"> ({progressData.conditionsInProgress.length})</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs md:text-sm">
              <Circle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">All</span>
              <span className="hidden md:inline"> ({pillarB.required})</span>
            </TabsTrigger>
          </TabsList>

          {/* Achieved conditions */}
          <TabsContent value="minimum" className="space-y-3">
            {progressData.details.minimum.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No conditions with minimum cases yet. Start practicing!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {progressData.details.minimum.map((cond) => (
                  <div
                    key={cond.condition}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{cond.condition}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(cond.totalDuration / 60)} min total
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {cond.count} cases
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* In-progress conditions */}
          <TabsContent value="progress" className="space-y-3">
            {progressData.conditionsInProgress.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No conditions in progress. Great work!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {progressData.conditionsInProgress.map((cond) => (
                  <div
                    key={cond.condition}
                    className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-sm">{cond.condition}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(cond.totalDuration / 60)} min total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-amber-600 text-amber-600">
                        {cond.count}/{3}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cond.needed} more needed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All conditions */}
          <TabsContent value="all" className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {allConditions?.map((cond) => {
                const achieved = progressData.details.minimum.find(
                  (c) => c.condition === cond.value
                );
                const inProgress = progressData.conditionsInProgress.find(
                  (c) => c.condition === cond.value
                );

                return (
                  <div
                    key={cond.value}
                    className={`p-2 md:p-3 rounded border text-xs md:text-sm ${
                      achieved
                        ? 'bg-green-50 border-green-200'
                        : inProgress
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-1 md:gap-2">
                      {achieved ? (
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : inProgress ? (
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{cond.label}</p>
                        {achieved && (
                          <p className="text-xs text-green-600">{achieved.count} cases</p>
                        )}
                        {inProgress && (
                          <p className="text-xs text-amber-600">
                            {inProgress.count}/{3} cases
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Recommendation */}
        {progressData.conditionsInProgress.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">💡 Recommendation</p>
            <p className="text-xs text-blue-800 mt-1">
              Focus on{' '}
              <span className="font-semibold">
                {progressData.conditionsInProgress[0].condition}
              </span>
              — you're {progressData.conditionsInProgress[0].needed} case(s) away from mastery.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
