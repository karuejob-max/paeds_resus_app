import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Intervention {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  evidence: string[];
  actions: {
    drug?: string;
    dose?: string;
    route?: string;
    frequency?: string;
    titration?: string;
    reassessmentCriteria?: string[];
  }[];
  escalationPath?: string;
}

interface PhaseInterventionBlockerProps {
  phase: string;
  interventions: Intervention[];
  onAllInterventionsComplete: () => void;
  onCancel: () => void;
}

export const PhaseInterventionBlocker: React.FC<PhaseInterventionBlockerProps> = ({
  phase,
  interventions,
  onAllInterventionsComplete,
  onCancel,
}) => {
  const [completedInterventions, setCompletedInterventions] = useState<Set<string>>(new Set());

  const handleInterventionComplete = (interventionId: string) => {
    const newCompleted = new Set(completedInterventions);
    if (newCompleted.has(interventionId)) {
      newCompleted.delete(interventionId);
    } else {
      newCompleted.add(interventionId);
    }
    setCompletedInterventions(newCompleted);
  };

  const allComplete = completedInterventions.size === interventions.length && interventions.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-red-500 border-2 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-red-500 flex-shrink-0" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {phase.toUpperCase()} PHASE - INTERVENTIONS REQUIRED
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                Critical findings detected. Mark all interventions as complete before proceeding to next phase.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {interventions.map((intervention) => (
              <Card
                key={intervention.id}
                className={`border-2 p-4 ${
                  intervention.severity === 'critical'
                    ? 'bg-red-900 border-red-500'
                    : intervention.severity === 'warning'
                    ? 'bg-yellow-900 border-yellow-500'
                    : 'bg-blue-900 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {intervention.severity === 'critical' && <AlertCircle className="text-red-400 flex-shrink-0 mt-1" />}
                  {intervention.severity === 'warning' && <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" />}
                  {intervention.severity === 'info' && <CheckCircle2 className="text-blue-400 flex-shrink-0 mt-1" />}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{intervention.title}</h3>
                    <p className="text-gray-200 text-xs mt-1">
                      <strong>Evidence:</strong> {intervention.evidence.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 ml-6">
                  {intervention.actions.map((action, idx) => (
                    <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-600 text-sm">
                      {action.drug && <p className="text-white font-semibold">{action.drug}</p>}
                      {action.dose && <p className="text-gray-300"><strong>Dose:</strong> {action.dose}</p>}
                      {action.route && <p className="text-gray-300"><strong>Route:</strong> {action.route}</p>}
                      {action.frequency && <p className="text-gray-300"><strong>Frequency:</strong> {action.frequency}</p>}
                    </div>
                  ))}
                </div>

                {intervention.escalationPath && (
                  <p className="text-orange-300 text-xs mb-3 ml-6">
                    <strong>Escalation:</strong> {intervention.escalationPath}
                  </p>
                )}

                <button
                  onClick={() => handleInterventionComplete(intervention.id)}
                  className={`ml-6 flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    completedInterventions.has(intervention.id)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  <Check
                    size={16}
                    className={completedInterventions.has(intervention.id) ? 'text-white' : 'text-gray-500'}
                  />
                  {completedInterventions.has(intervention.id) ? 'Intervention Complete' : 'Mark Complete'}
                </button>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3"
            >
              Cancel & Reassess Phase
            </Button>
            <Button
              onClick={onAllInterventionsComplete}
              disabled={!allComplete}
              className={`flex-1 py-3 font-bold text-lg ${
                allComplete
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              All Interventions Complete - Proceed to Next Phase
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
