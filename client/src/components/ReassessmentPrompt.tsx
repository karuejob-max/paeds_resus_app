import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type ReassessmentResponse = 'better' | 'same' | 'worse' | 'unable';

interface ReassessmentPromptProps {
  phase: string;
  interventionsDone: string[];
  onReassessment: (response: ReassessmentResponse, vitals?: any) => void;
  onCancel: () => void;
}

export const ReassessmentPrompt: React.FC<ReassessmentPromptProps> = ({
  phase,
  interventionsDone,
  onReassessment,
  onCancel,
}) => {
  const [selectedResponse, setSelectedResponse] = useState<ReassessmentResponse | null>(null);
  const [vitals, setVitals] = useState({
    heartRate: '',
    respiratoryRate: '',
    spO2: '',
    systolicBP: '',
    capillaryRefill: '',
  });

  const handleResponse = (response: ReassessmentResponse) => {
    onReassessment(response, vitals);
  };

  const getResponseGuidance = (response: ReassessmentResponse): { title: string; color: string; icon: React.ReactNode } => {
    switch (response) {
      case 'better':
        return {
          title: 'IMPROVEMENT DETECTED - Continue current pathway',
          color: 'bg-green-900 border-green-500',
          icon: <TrendingUp className="text-green-400" size={24} />,
        };
      case 'same':
        return {
          title: 'NO CHANGE - Escalate intervention',
          color: 'bg-yellow-900 border-yellow-500',
          icon: <Minus className="text-yellow-400" size={24} />,
        };
      case 'worse':
        return {
          title: 'DETERIORATION - EMERGENCY ESCALATION',
          color: 'bg-red-900 border-red-500',
          icon: <TrendingDown className="text-red-400" size={24} />,
        };
      case 'unable':
        return {
          title: 'UNABLE TO ASSESS - Proceed with caution',
          color: 'bg-gray-900 border-gray-500',
          icon: <AlertCircle className="text-gray-400" size={24} />,
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-2 border-blue-500 max-w-2xl w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-blue-400 flex-shrink-0" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-white">
                MANDATORY REASSESSMENT - {phase.toUpperCase()} PHASE
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                After intervention, reassess the patient's response before proceeding.
              </p>
            </div>
          </div>

          {/* Interventions Done */}
          <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-2">Interventions Completed:</p>
            <ul className="space-y-1">
              {interventionsDone.map((intervention, idx) => (
                <li key={idx} className="text-sm text-gray-200 flex items-center gap-2">
                  <span className="text-green-400">✓</span> {intervention}
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Vitals */}
          <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">Optional: Update Vitals</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 120"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Respiratory Rate (/min)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  value={vitals.respiratoryRate}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">SpO2 (%)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 95"
                  value={vitals.spO2}
                  onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Systolic BP (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 90"
                  value={vitals.systolicBP}
                  onChange={(e) => setVitals({ ...vitals, systolicBP: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Response Selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">How is the patient responding?</p>
            <div className="grid grid-cols-2 gap-3">
              {(['better', 'same', 'worse', 'unable'] as const).map((response) => {
                const guidance = getResponseGuidance(response);
                return (
                  <button
                    key={response}
                    onClick={() => setSelectedResponse(response)}
                    className={`p-4 rounded border-2 transition-all ${
                      selectedResponse === response
                        ? `${guidance.color} ring-2 ring-offset-2 ring-offset-slate-900`
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {guidance.icon}
                      <span className="font-semibold text-white capitalize">{response}</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      {response === 'better' && 'Patient improving, continue pathway'}
                      {response === 'same' && 'No improvement, escalate'}
                      {response === 'worse' && 'Patient deteriorating, emergency'}
                      {response === 'unable' && 'Cannot assess at this time'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guidance Box */}
          {selectedResponse && (
            <div className={`p-4 rounded border-2 mb-6 ${getResponseGuidance(selectedResponse).color}`}>
              <p className="text-white font-bold text-sm">{getResponseGuidance(selectedResponse).title}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3"
            >
              Cancel & Re-intervene
            </Button>
            <Button
              onClick={() => selectedResponse && handleResponse(selectedResponse)}
              disabled={!selectedResponse}
              className={`flex-1 py-3 font-bold text-lg ${
                selectedResponse
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm Reassessment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
