/**
 * Team Leader View
 * 
 * Full visibility and control over the resuscitation.
 * - See all team members and their roles
 * - View real-time event timeline
 * - Monitor CPR quality metrics
 * - End session and declare outcome
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { 
  Users, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Heart
} from 'lucide-react';

interface TeamLeaderViewProps {
  sessionId: number;
  session: any;
  teamMembers: any[];
  events: any[];
  elapsedTime: number;
}

export function TeamLeaderView({
  sessionId,
  session,
  teamMembers,
  events,
  elapsedTime,
}: TeamLeaderViewProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');

  const endSessionMutation = trpc.cprSession.endSession.useMutation();

  const handleEndSession = async () => {
    if (!selectedOutcome) return;

    try {
      await endSessionMutation.mutateAsync({
        sessionId,
        outcome: selectedOutcome as any,
        totalDuration: elapsedTime,
      });
      // Redirect to session details/debriefing
      window.location.href = `/cpr-monitoring/session/${sessionId}`;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'team_leader': return 'bg-purple-600';
      case 'compressions': return 'bg-red-600';
      case 'airway': return 'bg-blue-600';
      case 'iv_access': return 'bg-green-600';
      case 'medications': return 'bg-yellow-600';
      case 'recorder': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'team_leader': return 'Team Leader';
      case 'compressions': return 'Compressions';
      case 'airway': return 'Airway';
      case 'iv_access': return 'IV/IO Access';
      case 'medications': return 'Medications';
      case 'recorder': return 'Recorder';
      case 'observer': return 'Observer';
      default: return role;
    }
  };

  const formatEventTime = (eventTime: number) => {
    const mins = Math.floor(eventTime / 60);
    const secs = eventTime % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Team Roster */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-blue-500" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-800 p-3 rounded border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{member.providerName}</span>
                  {member.leftAt && (
                    <Badge className="bg-gray-600">Left</Badge>
                  )}
                </div>
                <Badge className={`${getRoleBadgeColor(member.role)} text-white text-xs`}>
                  {getRoleLabel(member.role)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-green-500" />
            Event Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No events logged yet</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-3 rounded border border-gray-700 flex items-start gap-3"
                >
                  <span className="text-blue-400 font-mono text-sm flex-shrink-0">
                    {formatEventTime(event.eventTime || 0)}
                  </span>
                  <div className="flex-1">
                    <p className="text-white text-sm">{event.description}</p>
                    {event.value && (
                      <p className="text-gray-400 text-xs mt-1">{event.value}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="h-5 w-5 text-red-500" />
            Session Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">Patient Weight</p>
              <p className="text-white text-2xl font-bold">{session.patientWeight} kg</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="text-white text-2xl font-bold">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          {!showEndDialog ? (
            <Button
              onClick={() => setShowEndDialog(true)}
              className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg"
            >
              End Resuscitation
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-white font-semibold">Declare Outcome:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setSelectedOutcome('ROSC')}
                  variant={selectedOutcome === 'ROSC' ? 'default' : 'outline'}
                  className={`h-auto py-4 flex flex-col items-center ${
                    selectedOutcome === 'ROSC'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <CheckCircle2 className="h-6 w-6 mb-1" />
                  <span className="text-sm font-semibold">ROSC</span>
                  <span className="text-xs opacity-80">Return of Spontaneous Circulation</span>
                </Button>

                <Button
                  onClick={() => setSelectedOutcome('pCOSCA')}
                  variant={selectedOutcome === 'pCOSCA' ? 'default' : 'outline'}
                  className={`h-auto py-4 flex flex-col items-center ${
                    selectedOutcome === 'pCOSCA'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <AlertTriangle className="h-6 w-6 mb-1" />
                  <span className="text-sm font-semibold">pCOSCA</span>
                  <span className="text-xs opacity-80">Pediatric Cardiac Arrest</span>
                </Button>

                <Button
                  onClick={() => setSelectedOutcome('mortality')}
                  variant={selectedOutcome === 'mortality' ? 'default' : 'outline'}
                  className={`h-auto py-4 flex flex-col items-center ${
                    selectedOutcome === 'mortality'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <XCircle className="h-6 w-6 mb-1" />
                  <span className="text-sm font-semibold">Mortality</span>
                  <span className="text-xs opacity-80">Resuscitation Ceased</span>
                </Button>

                <Button
                  onClick={() => setSelectedOutcome('ongoing')}
                  variant={selectedOutcome === 'ongoing' ? 'default' : 'outline'}
                  className={`h-auto py-4 flex flex-col items-center ${
                    selectedOutcome === 'ongoing'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Clock className="h-6 w-6 mb-1" />
                  <span className="text-sm font-semibold">Ongoing</span>
                  <span className="text-xs opacity-80">Still in Progress</span>
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowEndDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndSession}
                  disabled={!selectedOutcome || endSessionMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {endSessionMutation.isPending ? 'Ending...' : 'Confirm & End'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
