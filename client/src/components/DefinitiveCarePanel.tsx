/**

 * DefinitiveCarePanel — condition-based therapy walkthrough after primary survey.

 * Fellowship Pillar B credit gates on completing all required steps here.

 */



import { useEffect, useMemo, useState } from 'react';

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

  GraduationCap,

} from 'lucide-react';

import { type StepStatus } from '@/lib/resus/conditionProtocols';

import {

  resolveDefinitiveCare,

  type DefinitiveCareFallbackStep,

} from '@/lib/resus/definitive-care-engine';

import { computeDefinitiveCareStepProgress } from '@shared/definitive-care-completion';

import type { ResusSession } from '@/lib/resus/abcdeEngine';



interface DefinitiveCarePanelProps {

  session: ResusSession;

  onStepChange: (stepId: string, status: 'done' | 'skipped') => void;

  onComplete: () => void;

}



function FallbackStepCard({

  step,

  status,

  onDone,

  onSkip,

}: {

  step: DefinitiveCareFallbackStep;

  status: StepStatus;

  onDone: () => void;

  onSkip: () => void;

}) {

  const isDone = status === 'done' || status === 'skipped';

  const isReassess = step.isReassessment;



  return (

    <div

      className={`rounded-lg border p-3 ${

        isDone

          ? 'border-green-500/30 bg-green-500/5 opacity-75'

          : isReassess

            ? 'border-blue-500/30 bg-blue-500/5'

            : step.safetyWarning

              ? 'border-red-500/30 bg-red-500/5'

              : step.isCoDiagnosis

                ? 'border-amber-500/30 bg-amber-500/5'

                : step.isDischarge

                  ? 'border-emerald-500/30 bg-emerald-500/5'

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

          {!isDone && (

            <div className="flex gap-1 mt-2 flex-wrap">

              <Button size="sm" className="h-7 text-xs" onClick={onDone}>

                <CheckCircle2 className="h-3 w-3 mr-1" /> Done

              </Button>

              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onSkip}>

                <SkipForward className="h-3 w-3 mr-1" /> Skip

              </Button>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}



export function DefinitiveCarePanel({ session, onStepChange, onComplete }: DefinitiveCarePanelProps) {

  const weight = session.patientWeight ?? 10;

  const care = useMemo(

    () =>

      resolveDefinitiveCare(

        session.definitiveDiagnosis,

        weight,

        session.patientAge,

        session.concurrentDiagnoses ?? []

      ),

    [session.definitiveDiagnosis, session.concurrentDiagnoses, weight, session.patientAge]

  );



  const [expandedDoses, setExpandedDoses] = useState<Record<string, boolean>>({});



  const stepStatuses = session.definitiveCareProgress?.stepStatuses ?? {};



  const progress = useMemo(() => {

    if (!care) return null;

    return computeDefinitiveCareStepProgress(care.allSteps, stepStatuses);

  }, [care, stepStatuses]);



  const isComplete = Boolean(session.definitiveCareProgress?.completedAt) || progress?.isComplete;



  useEffect(() => {

    if (progress?.isComplete && !session.definitiveCareProgress?.completedAt) {

      onComplete();

    }

  }, [progress?.isComplete, session.definitiveCareProgress?.completedAt, onComplete]);



  if (!care) return null;



  const protocol = care.protocol;



  function getStepStatus(stepId: string): StepStatus {

    return stepStatuses[stepId] ?? 'pending';

  }



  return (

    <Card className="bg-card border-primary/30 border-2">

      <CardHeader className="pb-2">

        <CardTitle className="text-base flex items-center gap-2 text-foreground">

          <Stethoscope className="h-5 w-5 text-primary" />

          Definitive Care — {care.label}

        </CardTitle>

        <p className="text-xs text-muted-foreground">

          Complete condition-specific therapy before fellowship credit. Aligned with ISPAD / WHO / AHA

          guidelines and fellowship micro-course teaching.

        </p>

        {progress && (

          <div className="flex items-center gap-2 pt-2">

            <Progress value={progress.percent} className="h-1.5 flex-1" />

            <span className="text-[10px] text-muted-foreground shrink-0">

              {progress.completed}/{progress.total} steps

            </span>

          </div>

        )}

        {isComplete && (

          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">

            <GraduationCap className="h-4 w-4" />

            Definitive care complete — fellowship credit now available

          </div>

        )}

      </CardHeader>

      <CardContent className="space-y-3">

        {protocol ? (

          protocol.steps.map((step) => {

            const status = getStepStatus(step.id);

            const isDone = status === 'done' || status === 'skipped';

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

                          onClick={() => onStepChange(step.id, 'done')}

                        >

                          <CheckCircle2 className="h-3 w-3 mr-1" /> Done

                        </Button>

                        <Button

                          size="sm"

                          variant="outline"

                          className="h-7 text-xs"

                          onClick={() => onStepChange(step.id, 'skipped')}

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

          care.fallbackSteps.map((step) => (

            <FallbackStepCard

              key={step.id}

              step={step}

              status={getStepStatus(step.id)}

              onDone={() => onStepChange(step.id, 'done')}

              onSkip={() => onStepChange(step.id, 'skipped')}

            />

          ))

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



        {!isComplete && progress && progress.total > 0 && (

          <Button

            className="w-full mt-2"

            variant="secondary"

            disabled={!progress.isComplete}

            onClick={onComplete}

          >

            Mark definitive care complete

          </Button>

        )}

      </CardContent>

    </Card>

  );

}


