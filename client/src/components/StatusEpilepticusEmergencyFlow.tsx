/**
 * Status Epilepticus Emergency Management Flow Component
 * 
 * Provides real-time sequential guidance for status epilepticus management
 * with time-based escalation and intervention tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  assessStatusEpilepticusSeverity,
  generateFirstLineTherapy,
  generateSecondLineTherapy,
  generateThirdLineTherapy,
  generateSupportiveCareAndMonitoring,
  generateStatusEpilepticusSummary,
  type StatusEpilepticusAssessment,
  type StatusEpilepticusSeverity,
  type StatusEpilepticusIntervention,
} from '@/lib/resus/status-epilepticus-engine';

interface StatusEpilepticusFlowProps {
  patientAge: number;
  patientWeight: number;
  onSessionUpdate?: (data: any) => void;
  onComplete?: (summary: string) => void;
}

export const StatusEpilepticusEmergencyFlow: React.FC<StatusEpilepticusFlowProps> = ({
  patientAge,
  patientWeight,
  onSessionUpdate,
  onComplete,
}) => {
  const [step, setStep] = useState<'assessment' | 'interventions' | 'summary'>('assessment');
  const [seizureStartTime] = useState<number>(Date.now());
  const [seizureDuration, setSeizureDuration] = useState<number>(0);
  const [assessment, setAssessment] = useState<Partial<StatusEpilepticusAssessment>>({
    age: patientAge,
    weightKg: patientWeight,
    seizureDuration: 0,
  });
  const [severity, setSeverity] = useState<StatusEpilepticusSeverity | null>(null);
  const [interventions, setInterventions] = useState<StatusEpilepticusIntervention[]>([]);
  const [completedInterventions, setCompletedInterventions] = useState<string[]>([]);

  // Update seizure duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - seizureStartTime) / 1000 / 60); // minutes
      setSeizureDuration(duration);
      setAssessment(prev => ({ ...prev, seizureDuration: duration }));
    }, 1000);

    return () => clearInterval(interval);
  }, [seizureStartTime]);

  const handleAssessmentChange = useCallback((field: string, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAssessmentComplete = useCallback(() => {
    if (
      assessment.consciousness === undefined ||
      assessment.airwayPatency === undefined ||
      assessment.oxygenSaturation === undefined
    ) {
      alert('Please complete all clinical assessments');
      return;
    }

    const completedAssessment = assessment as StatusEpilepticusAssessment;
    const calculatedSeverity = assessStatusEpilepticusSeverity(completedAssessment);
    setSeverity(calculatedSeverity);

    // Generate interventions based on severity
    const firstLineInterventions = generateFirstLineTherapy(completedAssessment);
    const secondLineInterventions =
      calculatedSeverity.level !== 'early_se' ? generateSecondLineTherapy(completedAssessment) : [];
    const thirdLineInterventions =
      calculatedSeverity.level === 'refractory_se' || calculatedSeverity.level === 'super_refractory_se'
        ? generateThirdLineTherapy(completedAssessment)
        : [];
    const supportiveInterventions = generateSupportiveCareAndMonitoring(completedAssessment);

    const allInterventions = [
      ...firstLineInterventions,
      ...secondLineInterventions,
      ...thirdLineInterventions,
      ...supportiveInterventions,
    ];

    setInterventions(allInterventions);
    setStep('interventions');

    if (onSessionUpdate) {
      onSessionUpdate({
        emergencyType: 'status_epilepticus',
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

    const summary = generateStatusEpilepticusSummary(
      assessment as StatusEpilepticusAssessment,
      severity
    );
    setStep('summary');

    if (onComplete) {
      onComplete(summary);
    }
  }, [assessment, severity, onComplete]);

  return (
    <div className="status-epilepticus-flow">
      {step === 'assessment' && (
        <div className="assessment-section">
          <h2>Status Epilepticus Assessment</h2>

          <div className="seizure-duration-banner">
            <h3>Seizure Duration: {seizureDuration} minutes</h3>
            <p>
              {seizureDuration < 5
                ? '⚠️ Early SE - First-line therapy indicated'
                : seizureDuration < 30
                  ? '⚠️⚠️ Established SE - Second-line therapy if first-line fails'
                  : seizureDuration < 60
                    ? '🚨 Refractory SE - Third-line therapy + ICU REQUIRED'
                    : '🚨🚨 Super-Refractory SE - Anesthesia + ICU REQUIRED'}
            </p>
          </div>

          <div className="seizure-assessment">
            <div className="assessment-input">
              <label>Seizure Type</label>
              <select
                value={assessment.seizureType || ''}
                onChange={e => handleAssessmentChange('seizureType', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="generalized_tonic_clonic">Generalized Tonic-Clonic</option>
                <option value="focal">Focal</option>
                <option value="absence">Absence</option>
                <option value="myoclonic">Myoclonic</option>
                <option value="atonic">Atonic</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="assessment-input">
              <label>Consciousness Level</label>
              <select
                value={assessment.consciousness || ''}
                onChange={e => handleAssessmentChange('consciousness', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="alert">Alert</option>
                <option value="drowsy">Drowsy</option>
                <option value="unresponsive">Unresponsive</option>
              </select>
            </div>

            <div className="assessment-input">
              <label>Airway Patency</label>
              <select
                value={assessment.airwayPatency || ''}
                onChange={e => handleAssessmentChange('airwayPatency', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="patent">Patent</option>
                <option value="compromised">Compromised</option>
                <option value="obstructed">Obstructed</option>
              </select>
            </div>

            <div className="assessment-input">
              <label>Oxygen Saturation (%)</label>
              <input
                type="number"
                value={assessment.oxygenSaturation || ''}
                onChange={e => handleAssessmentChange('oxygenSaturation', parseFloat(e.target.value))}
                placeholder="e.g., 92"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="vital-signs-grid">
            <div className="vital-input">
              <label>Heart Rate (bpm)</label>
              <input
                type="number"
                value={assessment.heartRate || ''}
                onChange={e => handleAssessmentChange('heartRate', parseInt(e.target.value))}
                placeholder="e.g., 120"
              />
            </div>

            <div className="vital-input">
              <label>Respiratory Rate (breaths/min)</label>
              <input
                type="number"
                value={assessment.respiratoryRate || ''}
                onChange={e => handleAssessmentChange('respiratoryRate', parseInt(e.target.value))}
                placeholder="e.g., 28"
              />
            </div>

            <div className="vital-input">
              <label>Systolic BP (mmHg)</label>
              <input
                type="number"
                value={assessment.bloodPressure?.systolic || ''}
                onChange={e =>
                  handleAssessmentChange('bloodPressure', {
                    ...assessment.bloodPressure,
                    systolic: parseInt(e.target.value),
                  })
                }
                placeholder="e.g., 110"
              />
            </div>

            <div className="vital-input">
              <label>Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={assessment.bloodPressure?.diastolic || ''}
                onChange={e =>
                  handleAssessmentChange('bloodPressure', {
                    ...assessment.bloodPressure,
                    diastolic: parseInt(e.target.value),
                  })
                }
                placeholder="e.g., 70"
              />
            </div>

            <div className="vital-input">
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={assessment.temperature || ''}
                onChange={e => handleAssessmentChange('temperature', parseFloat(e.target.value))}
                placeholder="e.g., 37.5"
              />
            </div>

            <div className="vital-input">
              <label>Blood Glucose (mg/dL)</label>
              <input
                type="number"
                value={assessment.bloodGlucose || ''}
                onChange={e => handleAssessmentChange('bloodGlucose', parseFloat(e.target.value))}
                placeholder="e.g., 100"
              />
            </div>
          </div>

          <div className="clinical-history">
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={assessment.priorSeizures || false}
                  onChange={e => handleAssessmentChange('priorSeizures', e.target.checked)}
                />
                Prior Seizure History
              </label>
            </div>

            <div className="assessment-input">
              <label>Known Etiology</label>
              <input
                type="text"
                value={assessment.knownEtiology || ''}
                onChange={e => handleAssessmentChange('knownEtiology', e.target.value)}
                placeholder="e.g., idiopathic, infection, trauma, metabolic"
              />
            </div>

            <div className="assessment-input">
              <label>Prior Antiepileptics (comma-separated)</label>
              <input
                type="text"
                value={assessment.priorAntiepileptics?.join(', ') || ''}
                onChange={e =>
                  handleAssessmentChange(
                    'priorAntiepileptics',
                    e.target.value.split(',').map(s => s.trim())
                  )
                }
                placeholder="e.g., phenytoin, levetiracetam"
              />
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
            <h3>{severity.classification}</h3>
            <p>{severity.description}</p>
            {severity.requiresICU && <span className="badge-icu">ICU REQUIRED</span>}
            {severity.requiresIntubation && <span className="badge-intubation">INTUBATION NEEDED</span>}
            {severity.requiresAnesthesia && <span className="badge-anesthesia">ANESTHESIA REQUIRED</span>}
          </div>

          <div className="interventions-list">
            {interventions.map((intervention, index) => (
              <div
                key={index}
                className={`intervention-card ${completedInterventions.includes(intervention.type) ? 'completed' : ''}`}
              >
                <div className="intervention-header">
                  <div>
                    <h4>{intervention.description}</h4>
                    {intervention.timeWindow && (
                      <span className="time-window">Time Window: {intervention.timeWindow}</span>
                    )}
                  </div>
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
          <pre className="summary-text">
            {generateStatusEpilepticusSummary(assessment as StatusEpilepticusAssessment, severity)}
          </pre>

          <div className="summary-actions">
            <button className="btn-secondary" onClick={() => setStep('assessment')}>
              Start New Assessment
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .status-epilepticus-flow {
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

        .seizure-duration-banner {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .seizure-duration-banner h3 {
          margin: 0 0 10px 0;
          color: #856404;
          font-size: 24px;
        }

        .seizure-duration-banner p {
          margin: 0;
          color: #856404;
          font-size: 16px;
        }

        .seizure-assessment {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .assessment-input {
          display: flex;
          flex-direction: column;
        }

        .assessment-input label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .assessment-input input,
        .assessment-input select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
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

        .vital-input label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .vital-input input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .clinical-history {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .checkbox-group {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
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
        .badge-intubation,
        .badge-anesthesia {
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

        .badge-intubation {
          background: #fd7e14;
          color: white;
        }

        .badge-anesthesia {
          background: #6f42c1;
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
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .intervention-header h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .time-window {
          font-size: 12px;
          color: #666;
          font-weight: normal;
        }

        .btn-check {
          padding: 6px 12px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
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

export default StatusEpilepticusEmergencyFlow;
