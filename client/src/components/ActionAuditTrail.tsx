import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock, BarChart3 } from 'lucide-react';

interface CompletedAction {
  actionId: string;
  actionTitle: string;
  phase: string;
  completedAt: Date;
  durationSeconds: number;
  clinicalNotes?: string;
  skipped?: boolean;
  skipReason?: string;
}

interface ActionAuditTrailProps {
  completedActions: CompletedAction[];
  totalTimeSeconds: number;
  efficiencyScore?: number;
}

export const ActionAuditTrail: React.FC<ActionAuditTrailProps> = ({
  completedActions,
  totalTimeSeconds,
  efficiencyScore = 0,
}) => {
  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const completedCount = completedActions.filter((a) => !a.skipped).length;
  const skippedCount = completedActions.filter((a) => a.skipped).length;

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'airway':
        return 'bg-red-900 border-red-500 text-red-200';
      case 'breathing':
        return 'bg-orange-900 border-orange-500 text-orange-200';
      case 'circulation':
        return 'bg-blue-900 border-blue-500 text-blue-200';
      case 'disability':
        return 'bg-purple-900 border-purple-500 text-purple-200';
      case 'exposure':
        return 'bg-green-900 border-green-500 text-green-200';
      default:
        return 'bg-slate-900 border-slate-500 text-slate-200';
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Time</p>
            <p className="text-2xl font-bold text-white">{totalMinutes} min</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Actions Completed</p>
            <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Actions Skipped</p>
            <p className="text-2xl font-bold text-orange-400">{skippedCount}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Efficiency Score</p>
            <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyScore)}`}>
              {efficiencyScore}%
            </p>
          </div>
        </div>
      </Card>

      {/* Action Timeline */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={20} />
          Action Timeline
        </h3>

        <div className="space-y-3">
          {completedActions.map((action, idx) => (
            <div
              key={action.actionId}
              className={`border-l-4 pl-4 py-3 ${
                action.skipped
                  ? 'border-gray-500 bg-gray-900/30'
                  : getPhaseColor(action.phase)
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {action.skipped ? (
                    <AlertCircle size={18} className="text-gray-400" />
                  ) : (
                    <CheckCircle2 size={18} className="text-green-400" />
                  )}
                  <div>
                    <p className="font-semibold text-white">{action.actionTitle}</p>
                    <p className="text-xs text-gray-400">
                      {action.phase.toUpperCase()} • {new Date(action.completedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-300">
                    {action.durationSeconds}s
                  </p>
                  {action.skipped && (
                    <p className="text-xs text-orange-400">SKIPPED</p>
                  )}
                </div>
              </div>

              {action.clinicalNotes && (
                <p className="text-sm text-gray-300 italic pl-6">
                  Notes: {action.clinicalNotes}
                </p>
              )}

              {action.skipReason && (
                <p className="text-sm text-orange-300 italic pl-6">
                  Skip reason: {action.skipReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Phase Summary */}
      {completedActions.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Phase Breakdown
          </h3>

          <div className="space-y-2">
            {['airway', 'breathing', 'circulation', 'disability', 'exposure'].map((phase) => {
              const phaseActions = completedActions.filter(
                (a) => a.phase === phase && !a.skipped
              );
              const phaseTime = phaseActions.reduce((sum, a) => sum + a.durationSeconds, 0);

              if (phaseActions.length === 0) return null;

              return (
                <div key={phase} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        phase === 'airway'
                          ? 'bg-red-500'
                          : phase === 'breathing'
                          ? 'bg-orange-500'
                          : phase === 'circulation'
                          ? 'bg-blue-500'
                          : phase === 'disability'
                          ? 'bg-purple-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <span className="text-white capitalize font-semibold">{phase}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-300">{phaseActions.length} actions</span>
                    <span className="text-gray-400 text-sm ml-3">
                      {Math.round(phaseTime / 60)} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quality Metrics */}
      {completedActions.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quality Metrics</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Completion Rate</span>
              <span className="text-white font-semibold">
                {Math.round((completedCount / completedActions.length) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Action Time</span>
              <span className="text-white font-semibold">
                {Math.round(totalTimeSeconds / completedActions.length)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Documentation Rate</span>
              <span className="text-white font-semibold">
                {Math.round(
                  (completedActions.filter((a) => a.clinicalNotes).length /
                    completedCount) *
                    100
                )}%
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-700">
              <span className="text-gray-300 font-semibold">Efficiency Score</span>
              <span className={`font-bold text-lg ${getEfficiencyColor(efficiencyScore)}`}>
                {efficiencyScore}%
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
