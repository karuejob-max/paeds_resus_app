/**
 * InlineDoseCard - Display calculated medication doses inline
 * 
 * Non-blocking component that shows weight-based dosing calculations
 * without interrupting the GPS assessment flow.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Syringe, Info } from 'lucide-react';

interface DoseInfo {
  medication: string;
  dose: string;
  route: string;
  volume?: string;
  rationale?: string;
  maxDose?: string;
}

interface Props {
  doses: DoseInfo[];
  severity?: 'routine' | 'urgent' | 'critical';
  title?: string;
}

export function InlineDoseCard({ doses, severity = 'routine', title = 'Calculated Doses' }: Props) {
  const severityColors = {
    routine: 'bg-blue-900/30 border-blue-700',
    urgent: 'bg-orange-900/30 border-orange-700',
    critical: 'bg-red-900/30 border-red-700',
  };

  const badgeColors = {
    routine: 'bg-blue-600',
    urgent: 'bg-orange-600',
    critical: 'bg-red-600',
  };

  return (
    <Card className={`${severityColors[severity]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
          {severity !== 'routine' && (
            <Badge className={`${badgeColors[severity]} text-white`}>
              {severity.toUpperCase()}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {doses.map((dose, index) => (
            <div key={index} className="bg-black/20 p-3 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-white">{dose.medication}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-400">Dose:</span> {dose.dose}
                      {dose.maxDose && (
                        <span className="text-yellow-400 ml-2">(max: {dose.maxDose})</span>
                      )}
                    </p>
                    {dose.volume && (
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-400">Volume:</span> {dose.volume}
                      </p>
                    )}
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-400">Route:</span> {dose.route}
                    </p>
                  </div>
                </div>
              </div>
              {dose.rationale && (
                <div className="mt-2 flex items-start gap-2 text-xs text-blue-200 bg-blue-900/20 p-2 rounded">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{dose.rationale}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
