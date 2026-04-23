/**
 * ConditionProtocolSheet
 *
 * Bedside step-by-step protocol panel for condition-specific emergencies.
 * Activated from ResusGPS when a condition is selected.
 *
 * Features:
 *  - Sequential step checklist with Done / Skip / Reassess actions
 *  - Weight-based doses pre-calculated and displayed inline
 *  - Phase grouping (Immediate / Escalation / Refractory)
 *  - Safety warnings highlighted in red
 *  - Reassessment checkpoints visually distinct
 *  - Progress bar
 *  - Monitoring targets and key pitfalls accessible via tabs
 *  - Fully offline — no network calls
 */

import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  SkipForward,
  RefreshCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pill,
  Target,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import {
  type ConditionProtocol,
  type ActiveConditionState,
  type StepStatus,
  type ExtendedConditionId,
  updateConditionStep,
  getProtocolProgress,
  buildExtendedProtocol,
  EXTENDED_PROTOCOL_LIST,
  PROTOCOL_META,
} from '@/lib/resus/conditionProtocols';
import { getAgeCategory } from '@/lib/resus/abcdeEngine';
import type { ResusSession } from '@/lib/resus/abcdeEngine';

// ─── Props ───────────────────────────────────────────────────

interface ConditionProtocolSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ResusSession;
  initialConditionId?: ExtendedConditionId;
  /** Called whenever a step is marked done — provides condition + step counts for Fellowship Pillar B credit */
  onProtocolProgress?: (conditionId: ExtendedConditionId, completedSteps: number, totalSteps: number) => void;
}

// ─── Component ───────────────────────────────────────────────

