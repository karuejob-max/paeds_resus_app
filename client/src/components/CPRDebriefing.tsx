/**
 * CPR Debriefing Component
 * 
 * Post-arrest team debriefing with performance metrics and AI-generated insights.
 * Supports continuous quality improvement and team learning.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  Syringe,
  Users,
  Download,
  Sparkles,
  X
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ArrestEvent {
  id: string;
  timestamp: number;
  action: string;
  details?: string;
  performedBy?: string;
}

interface TeamMember {
  id: number;
  providerName: string;
  role: string | null;
}

interface DebriefingProps {
  sessionId: number;
  totalDuration: number;
  shockCount: number;
  epiDoses: number;
  outcome: 'ROSC' | 'ongoing' | 'discontinued';
  events: ArrestEvent[];
  teamMembers: TeamMember[];
  onClose: () => void;
}

interface PerformanceMetrics {
  compressionFraction: number;
  timeToFirstEpi: number | null;
  timeToFirstShock: number | null;
  rhythmCheckIntervals: number[];
  roleDistribution: Record<string, number>;
  criticalDelays: string[];
  strengths: string[];
}

export function CPRDebriefing({
  sessionId,
  totalDuration,
  shockCount,
  epiDoses,
  outcome,
  events,
  teamMembers,
  onClose
}: DebriefingProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Calculate performance metrics
  useEffect(() => {
    const calculated = calculateMetrics();
    setMetrics(calculated);
  }, [events, teamMembers]);

  // Generate AI insights
  const generateInsights = trpc.cprSession.generateInsights.useMutation();

  const handleGenerateInsights = async () => {
    if (!metrics) return;
    
    setIsGeneratingInsights(true);
    try {
      const result = await generateInsights.mutateAsync({
        sessionId,
        metrics: {
          totalDuration,
          shockCount,
          epiDoses,
          outcome,
          compressionFraction: metrics.compressionFraction,
          timeToFirstEpi: metrics.timeToFirstEpi,
          timeToFirstShock: metrics.timeToFirstShock,
          criticalDelays: metrics.criticalDelays,
        },
        events: events.map(e => ({
          timestamp: e.timestamp,
          action: e.action,
          performedBy: e.performedBy,
        })),
      });
      setAiInsights(typeof result.insights === 'string' ? result.insights : JSON.stringify(result.insights));
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const calculateMetrics = (): PerformanceMetrics => {
    // Compression fraction (% of time doing compressions)
    // Simplified: assume 2-min cycles, 10s rhythm checks
    const rhythmChecks = events.filter(e => e.action.includes('Rhythm check') || e.action.includes('rhythm')).length;
    const pauseTime = rhythmChecks * 10; // 10s per rhythm check
    const compressionTime = totalDuration - pauseTime;
    const compressionFraction = (compressionTime / totalDuration) * 100;

    // Time to first epinephrine
    const firstEpi = events.find(e => e.action.includes('Epinephrine') || e.action.includes('Epi'));
    const timeToFirstEpi = firstEpi ? firstEpi.timestamp : null;

    // Time to first shock
    const firstShock = events.find(e => e.action.includes('Shock'));
    const timeToFirstShock = firstShock ? firstShock.timestamp : null;

    // Rhythm check intervals
    const rhythmCheckEvents = events.filter(e => e.action.includes('Rhythm check'));
    const rhythmCheckIntervals: number[] = [];
    for (let i = 1; i < rhythmCheckEvents.length; i++) {
      const interval = rhythmCheckEvents[i].timestamp - rhythmCheckEvents[i - 1].timestamp;
      rhythmCheckIntervals.push(interval);
    }

    // Role distribution (how many actions per role)
    const roleDistribution: Record<string, number> = {};
    teamMembers.forEach(member => {
      const actionsCount = events.filter(e => e.performedBy === member.providerName).length;
      if (member.role) {
        roleDistribution[member.role] = (roleDistribution[member.role] || 0) + actionsCount;
      }
    });

    // Critical delays
    const criticalDelays: string[] = [];
    if (timeToFirstEpi && timeToFirstEpi > 180) {
      criticalDelays.push(`Epinephrine delayed (${Math.floor(timeToFirstEpi / 60)} min)`);
    }
    if (timeToFirstShock && timeToFirstShock > 120) {
      criticalDelays.push(`First shock delayed (${Math.floor(timeToFirstShock / 60)} min)`);
    }
    if (rhythmCheckIntervals.some(interval => interval > 150)) {
      criticalDelays.push('Rhythm check interval exceeded 2.5 minutes');
    }

    // Strengths
    const strengths: string[] = [];
    if (compressionFraction >= 80) {
      strengths.push('Excellent compression fraction (≥80%)');
    }
    if (timeToFirstEpi && timeToFirstEpi <= 180) {
      strengths.push('Timely epinephrine administration');
    }
    if (timeToFirstShock && timeToFirstShock <= 120) {
      strengths.push('Rapid defibrillation');
    }
    if (teamMembers.length >= 4) {
      strengths.push('Well-staffed resuscitation team');
    }

    return {
      compressionFraction,
      timeToFirstEpi,
      timeToFirstShock,
      rhythmCheckIntervals,
      roleDistribution,
      criticalDelays,
      strengths,
    };
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportDebriefing = () => {
    const report = {
      sessionId,
      timestamp: new Date().toISOString(),
      outcome,
      totalDuration,
      metrics,
      events,
      teamMembers,
      aiInsights,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpr-debriefing-${sessionId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!metrics) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Post-Arrest Debriefing</h1>
            <p className="text-gray-400">Session #{sessionId} - {outcome === 'ROSC' ? 'ROSC Achieved' : outcome}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Outcome Summary */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {outcome === 'ROSC' ? (
                <><CheckCircle2 className="h-6 w-6 text-green-500" /> Successful Resuscitation</>
              ) : (
                <><AlertTriangle className="h-6 w-6 text-yellow-500" /> Resuscitation {outcome}</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatTime(totalDuration)}</div>
                <div className="text-sm text-gray-400">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{shockCount}</div>
                <div className="text-sm text-gray-400">Shocks Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{epiDoses}</div>
                <div className="text-sm text-gray-400">Epi Doses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{teamMembers.length}</div>
                <div className="text-sm text-gray-400">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Compression Fraction */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Compression Fraction</span>
                <Badge className={metrics.compressionFraction >= 80 ? 'bg-green-500' : metrics.compressionFraction >= 60 ? 'bg-yellow-500' : 'bg-red-500'}>
                  {metrics.compressionFraction.toFixed(1)}%
                </Badge>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metrics.compressionFraction >= 80 ? 'bg-green-500' : metrics.compressionFraction >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${metrics.compressionFraction}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">Target: ≥80% (AHA guidelines)</p>
            </div>

            {/* Time to Critical Interventions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Syringe className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">Time to First Epi</span>
                </div>
                <div className="text-2xl font-bold">{formatTime(metrics.timeToFirstEpi)}</div>
                <p className="text-sm text-gray-400">Target: ≤3 min</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">Time to First Shock</span>
                </div>
                <div className="text-2xl font-bold">{formatTime(metrics.timeToFirstShock)}</div>
                <p className="text-sm text-gray-400">Target: ≤2 min</p>
              </div>
            </div>

            {/* Role Distribution */}
            {Object.keys(metrics.roleDistribution).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Role Distribution</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(metrics.roleDistribution).map(([role, count]) => (
                    <div key={role} className="bg-gray-700 rounded px-3 py-2 text-sm">
                      <span className="capitalize">{role.replace('_', ' ')}</span>: {count} actions
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strengths & Areas for Improvement */}
        <div className="grid grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {metrics.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No specific strengths identified</p>
              )}
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="h-5 w-5" /> Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.criticalDelays.length > 0 ? (
                <ul className="space-y-2">
                  {metrics.criticalDelays.map((delay, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{delay}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No critical delays identified</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI-Generated Insights */}
        <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!aiInsights ? (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">Get personalized improvement suggestions based on your team's performance</p>
                <Button
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGeneratingInsights ? (
                    <>Generating Insights...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate AI Insights</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiInsights}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Timeline */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Event Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-4 text-sm border-l-2 border-gray-700 pl-4 py-2">
                  <span className="font-mono text-gray-400 w-16">{formatTime(event.timestamp)}</span>
                  <div className="flex-1">
                    <span className="font-medium">{event.action}</span>
                    {event.details && <span className="text-gray-400"> - {event.details}</span>}
                    {event.performedBy && <span className="text-purple-400 ml-2">({event.performedBy})</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button onClick={exportDebriefing} variant="outline" className="text-white border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Debriefing Report
          </Button>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Close Debriefing
          </Button>
        </div>
      </div>
    </div>
  );
}
