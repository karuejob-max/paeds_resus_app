/**
 * Anaphylaxis Emergency Flow Component
 * 
 * Provides rapid decision support for anaphylactic shock management.
 * Time-critical: Epinephrine IM must be given within minutes.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Zap, Pill, CheckCircle, Clock } from 'lucide-react';
import {
  assessSeverity,
  calculateEpinephrineImDose,
  calculateEpinephrineIvDose,
  calculateAntihistamineDose,
  calculateCorticosteroidDose,
  evaluateEpinephrineEligibility,
  evaluateIcuAdmissionCriteria,
  identifyTrigger,
  generateRecommendation,
  type AnaphylaxisEngineState,
} from '@/lib/resus/anaphylaxis-engine';

interface AnaphylaxisEmergencyFlowProps {
  sessionId: number;
  patientWeight: number;
  patientAgeMonths: number;
  onSaveData?: (data: any) => void;
}

const SeverityBadgeColor = (severity: string): string => {
  const colors: Record<string, string> = {
    mild: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    severe: 'bg-orange-100 text-orange-800',
    cardiovascular_collapse: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
};

export const AnaphylaxisEmergencyFlow: React.FC<AnaphylaxisEmergencyFlowProps> = ({
  sessionId,
  patientWeight,
  patientAgeMonths,
  onSaveData,
}) => {
  const [phase, setPhase] = useState<'recognition' | 'treatment' | 'monitoring'>('recognition');
  const [findings, setFindings] = useState({
    systemsInvolved: [] as string[],
    respiratoryRate: 0,
    heartRate: 0,
    bloodPressureSystolic: 100,
    bloodPressureDiastolic: 60,
    oxygenSaturation: 100,
    wheezing: false,
    stridor: false,
    hypotension: false,
  });

  const [engineState, setEngineState] = useState<Partial<AnaphylaxisEngineState>>({
    patientWeight,
    patientAgeMonths,
    severity: 'mild',
    phase: 'recognition',
    epinephrineDoses: 0,
    ivAccessEstablished: false,
    antihistamineDoses: 0,
    corticosteroidDoses: 0,
    symptomOnsetTime: 0,
  });

  const [triggerContext, setTriggerContext] = useState({
    recentFoodIntake: '',
    recentMedicationExposure: '',
    insectStingHistory: false,
    latexExposure: false,
    exerciseRelated: false,
  });

  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer for tracking symptom onset
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate severity whenever findings change
  useEffect(() => {
    const severity = assessSeverity({
      ...findings,
      patientAgeMonths,
    });

    setEngineState((prev) => ({
      ...prev,
      ...findings,
      severity,
      symptomOnsetTime: timerSeconds,
    }));
  }, [findings, patientAgeMonths, timerSeconds]);

  const handleFindingChange = (key: string, value: any) => {
    setFindings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleSystem = (system: string) => {
    setFindings((prev) => {
      const systems = prev.systemsInvolved || [];
      if (systems.includes(system)) {
        return { ...prev, systemsInvolved: systems.filter((s) => s !== system) };
      } else {
        return { ...prev, systemsInvolved: [...systems, system] };
      }
    });
  };

  const handleGiveEpinephrine = (route: 'IM' | 'IV') => {
    const newState = { ...engineState };
    newState.epinephrineDoses = (newState.epinephrineDoses || 0) + 1;
    newState.lastEpinephrineTime = timerSeconds;
    if (route === 'IV') {
      newState.ivAccessEstablished = true;
    }
    setEngineState(newState);
    onSaveData?.(newState);
  };

  const handleGiveMedication = (medicationType: string) => {
    const newState = { ...engineState };
    switch (medicationType) {
      case 'antihistamine':
        newState.antihistamineDoses = (newState.antihistamineDoses || 0) + 1;
        break;
      case 'corticosteroid':
        newState.corticosteroidDoses = (newState.corticosteroidDoses || 0) + 1;
        break;
    }
    setEngineState(newState);
    onSaveData?.(newState);
  };

  const epinephrineEligibility = evaluateEpinephrineEligibility(engineState as AnaphylaxisEngineState);
  const icuCriteria = evaluateIcuAdmissionCriteria(engineState as AnaphylaxisEngineState);
  const recommendation = generateRecommendation(engineState as AnaphylaxisEngineState);
  const triggers = identifyTrigger(triggerContext);

  const epinephrineImDose = calculateEpinephrineImDose(patientWeight);
  const epinephrineIvDose = calculateEpinephrineIvDose(patientWeight);
  const antihistamineDose = calculateAntihistamineDose(patientWeight);
  const corticosteroidDose = calculateCorticosteroidDose(patientWeight);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Severity Badge and Timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anaphylaxis</h1>
          <p className="mt-1 text-gray-600">Anaphylactic Shock Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded bg-gray-100 px-4 py-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="font-mono text-lg font-bold text-gray-900">{formatTime(timerSeconds)}</span>
          </div>
          <Badge className={SeverityBadgeColor(engineState.severity || 'mild')}>
            {(engineState.severity || 'mild').toUpperCase().replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Critical Alert */}
      <Alert
        className={`border-l-4 ${
          engineState.severity === 'cardiovascular_collapse'
            ? 'border-red-500 bg-red-50'
            : engineState.severity === 'severe'
              ? 'border-orange-500 bg-orange-50'
              : 'border-yellow-500 bg-yellow-50'
        }`}
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="font-medium">{recommendation}</AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={phase} onValueChange={(v) => setPhase(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recognition">Recognition</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Recognition Tab */}
        <TabsContent value="recognition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Findings</CardTitle>
              <CardDescription>Select systems involved and enter vital signs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">Systems Involved</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {['respiratory', 'cardiovascular', 'cutaneous', 'gastrointestinal', 'neurological'].map(
                    (system) => (
                      <label key={system} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={findings.systemsInvolved?.includes(system) || false}
                          onChange={() => handleToggleSystem(system)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{system}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Respiratory Rate</label>
                  <Input
                    type="number"
                    value={findings.respiratoryRate}
                    onChange={(e) => handleFindingChange('respiratoryRate', parseInt(e.target.value) || 0)}
                    placeholder="breaths/min"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Heart Rate</label>
                  <Input
                    type="number"
                    value={findings.heartRate}
                    onChange={(e) => handleFindingChange('heartRate', parseInt(e.target.value) || 0)}
                    placeholder="bpm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Systolic BP</label>
                  <Input
                    type="number"
                    value={findings.bloodPressureSystolic}
                    onChange={(e) => handleFindingChange('bloodPressureSystolic', parseInt(e.target.value) || 100)}
                    placeholder="mmHg"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Oxygen Saturation</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={findings.oxygenSaturation}
                    onChange={(e) => handleFindingChange('oxygenSaturation', parseInt(e.target.value) || 100)}
                    placeholder="%"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'wheezing', label: 'Wheezing' },
                  { key: 'stridor', label: 'Stridor (Laryngeal Edema)' },
                  { key: 'hypotension', label: 'Hypotension (Shock)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(findings as any)[key]}
                      onChange={(e) => handleFindingChange(key, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trigger Identification */}
          <Card>
            <CardHeader>
              <CardTitle>Trigger Identification</CardTitle>
              <CardDescription>For prevention counseling and allergy referral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Recent Food Intake</label>
                <Input
                  value={triggerContext.recentFoodIntake}
                  onChange={(e) => setTriggerContext((prev) => ({ ...prev, recentFoodIntake: e.target.value }))}
                  placeholder="e.g., peanuts, shellfish"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Recent Medication</label>
                <Input
                  value={triggerContext.recentMedicationExposure}
                  onChange={(e) =>
                    setTriggerContext((prev) => ({ ...prev, recentMedicationExposure: e.target.value }))
                  }
                  placeholder="e.g., Penicillin, Aspirin"
                />
              </div>
              <div className="space-y-2">
                {[
                  { key: 'insectStingHistory', label: 'Insect Sting' },
                  { key: 'latexExposure', label: 'Latex Exposure' },
                  { key: 'exerciseRelated', label: 'Exercise-Induced' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(triggerContext as any)[key]}
                      onChange={(e) => setTriggerContext((prev) => ({ ...prev, [key]: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="rounded bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">Identified Triggers:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {triggers.map((trigger, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment" className="space-y-4">
          {/* Epinephrine IM - FIRST LINE */}
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Zap className="h-5 w-5" />
                Epinephrine IM (FIRST LINE)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded bg-white p-3">
                <p className="text-sm font-semibold text-gray-700">Dose</p>
                <p className="text-lg font-bold text-red-600">
                  {epinephrineImDose.dose} {epinephrineImDose.unit}
                </p>
                <p className="text-xs text-gray-600">
                  {epinephrineImDose.volume} {epinephrineImDose.volumeUnit} of {epinephrineImDose.concentration}
                </p>
                <p className="text-xs text-gray-600">Site: {epinephrineImDose.site}</p>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Doses given:</strong> {engineState.epinephrineDoses || 0}
              </p>
              <Button
                onClick={() => handleGiveEpinephrine('IM')}
                disabled={!epinephrineEligibility.eligible}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                GIVE EPINEPHRINE IM NOW
              </Button>
              {!epinephrineEligibility.eligible && (
                <p className="text-xs text-red-700">{epinephrineEligibility.recommendation}</p>
              )}
            </CardContent>
          </Card>

          {/* Epinephrine IV - If IM Failed */}
          {engineState.epinephrineDoses! > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Epinephrine IV (if IM failed)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Bolus</p>
                  <p className="text-lg font-bold text-blue-600">
                    {epinephrineIvDose.bolus.dose} {epinephrineIvDose.bolus.unit}
                  </p>
                  <p className="text-xs text-gray-600">
                    {epinephrineIvDose.bolus.volume} {epinephrineIvDose.bolus.volumeUnit} of{' '}
                    {epinephrineIvDose.bolus.concentration}
                  </p>
                </div>
                <Button
                  onClick={() => handleGiveEpinephrine('IV')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Epinephrine IV
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Antihistamine */}
          {engineState.epinephrineDoses! > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Antihistamine (H1 Blocker)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-purple-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Dose</p>
                  <p className="text-lg font-bold text-purple-600">
                    {antihistamineDose.dose} {antihistamineDose.unit}
                  </p>
                  <p className="text-xs text-gray-600">{antihistamineDose.agent} - {antihistamineDose.route}</p>
                </div>
                <Button
                  onClick={() => handleGiveMedication('antihistamine')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Antihistamine
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Corticosteroid */}
          {engineState.epinephrineDoses! > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Corticosteroid (Prevent Biphasic Reaction)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-green-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Dose</p>
                  <p className="text-lg font-bold text-green-600">
                    {corticosteroidDose.dose} {corticosteroidDose.unit}
                  </p>
                  <p className="text-xs text-gray-600">{corticosteroidDose.agent} - {corticosteroidDose.route}</p>
                </div>
                <Button
                  onClick={() => handleGiveMedication('corticosteroid')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Corticosteroid
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          {icuCriteria.requiresIcu && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>ICU Admission Required:</strong>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {icuCriteria.criteria.map((criterion, idx) => (
                    <li key={idx}>{criterion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Observation Period</CardTitle>
              <CardDescription>Monitor for biphasic anaphylaxis (1-72 hours)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Patient should be observed for 4-8 hours minimum. Biphasic reactions can occur up to 72 hours after
                initial onset. Ensure epinephrine auto-injector is prescribed and patient receives allergy specialist
                referral.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnaphylaxisEmergencyFlow;

