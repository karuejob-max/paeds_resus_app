/**
 * Diagnosis Card Component
 * 
 * Displays a single diagnosis with confidence level, supporting findings,
 * and targeted interventions.
 */

import { CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Diagnosis,
  DiagnosisConfidence,
  getConfidenceColorClass,
} from '@/lib/resus/multi-diagnosis';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  onResolve: (id: string) => void;
  onRemove: (id: string) => void;
  showDetails?: boolean;
}

export function DiagnosisCard({
  diagnosis,
  onResolve,
  onRemove,
  showDetails = true,
}: DiagnosisCardProps) {
  const colorClass = getConfidenceColorClass(diagnosis.confidence);

  const confidenceIcon = {
    definite: <CheckCircle2 className="h-4 w-4" />,
    likely: <AlertCircle className="h-4 w-4" />,
    consider: <HelpCircle className="h-4 w-4" />,
  };

  const confidenceLabel = {
    definite: 'Definite',
    likely: 'Likely',
    consider: 'Consider',
  };

  return (
    <Card className={`border ${colorClass}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          {/* Diagnosis Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {confidenceIcon[diagnosis.confidence]}
              <h3 className="font-medium capitalize">{diagnosis.condition}</h3>
              <Badge variant="outline" className="text-[10px]">
                {confidenceLabel[diagnosis.confidence]}
              </Badge>
            </div>

            {showDetails && (
              <div className="space-y-2 text-xs text-muted-foreground">
                {/* Supporting Findings */}
                {diagnosis.findings.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">Supporting Findings:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {diagnosis.findings.map((finding) => (
                        <Badge key={finding} variant="secondary" className="text-[9px]">
                          {finding.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Targeted Interventions */}
                {diagnosis.interventions.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">Interventions:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {diagnosis.interventions.map((intervention) => (
                        <Badge key={intervention} variant="outline" className="text-[9px]">
                          {intervention.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onResolve(diagnosis.id)}
              title="Mark as resolved"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onRemove(diagnosis.id)}
              title="Remove diagnosis"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
