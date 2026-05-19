/**
 * Pneumonia Emergency Flow Component
 * 
 * Provides sequential assessment and real-time intervention guidance
 * for community-acquired pneumonia management
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Stethoscope } from 'lucide-react';
import {
  assessPneumoniaSeverity,
  generateAntibioticRegimen,
  generatePneumoniaSupportiveCare,
  shouldAdmitPneumonia,
  generatePneumoniaSummary,
  type PneumoniaAssessment,
} from '@/lib/resus/pneumonia-engine';

interface PneumoniaEmergencyFlowProps {
  patientAge: number; // years
  patientWeight: number; // kg
  onSessionStart?: (sessionData: any) => void;
}

export const PneumoniaEmergencyFlow: React.FC<PneumoniaEmergencyFlowProps> = ({
  patientAge,
  patientWeight,
  onSessionStart,
}) => {
  const [step, setStep] = useState<'assessment' | 'interventions' | 'summary'>('assessment');
  const [assessment, setAssessment] = useState<Partial<PneumoniaAssessment>>({
    age: patientAge,
    weightKg: patientWeight,
    respiratoryRate: 0,
    oxygenSaturation: 100,
    temperature: 37,
    chestIndrawing: false,
    stridor: false,
    cyanosis: false,
    lethargy: false,
    feedingDifficulty: false,
    crackles: false,
    consolidation: false,
    pleuraEffusion: false,
  });

  const [interventionsApplied, setInterventionsApplied] = useState<string[]>([]);

  // Validate assessment is complete
  const isAssessmentComplete =
    assessment.respiratoryRate! > 0 &&
    assessment.oxygenSaturation! > 0 &&
    assessment.temperature! > 0;

  // Calculate severity
  const severity = isAssessmentComplete
    ? assessPneumoniaSeverity(assessment as PneumoniaAssessment)
    : null;

  // Generate interventions
  const antibiotics =
    severity && isAssessmentComplete
      ? generateAntibioticRegimen(assessment as PneumoniaAssessment, severity)
      : [];

  const supportiveCare =
    severity && isAssessmentComplete
      ? generatePneumoniaSupportiveCare(assessment as PneumoniaAssessment, severity)
      : [];

  const allInterventions = [...antibiotics, ...supportiveCare];

  const handleAssessmentChange = (field: keyof PneumoniaAssessment, value: any) => {
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
        emergencyType: 'pneumonia',
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
    <div className="pneumonia-flow bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Stethoscope size={28} className="text-orange-600" />
          Pneumonia Emergency Management
        </h1>
        <p className="text-gray-600 mt-2">
          Patient: {patientAge} years old, {patientWeight}kg
        </p>
      </div>

      {/* Step 1: Assessment */}
      {step === 'assessment' && (
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-500">
            <h2 className="font-bold text-orange-900 mb-3">Step 1: WHO IMCI Assessment</h2>
            <p className="text-sm text-orange-800">
              Complete all assessments to determine pneumonia classification
            </p>
          </div>

          {/* Vital Signs */}
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={assessment.temperature || ''}
                onChange={e => handleAssessmentChange('temperature', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter temp"
              />
            </div>
          </div>

          {/* Danger Signs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Danger Signs</label>
            <div className="space-y-2">
              {[
                { key: 'cyanosis', label: 'Cyanosis' },
                { key: 'lethargy', label: 'Lethargy/Unconscious' },
                { key: 'stridor', label: 'Stridor in calm child' },
              ].map(sign => (
                <label key={sign.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assessment[sign.key as keyof PneumoniaAssessment] as boolean}
                    onChange={e =>
                      handleAssessmentChange(sign.key as keyof PneumoniaAssessment, e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{sign.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pneumonia Signs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Pneumonia Signs</label>
            <div className="space-y-2">
              {[
                { key: 'chestIndrawing', label: 'Chest indrawing' },
                { key: 'feedingDifficulty', label: 'Feeding difficulty' },
                { key: 'crackles', label: 'Crackles on auscultation' },
                { key: 'consolidation', label: 'Consolidation on examination' },
                { key: 'pleuraEffusion', label: 'Pleural effusion' },
              ].map(sign => (
                <label key={sign.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assessment[sign.key as keyof PneumoniaAssessment] as boolean}
                    onChange={e =>
                      handleAssessmentChange(sign.key as keyof PneumoniaAssessment, e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{sign.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Classification Display */}
          {severity && (
            <div className={`p-4 rounded border-l-4 ${
              severity.classification === 'very_severe_pneumonia'
                ? 'bg-red-50 border-red-500'
                : severity.classification === 'severe_pneumonia'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-green-50 border-green-500'
            }`}>
              <p className="font-bold text-gray-800">
                Classification: <span className="uppercase">{severity.classification.replace(/_/g, ' ')}</span>
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
            className="w-full px-4 py-3 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Interventions
          </button>
        </div>
      )}

      {/* Step 2: Interventions */}
      {step === 'interventions' && severity && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
            <h2 className="font-bold text-green-900 mb-3">Step 2: Antibiotic & Supportive Care</h2>
            <p className="text-sm text-green-800">
              Confirm each intervention as it is prescribed/applied
            </p>
          </div>

          {/* Antibiotic Regimen */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Antibiotic Regimen</h3>
            <div className="space-y-3">
              {antibiotics.map((intervention, index) => (
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
                      <h4 className="font-bold text-gray-800">{intervention.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">{intervention.indication}</p>
                      {intervention.dosing && (
                        <p className="text-sm text-gray-700 mt-2 font-mono bg-white p-2 rounded">
                          {intervention.dosing}
                        </p>
                      )}
                      {intervention.frequency && (
                        <p className="text-xs text-gray-600 mt-2">
                          <strong>Duration:</strong> {intervention.frequency}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleInterventionApplied(intervention.type)}
                      className={`ml-4 px-3 py-2 rounded font-semibold whitespace-nowrap text-sm ${
                        interventionsApplied.includes(intervention.type)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {interventionsApplied.includes(intervention.type) ? '✓ Prescribed' : 'Mark Prescribed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supportive Care */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Supportive Care</h3>
            <div className="space-y-3">
              {supportiveCare.map((intervention, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border-2 ${
                    interventionsApplied.includes(intervention.type)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{intervention.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">{intervention.indication}</p>
                      {intervention.dosing && (
                        <p className="text-sm text-gray-700 mt-2 font-mono bg-white p-2 rounded">
                          {intervention.dosing}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleInterventionApplied(intervention.type)}
                      className={`ml-4 px-3 py-2 rounded font-semibold whitespace-nowrap text-sm ${
                        interventionsApplied.includes(intervention.type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {interventionsApplied.includes(intervention.type) ? '✓ Applied' : 'Mark Applied'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admission Recommendation */}
          <div className={`p-4 rounded border-l-4 ${
            shouldAdmitPneumonia(assessment as PneumoniaAssessment)
              ? 'bg-red-50 border-red-500'
              : 'bg-blue-50 border-blue-500'
          }`}>
            <p className="font-bold text-gray-800">
              {shouldAdmitPneumonia(assessment as PneumoniaAssessment)
                ? '⚠️ Hospitalization Required'
                : '✓ Outpatient Management Possible'}
            </p>
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
            {generatePneumoniaSummary(assessment as PneumoniaAssessment, severity)}
          </pre>

          {/* Clinical Notes */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-900">
              <strong>Next Steps:</strong> Reassess in 48 hours. If improving, consider switching to oral
              antibiotics. If worsening, escalate to higher level of care.
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
                  temperature: 37,
                  chestIndrawing: false,
                  stridor: false,
                  cyanosis: false,
                  lethargy: false,
                  feedingDifficulty: false,
                  crackles: false,
                  consolidation: false,
                  pleuraEffusion: false,
                });
                setInterventionsApplied([]);
              }}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              New Assessment
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Print Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PneumoniaEmergencyFlow;
