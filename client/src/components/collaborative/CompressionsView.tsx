/**
 * Compressions View
 * 
 * Optimized for the provider performing chest compressions.
 * - Large, visible timer for compression cycles
 * - Quick log compression cycle button
 * - Fatigue alerts (every 2 minutes)
 * - CPR quality reminders
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Activity, AlertCircle, CheckCircle2, Hand } from 'lucide-react';

interface CompressionsViewProps {
  sessionId: number;
  memberId: number;
  session: any;
  elapsedTime: number;
}

export function CompressionsView({
  sessionId,
  memberId,
  session,
  elapsedTime,
}: CompressionsViewProps) {
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);
  const [cycleElapsed, setCycleElapsed] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);

  const logEventMutation = trpc.cprSession.logEvent.useMutation();

  // Cycle timer
  useEffect(() => {
    if (cycleStartTime) {
      const interval = setInterval(() => {
        setCycleElapsed(Math.floor((Date.now() - cycleStartTime) / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [cycleStartTime]);

  const handleStartCycle = () => {
    setCycleStartTime(Date.now());
    setCycleElapsed(0);
  };

  const handleCompleteCycle = async () => {
    if (!cycleStartTime) return;

    const duration = Math.floor((Date.now() - cycleStartTime) / 1000);
    
    try {
      await logEventMutation.mutateAsync({
        sessionId,
        memberId,
        eventType: 'compression_cycle',
        eventTime: elapsedTime,
        description: `Compression cycle completed (${duration}s)`,
        value: `${duration} seconds`,
      });

      setTotalCycles(prev => prev + 1);
      setCycleStartTime(null);
      setCycleElapsed(0);
    } catch (error) {
      console.error('Failed to log compression cycle:', error);
    }
  };

  // Fatigue alert every 2 minutes
  const showFatigueAlert = elapsedTime > 0 && elapsedTime % 120 === 0;

  return (
    <div className="space-y-4">
      {/* Fatigue Alert */}
      {showFatigueAlert && (
        <Card className="bg-yellow-900/50 border-yellow-700">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-100 font-semibold">Switch Compressor</p>
              <p className="text-yellow-200 text-sm">2 minutes elapsed - rotate to prevent fatigue</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compression Timer */}
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-center justify-center">
            <Activity className="h-6 w-6 text-red-500" />
            Chest Compressions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Large Cycle Timer */}
          <div className="bg-gradient-to-br from-red-900 to-red-700 p-8 rounded-lg text-center">
            <p className="text-red-200 text-sm mb-2">Current Cycle</p>
            <div className="text-white font-mono text-7xl font-bold">
              {Math.floor(cycleElapsed / 60)}:{(cycleElapsed % 60).toString().padStart(2, '0')}
            </div>
            {cycleStartTime && cycleElapsed >= 120 && (
              <p className="text-yellow-300 text-sm mt-2 font-semibold animate-pulse">
                ⚠️ 2 minutes - Consider switching
              </p>
            )}
          </div>

          {/* Cycle Controls */}
          {!cycleStartTime ? (
            <Button
              onClick={handleStartCycle}
              className="w-full bg-green-600 hover:bg-green-700 py-8 text-2xl"
            >
              <Hand className="h-8 w-8 mr-3" />
              Start Compressions
            </Button>
          ) : (
            <Button
              onClick={handleCompleteCycle}
              disabled={logEventMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 py-8 text-2xl"
            >
              <CheckCircle2 className="h-8 w-8 mr-3" />
              {logEventMutation.isPending ? 'Logging...' : 'Complete Cycle'}
            </Button>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded text-center">
              <p className="text-gray-400 text-sm">Total Cycles</p>
              <p className="text-white text-3xl font-bold">{totalCycles}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded text-center">
              <p className="text-gray-400 text-sm">Session Time</p>
              <p className="text-white text-3xl font-bold">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CPR Quality Reminders */}
      <Card className="bg-blue-900/30 border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-100 text-lg">Quality Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-100 text-sm">
              <strong>Rate:</strong> 100-120 compressions per minute
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-100 text-sm">
              <strong>Depth:</strong> At least 1/3 chest depth (5cm for child, 4cm for infant)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-100 text-sm">
              <strong>Recoil:</strong> Allow complete chest recoil between compressions
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-100 text-sm">
              <strong>Minimize interruptions:</strong> Pause only for ventilations and rhythm checks
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