export function ConditionProtocolSheet({
  open,
  onOpenChange,
  session,
  initialConditionId,
  onProtocolProgress,
}: ConditionProtocolSheetProps) {
  const weight = session.patientWeight ?? 10;
  const ageCategory = getAgeCategory(session.patientAge);

  const [selectedCondition, setSelectedCondition] = useState<ExtendedConditionId>(
    initialConditionId ?? 'septic_shock'
  );
  const [conditionStates, setConditionStates] = useState<Record<ExtendedConditionId, ActiveConditionState>>(
    Object.fromEntries(
      EXTENDED_PROTOCOL_LIST.map(id => [id, { conditionId: id, startedAt: Date.now(), stepStatuses: {} }])
    ) as Record<ExtendedConditionId, ActiveConditionState>
  );
  const [expandedDoses, setExpandedDoses] = useState<Record<string, boolean>>({});

  const protocol: ConditionProtocol = useMemo(
    () => buildExtendedProtocol(selectedCondition, weight, ageCategory),
    [selectedCondition, weight, ageCategory]
  );

  const activeState = conditionStates[selectedCondition];
  const progress = getProtocolProgress(protocol, activeState);

  function setStepStatus(stepId: string, status: StepStatus) {
    setConditionStates(prev => {
      const next = {
        ...prev,
        [selectedCondition]: updateConditionStep(prev[selectedCondition], stepId, status),
      };
      // Fire fellowship credit callback when a step is completed
      if (status === 'done' && onProtocolProgress) {
        const updatedState = next[selectedCondition];
        const completedCount = Object.values(updatedState.stepStatuses).filter(s => s === 'done').length;
        onProtocolProgress(selectedCondition, completedCount, protocol.steps.length);
      }
      return next;
    });
  }

  function toggleDoses(stepId: string) {
    setExpandedDoses(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  }

  function resetProtocol() {
    setConditionStates(prev => ({
      ...prev,
      [selectedCondition]: {
        conditionId: selectedCondition,
        startedAt: Date.now(),
        stepStatuses: {},
      },
    }));
    setExpandedDoses({});
  }

  // Group steps by phase
  const stepsByPhase = useMemo(() => {
    const phases: Record<string, typeof protocol.steps> = {};
    for (const step of protocol.steps) {
      if (!phases[step.phase]) phases[step.phase] = [];
      phases[step.phase].push(step);
    }
    return phases;
  }, [protocol]);

  const conditionOptions: { id: ExtendedConditionId; label: string; icon: string; color: string }[] = [
    { id: 'septic_shock',       label: 'Septic Shock',       icon: '🦠', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { id: 'status_epilepticus', label: 'Status Epilepticus', icon: '⚡', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { id: 'dka',                label: 'DKA',                icon: '🩸', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { id: 'nrp',                label: 'NRP (Neonatal)',     icon: '👶', color: 'bg-pink-100 text-pink-700 border-pink-300' },
    { id: 'anaphylaxis',        label: 'Anaphylaxis',        icon: '⚡', color: 'bg-red-100 text-red-700 border-red-300' },
    { id: 'severe_asthma',      label: 'Severe Asthma',     icon: '🫁', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-primary" />
              Condition Protocols
            </SheetTitle>
            <Badge variant="outline" className="text-xs">
              {weight} kg · {ageCategory}
            </Badge>
          </div>
          <SheetDescription className="text-xs">
            Step-by-step bedside protocols with weight-based doses
          </SheetDescription>

          {/* Condition selector */}
          <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
            {conditionOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedCondition(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all ${
                  selectedCondition === opt.id
                    ? opt.color + ' shadow-sm'
                    : 'bg-muted text-muted-foreground border-transparent'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <Tabs defaultValue="steps" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-4 mt-2 shrink-0 grid grid-cols-3">
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="pitfalls">Pitfalls</TabsTrigger>
          </TabsList>

          {/* ── Steps Tab ── */}
          <TabsContent value="steps" className="flex flex-col flex-1 min-h-0 mt-0">
            {/* Progress bar */}
            <div className="px-4 py-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{progress.completed} / {progress.total} steps complete</span>
                <button
                  onClick={resetProtocol}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <Progress value={progress.percent} className="h-1.5" />
            </div>

            <ScrollArea className="flex-1 px-4 pb-4">
              {Object.entries(stepsByPhase).map(([phase, steps]) => (
                <div key={phase} className="mb-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-background py-1">
                    {phase}
                  </div>
                  <div className="space-y-2">
                    {steps.map(step => {
                      const status = activeState.stepStatuses[step.id] ?? 'pending';
                      const isDone = status === 'done';
                      const isSkipped = status === 'skipped';
                      const isReassess = status === 'reassess';
                      const dosesExpanded = expandedDoses[step.id];

                      return (
                        <div
                          key={step.id}
                          className={`rounded-lg border p-3 transition-all ${
                            step.isReassessment
                              ? 'border-blue-200 bg-blue-50'
                              : isDone
                              ? 'border-green-200 bg-green-50 opacity-70'
                              : isSkipped
                              ? 'border-muted bg-muted/30 opacity-60'
                              : 'border-border bg-card'
                          }`}
                        >
                          {/* Step header */}
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 mt-0.5">
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : isSkipped ? (
                                <SkipForward className="h-4 w-4 text-muted-foreground" />
                              ) : step.isReassessment ? (
                                <RefreshCcw className="h-4 w-4 text-blue-600" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isDone || isSkipped ? 'line-through text-muted-foreground' : ''}`}>
                                {step.action}
                              </p>

                              {/* Safety warning */}
                              {step.safetyWarning && !isDone && !isSkipped && (
                                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded bg-red-50 border border-red-200">
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-700">{step.safetyWarning}</p>
                                </div>
                              )}

                              {/* Doses toggle */}
                              {step.doses && step.doses.length > 0 && !isDone && !isSkipped && (
                                <button
                                  onClick={() => toggleDoses(step.id)}
                                  className="flex items-center gap-1 mt-1.5 text-xs text-primary font-medium"
                                >
                                  <Pill className="h-3 w-3" />
                                  {dosesExpanded ? 'Hide' : 'Show'} doses
                                  {dosesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                              )}

                              {/* Dose cards */}
                              {dosesExpanded && step.doses && (
                                <div className="mt-2 space-y-2">
                                  {step.doses.map((dose, i) => (
                                    <div key={i} className="rounded-md bg-primary/5 border border-primary/20 p-2">
                                      <p className="text-xs font-semibold text-primary">{dose.drug}</p>
                                      <p className="text-xs text-foreground mt-0.5">
                                        <span className="font-medium">Dose: </span>{dose.dose}
                                      </p>
                                      <p className="text-xs text-foreground">
                                        <span className="font-medium">For {weight} kg: </span>
                                        <span className="text-primary font-bold">{dose.calculated}</span>
                                      </p>
                                      <p className="text-xs text-foreground">
                                        <span className="font-medium">Route: </span>{dose.route}
                                      </p>
                                      {dose.maxDose && (
                                        <p className="text-xs text-amber-700">
                                          <span className="font-medium">Max dose: </span>{dose.maxDose}
                                        </p>
                                      )}
                                      {dose.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">{dose.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          {!isDone && !isSkipped && (
                            <div className="flex gap-2 mt-2 ml-6">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-3"
                                onClick={() => setStepStatus(step.id, 'done')}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Done
                              </Button>
                              {step.isReassessment ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-3 border-blue-300 text-blue-700"
                                  onClick={() => setStepStatus(step.id, 'reassess')}
                                >
                                  <RefreshCcw className="h-3 w-3 mr-1" />
                                  Reassessing
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-3"
                                  onClick={() => setStepStatus(step.id, 'skipped')}
                                >
                                  <SkipForward className="h-3 w-3 mr-1" />
                                  Skip
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Undo */}
                          {(isDone || isSkipped) && (
                            <button
                              onClick={() => setStepStatus(step.id, 'pending')}
                              className="ml-6 mt-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          {/* ── Monitoring Tab ── */}
          <TabsContent value="monitoring" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Monitoring Targets</h3>
              </div>
              <ul className="space-y-2">
                {protocol.monitoringTargets.map((target, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{target}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">References</h3>
                </div>
                <ul className="space-y-1">
                  {protocol.references.map((ref, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {ref}</li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Pitfalls Tab ── */}
          <TabsContent value="pitfalls" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-semibold">Key Pitfalls to Avoid</h3>
              </div>
              <ul className="space-y-2">
                {protocol.keyPitfalls.map((pitfall, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded-md bg-red-50 border border-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-800">{pitfall}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
