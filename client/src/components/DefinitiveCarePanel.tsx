/**
 * DefinitiveCarePanel — condition-based therapy walkthrough after primary survey.
 * Sourced from conditionProtocols / fellowship CST alignment.
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  SkipForward,
  RefreshCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from 'lucide-react';
import {
  type ActiveConditionState,
  type StepStatus,
  getProtocolProgress,
  updateConditionStep,
} from '@/lib/resus/conditionProtocols';
import { resolveDefinitiveCare } from '@/lib/resus/definitive-care-engine';
import type { ResusSession } from '@/lib/resus/abcdeEngine';

interface DefinitiveCarePanelProps {
  session: ResusSession;
}

export function DefinitiveCarePanel({ session }: DefinitiveCarePanelProps) {
  const weight = session.patientWeight ?? 10;
  const care = useMemo(
    () => resolveDefinitiveCare(session.definitiveDiagnosis, weight, session.patientAge),
    [session.definitiveDiagnosis, weight, session.patientAge]
  );

  const [stepState, setStepState] = useState<ActiveConditionState>(() => ({
    conditionId: 'septic_shock',
    startedAt: Date.now(),
    stepStatuses: {},
  }));
  const [expandedDoses, setExpandedDoses] = useState<Record<string, boolean>>({});

  if (!care) return null;

  const protocol = care.protocol;
  const progress = protocol ? getProtocolProgress(protocol, stepState) : null;

  function setStepStatus(stepId: string, status: StepStatus) {
    if (!protocol) return;
    setStepState((prev) => updateConditionStep(prev, stepId, status));
  }

  return (
    <Card className="bg-card border-primary/30 border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Stethoscope className="h-5 w-5 text-primary" />
          Definitive Care — {care.label}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Condition-based therapy aligned with fellowship micro-course teaching (10 mL/kg aliquots,
          reassess after each intervention, CST dosing).
        </p>
        {progress && (
          <div className="flex items-center gap-2 pt-2">
            <Progress value={progress.percent} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground shrink-0">
              {progress.completed}/{progress.total} steps
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {protocol ? (
          protocol.steps.map((step) => {
            const status = stepState.stepStatuses[step.id] ?? step.status;
            const isDone = status === 'done';
            const isReassess = step.isReassessment;
            return (
              <div
                key={step.id}
                className={`rounded-lg border p-3 ${
                  isDone
                    ? 'border-green-500/30 bg-green-500/5 opacity-75'
                    : isReassess
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : step.safetyWarning
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-border bg-accent/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : isReassess ? (
                    <RefreshCcw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : step.safetyWarning ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[9px] mb-1">
                      {step.phase}
                    </Badge>
                    <p className="text-sm font-medium text-foreground">{step.action}</p>
                    {step.rationale && (
                      <p className="text-[11px] text-muted-foreground mt-1">{step.rationale}</p>
                    )}
                    {step.safetyWarning && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {step.safetyWarning}
                      </p>
                    )}
                    {step.doses && step.doses.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-[10px] text-primary flex items-center gap-1"
                          onClick={() =>
                            setExpandedDoses((p) => ({ ...p, [step.id]: !p[step.id] }))
                          }
                        >
                          {expandedDoses[step.id] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          Doses ({weight} kg)
                        </button>
                        {expandedDoses[step.id] && (
                          <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                            {step.doses.map((d, i) => (
                              <li key={i}>
                                <strong className="text-foreground">{d.drug}</strong>: {d.calculated}{' '}
                                — {d.dose}
                                {d.notes ? ` (${d.notes})` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {!isDone && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setStepStatus(step.id, 'done')}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setStepStatus(step.id, 'skipped')}
                        >
                          <SkipForward className="h-3 w-3 mr-1" /> Skip
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
            {care.fallbackSteps.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}

        {protocol && protocol.keyPitfalls.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mt-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Key pitfalls</p>
            <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
              {protocol.keyPitfalls.slice(0, 3).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
