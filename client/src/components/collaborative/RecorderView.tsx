/**
 * Recorder View
 * 
 * Optimized for the provider documenting the resuscitation.
 * - Complete event timeline with timestamps
 * - Quick add custom notes
 * - Export functionality
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { FileText, Plus, Download, Clock } from 'lucide-react';

interface RecorderViewProps {
  sessionId: number;
  memberId: number;
  session: any;
  teamMembers: any[];
  events: any[];
  elapsedTime: number;
  readOnly?: boolean;
}

export function RecorderView({
  sessionId,
  memberId,
  session,
  teamMembers,
  events,
  elapsedTime,
  readOnly = false,
}: RecorderViewProps) {
  const [noteText, setNoteText] = useState('');

  const logEventMutation = trpc.cprSession.logEvent.useMutation();

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      await logEventMutation.mutateAsync({
        sessionId,
        memberId,
        eventType: 'note',
        eventTime: elapsedTime,
        description: noteText.trim(),
      });
      setNoteText('');
    } catch (error) {
      console.error('Failed to log note:', error);
    }
  };

  const formatEventTime = (eventTime: number) => {
    const mins = Math.floor(eventTime / 60);
    const secs = eventTime % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'compression_cycle': return '🫀';
      case 'medication': return '💉';
      case 'defibrillation': return '⚡';
      case 'airway': return '🫁';
      case 'note': return '📝';
      case 'outcome': return '✅';
      default: return '•';
    }
  };

  const handleExport = () => {
    const exportData = {
      session: {
        code: session.sessionCode,
        startTime: session.startTime,
        patientWeight: session.patientWeight,
        duration: elapsedTime,
      },
      teamMembers: teamMembers.map(m => ({
        name: m.providerName,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      events: events.map(e => ({
        time: formatEventTime(e.eventTime || 0),
        type: e.eventType,
        description: e.description,
        value: e.value,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resus-session-${session.sessionCode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Session Info */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-6 w-6 text-blue-500" />
              Documentation
            </CardTitle>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="bg-gray-800 hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-xs">Session Code</p>
              <p className="text-white font-mono font-bold">{session.sessionCode}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-xs">Patient Weight</p>
              <p className="text-white font-bold">{session.patientWeight} kg</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-xs">Duration</p>
              <p className="text-white font-bold">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div className="space-y-2">
              <p className="text-white text-sm font-semibold">Add Custom Note:</p>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter observation, vital signs, or other notes..."
                className="bg-gray-800 border-gray-600 text-white min-h-20"
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteText.trim() || logEventMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {logEventMutation.isPending ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-green-500" />
            Event Timeline ({events.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No events logged yet</p>
                <p className="text-gray-500 text-sm">Events will appear here as the team logs them</p>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className="bg-gray-800 border border-gray-700 rounded p-3 flex items-start gap-3"
                >
                  <span className="text-2xl flex-shrink-0">{getEventIcon(event.eventType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400 font-mono text-sm font-bold">
                        {formatEventTime(event.eventTime || 0)}
                      </span>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">
                        {event.eventType.replace('_', ' ')}
                      </span>
                    </div>
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

      {/* Team Roster */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Team Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-800 p-3 rounded flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold">{member.providerName}</p>
                  <p className="text-gray-400 text-xs capitalize">{member.role.replace('_', ' ')}</p>
                </div>
                {member.leftAt && (
                  <span className="text-gray-500 text-xs">Left session</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
