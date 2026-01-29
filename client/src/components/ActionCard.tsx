import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Clock, Zap, Info } from 'lucide-react';

export interface Action {
  id: string;
  sequence: number;
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  timeframe?: string;
  urgency: 'critical' | 'urgent' | 'routine';
  phase: string;
  prerequisites?: string[];
  contraindications?: string[];
  dosing?: {
    weight: number;
    calculation: string;
    dose: string;
    route: string;
  };
  monitoring?: string[];
}

interface ActionCardProps {
  action: Action;
  totalActions: number;
  onComplete: (actionId: string, notes?: string) => void;
  onSkip?: (actionId: string, reason?: string) => void;
  isCompleted?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  totalActions,
  onComplete,
  onSkip,
  isCompleted = false,
}) => {
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-900 border-red-500 text-red-200';
      case 'urgent':
        return 'bg-orange-900 border-orange-500 text-orange-200';
      default:
        return 'bg-blue-900 border-blue-500 text-blue-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Zap className="text-red-400" size={20} />;
      case 'urgent':
        return <AlertCircle className="text-orange-400" size={20} />;
      default:
        return <Clock className="text-blue-400" size={20} />;
    }
  };

  if (isCompleted) {
    return (
      <Card className="bg-green-900 border-green-500 p-6 opacity-75">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-green-400" size={24} />
          <div>
            <p className="text-green-300 font-semibold">{action.title}</p>
            <p className="text-green-200 text-sm">Completed</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`border-2 p-6 ${getUrgencyColor(action.urgency)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {getUrgencyIcon(action.urgency)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold opacity-75">
                ACTION {action.sequence} OF {totalActions}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                action.urgency === 'critical' ? 'bg-red-800' :
                action.urgency === 'urgent' ? 'bg-orange-800' :
                'bg-blue-800'
              }`}>
                {action.urgency.toUpperCase()}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white">{action.title}</h3>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-white mb-4 leading-relaxed">{action.description}</p>

      {/* Rationale */}
      <div className="bg-black/30 p-3 rounded mb-4 border border-white/10">
        <p className="text-sm font-semibold text-white mb-1">Why this action?</p>
        <p className="text-sm text-gray-200">{action.rationale}</p>
      </div>

      {/* Dosing Information (if applicable) */}
      {action.dosing && (
        <div className="bg-black/30 p-3 rounded mb-4 border border-white/10">
          <p className="text-sm font-semibold text-white mb-2">Dosing Calculation</p>
          <div className="space-y-1 text-sm text-gray-200">
            <p><strong>Weight:</strong> {action.dosing.weight} kg</p>
            <p><strong>Calculation:</strong> {action.dosing.calculation}</p>
            <p className="text-white font-bold text-base"><strong>Dose:</strong> {action.dosing.dose}</p>
            <p><strong>Route:</strong> {action.dosing.route}</p>
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {action.prerequisites && action.prerequisites.length > 0 && (
        <div className="bg-black/30 p-3 rounded mb-4 border border-white/10">
          <p className="text-sm font-semibold text-white mb-2">Prerequisites</p>
          <ul className="space-y-1">
            {action.prerequisites.map((prereq, idx) => (
              <li key={idx} className="text-sm text-gray-200 flex items-center gap-2">
                <span className="text-blue-400">✓</span> {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contraindications */}
      {action.contraindications && action.contraindications.length > 0 && (
        <div className="bg-red-900/30 p-3 rounded mb-4 border border-red-500/30">
          <p className="text-sm font-semibold text-red-300 mb-2">⚠️ Contraindications</p>
          <ul className="space-y-1">
            {action.contraindications.map((contra, idx) => (
              <li key={idx} className="text-sm text-red-200 flex items-center gap-2">
                <span className="text-red-400">✗</span> {contra}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expected Outcome */}
      <div className="bg-green-900/30 p-3 rounded mb-4 border border-green-500/30">
        <p className="text-sm font-semibold text-green-300 mb-1">Expected Outcome</p>
        <p className="text-sm text-green-200">{action.expectedOutcome}</p>
      </div>

      {/* Monitoring Points */}
      {action.monitoring && action.monitoring.length > 0 && (
        <div className="bg-black/30 p-3 rounded mb-4 border border-white/10">
          <p className="text-sm font-semibold text-white mb-2">Monitor For:</p>
          <ul className="space-y-1">
            {action.monitoring.map((monitor, idx) => (
              <li key={idx} className="text-sm text-gray-200 flex items-center gap-2">
                <span className="text-yellow-400">•</span> {monitor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeframe */}
      {action.timeframe && (
        <div className="text-sm text-white/80 mb-4 flex items-center gap-2">
          <Clock size={16} />
          <span>Timeframe: {action.timeframe}</span>
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="bg-black/30 p-4 rounded mb-4 border border-white/10">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            className="w-5 h-5"
          />
          <span className="text-white font-semibold">
            I have completed this action
          </span>
        </label>
      </div>

      {/* Notes */}
      {confirmed && (
        <div className="mb-4">
          <label className="text-sm text-white/80 block mb-2">
            Optional: Add clinical notes about this action
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 'Oxygen applied at 10 L/min, SpO2 improved to 95%'"
            className="w-full bg-black/30 border border-white/20 text-white placeholder-gray-500 p-3 rounded text-sm"
            rows={3}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onSkip && (
          <Button
            onClick={() => onSkip(action.id)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3"
          >
            Skip (with reason)
          </Button>
        )}
        <Button
          onClick={() => onComplete(action.id, notes)}
          disabled={!confirmed}
          className={`flex-1 py-3 font-bold text-lg ${
            confirmed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {action.sequence === totalActions ? 'Complete & Reassess' : 'Complete & Next Action'}
        </Button>
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-4 text-sm text-white/60 hover:text-white/80 flex items-center justify-center gap-2"
      >
        <Info size={16} />
        {showDetails ? 'Hide' : 'Show'} Clinical Details
      </button>
    </Card>
  );
};
