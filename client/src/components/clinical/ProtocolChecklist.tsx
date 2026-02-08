/**
 * Protocol Checklist Component
 * 
 * Toggleable checklist for complex multi-step procedures (shock resuscitation,
 * DKA management, sepsis bundle, intubation sequence, etc.)
 * 
 * Features:
 * - Visual step-by-step guidance
 * - Toggle individual steps as complete
 * - Progress tracking
 * - Collapsible for space efficiency
 * - Mobile-optimized touch targets
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChecklistStep {
  id: string;
  label: string;
  completed: boolean;
  critical?: boolean; // Highlight critical steps
  note?: string; // Additional guidance
}

export interface ProtocolChecklistProps {
  title: string;
  steps: ChecklistStep[];
  onComplete?: () => void;
  defaultExpanded?: boolean;
}

export const ProtocolChecklist: React.FC<ProtocolChecklistProps> = ({
  title,
  steps,
  onComplete,
  defaultExpanded = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [checklistSteps, setChecklistSteps] = useState<ChecklistStep[]>(steps);

  const completedCount = checklistSteps.filter(s => s.completed).length;
  const totalCount = checklistSteps.length;
  const allComplete = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  const toggleStep = (stepId: string) => {
    setChecklistSteps(prev => {
      const updated = prev.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      );
      
      // Check if all steps are now complete
      const nowAllComplete = updated.every(s => s.completed);
      if (nowAllComplete && onComplete) {
        onComplete();
      }
      
      return updated;
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-600">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2 flex-1">
          <div className={`text-xs font-bold uppercase ${
            allComplete ? 'text-green-400' : 'text-orange-400'
          }`}>
            {allComplete ? 'Complete' : 'In Progress'}
          </div>
          <h4 className="text-sm font-semibold text-white text-left">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {completedCount}/{totalCount}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            allComplete ? 'bg-green-500' : 'bg-orange-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      {expanded && (
        <div className="p-3 space-y-2">
          {checklistSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`w-full p-2 rounded flex items-start gap-3 transition-all min-h-[44px] ${
                step.completed
                  ? 'bg-green-900/30 border border-green-700/50'
                  : step.critical
                  ? 'bg-red-900/20 border border-red-700/50 hover:bg-red-900/30'
                  : 'bg-slate-700/30 border border-slate-600/50 hover:bg-slate-700/50'
              }`}
            >
              {/* Checkbox Icon */}
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  step.critical ? 'text-red-400' : 'text-slate-400'
                }`} />
              )}

              {/* Step Content */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    step.completed ? 'text-green-300 line-through' : 'text-white'
                  }`}>
                    {index + 1}. {step.label}
                  </span>
                  {step.critical && !step.completed && (
                    <span className="text-[10px] uppercase font-bold text-red-400 bg-red-900/30 px-1 py-0.5 rounded">
                      Critical
                    </span>
                  )}
                </div>
                {step.note && (
                  <p className={`text-[11px] mt-1 ${
                    step.completed ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {step.note}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
