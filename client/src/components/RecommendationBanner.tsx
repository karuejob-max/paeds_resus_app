/**
 * Recommendation Banner for ResusGPS
 * 
 * Displays personalized learning pathway recommendation based on:
 * - Learner progress (conditions mastered, gaps)
 * - Facility practice patterns (conditions not practiced)
 * - Clinical priority (life-threatening conditions first)
 * 
 * Strategic alignment: Pillar B mastery + institutional intelligence
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Flame, TrendingUp, X } from 'lucide-react';

interface RecommendationBannerProps {
  pathway: string;
  condition: string;
  message: string;
  facilityGap?: string;
  learnerProgress?: number;
  onPracticeNow: () => void;
  onDismiss: () => void;
}

export function RecommendationBanner({
  pathway,
  condition,
  message,
  facilityGap,
  learnerProgress,
  onPracticeNow,
  onDismiss,
}: RecommendationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Recommended Pathway</h3>
                <Badge variant="outline" className="text-xs">
                  {pathway}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{message}</p>

              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  <strong>Condition:</strong> {condition}
                </p>
                {facilityGap && (
                  <p className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="w-3 h-3" />
                    <strong>Facility gap:</strong> {facilityGap}
                  </p>
                )}
                {learnerProgress !== undefined && (
                  <p>
                    <strong>Your progress:</strong> {learnerProgress}% of conditions mastered
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onPracticeNow}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Flame className="w-4 h-4 mr-1" />
              Practice Now
            </Button>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
