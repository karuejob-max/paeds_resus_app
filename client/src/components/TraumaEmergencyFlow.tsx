/**
 * Trauma Emergency Flow Component
 * 
 * Provides real-time guidance for pediatric trauma management
 * Implements ATLS primary and secondary survey with sequential assessment
 */

'use client';

import React, { useState } from 'react';
import {
  assessTraumaSeverity,
  generatePrimarySurveyInterventions,
  generateSecondarySurveyInterventions,
  generateSpinalPrecautionInterventions,
  generateTraumaSummary,
  type TraumaAssessment,
} from '@/lib/resus/trauma-engine';

export function TraumaEmergencyFlow() {
  const [step, setStep] = useState<'initial' | 'primary' | 'secondary' | 'summary'>('initial');
  const [assessment, setAssessment] = useState<Partial<TraumaAssessment>>({
    age: 0,
    weightKg: 0,
    mechanismOfInjury: '',
    airwayPatency: 'patent',
    respiratoryRate: 20,
    oxygenSaturation: 98,
    breathSounds: 'bilateral_equal',
    chestWallIntegrity: 'intact',
    heartRate: 100,
    systolicBP: 100,
    diastolicBP: 60,
    capillaryRefillTime: 2,
    skinPerfusion: 'warm_pink',
    pulseQuality: 'strong',
    consciousness: 'alert',
    pupilSize: 'normal',
    pupilReactivity: 'reactive',
    suspectedSpinalInjury: false,
    highEnergyMechanism: false,
    penetratingInjury: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setAssessment(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const severity = assessTraumaSeverity(assessment as TraumaAssessment);
  const primaryInterventions = generatePrimarySurveyInterventions(assessment as TraumaAssessment, severity);
  const secondaryInterventions = generateSecondarySurveyInterventions(assessment as TraumaAssessment);
  const spinalInterventions = generateSpinalPrecautionInterventions(assessment as TraumaAssessment);
  const summary = generateTraumaSummary(assessment as TraumaAssessment, severity);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-red-700">🚑 Pediatric Trauma Management</h1>

      {/* Step Navigation */}
      <div className="flex gap-2 mb-8">
        {['initial', 'primary', 'secondary', 'summary'].map(s => (
          <button
            key={s}
            onClick={() => setStep(s as any)}
            className={`px-4 py-2 rounded font-semibold transition ${
              step === s
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {s === 'initial' && 'Initial'}
            {s === 'primary' && 'Primary Survey'}
            {s === 'secondary' && 'Secondary'}
            {s === 'summary' && 'Summary'}
          </button>
        ))}
      </div>

      {/* Initial Assessment */}
      {step === 'initial' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Initial Assessment</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Age (years)</label>
              <input
                type="number"
                value={assessment.age || ''}
                onChange={e => handleInputChange('age', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Weight (kg)</label>
              <input
                type="number"
                value={assessment.weightKg || ''}
                onChange={e => handleInputChange('weightKg', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Mechanism of Injury</label>
            <input
              type="text"
              value={assessment.mechanismOfInjury || ''}
              onChange={e => handleInputChange('mechanismOfInjury', e.target.value)}
              placeholder="e.g., MVA, fall, penetrating wound"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assessment.highEnergyMechanism || false}
                onChange={e => handleInputChange('highEnergyMechanism', e.target.checked)}
              />
              <span>High-Energy Mechanism</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assessment.penetratingInjury || false}
                onChange={e => handleInputChange('penetratingInjury', e.target.checked)}
              />
              <span>Penetrating Injury</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assessment.suspectedSpinalInjury || false}
                onChange={e => handleInputChange('suspectedSpinalInjury', e.target.checked)}
              />
              <span>Suspected Spinal Injury</span>
            </label>
          </div>

          <button
            onClick={() => setStep('primary')}
            className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition"
          >
            Proceed to Primary Survey
          </button>
        </div>
      )}

      {/* Primary Survey */}
      {step === 'primary' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Primary Survey (A-B-C-D-E)</h2>

          {/* Airway */}
          <div className="border-l-4 border-red-600 pl-4 py-2">
            <h3 className="text-xl font-bold text-red-700">A - Airway</h3>
            <div className="mt-2">
              <label className="block text-sm font-semibold mb-2">Airway Patency</label>
              <select
                value={assessment.airwayPatency || 'patent'}
                onChange={e => handleInputChange('airwayPatency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="patent">Patent</option>
                <option value="compromised">Compromised</option>
                <option value="obstructed">Obstructed</option>
              </select>
            </div>
          </div>

          {/* Breathing */}
          <div className="border-l-4 border-orange-600 pl-4 py-2">
            <h3 className="text-xl font-bold text-orange-700">B - Breathing</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-semibold mb-2">Respiratory Rate</label>
                <input
                  type="number"
                  value={assessment.respiratoryRate || ''}
                  onChange={e => handleInputChange('respiratoryRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">O2 Saturation (%)</label>
                <input
                  type="number"
                  value={assessment.oxygenSaturation || ''}
                  onChange={e => handleInputChange('oxygenSaturation', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold mb-2">Breath Sounds</label>
              <select
                value={assessment.breathSounds || 'bilateral_equal'}
                onChange={e => handleInputChange('breathSounds', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="bilateral_equal">Bilateral Equal</option>
                <option value="unilateral_decreased">Unilateral Decreased</option>
                <option value="absent">Absent</option>
                <option value="asymmetric">Asymmetric</option>
              </select>
            </div>
          </div>

          {/* Circulation */}
          <div className="border-l-4 border-blue-600 pl-4 py-2">
            <h3 className="text-xl font-bold text-blue-700">C - Circulation</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-semibold mb-2">Heart Rate</label>
                <input
                  type="number"
                  value={assessment.heartRate || ''}
                  onChange={e => handleInputChange('heartRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Systolic BP</label>
                <input
                  type="number"
                  value={assessment.systolicBP || ''}
                  onChange={e => handleInputChange('systolicBP', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">CRT (seconds)</label>
                <input
                  type="number"
                  value={assessment.capillaryRefillTime || ''}
                  onChange={e => handleInputChange('capillaryRefillTime', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Skin Perfusion</label>
                <select
                  value={assessment.skinPerfusion || 'warm_pink'}
                  onChange={e => handleInputChange('skinPerfusion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="warm_pink">Warm & Pink</option>
                  <option value="cool_pale">Cool & Pale</option>
                  <option value="cold_mottled">Cold & Mottled</option>
                  <option value="cyanotic">Cyanotic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Disability */}
          <div className="border-l-4 border-purple-600 pl-4 py-2">
            <h3 className="text-xl font-bold text-purple-700">D - Disability</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-semibold mb-2">Consciousness</label>
                <select
                  value={assessment.consciousness || 'alert'}
                  onChange={e => handleInputChange('consciousness', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="alert">Alert</option>
                  <option value="verbal">Verbal</option>
                  <option value="pain">Pain</option>
                  <option value="unresponsive">Unresponsive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Pupil Size</label>
                <select
                  value={assessment.pupilSize || 'normal'}
                  onChange={e => handleInputChange('pupilSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="normal">Normal</option>
                  <option value="dilated_unilateral">Dilated (Unilateral)</option>
                  <option value="dilated_bilateral">Dilated (Bilateral)</option>
                  <option value="pinpoint">Pinpoint</option>
                </select>
              </div>
            </div>
          </div>

          {/* Severity Alert */}
          <div
            className={`p-4 rounded font-bold text-white ${
              severity.level === 'critical'
                ? 'bg-red-600'
                : severity.level === 'severe'
                  ? 'bg-orange-600'
                  : severity.level === 'moderate'
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
            }`}
          >
            {severity.classification}: {severity.description}
          </div>

          {/* Interventions */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-3">Recommended Interventions</h3>
            <div className="space-y-3">
              {primaryInterventions.map((intervention, idx) => (
                <div key={idx} className="bg-white p-3 rounded border-l-4 border-red-600">
                  <div className="font-semibold text-red-700">{intervention.description}</div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('secondary')}
            className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition"
          >
            Proceed to Secondary Survey
          </button>
        </div>
      )}

      {/* Secondary Survey */}
      {step === 'secondary' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Secondary Survey</h2>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold mb-3">Systematic Head-to-Toe Assessment</h3>
            <div className="space-y-3">
              {secondaryInterventions.map((intervention, idx) => (
                <div key={idx} className="bg-white p-3 rounded border-l-4 border-blue-600">
                  <div className="font-semibold text-blue-700">{intervention.description}</div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                </div>
              ))}
            </div>
          </div>

          {assessment.suspectedSpinalInjury && (
            <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-600">
              <h3 className="font-bold text-yellow-700 mb-3">Spinal Precautions</h3>
              <div className="space-y-3">
                {spinalInterventions.map((intervention, idx) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <div className="font-semibold text-yellow-700">{intervention.description}</div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{intervention.dosing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('summary')}
            className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition"
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
              onClick={() => setStep('primary')}
              className="flex-1 bg-gray-600 text-white py-3 rounded font-bold hover:bg-gray-700 transition"
            >
              Back to Primary Survey
            </button>
            <button
              onClick={() => {
                const element = document.createElement('a');
                element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(summary)}`);
                element.setAttribute('download', 'trauma-summary.txt');
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
