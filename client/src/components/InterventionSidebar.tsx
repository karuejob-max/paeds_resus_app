/**
 * Immediate Intervention Sidebar
 * 
 * Persistent sidebar showing ongoing interventions that need monitoring.
 * Prevents forgetting critical interventions during resuscitation.
 * 
 * Features:
 * - Checklist of active interventions
 * - Status indicators (Started, In Progress, Completed)
 * - Time-based reminders
 * - Weight-based dosing calculators
 * - Real-time timer display
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Syringe,
  Droplet,
  Heart,
  Wind,
  X,
} from 'lucide-react';
import { timerService, type Intervention } from '@/lib/timerService';

export interface ActiveIntervention {
  id: string;
  title: string;
  category: Intervention['category'];
  status: 'started' | 'in_progress' | 'completed';
  dose?: string;
  route?: string;
  frequency?: string;
  nextDueTime?: number; // Seconds since timer start
  reminder?: string;
  details?: string;
}

interface InterventionSidebarProps {
  sessionId: string;
  patientWeight?: number;
  interventions: ActiveIntervention[];
  onInterventionStatusChange: (id: string, status: ActiveIntervention['status']) => void;
  onRemoveIntervention: (id: string) => void;
  className?: string;
}

export function InterventionSidebar({
  sessionId,
  patientWeight,
  interventions,
  onInterventionStatusChange,
  onRemoveIntervention,
  className = '',
}: InterventionSidebarProps) {
  const [timerState, setTimerState] = useState(timerService.getTimer(sessionId));

  // Update timer state every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState(timerService.getTimer(sessionId));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const getCategoryIcon = (category: Intervention['category']) => {
    switch (category) {
      case 'airway':
        return <Wind className="h-4 w-4" />;
      case 'breathing':
        return <Activity className="h-4 w-4" />;
      case 'circulation':
        return <Heart className="h-4 w-4" />;
      case 'medication':
        return <Syringe className="h-4 w-4" />;
      case 'procedure':
        return <Droplet className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: ActiveIntervention['status']) => {
    switch (status) {
      case 'started':
        return <Badge className="bg-yellow-600">Started</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600 animate-pulse">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
    }
  };

  const isReminderDue = (intervention: ActiveIntervention): boolean => {
    if (!intervention.nextDueTime) return false;
    return timerState.elapsedSeconds >= intervention.nextDueTime;
  };

  const activeInterventions = interventions.filter((i) => i.status !== 'completed');
  const completedInterventions = interventions.filter((i) => i.status === 'completed');

  return (
    <Card className={`p-4 space-y-4 bg-gray-800 border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-bold text-white">Active Interventions</h3>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Clock className="h-4 w-4" />
          <span className="font-mono text-lg">
            {timerService.formatTime(timerState.elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Patient Weight */}
      {patientWeight && (
        <div className="text-sm text-gray-400">
          Patient Weight: <span className="font-bold text-white">{patientWeight} kg</span>
        </div>
      )}

      {/* Active Interventions */}
      {activeInterventions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase">Ongoing</h4>
          {activeInterventions.map((intervention) => (
            <Card
              key={intervention.id}
              className={`p-3 space-y-2 ${
                isReminderDue(intervention)
                  ? 'bg-yellow-900 border-yellow-600 animate-pulse'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="mt-1">{getCategoryIcon(intervention.category)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{intervention.title}</div>
                    {intervention.dose && (
                      <div className="text-sm text-gray-300">
                        Dose: <span className="font-mono">{intervention.dose}</span>
                        {intervention.route && ` (${intervention.route})`}
                      </div>
                    )}
                    {intervention.frequency && (
                      <div className="text-sm text-gray-300">
                        Frequency: {intervention.frequency}
                      </div>
                    )}
                    {intervention.details && (
                      <div className="text-sm text-gray-400 mt-1">{intervention.details}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveIntervention(intervention.id)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Status Buttons */}
              <div className="flex items-center gap-2">
                {getStatusBadge(intervention.status)}
                {intervention.status !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const nextStatus =
                        intervention.status === 'started' ? 'in_progress' : 'completed';
                      onInterventionStatusChange(intervention.id, nextStatus);
                      if (nextStatus === 'completed') {
                        timerService.logIntervention(sessionId, {
                          action: `Completed: ${intervention.title}`,
                          category: intervention.category,
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {intervention.status === 'started' ? 'Mark In Progress' : 'Mark Completed'}
                  </Button>
                )}
              </div>

              {/* Reminder */}
              {isReminderDue(intervention) && intervention.reminder && (
                <div className="flex items-center gap-2 text-yellow-300 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold">{intervention.reminder}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          No active interventions. Add interventions as they are performed.
        </div>
      )}

      {/* Completed Interventions (Collapsed) */}
      {completedInterventions.length > 0 && (
        <details className="space-y-2">
          <summary className="text-sm font-semibold text-gray-400 uppercase cursor-pointer">
            Completed ({completedInterventions.length})
          </summary>
          <div className="space-y-2 mt-2">
            {completedInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className="flex items-center gap-2 text-sm text-gray-400 line-through"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{intervention.title}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Export Timeline Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const timeline = timerService.exportTimeline(sessionId);
          console.log(timeline);
          // TODO: Add export to file functionality
          alert('Timeline exported to console');
        }}
        className="w-full border-gray-600 text-white"
      >
        Export Timeline
      </Button>
    </Card>
  );
}
