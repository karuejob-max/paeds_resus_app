/**
 * Provider Intelligence Dashboard
 * 
 * Shows individual providers their ResusGPS mastery progress, recommended conditions,
 * and anonymized peer benchmarking to drive engagement and healthy competition.
 * 
 * Strategic alignment: Pillar B (ResusGPS mastery) + engagement + institutional intelligence
 * Reduces preventable mortality by ensuring providers master all critical conditions
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  Users, 
  Calendar,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';

interface ConditionProgress {
  condition: string;
  casesCompleted: number;
  casesRequired: number;
  depthScore: number;
  lastPracticed: string;
  status: 'mastered' | 'in-progress' | 'not-started';
}

interface PeerBenchmark {
  rank: number;
  sessionsPerWeek: number;
  conditionsMastered: number;
  avgDepthScore: number;
  streakDays: number;
}

export function ProviderIntelligenceDashboard() {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  // Fetch provider progress
  const { data: progress, isLoading } = trpc.providerIntelligence.getProgress.useQuery();

  // Fetch peer benchmarking
  const { data: benchmarks } = trpc.providerIntelligence.getPeerBenchmarks.useQuery();

  // Fetch recommended next condition
  const { data: recommendation } = trpc.providerIntelligence.getNextRecommendation.useQuery();

  if (isLoading) {
    return <div className="text-center py-8">Loading your progress...</div>;
  }

  const masteredCount = progress?.conditions.filter(
    (c: ConditionProgress) => c.status === 'mastered'
  ).length || 0;
  const totalConditions = progress?.conditions.length || 27;
  const masteryPercentage = Math.round((masteredCount / totalConditions) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your ResusGPS Mastery</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your progress toward fellowship qualification
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-blue-600">{masteryPercentage}%</p>
          <p className="text-sm text-gray-600">{masteredCount} of {totalConditions} conditions</p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Fellowship Progress</span>
              <span className="text-sm font-bold text-gray-900">{masteryPercentage}%</span>
            </div>
            <Progress value={masteryPercentage} className="h-3" />
            <p className="text-xs text-gray-600 mt-2">
              Complete ≥3 cases per condition with sufficient depth to qualify for fellowship
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessions This Week</p>
                <p className="text-3xl font-bold">{progress?.sessionsThisWeek || 0}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{progress?.currentStreak || 0}d</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Depth Score</p>
                <p className="text-3xl font-bold">{progress?.avgDepthScore?.toFixed(1) || '0.0'}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Rank</p>
                <p className="text-3xl font-bold text-purple-600">#{benchmarks?.yourRank || 'N/A'}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next Condition */}
      {recommendation && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Next Recommended Condition</h3>
                <p className="text-sm text-gray-700 mb-3">
                  {recommendation.condition} — {recommendation.reason}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                  <span className="px-2 py-1 bg-white rounded border">
                    Impact: {recommendation.impact}
                  </span>
                  <span className="px-2 py-1 bg-white rounded border">
                    Facility Gap: {recommendation.facilityGapDays}d
                  </span>
                </div>
              </div>
              <Button className="flex-shrink-0">
                Practice Now <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Condition Progress Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Conditions</TabsTrigger>
          <TabsTrigger value="mastered">Mastered</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="not-started">Not Started</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {progress?.conditions?.map((condition: ConditionProgress) => (
            <ConditionCard
              key={condition.condition}
              condition={condition}
              isSelected={selectedCondition === condition.condition}
              onSelect={() => setSelectedCondition(condition.condition)}
            />
          ))}
        </TabsContent>

        <TabsContent value="mastered" className="space-y-3 mt-4">
          {progress?.conditions
            ?.filter((c: ConditionProgress) => c.status === 'mastered')
            .map((condition: ConditionProgress) => (
              <ConditionCard key={condition.condition} condition={condition} />
            ))}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-3 mt-4">
          {progress?.conditions
            ?.filter((c: ConditionProgress) => c.status === 'in-progress')
            .map((condition: ConditionProgress) => (
              <ConditionCard key={condition.condition} condition={condition} />
            ))}
        </TabsContent>

        <TabsContent value="not-started" className="space-y-3 mt-4">
          {progress?.conditions
            ?.filter((c: ConditionProgress) => c.status === 'not-started')
            .map((condition: ConditionProgress) => (
              <ConditionCard key={condition.condition} condition={condition} />
            ))}
        </TabsContent>
      </Tabs>

      {/* Peer Benchmarking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            How You Compare
          </CardTitle>
          <CardDescription>
            Anonymized peer benchmarking from your facility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Your Sessions/Week</p>
              <p className="text-2xl font-bold">{progress?.sessionsThisWeek || 0}</p>
              <p className="text-xs text-gray-600 mt-1">
                Facility avg: {benchmarks?.facilityAvgSessions || 0}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Your Conditions Mastered</p>
              <p className="text-2xl font-bold">{masteredCount}</p>
              <p className="text-xs text-gray-600 mt-1">
                Facility avg: {benchmarks?.facilityAvgMastered || 0}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Your Depth Score</p>
              <p className="text-2xl font-bold">{progress?.avgDepthScore?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-gray-600 mt-1">
                Facility avg: {benchmarks?.facilityAvgDepth?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Your Rank</p>
              <p className="text-2xl font-bold">#{benchmarks?.yourRank || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">
                of {benchmarks?.totalProviders || 0} providers
              </p>
            </div>
          </div>

          {benchmarks?.yourRank === 1 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">
                You're the top ResusGPS practitioner at your facility! 🏆
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Condition progress card component
 */
function ConditionCard({
  condition,
  isSelected = false,
  onSelect,
}: {
  condition: ConditionProgress;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const statusColors = {
    mastered: 'bg-green-100 text-green-800 border-green-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    'not-started': 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusIcons = {
    mastered: <Unlock className="w-4 h-4" />,
    'in-progress': <Target className="w-4 h-4" />,
    'not-started': <Lock className="w-4 h-4" />,
  };

  const progressPercentage = Math.round(
    (condition.casesCompleted / condition.casesRequired) * 100
  );

  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {statusIcons[condition.status]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{condition.condition}</h4>
                <Badge className={statusColors[condition.status]}>
                  {condition.status === 'mastered' ? '✓ Mastered' :
                   condition.status === 'in-progress' ? 'In Progress' :
                   'Not Started'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Cases: {condition.casesCompleted}/{condition.casesRequired}</span>
                    <span className="font-medium text-gray-900">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Depth Score</span>
                    <span className="font-medium text-gray-900">{condition.depthScore.toFixed(1)}/10</span>
                  </div>
                  <Progress value={condition.depthScore * 10} className="h-2" />
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Last practiced: {condition.lastPracticed}
              </p>
            </div>
          </div>

          {condition.status !== 'mastered' && (
            <Button size="sm" variant="outline" className="flex-shrink-0">
              Practice <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
