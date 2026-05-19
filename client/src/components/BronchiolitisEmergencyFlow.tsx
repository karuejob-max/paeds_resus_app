/**
 * Bronchiolitis Emergency Flow Component
 * 
 * Provides sequential assessment and real-time intervention guidance
 * for acute bronchiolitis management
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Droplet } from 'lucide-react';
import {
  assessBronchiolitisSeverity,
  generateBronchiolitisInterventions,
  shouldAdmitBronchiolitis,
  shouldAdmitToICU,
  generateBronchiolitisSummary,
  type BronchiolitisAssessment,
} from '@/lib/resus/bronchiolitis-engine';

interface BronchiolitisEmergencyFlowProps {
  patientAge: number; // months
  patientWeight: number; // kg
  onSessionStart?: (sessionData: any) => void;
}

export const BronchiolitisEmergencyFlow: React.FC<BronchiolitisEmergencyFlowProps> = ({
  patientAge,
  patientWeight,
  onSessionStart,
}) => {
  const [step, setStep] = useState<'assessment' | 'interventions' | 'summary'>('assessment');
  const [assessment, setAssessment] = useState<Partial<BronchiolitisAssessment>>({
    age: patientAge,
    weightKg: patientWeight,
    respiratoryRate: 0,
    oxygenSaturation: 100,
    retractions: 'none',
    wheeze: false,
    crackles: false,
    feedingDifficulty: false,
    lethargy: false,
    cyanosis: false,
  });

  const [interventionsApplied, setInterventionsApplied] = useState<string[]>([]);

  // Validate assessment is complete
  const isAssessmentComplete =
    assessment.respiratoryRate! > 0 &&
    assessment.oxygenSaturation! > 0 &&
    assessment.retractions !== 'none';

  // Calculate severity
  const severity = isAssessmentComplete
    ? assessBronchiolitisSeverity(assessment as BronchiolitisAssessment)
    : null;

  // Generate interventions
  const interventions =
    severity && isAssessmentComplete
      ? generateBronchiolitisInterventions(assessment as BronchiolitisAssessment, severity)
      : [];

  const handleAssessmentChange = (field: keyof BronchiolitisAssessment, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  };

  const handleInterventionApplied = (interventionType: string) => {
    if (!interventionsApplied.includes(interventionType)) {
      setInterventionsApplied([...interventionsApplied, interventionType]);
    }
  };

  const handleProceedToInterventions = () => {
    if (isAssessmentComplete && onSessionStart) {
      onSessionStart({
        emergencyType: 'bronchiolitis',
        assessment,
        severity,
      });
    }
    setStep('interventions');
  };

  const handleCompleteSession = () => {
    setStep('summary');
  };

  return (
    <div className="bronchiolitis-flow bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertCircle size={28} className="text-blue-600" />
          Bronchiolitis Emergency Management
        </h1>
        <p className="text-gray-600 mt-2">
          Patient: {patientAge} months old, {patientWeight}kg
        </p>
      </div>

      {/* Step 1: Assessment */}
      {step === 'assessment' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
            <h2 className="font-bold text-blue-900 mb-3">Step 1: Clinical Assessment</h2>
            <p className="text-sm text-blue-800">
              Complete all assessments before proceeding to interventions
            </p>
          </div>

          {/* Vital Signs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="number"
                value={assessment.respiratoryRate || ''}
                onChange={e => handleAssessmentChange('respiratoryRate', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter RR"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Oxygen Saturation (%)
              </label>
              <input
                type="number"
                value={assessment.oxygenSaturation || ''}
                onChange={e => handleAssessmentChange('oxygenSaturation', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter SpO2"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Retractions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Retractions
            </label>
            <select
              value={assessment.retractions || 'none'}
              onChange={e => handleAssessmentChange('retractions', e.target.value as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          {/* Clinical Signs */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Clinical Signs</label>
            {[
              { key: 'wheeze', label: 'Wheeze present' },
              { key: 'crackles', label: 'Crackles present' },
              { key: 'feedingDifficulty', label: 'Feeding difficulty' },
              { key: 'lethargy', label: 'Lethargy' },
              { key: 'cyanosis', label: 'Cyanosis' },
            ].map(sign => (
              <label key={sign.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assessment[sign.key as keyof BronchiolitisAssessment] as boolean}
                  onChange={e =>
                    handleAssessmentChange(sign.key as keyof BronchiolitisAssessment, e.target.checked)
                  }
                  className="w-4 h-4"
                />
                <span className="text-gray-700">{sign.label}</span>
              </label>
            ))}
          </div>

          {/* Severity Display */}
          {severity && (
            <div className={`p-4 rounded border-l-4 ${
              severity.level === 'severe'
                ? 'bg-red-50 border-red-500'
                : severity.level === 'moderate'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-green-50 border-green-500'
            }`}>
              <p className="font-bold text-gray-800">
                Severity: <span className="uppercase">{severity.level}</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">{severity.description}</p>
              <p className="text-xs text-gray-600 mt-2">
                Admission: {severity.requiresHospitalization ? 'REQUIRED' : 'Consider outpatient'}
              </p>
            </div>
          )}

          {/* Proceed Button */}
          <button
            onClick={handleProceedToInterventions}
            disabled={!isAssessmentComplete}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Interventions
          </button>
        </div>
      )}

      {/* Step 2: Interventions */}
      {step === 'interventions' && severity && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
            <h2 className="font-bold text-green-900 mb-3">Step 2: Recommended Interventions</h2>
            <p className="text-sm text-green-800">
              Confirm each intervention as it is applied
            </p>
          </div>

          {/* Interventions List */}
          <div className="space-y-4">
            {interventions.map((intervention, index) => (
              <div
                key={index}
                className={`p-4 rounded border-2 ${
                  interventionsApplied.includes(intervention.type)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{intervention.description}</h3>
                    <p className="text-sm text-gray-600 mt-1">{intervention.indication}</p>
                    {intervention.dosing && (
                      <p className="text-sm text-gray-700 mt-2 font-mono bg-white p-2 rounded">
                        {intervention.dosing}
                      </p>
                    )}
                    {intervention.frequency && (
                      <p className="text-xs text-gray-600 mt-2">
                        <strong>Frequency:</strong> {intervention.frequency}
                      </p>
                    )}
                    {intervention.monitoring && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Monitor:</strong> {intervention.monitoring}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleInterventionApplied(intervention.type)}
                    className={`ml-4 px-4 py-2 rounded font-semibold whitespace-nowrap ${
                      interventionsApplied.includes(intervention.type)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {interventionsApplied.includes(intervention.type) ? (
                      <>
                        <CheckCircle size={16} className="inline mr-1" />
                        Applied
                      </>
                    ) : (
                      'Mark Applied'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Admission Recommendation */}
          <div className={`p-4 rounded border-l-4 ${
            shouldAdmitBronchiolitis(assessment as BronchiolitisAssessment)
              ? 'bg-red-50 border-red-500'
              : 'bg-blue-50 border-blue-500'
          }`}>
            <p className="font-bold text-gray-800">
              {shouldAdmitBronchiolitis(assessment as BronchiolitisAssessment)
                ? '⚠️ Hospitalization Required'
                : '✓ Outpatient Management Possible'}
            </p>
            {shouldAdmitToICU(assessment as BronchiolitisAssessment) && (
              <p className="text-sm text-red-800 mt-1">ICU Admission Recommended</p>
            )}
          </div>

          {/* Complete Session Button */}
          <button
            onClick={handleCompleteSession}
            className="w-full px-4 py-3 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
          >
            Complete Session & Generate Summary
          </button>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 'summary' && severity && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
            <h2 className="font-bold text-blue-900 mb-3">Session Summary</h2>
          </div>

          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto border">
            {generateBronchiolitisSummary(assessment as BronchiolitisAssessment, severity)}
          </pre>

          {/* Clinical Notes */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-900">
              <strong>Next Steps:</strong> Close clinical monitoring, reassess in 2-4 hours. Consider
              transfer if worsening or if ICU admission criteria met.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep('assessment');
                setAssessment({
                  age: patientAge,
                  weightKg: patientWeight,
                  respiratoryRate: 0,
                  oxygenSaturation: 100,
                  retractions: 'none',
                  wheeze: false,
                  crackles: false,
                  feedingDifficulty: false,
                  lethargy: false,
                  cyanosis: false,
                });
                setInterventionsApplied([]);
              }}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              New Assessment
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BronchiolitisEmergencyFlow;
