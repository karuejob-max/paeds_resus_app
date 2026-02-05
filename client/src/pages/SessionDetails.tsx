/**
 * Session Details Page
 * 
 * Displays comprehensive information about a single cardiac arrest session:
 * - Session header with key metrics
 * - Event timeline with timestamps
 * - Team member roster
 * - Quality metrics
 * - AI-powered debriefing insights
 */

import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Clock,
  Heart,
  Users,
  Activity,
  Zap,
  Syringe,
  Wind,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function SessionDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const sessionId = parseInt(id || '0');

  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // Fetch session details
  const { data, isLoading, error } = trpc.cprSession.getSessionDetails.useQuery(
    { sessionId },
    { enabled: sessionId > 0 }
  );

  // Generate AI insights mutation
  const generateInsightsMutation = trpc.cprSession.generateInsights.useMutation();

  const formatTime = (seconds: number | null) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return <Badge className="bg-gray-600">Unknown</Badge>;
    switch (outcome) {
      case 'ROSC':
        return <Badge className="bg-green-600 text-lg px-4 py-1">ROSC Achieved</Badge>;
      case 'pCOSCA':
        return <Badge className="bg-blue-600 text-lg px-4 py-1">pCOSCA</Badge>;
      case 'mortality':
        return <Badge className="bg-red-600 text-lg px-4 py-1">Mortality</Badge>;
      case 'ongoing':
        return <Badge className="bg-yellow-600 text-lg px-4 py-1 animate-pulse">Ongoing</Badge>;
      default:
        return <Badge className="bg-gray-600 text-lg px-4 py-1">{outcome}</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'compression_cycle':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'medication':
        return <Syringe className="h-5 w-5 text-blue-500" />;
      case 'defibrillation':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'airway':
        return <Wind className="h-5 w-5 text-teal-500" />;
      case 'note':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'outcome':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleGenerateInsights = async () => {
    if (!data) return;

    setGeneratingInsights(true);
    setShowAIInsights(true);

    try {
      // Calculate metrics from session data
      const shockCount = data.events.filter(e => e.eventType === 'defibrillation').length;
      const epiDoses = data.events.filter(e => e.eventType === 'medication' && e.description?.toLowerCase().includes('epinephrine')).length;
      const totalDuration = data.session.totalDuration || 0;
      
      // Find time to first epinephrine and first shock
      const firstEpi = data.events.find(e => e.eventType === 'medication' && e.description?.toLowerCase().includes('epinephrine'));
      const firstShock = data.events.find(e => e.eventType === 'defibrillation');

      // Build event timeline for AI
      const eventTimeline = data.events.slice(0, 20).map(event => ({
        timestamp: event.eventTime || 0,
        action: `${event.eventType}: ${event.description || event.value || ''}`,
        performedBy: event.memberId ? `Member ${event.memberId}` : undefined,
      }));

      const result = await generateInsightsMutation.mutateAsync({
        sessionId: data.session.id,
        metrics: {
          totalDuration,
          outcome: data.session.outcome || 'ongoing',
          shockCount,
          epiDoses,
          compressionFraction: 75, // Placeholder - would come from actual tracking
          timeToFirstEpi: firstEpi?.eventTime || null,
          timeToFirstShock: firstShock?.eventTime || null,
          criticalDelays: [], // Placeholder - would be calculated from events
        },
        events: eventTimeline,
      });

      // Handle both string and array response types from LLM
      const insightsText = typeof result.insights === 'string' 
        ? result.insights 
        : JSON.stringify(result.insights);
      setAiInsights(insightsText);
    } catch (error) {
      console.error('Error generating insights:', error);
      setAiInsights('Unable to generate AI insights at this time. Please try again later.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Session Not Found</h2>
            <p className="text-gray-400 mb-6">
              {error?.message || 'The requested session could not be found.'}
            </p>
            <Button
              onClick={() => setLocation('/cpr-monitoring')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Monitoring
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, events, teamMembers } = data;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          onClick={() => setLocation('/cpr-monitoring')}
          variant="outline"
          className="border-gray-700 text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Monitoring
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Session #{session.id}
            </h1>
            <p className="text-gray-400">
              Code: <span className="font-mono font-bold text-white">{session.sessionCode || 'N/A'}</span>
            </p>
          </div>
          <div className="text-right">
            {getOutcomeBadge(session.outcome)}
            <p className="text-gray-400 mt-2">
              Started: {formatTimestamp(session.startTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-2xl font-bold">{formatTime(session.totalDuration)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Patient Weight</p>
                <p className="text-2xl font-bold">{session.patientWeight ? `${session.patientWeight}kg` : 'N/A'}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Patient Age</p>
                <p className="text-2xl font-bold">{session.patientAgeMonths ? `${session.patientAgeMonths}mo` : 'N/A'}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Team Size</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Quality Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Compression Fraction */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Compression Fraction</p>
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {(() => {
                  const compressionEvents = events.filter(e => e.eventType === 'compression_cycle');
                  const totalDuration = session.totalDuration || 0;
                  if (totalDuration === 0) return 'N/A';
                  // Estimate: each compression cycle is 2 minutes
                  const compressionTime = compressionEvents.length * 120;
                  const fraction = Math.min(100, Math.round((compressionTime / totalDuration) * 100));
                  return `${fraction}%`;
                })()}
              </p>
              <p className="text-xs text-gray-500">Target: ≥80% (AHA)</p>
            </CardContent>
          </Card>

          {/* Time to First Epinephrine */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Time to 1st Epi</p>
                <Syringe className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {(() => {
                  const firstEpi = events.find(e => 
                    e.eventType === 'medication' && 
                    e.description?.toLowerCase().includes('epinephrine')
                  );
                  return firstEpi ? formatTime(firstEpi.eventTime) : 'N/A';
                })()}
              </p>
              <p className="text-xs text-gray-500">Target: &lt;3 min (AHA)</p>
            </CardContent>
          </Card>

          {/* Time to First Shock */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Time to 1st Shock</p>
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {(() => {
                  const firstShock = events.find(e => e.eventType === 'defibrillation');
                  return firstShock ? formatTime(firstShock.eventTime) : 'N/A';
                })()}
              </p>
              <p className="text-xs text-gray-500">Target: &lt;2 min (AHA)</p>
            </CardContent>
          </Card>
        </div>

        {/* Intervention Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {events.filter(e => e.eventType === 'defibrillation').length}
              </p>
              <p className="text-sm text-gray-400">Shocks</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Syringe className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {events.filter(e => 
                  e.eventType === 'medication' && 
                  e.description?.toLowerCase().includes('epinephrine')
                ).length}
              </p>
              <p className="text-sm text-gray-400">Epi Doses</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Wind className="h-6 w-6 text-teal-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {events.filter(e => e.eventType === 'airway').length}
              </p>
              <p className="text-sm text-gray-400">Airway Events</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {events.filter(e => e.eventType === 'compression_cycle').length}
              </p>
              <p className="text-sm text-gray-400">CPR Cycles</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Timeline */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Event Timeline ({events.length} events)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No events recorded</p>
                ) : (
                  events.map((event, index) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 bg-gray-700 rounded hover:bg-gray-650 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-white capitalize">
                            {event.eventType.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-400 font-mono">
                            {formatTime(event.eventTime)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-gray-300 text-sm">{event.description}</p>
                        )}
                        {event.value && (
                          <p className="text-gray-400 text-sm">Value: {event.value}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Team Members and AI Insights */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-6 w-6" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMembers.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No team members</p>
                ) : (
                  teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-gray-700 rounded"
                    >
                      <div className="font-semibold text-white">{member.providerName}</div>
                      <div className="text-sm text-gray-400 capitalize">{member.role}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Debriefing Insights */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                AI Debriefing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showAIInsights ? (
                <Button
                  onClick={handleGenerateInsights}
                  disabled={generatingInsights}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {generatingInsights ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate AI Insights'
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none text-sm">
                    <div className="whitespace-pre-wrap text-gray-300">
                      {aiInsights}
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={generatingInsights}
                    variant="outline"
                    className="w-full border-gray-600 text-white"
                  >
                    Regenerate Insights
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
