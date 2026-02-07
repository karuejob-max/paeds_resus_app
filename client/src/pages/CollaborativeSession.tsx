/**
 * Collaborative Session Page
 * 
 * Main view for collaborative resuscitation sessions.
 * Displays role-specific interface based on team member's assigned role.
 * Polls for real-time updates from other team members.
 */

import { useState, useEffect } from 'react';
import { useParams, useSearch, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Clock, Heart, X, AlertCircle } from 'lucide-react';

// Import role-specific components
import { TeamLeaderView } from '@/components/collaborative/TeamLeaderView';
import { CompressionsView } from '@/components/collaborative/CompressionsView';
import { AirwayView } from '@/components/collaborative/AirwayView';
import { MedicationsView } from '@/components/collaborative/MedicationsView';
import { RecorderView } from '@/components/collaborative/RecorderView';

export default function CollaborativeSession() {
  const params = useParams();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  
  const sessionId = parseInt(params.id || '0');
  const urlParams = new URLSearchParams(searchParams);
  const role = urlParams.get('role') || 'observer';
  const memberId = parseInt(urlParams.get('memberId') || '0');

  const [elapsedTime, setElapsedTime] = useState(0);

  // Poll for session updates every 3 seconds
  const { data: sessionData, isLoading, error } = trpc.cprSession.getSession.useQuery(
    { sessionId },
    {
      refetchInterval: 3000, // Poll every 3 seconds
      enabled: sessionId > 0,
    }
  );

  // Timer
  useEffect(() => {
    if (sessionData?.session) {
      const startTime = new Date(sessionData.session.startTime).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionData?.session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-900/95 border-gray-700">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-white text-lg">Loading session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-900/95 border-gray-700 max-w-md">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-white text-lg text-center">Session not found or has ended</p>
            <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-700">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, teamMembers, events } = sessionData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      {/* Global Header */}
      <div className="bg-black/50 border-b border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h1 className="text-white font-bold text-lg">Collaborative Resuscitation</h1>
              <p className="text-gray-400 text-sm">Session: {session.sessionCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 bg-red-900/50 px-4 py-2 rounded">
              <Clock className="h-5 w-5 text-red-400" />
              <span className="text-white font-mono text-xl">{formatTime(elapsedTime)}</span>
            </div>

            {/* Current Role */}
            <Badge className={`${getRoleBadgeColor(role)} text-white px-3 py-1`}>
              {getRoleLabel(role)}
            </Badge>

            {/* Team Count */}
            <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-white text-sm">{teamMembers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Content */}
      <div className="container mx-auto p-4">
        {role === 'team_leader' && (
          <TeamLeaderView
            sessionId={sessionId}
            session={session}
            teamMembers={teamMembers}
            events={events}
            elapsedTime={elapsedTime}
          />
        )}

        {role === 'compressions' && (
          <CompressionsView
            sessionId={sessionId}
            memberId={memberId}
            session={session}
            elapsedTime={elapsedTime}
          />
        )}

        {role === 'airway' && (
          <AirwayView
            sessionId={sessionId}
            memberId={memberId}
            session={session}
            elapsedTime={elapsedTime}
          />
        )}

        {(role === 'medications' || role === 'iv_access') && (
          <MedicationsView
            sessionId={sessionId}
            memberId={memberId}
            session={session}
            elapsedTime={elapsedTime}
          />
        )}

        {role === 'recorder' && (
          <RecorderView
            sessionId={sessionId}
            memberId={memberId}
            session={session}
            teamMembers={teamMembers}
            events={events}
            elapsedTime={elapsedTime}
          />
        )}

        {role === 'observer' && (
          <Card className="bg-gray-900/95 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Observer View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                You are observing this resuscitation session. You can see the event timeline but cannot make changes.
              </p>
              <RecorderView
                sessionId={sessionId}
                memberId={memberId}
                session={session}
                teamMembers={teamMembers}
                events={events}
                elapsedTime={elapsedTime}
                readOnly
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
