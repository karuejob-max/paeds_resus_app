/**
 * Medications View
 * 
 * Optimized for the provider preparing and administering medications.
 * - Weight-based dosing calculator
 * - Quick log medication administration
 * - Dosing intervals and timing
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Syringe, Clock, AlertCircle } from 'lucide-react';

interface MedicationsViewProps {
  sessionId: number;
  memberId: number;
  session: any;
  elapsedTime: number;
}

export function MedicationsView({
  sessionId,
  memberId,
  session,
  elapsedTime,
}: MedicationsViewProps) {
  const [lastEpiTime, setLastEpiTime] = useState<number | null>(null);

  const logEventMutation = trpc.cprSession.logEvent.useMutation();

  const patientWeight = parseFloat(session.patientWeight) || 10;

  const medications = [
    {
      name: 'Epinephrine',
      dose: 0.01,
      unit: 'mg/kg',
      maxDose: null,
      route: 'IV/IO',
      interval: 180, // 3-5 minutes
      concentration: '1:10,000 (0.1 mg/mL)',
      calculation: (patientWeight * 0.01).toFixed(2),
      volume: (patientWeight * 0.01 / 0.1).toFixed(1),
    },
    {
      name: 'Amiodarone',
      dose: 5,
      unit: 'mg/kg',
      maxDose: 300,
      route: 'IV/IO',
      interval: null,
      concentration: '50 mg/mL',
      calculation: Math.min(patientWeight * 5, 300).toFixed(0),
      volume: (Math.min(patientWeight * 5, 300) / 50).toFixed(1),
    },
    {
      name: 'Atropine',
      dose: 0.02,
      unit: 'mg/kg',
      maxDose: 0.5,
      route: 'IV/IO',
      interval: null,
      concentration: '0.1 mg/mL',
      calculation: Math.min(patientWeight * 0.02, 0.5).toFixed(2),
      volume: (Math.min(patientWeight * 0.02, 0.5) / 0.1).toFixed(1),
    },
    {
      name: 'Calcium Chloride',
      dose: 20,
      unit: 'mg/kg',
      maxDose: 2000,
      route: 'IV/IO (slow push)',
      interval: null,
      concentration: '100 mg/mL (10%)',
      calculation: Math.min(patientWeight * 20, 2000).toFixed(0),
      volume: (Math.min(patientWeight * 20, 2000) / 100).toFixed(1),
    },
    {
      name: 'Sodium Bicarbonate',
      dose: 1,
      unit: 'mEq/kg',
      maxDose: 50,
      route: 'IV/IO (slow push)',
      interval: null,
      concentration: '1 mEq/mL (8.4%)',
      calculation: Math.min(patientWeight * 1, 50).toFixed(0),
      volume: Math.min(patientWeight * 1, 50).toFixed(1),
    },
  ];

  const handleLogMedication = async (med: typeof medications[0]) => {
    try {
      await logEventMutation.mutateAsync({
        sessionId,
        memberId,
        eventType: 'medication',
        eventTime: elapsedTime,
        description: `${med.name} administered`,
        value: `${med.calculation} ${med.unit.includes('mEq') ? 'mEq' : 'mg'} (${med.volume} mL) ${med.route}`,
        metadata: JSON.stringify({
          medication: med.name,
          dose: med.calculation,
          volume: med.volume,
          route: med.route,
          weight: patientWeight,
        }),
      });

      if (med.name === 'Epinephrine') {
        setLastEpiTime(elapsedTime);
      }
    } catch (error) {
      console.error('Failed to log medication:', error);
    }
  };

  // Calculate time since last epinephrine
  const timeSinceLastEpi = lastEpiTime !== null ? elapsedTime - lastEpiTime : null;
  const showEpiReminder = timeSinceLastEpi !== null && timeSinceLastEpi >= 180;

  return (
    <div className="space-y-4">
      {/* Epinephrine Reminder */}
      {showEpiReminder && (
        <Card className="bg-yellow-900/50 border-yellow-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-100 font-semibold">Epinephrine Due</p>
              <p className="text-yellow-200 text-sm">
                {Math.floor(timeSinceLastEpi! / 60)} minutes since last dose
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Info */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Syringe className="h-6 w-6 text-green-500" />
            Medication Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-900/30 border border-blue-700 p-4 rounded mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-sm">Patient Weight</p>
                <p className="text-white text-2xl font-bold">{patientWeight} kg</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Elapsed Time</p>
                <p className="text-white text-2xl font-bold">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>

          {/* Medications List */}
          <div className="space-y-3">
            {medications.map((med) => (
              <div
                key={med.name}
                className="bg-gray-800 border border-gray-700 rounded p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">{med.name}</h3>
                    <p className="text-gray-400 text-sm">{med.route}</p>
                  </div>
                  <Button
                    onClick={() => handleLogMedication(med)}
                    disabled={logEventMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {logEventMutation.isPending ? 'Logging...' : 'Log Given'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Dose</p>
                    <p className="text-white font-semibold">
                      {med.calculation} {med.unit.includes('mEq') ? 'mEq' : 'mg'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {med.dose} {med.unit}
                      {med.maxDose && ` (max ${med.maxDose})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Volume</p>
                    <p className="text-white font-semibold">{med.volume} mL</p>
                    <p className="text-gray-500 text-xs">{med.concentration}</p>
                  </div>
                </div>

                {med.interval && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-yellow-300">
                    <Clock className="h-3 w-3" />
                    <span>Repeat every {med.interval / 60} minutes</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Reminders */}
      <Card className="bg-red-900/30 border-red-700">
        <CardHeader>
          <CardTitle className="text-red-100 text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Safety Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-red-100">✓ Verify patient weight before calculating doses</p>
          <p className="text-red-100">✓ Double-check calculations with another provider</p>
          <p className="text-red-100">✓ Confirm medication concentration before drawing</p>
          <p className="text-red-100">✓ Announce medication name, dose, and route before giving</p>
          <p className="text-red-100">✓ Flush IV line after each medication</p>
        </CardContent>
      </Card>
    </div>
  );
}
