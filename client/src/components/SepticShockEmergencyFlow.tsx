/**
 * Septic Shock Emergency Management Flow Component
 * 
 * Provides real-time sequential guidance for septic shock management
 * with integrated severity assessment and intervention tracking
 */

import React, { useState, useCallback } from 'react';
import {
  assessSepticShockSeverity,
  calculateFluidResuscitation,
  generateAntibioticRegimen,
  generateVasopressorRegimen,
  generateSupportiveCare,
  generateSepticShockSummary,
  type SepticShockAssessment,
  type ShockSeverity,
  type ShockIntervention,
} from '@/lib/resus/septic-shock-engine';

interface SepticShockFlowProps {
  patientAge: number;
  patientWeight: number;
  onSessionUpdate?: (data: any) => void;
  onComplete?: (summary: string) => void;
}

export const SepticShockEmergencyFlow: React.FC<SepticShockFlowProps> = ({
  patientAge,
  patientWeight,
  onSessionUpdate,
  onComplete,
}) => {
  const [step, setStep] = useState<'assessment' | 'interventions' | 'summary'>('assessment');
  const [assessment, setAssessment] = useState<Partial<SepticShockAssessment>>({
    age: patientAge,
    weightKg: patientWeight,
  });
  const [severity, setSeverity] = useState<ShockSeverity | null>(null);
  const [interventions, setInterventions] = useState<ShockIntervention[]>([]);
  const [completedInterventions, setCompletedInterventions] = useState<string[]>([]);

  const handleAssessmentChange = useCallback((field: string, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAssessmentComplete = useCallback(() => {
    if (!assessment.temperature || assessment.heartRate === undefined || !assessment.systolicBP) {
      alert('Please complete all vital signs');
      return;
    }

    const completedAssessment = assessment as SepticShockAssessment;
    const calculatedSeverity = assessSepticShockSeverity(completedAssessment);
    setSeverity(calculatedSeverity);

    // Generate interventions based on severity
    const fluidInterventions = calculateFluidResuscitation(completedAssessment, calculatedSeverity);
    const antibioticInterventions = generateAntibioticRegimen(completedAssessment);
    const vasopressorInterventions = calculatedSeverity.requiresVasopressors
      ? generateVasopressorRegimen(completedAssessment)
      : [];
    const supportiveInterventions = generateSupportiveCare(completedAssessment);

    const allInterventions = [
      ...fluidInterventions,
      ...antibioticInterventions,
      ...vasopressorInterventions,
      ...supportiveInterventions,
    ];

    setInterventions(allInterventions);
    setStep('interventions');

    if (onSessionUpdate) {
      onSessionUpdate({
        emergencyType: 'septic_shock',
        severity: calculatedSeverity,
        assessment: completedAssessment,
      });
    }
  }, [assessment, onSessionUpdate]);

  const handleInterventionComplete = useCallback((interventionType: string) => {
    setCompletedInterventions(prev => [...new Set([...prev, interventionType])]);
  }, []);

  const handleSummary = useCallback(() => {
    if (!assessment || !severity) return;

    const summary = generateSepticShockSummary(assessment as SepticShockAssessment, severity);
    setStep('summary');

    if (onComplete) {
      onComplete(summary);
    }
  }, [assessment, severity, onComplete]);

  return (
    <div className="septic-shock-flow">
      {step === 'assessment' && (
        <div className="assessment-section">
          <h2>Septic Shock Assessment</h2>

          <div className="vital-signs-grid">
            <div className="vital-input">
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={assessment.temperature || ''}
                onChange={e => handleAssessmentChange('temperature', parseFloat(e.target.value))}
                placeholder="e.g., 38.5"
              />
            </div>

            <div className="vital-input">
              <label>Heart Rate (bpm)</label>
              <input
                type="number"
                value={assessment.heartRate || ''}
                onChange={e => handleAssessmentChange('heartRate', parseInt(e.target.value))}
                placeholder="e.g., 140"
              />
            </div>

            <div className="vital-input">
              <label>Respiratory Rate (breaths/min)</label>
              <input
                type="number"
                value={assessment.respiratoryRate || ''}
                onChange={e => handleAssessmentChange('respiratoryRate', parseInt(e.target.value))}
                placeholder="e.g., 35"
              />
            </div>

            <div className="vital-input">
              <label>Systolic BP (mmHg)</label>
              <input
                type="number"
                value={assessment.systolicBP || ''}
                onChange={e => handleAssessmentChange('systolicBP', parseInt(e.target.value))}
                placeholder="e.g., 85"
              />
            </div>

            <div className="vital-input">
              <label>Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={assessment.diastolicBP || ''}
                onChange={e => handleAssessmentChange('diastolicBP', parseInt(e.target.value))}
                placeholder="e.g., 50"
              />
            </div>

            <div className="vital-input">
              <label>Capillary Refill Time (seconds)</label>
              <input
                type="number"
                step="0.5"
                value={assessment.capillaryRefillTime || ''}
                onChange={e => handleAssessmentChange('capillaryRefillTime', parseFloat(e.target.value))}
                placeholder="e.g., 3"
              />
            </div>
          </div>

          <div className="perfusion-assessment">
            <label>Skin Perfusion</label>
            <div className="radio-group">
              {(['warm', 'cool', 'mottled', 'cyanotic'] as const).map(option => (
                <label key={option}>
                  <input
                    type="radio"
                    name="skinPerfusion"
                    value={option}
                    checked={assessment.skinPerfusion === option}
                    onChange={e => handleAssessmentChange('skinPerfusion', e.target.value)}
                  />
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="vital-input">
            <label>Lactate (mmol/L)</label>
            <input
              type="number"
              step="0.1"
              value={assessment.lactate || ''}
              onChange={e => handleAssessmentChange('lactate', parseFloat(e.target.value))}
              placeholder="e.g., 3.5"
            />
          </div>

          <div className="vital-input">
            <label>Mental Status</label>
            <select
              value={assessment.mentalStatus || ''}
              onChange={e => handleAssessmentChange('mentalStatus', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="alert">Alert</option>
              <option value="lethargic">Lethargic</option>
              <option value="unresponsive">Unresponsive</option>
            </select>
          </div>

          <div className="vital-input">
            <label>Suspected Source</label>
            <input
              type="text"
              value={assessment.suspectedSource || ''}
              onChange={e => handleAssessmentChange('suspectedSource', e.target.value)}
              placeholder="e.g., pneumonia, UTI, meningitis"
            />
          </div>

          <button className="btn-primary" onClick={handleAssessmentComplete}>
            Complete Assessment & Generate Interventions
          </button>
        </div>
      )}

      {step === 'interventions' && severity && (
        <div className="interventions-section">
          <div className="severity-badge">
            <h3>{severity.level.toUpperCase()}</h3>
            <p>{severity.description}</p>
            {severity.requiresICU && <span className="badge-icu">ICU REQUIRED</span>}
            {severity.requiresVasopressors && <span className="badge-vasopressor">VASOPRESSORS NEEDED</span>}
          </div>

          <div className="interventions-list">
            {interventions.map((intervention, index) => (
              <div
                key={index}
                className={`intervention-card ${completedInterventions.includes(intervention.type) ? 'completed' : ''}`}
              >
                <div className="intervention-header">
                  <h4>{intervention.description}</h4>
                  <button
                    className="btn-check"
                    onClick={() => handleInterventionComplete(intervention.type)}
                    disabled={completedInterventions.includes(intervention.type)}
                  >
                    {completedInterventions.includes(intervention.type) ? '✓ Done' : 'Mark Done'}
                  </button>
                </div>

                <p className="indication">
                  <strong>Indication:</strong> {intervention.indication}
                </p>

                {intervention.dosing && (
                  <div className="dosing">
                    <strong>Dosing:</strong>
                    <pre>{intervention.dosing}</pre>
                  </div>
                )}

                {intervention.frequency && (
                  <p>
                    <strong>Frequency:</strong> {intervention.frequency}
                  </p>
                )}

                {intervention.monitoring && (
                  <p>
                    <strong>Monitoring:</strong> {intervention.monitoring}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handleSummary}>
            Generate Clinical Summary
          </button>
        </div>
      )}

      {step === 'summary' && assessment && severity && (
        <div className="summary-section">
          <h3>Clinical Summary</h3>
          <pre className="summary-text">{generateSepticShockSummary(assessment as SepticShockAssessment, severity)}</pre>

          <div className="summary-actions">
            <button className="btn-secondary" onClick={() => setStep('assessment')}>
              Start New Assessment
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .septic-shock-flow {
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        .assessment-section,
        .interventions-section,
        .summary-section {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
        }

        .vital-signs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .vital-input {
          display: flex;
          flex-direction: column;
        }

        .vital-input label,
        .perfusion-assessment label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .vital-input input,
        .vital-input select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .radio-group {
          display: flex;
          gap: 15px;
          margin: 10px 0;
        }

        .radio-group label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: normal;
          margin: 0;
        }

        .severity-badge {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .severity-badge h3 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .badge-icu,
        .badge-vasopressor {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
          margin-top: 10px;
        }

        .badge-icu {
          background: #dc3545;
          color: white;
        }

        .badge-vasopressor {
          background: #fd7e14;
          color: white;
        }

        .interventions-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin: 20px 0;
        }

        .intervention-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 15px;
          transition: all 0.3s ease;
        }

        .intervention-card.completed {
          background: #d4edda;
          border-color: #28a745;
          opacity: 0.7;
        }

        .intervention-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .intervention-header h4 {
          margin: 0;
          color: #333;
        }

        .btn-check {
          padding: 6px 12px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-check:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .indication {
          margin: 10px 0;
          color: #666;
          font-size: 14px;
        }

        .dosing {
          background: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .dosing pre {
          margin: 5px 0 0 0;
          font-size: 12px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .summary-text {
          background: white;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 15px 0;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-top: 15px;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .summary-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default SepticShockEmergencyFlow;
