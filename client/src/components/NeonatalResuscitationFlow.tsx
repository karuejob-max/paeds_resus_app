/**
 * Neonatal Resuscitation Flow Component
 * 
 * Provides real-time guidance for newborn resuscitation (0-28 days)
 * Implements NRP 8th Edition guidelines with sequential assessment
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  assessNeonatalSeverity,
  generateInitialAssessmentInterventions,
  generateDryingAndStimulationInterventions,
  generateVentilationInterventions,
  generateChestCompressionInterventions,
  generateMedicationInterventions,
  generatePostResuscitationCareInterventions,
  generateNeonatalResuscitationSummary,
  type NeonatalAssessment,
} from '@/lib/resus/neonatal-resuscitation-engine';

export function NeonatalResuscitationFlow() {
  const [step, setStep] = useState<'initial' | 'assessment' | 'interventions' | 'summary'>('initial');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [assessment, setAssessment] = useState<Partial<NeonatalAssessment>>({
    ageMinutes: 0,
    birthWeight: 3500,
    gestationalAge: 40,
    term: true,
    toneAtBirth: 'good',
    breathingEffort: 'spontaneous',
    heartRate: 140,
    meconiumPresent: false,
    meconiumStained: 'clear',
    dryingAndStimulation: false,
    positioningDone: false,
    suction: 'not_needed',
    oxygenSaturation: 98,
    chestRise: 'adequate',
    breathSounds: 'bilateral_equal',
    heartRateAfterVentilation: 140,
    color: 'pink',
    meconiumAspiration: false,
  });

  // Timer for resuscitation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleInputChange = (field: string, value: any) => {
    setAssessment(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const severity = assessNeonatalSeverity(assessment as NeonatalAssessment);
  const initialInterventions = generateInitialAssessmentInterventions(assessment as NeonatalAssessment);
  const dryingInterventions = generateDryingAndStimulationInterventions(assessment as NeonatalAssessment);
  const ventilationInterventions = generateVentilationInterventions(assessment as NeonatalAssessment, severity);
  const compressionInterventions = generateChestCompressionInterventions(assessment as NeonatalAssessment, severity);
  const medicationInterventions = generateMedicationInterventions(assessment as NeonatalAssessment, severity);
  const postResuscitationInterventions = generatePostResuscitationCareInterventions(assessment as NeonatalAssessment, severity);
  const summary = generateNeonatalResuscitationSummary(assessment as NeonatalAssessment, severity);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">👶 Neonatal Resuscitation (NRP)</h1>

      {/* Resuscitation Timer */}
      {step !== 'initial' && (
        <div className="mb-6 p-4 bg-blue-50 rounded border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600">Resuscitation Time</div>
              <div className="text-3xl font-bold text-blue-700">{formatTime(timer)}</div>
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`px-4 py-2 rounded font-bold text-white transition ${
                isTimerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
          </div>
        </div>
      )}

      {/* Step Navigation */}
      <div className="flex gap-2 mb-8">
        {['initial', 'assessment', 'interventions', 'summary'].map(s => (
          <button
            key={s}
            onClick={() => setStep(s as any)}
            className={`px-4 py-2 rounded font-semibold transition ${
              step === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {s === 'initial' && 'Initial'}
            {s === 'assessment' && 'Assessment'}
            {s === 'interventions' && 'Interventions'}
            {s === 'summary' && 'Summary'}
          </button>
        ))}
      </div>

      {/* Initial Information */}
      {step === 'initial' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Patient Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Birth Weight (grams)</label>
              <input
                type="number"
                value={assessment.birthWeight || ''}
                onChange={e => handleInputChange('birthWeight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Gestational Age (weeks)</label>
              <input
                type="number"
                value={assessment.gestationalAge || ''}
                onChange={e => handleInputChange('gestationalAge', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={assessment.term || false}
              onChange={e => handleInputChange('term', e.target.checked)}
            />
            <span className="font-semibold">Term infant (≥35 weeks)</span>
          </label>

          <div>
            <label className="block text-sm font-semibold mb-2">Meconium-Stained Fluid</label>
            <select
              value={assessment.meconiumStained || 'clear'}
              onChange={e => handleInputChange('meconiumStained', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="clear">Clear</option>
              <option value="thin">Thin</option>
              <option value="thick">Thick</option>
            </select>
          </div>

          <button
            onClick={() => {
              setIsTimerRunning(true);
              setStep('assessment');
            }}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
          >
            Start Resuscitation Assessment
          </button>
        </div>
      )}

      {/* Assessment */}
      {step === 'assessment' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Initial Assessment (First 30 seconds)</h2>

          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-600">
            <p className="font-semibold text-blue-700 mb-3">Assess three questions:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Is the infant term? (≥35 weeks)</li>
              <li>Is muscle tone good?</li>
              <li>Is the infant breathing or crying?</li>
            </ol>
            <p className="mt-3 text-sm text-gray-600">
              If YES to all three → Routine care. If NO to any → Proceed with resuscitation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Tone at Birth</label>
              <select
                value={assessment.toneAtBirth || 'good'}
                onChange={e => handleInputChange('toneAtBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="good">Good</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Breathing Effort</label>
              <select
                value={assessment.breathingEffort || 'spontaneous'}
                onChange={e => handleInputChange('breathingEffort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="spontaneous">Spontaneous</option>
                <option value="gasping">Gasping</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Heart Rate (bpm)</label>
            <input
              type="number"
              value={assessment.heartRate || ''}
              onChange={e => handleInputChange('heartRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">Normal: 120-160 bpm. Bradycardia: <100 bpm</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Skin Color</label>
            <select
              value={assessment.color || 'pink'}
              onChange={e => handleInputChange('color', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="pink">Pink</option>
              <option value="acrocyanosis">Acrocyanosis</option>
              <option value="cyanotic">Cyanotic</option>
              <option value="pale">Pale</option>
            </select>
          </div>

          {/* Severity Alert */}
          <div
            className={`p-4 rounded font-bold text-white ${
              severity.level === 'severely_depressed'
                ? 'bg-red-600'
                : severity.level === 'depressed'
                  ? 'bg-orange-600'
                  : 'bg-green-600'
            }`}
          >
            {severity.classification}: {severity.description}
          </div>

          {/* Initial Interventions */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-3">Initial Assessment Guidance</h3>
            <div className="space-y-3">
              {initialInterventions.map((intervention, idx) => (
                <div key={idx} className="bg-white p-3 rounded border-l-4 border-blue-600">
                  <div className="font-semibold text-blue-700">{intervention.description}</div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('interventions')}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
          >
            Proceed to Interventions
          </button>
        </div>
      )}

      {/* Interventions */}
      {step === 'interventions' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Resuscitation Interventions</h2>

          {/* Drying & Stimulation */}
          {dryingInterventions.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-600">
              <h3 className="font-bold text-yellow-700 mb-3">Step 1: Drying & Stimulation</h3>
              {dryingInterventions.map((intervention, idx) => (
                <div key={idx} className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{intervention.dosing}</div>
                </div>
              ))}
            </div>
          )}

          {/* Ventilation */}
          {ventilationInterventions.length > 0 && (
            <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-600">
              <h3 className="font-bold text-orange-700 mb-3">Step 2: Positive Pressure Ventilation</h3>
              <div className="space-y-3">
                {ventilationInterventions.map((intervention, idx) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <div className="font-semibold text-orange-700">{intervention.description}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chest Compressions */}
          {compressionInterventions.length > 0 && (
            <div className="bg-red-50 p-4 rounded border-l-4 border-red-600">
              <h3 className="font-bold text-red-700 mb-3">Step 3: Chest Compressions</h3>
              <div className="space-y-3">
                {compressionInterventions.map((intervention, idx) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <div className="font-semibold text-red-700">{intervention.description}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {medicationInterventions.length > 0 && (
            <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-600">
              <h3 className="font-bold text-purple-700 mb-3">Step 4: Medications</h3>
              <div className="space-y-3">
                {medicationInterventions.map((intervention, idx) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <div className="font-semibold text-purple-700">{intervention.description}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post-Resuscitation */}
          {postResuscitationInterventions.length > 0 && (
            <div className="bg-green-50 p-4 rounded border-l-4 border-green-600">
              <h3 className="font-bold text-green-700 mb-3">Post-Resuscitation Care</h3>
              <div className="space-y-3">
                {postResuscitationInterventions.map((intervention, idx) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <div className="font-semibold text-green-700">{intervention.description}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('summary')}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
          >
            View Clinical Summary
          </button>
        </div>
      )}

      {/* Summary */}
      {step === 'summary' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Clinical Summary</h2>

          <div className="bg-gray-50 p-6 rounded font-mono text-sm whitespace-pre-wrap">
            {summary}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('interventions')}
              className="flex-1 bg-gray-600 text-white py-3 rounded font-bold hover:bg-gray-700 transition"
            >
              Back to Interventions
            </button>
            <button
              onClick={() => {
                const element = document.createElement('a');
                element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(summary)}`);
                element.setAttribute('download', 'neonatal-resuscitation-summary.txt');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition"
            >
              Download Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
