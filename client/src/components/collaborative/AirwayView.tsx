/**
 * Airway View
 * 
 * Optimized for the provider managing airway and ventilation.
 * - Quick log airway interventions
 * - Equipment tracking (BVM, ETT, LMA, etc.)
 * - Ventilation reminders
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Wind, CheckCircle2, AlertCircle } from 'lucide-react';

interface AirwayViewProps {
  sessionId: number;
  memberId: number;
  session: any;
  elapsedTime: number;
}

export function AirwayView({
  sessionId,
  memberId,
  session,
  elapsedTime,
}: AirwayViewProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<string>('');

  const logEventMutation = trpc.cprSession.logEvent.useMutation();

  const airwayInterventions = [
    { value: 'bvm', label: 'BVM Ventilation', description: 'Bag-valve-mask ventilation' },
    { value: 'ett', label: 'ETT Placement', description: 'Endotracheal intubation' },
    { value: 'lma', label: 'LMA Placement', description: 'Laryngeal mask airway' },
    { value: 'igel', label: 'i-gel Placement', description: 'Supraglottic airway device' },
    { value: 'oropharyngeal', label: 'OPA Inserted', description: 'Oropharyngeal airway' },
    { value: 'nasopharyngeal', label: 'NPA Inserted', description: 'Nasopharyngeal airway' },
    { value: 'suction', label: 'Suctioning', description: 'Airway suctioning performed' },
    { value: 'oxygen', label: 'Oxygen Applied', description: 'Supplemental oxygen' },
  ];

  const handleLogIntervention = async (intervention: typeof airwayInterventions[0]) => {
    try {
      await logEventMutation.mutateAsync({
        sessionId,
        memberId,
        eventType: 'airway',
        eventTime: elapsedTime,
        description: intervention.label,
        value: intervention.description,
      });
      setSelectedIntervention('');
    } catch (error) {
      console.error('Failed to log airway intervention:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Airway Management */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wind className="h-6 w-6 text-blue-500" />
            Airway Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
            <p className="text-blue-100 text-sm mb-2">
              <strong>Current Time:</strong> {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-blue-100 text-sm">
              <strong>Patient Weight:</strong> {session.patientWeight} kg
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-white font-semibold">Log Airway Intervention:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {airwayInterventions.map((intervention) => (
                <Button
                  key={intervention.value}
                  onClick={() => handleLogIntervention(intervention)}
                  disabled={logEventMutation.isPending}
                  className="h-auto py-4 px-4 flex flex-col items-start bg-gray-800 hover:bg-gray-700 text-left"
                >
                  <span className="font-semibold text-sm text-white">{intervention.label}</span>
                  <span className="text-xs text-gray-400">{intervention.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ventilation Reminders */}
      <Card className="bg-blue-900/30 border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-100 text-lg">Ventilation Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-100 text-sm font-semibold">Rate: 1 breath every 6 seconds (10/min)</p>
              <p className="text-blue-200 text-xs">During CPR with advanced airway</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-100 text-sm font-semibold">Ratio: 30:2 (compressions:breaths)</p>
              <p className="text-blue-200 text-xs">Single rescuer or without advanced airway</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-100 text-sm font-semibold">Ratio: 15:2 (compressions:breaths)</p>
              <p className="text-blue-200 text-xs">Two rescuers (pediatric/neonatal)</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-100 text-sm font-semibold">Avoid hyperventilation</p>
              <p className="text-blue-200 text-xs">Excessive ventilation decreases cardiac output</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-100 text-sm font-semibold">Chest rise with each breath</p>
              <p className="text-blue-200 text-xs">Visible chest rise indicates adequate volume</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ETT Size Reference */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">ETT Size Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="bg-gray-800 p-3 rounded flex justify-between">
              <span className="text-gray-300 text-sm">Newborn (term)</span>
              <span className="text-white font-semibold">3.5 mm</span>
            </div>
            <div className="bg-gray-800 p-3 rounded flex justify-between">
              <span className="text-gray-300 text-sm">1-6 months</span>
              <span className="text-white font-semibold">3.5-4.0 mm</span>
            </div>
            <div className="bg-gray-800 p-3 rounded flex justify-between">
              <span className="text-gray-300 text-sm">6-12 months</span>
              <span className="text-white font-semibold">4.0 mm</span>
            </div>
            <div className="bg-gray-800 p-3 rounded flex justify-between">
              <span className="text-gray-300 text-sm">1-2 years</span>
              <span className="text-white font-semibold">4.5 mm</span>
            </div>
            <div className="bg-gray-800 p-3 rounded flex justify-between">
              <span className="text-gray-300 text-sm">Formula (age &gt; 2)</span>
              <span className="text-white font-semibold">(Age/4) + 4 mm</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
