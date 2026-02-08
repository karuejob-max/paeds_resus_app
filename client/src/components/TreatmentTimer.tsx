/**
 * TreatmentTimer - Universal treatment timer
 * 
 * Tracks elapsed time since treatment start for any emergency
 * (not just cardiac arrest). Extracted from DKA protocol.
 */

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  startTime: Date;
  label?: string;
  showMinutes?: boolean;
}

export function TreatmentTimer({ startTime, label = 'Time Elapsed', showMinutes = false }: Props) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffMins = Math.floor(diffMs / 1000 / 60);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      setElapsed({ hours, minutes });
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-400">{label}:</span>
      <Badge variant="outline" className="font-mono">
        {showMinutes 
          ? `${elapsed.hours}h ${elapsed.minutes}m`
          : `${elapsed.hours}h`
        }
      </Badge>
    </div>
  );
}
