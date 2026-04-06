/**
 * Condition Recommendation Component
 * 
 * Displays personalized learning path based on:
 * - Learner progress (conditions needing more practice)
 * - Facility gaps (conditions not practiced recently)
 * - Clinical priority (life-threatening conditions first)
 */

import React from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { Lightbulb, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';

interface ConditionRecommendationProps {
  userId?: string;
  institutionId?: string;
  onSelectCondition?: (condition: string) => void;
}

export function ConditionRecommendation({
  userId,
  institutionId,
  onSelectCondition,
}: ConditionRecommendationProps) {
  const [, navigate] = useLocation();
  const { data: recommendations, isLoading } = trpc.recommendationEngine.getPersonalizedLearningPath.useQuery(
    {
      userId,
      institutionId,
      limit: 3,
    },
    { enabled: !!userId }
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Recommended Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-12 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations?.path || recommendations.path.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            All Set!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You've achieved the minimum for all conditions. Keep practicing to deepen your expertise!
          </p>
        </CardContent>
      </Card>
    );
  }

  const topRecommendation = recommendations.path[0];
  const alternatives = recommendations.path.slice(1);

  const handleStartPractice = () => {
    if (onSelectCondition) {
      onSelectCondition(topRecommendation.condition);
    }
    // Navigate to ResusGPS with pathway parameter
    navigate(`/resus-gps?pathway=${topRecommendation.condition}`);
  };

  return (
    <Card className="w-full border-amber-200 bg-amber-50/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              Recommended Next
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Based on your progress and facility needs
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Recommendation */}
        <div className="p-3 bg-white border border-amber-200 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {topRecommendation.type === 'facility_gap' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                )}
                <h3 className="font-semibold text-sm">{topRecommendation.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{topRecommendation.reason}</p>
              {topRecommendation.count !== undefined && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {topRecommendation.count}/3 cases
                  </Badge>
                  {topRecommendation.daysSinceLast !== undefined &&
                    topRecommendation.daysSinceLast !== null && (
                      <Badge variant="secondary" className="text-xs">
                        Last: {topRecommendation.daysSinceLast}d ago
                      </Badge>
                    )}
                </div>
              )}
            </div>
            <Button
              onClick={handleStartPractice}
              size="sm"
              className="mt-1 flex-shrink-0"
            >
              <span>Start</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Or try:</p>
            {alternatives.map((alt) => (
              <button
                key={alt.condition}
                onClick={() => {
                  if (onSelectCondition) {
                    onSelectCondition(alt.condition);
                  }
                  navigate(`/resus-gps?pathway=${alt.condition}`);
                }}
                className="w-full text-left p-2 hover:bg-white rounded border border-amber-100 transition-colors"
              >
                <p className="text-xs font-medium">{alt.label}</p>
                <p className="text-xs text-muted-foreground">{alt.reason}</p>
              </button>
            ))}
          </div>
        )}

        {/* Progress Summary */}
        {recommendations.learnerProgress && (
          <div className="pt-2 border-t border-amber-100">
            <p className="text-xs text-muted-foreground">
              Fellowship progress: {recommendations.learnerProgress.totalConditionsAtMinimum}/
              {recommendations.learnerProgress.totalConditions} conditions
              ({recommendations.learnerProgress.percentage}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
