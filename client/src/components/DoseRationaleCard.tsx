/**
 * Dose Rationale Card Component
 * 
 * Displays dose calculation with evidence-based explanation.
 * Expandable to show full rationale and alternatives.
 */

import { ChevronDown, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoseRationale, formatDoseRationale } from '@/lib/resus/dose-rationale';

interface DoseRationaleCardProps {
  rationale: DoseRationale;
}

export function DoseRationaleCard({ rationale }: DoseRationaleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">
              {rationale.drug} — {rationale.dose} {rationale.unit}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{rationale.guideline}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Calculation */}
        <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
          <p className="text-xs text-muted-foreground">Calculation</p>
          <p className="font-mono text-sm font-medium">{rationale.calculation}</p>
        </div>

        {/* Quick Rationale */}
        <p className="text-sm text-foreground">{rationale.rationale}</p>

        {/* Expandable Details */}
        {expanded && (
          <div className="space-y-3 pt-2 border-t">
            {/* Clinical Notes */}
            {rationale.notes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Clinical Notes</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {rationale.notes.map((note, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternatives */}
            {rationale.alternatives && rationale.alternatives.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-2">Alternatives</p>
                <div className="space-y-2">
                  {rationale.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="p-2 bg-amber-500/10 border border-amber-500/30 rounded"
                    >
                      <p className="text-xs font-medium">{alt.condition}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alt.dose} {alt.unit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{alt.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Text */}
            <div className="p-2 bg-muted rounded">
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Full Reference
              </p>
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-words">
                {formatDoseRationale(rationale)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
