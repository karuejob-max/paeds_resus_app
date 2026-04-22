/**
 * DKA Emergency Management Flow Component
 * 
 * Provides real-time sequential guidance for DKA management
 * with integrated severity assessment and intervention tracking
 */

import React, { useState, useCallback } from 'react';
import {
  assessDKASeverity,
  calculateDKAFluidResuscitation,
  generateInsulinProtocol,
  generateElectrolyteManagement,
  generateCerebralEdemaProtocol,
  generateDKASummary,
  type DKAAssessment,
  type DKASeverity,
  type DKAIntervention,
} from '@/lib/resus/dka-engine';

interface DKAFlowProps {
  patientAge: number;
  patientWeight: number;
  onSessionUpdate?: (data: any) => void;
  onComplete?: (summary: string) => void;
}

export const DKAEmergencyFlow: React.FC<DKAFlowProps> = ({
  patientAge,
  patientWeight,
  onSessionUpdate,
  onComplete,
}) => {
  const [step, setStep] = useState<'assessment' | 'interventions' | 'summary'>('assessment');
  const [glucoseUnit, setGlucoseUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');
  const [assessment, setAssessment] = useState<Partial<DKAAssessment>>({
    age: patientAge,
    weightKg: patientWeight,
    glucoseUnit: 'mg/dL',
  });
  const [severity, setSeverity] = useState<DKASeverity | null>(null);
  const [interventions, setInterventions] = useState<DKAIntervention[]>([]);
  const [completedInterventions, setCompletedInterventions] = useState<string[]>([]);

  const handleAssessmentChange = useCallback((field: string, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGlucoseUnitChange = useCallback((unit: 'mg/dL' | 'mmol/L') => {
    setGlucoseUnit(unit);
    handleAssessmentChange('glucoseUnit', unit);
  }, []);

  const handleAssessmentComplete = useCallback(() => {
    if (
      assessment.bloodGlucose === undefined ||
      assessment.pH === undefined ||
      assessment.bicarbonate === undefined
    ) {
      alert('Please complete all laboratory values');
      return;
    }

    const completedAssessment = assessment as DKAAssessment;
    const calculatedSeverity = assessDKASeverity(completedAssessment);
    setSeverity(calculatedSeverity);

    // Generate interventions based on severity
    const fluidInterventions = calculateDKAFluidResuscitation(completedAssessment, calculatedSeverity);
    const insulinInterventions = generateInsulinProtocol(completedAssessment, calculatedSeverity);
    const electrolyteInterventions = generateElectrolyteManagement(completedAssessment);
    const cerebralEdemaInterventions = generateCerebralEdemaProtocol(completedAssessment);

    const allInterventions = [
      ...fluidInterventions,
      ...insulinInterventions,
      ...electrolyteInterventions,
      ...cerebralEdemaInterventions,
    ];

    setInterventions(allInterventions);
    setStep('interventions');

    if (onSessionUpdate) {
      onSessionUpdate({
        emergencyType: 'dka',
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

    const summary = generateDKASummary(assessment as DKAAssessment, severity);
    setStep('summary');

    if (onComplete) {
      onComplete(summary);
    }
  }, [assessment, severity, onComplete]);

  return (
    <div className="dka-flow">
      {step === 'assessment' && (
        <div className="assessment-section">
          <h2>Diabetic Ketoacidosis (DKA) Assessment</h2>

          <div className="glucose-unit-selector">
            <label>Glucose Unit:</label>
            <button
              className={glucoseUnit === 'mg/dL' ? 'active' : ''}
              onClick={() => handleGlucoseUnitChange('mg/dL')}
            >
              mg/dL
            </button>
            <button
              className={glucoseUnit === 'mmol/L' ? 'active' : ''}
              onClick={() => handleGlucoseUnitChange('mmol/L')}
            >
              mmol/L
            </button>
          </div>

          <div className="lab-values-grid">
            <div className="lab-input">
              <label>Blood Glucose ({glucoseUnit})</label>
              <input
                type="number"
                value={assessment.bloodGlucose || ''}
                onChange={e => handleAssessmentChange('bloodGlucose', parseFloat(e.target.value))}
                placeholder={glucoseUnit === 'mg/dL' ? 'e.g., 450' : 'e.g., 25'}
              />
            </div>

            <div className="lab-input">
              <label>pH</label>
              <input
                type="number"
                step="0.01"
                value={assessment.pH || ''}
                onChange={e => handleAssessmentChange('pH', parseFloat(e.target.value))}
                placeholder="e.g., 7.15"
              />
            </div>

            <div className="lab-input">
              <label>Bicarbonate (mEq/L)</label>
              <input
                type="number"
                value={assessment.bicarbonate || ''}
                onChange={e => handleAssessmentChange('bicarbonate', parseFloat(e.target.value))}
                placeholder="e.g., 8"
              />
            </div>

            <div className="lab-input">
              <label>Anion Gap</label>
              <input
                type="number"
                value={assessment.anionGap || ''}
                onChange={e => handleAssessmentChange('anionGap', parseFloat(e.target.value))}
                placeholder="e.g., 18"
              />
            </div>

            <div className="lab-input">
              <label>Potassium (mEq/L)</label>
              <input
                type="number"
                step="0.1"
                value={assessment.potassium || ''}
                onChange={e => handleAssessmentChange('potassium', parseFloat(e.target.value))}
                placeholder="e.g., 5.2"
              />
            </div>

            <div className="lab-input">
              <label>Sodium (mEq/L)</label>
              <input
                type="number"
                value={assessment.sodium || ''}
                onChange={e => handleAssessmentChange('sodium', parseFloat(e.target.value))}
                placeholder="e.g., 135"
              />
            </div>

            <div className="lab-input">
              <label>Chloride (mEq/L)</label>
              <input
                type="number"
                value={assessment.chloride || ''}
                onChange={e => handleAssessmentChange('chloride', parseFloat(e.target.value))}
                placeholder="e.g., 102"
              />
            </div>

            <div className="lab-input">
              <label>Fluid Deficit (%)</label>
              <input
                type="number"
                value={assessment.fluidDeficit || ''}
                onChange={e => handleAssessmentChange('fluidDeficit', parseFloat(e.target.value))}
                placeholder="e.g., 10"
              />
            </div>
          </div>

          <div className="clinical-assessment">
            <div className="assessment-input">
              <label>Ketonemia</label>
              <select
                value={assessment.ketonemia || ''}
                onChange={e => handleAssessmentChange('ketonemia', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="negative">Negative</option>
                <option value="small">Small</option>
                <option value="moderate">Moderate</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="assessment-input">
              <label>Ketonuria</label>
              <select
                value={assessment.ketonuria || ''}
                onChange={e => handleAssessmentChange('ketonuria', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="negative">Negative</option>
                <option value="small">Small</option>
                <option value="moderate">Moderate</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="assessment-input">
              <label>Respiratory Pattern</label>
              <select
                value={assessment.breathPattern || ''}
                onChange={e => handleAssessmentChange('breathPattern', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="normal">Normal</option>
                <option value="kussmaul">Kussmaul (deep, rapid)</option>
                <option value="rapid">Rapid</option>
              </select>
            </div>

            <div className="assessment-input">
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

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={assessment.vomiting || false}
                  onChange={e => handleAssessmentChange('vomiting', e.target.checked)}
                />
                Vomiting
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={assessment.abdominalPain || false}
                  onChange={e => handleAssessmentChange('abdominalPain', e.target.checked)}
                />
                Abdominal Pain
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={assessment.priorInsulin || false}
                  onChange={e => handleAssessmentChange('priorInsulin', e.target.checked)}
                />
                Prior Insulin Use
              </label>
            </div>
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
            {severity.riskOfCerebralEdema && <span className="badge-warning">CEREBRAL EDEMA RISK</span>}
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
          <pre className="summary-text">{generateDKASummary(assessment as DKAAssessment, severity)}</pre>

          <div className="summary-actions">
            <button className="btn-secondary" onClick={() => setStep('assessment')}>
              Start New Assessment
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dka-flow {
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

        .glucose-unit-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .glucose-unit-selector button {
          padding: 8px 16px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .glucose-unit-selector button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .lab-values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .lab-input {
          display: flex;
          flex-direction: column;
        }

        .lab-input label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .lab-input input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .clinical-assessment {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .assessment-input {
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
        }

        .assessment-input label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .assessment-input select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: normal;
          cursor: pointer;
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
        .badge-warning {
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

        .badge-warning {
          background: #ffc107;
          color: #333;
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

export default DKAEmergencyFlow;
