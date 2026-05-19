/**
 * Respiratory Emergency Flow Component
 * 
 * Provides sequential decision support for severe asthma exacerbation (Status Asthmaticus).n * Follows ABCDE assessment framework with real-time medication recommendations.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Activity, Zap, Pill, CheckCircle } from 'lucide-react';
import {
  assessSeverity,
  calculateSalbutamolDose,
  calculateIpratropiumDose,
  calculateCorticosteroidDose,
  calculateMagnesiumDose,
  evaluateMedicationEligibility,
  evaluateIcuAdmissionCriteria,
  generateRecommendation,
  type AsthmaticEngineState,
} from '@/lib/resus/status-asthmaticus-engine';

interface RespiratoryEmergencyFlowProps {
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
    life_threatening: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
};

export const RespiratoryEmergencyFlow: React.FC<RespiratoryEmergencyFlowProps> = ({
  sessionId,
  patientWeight,
  patientAgeMonths,
  onSaveData,
}) => {
  const [phase, setPhase] = useState<'assessment' | 'treatment' | 'monitoring'>('assessment');
  const [findings, setFindings] = useState({
    respiratoryRate: 0,
    oxygenSaturation: 100,
    peakFlowPercent: 0,
    accessoryMusclUse: false,
    speakingAbility: 'full_sentences' as const,
    alertness: 'alert' as const,
  });

  const [engineState, setEngineState] = useState<Partial<AsthmaticEngineState>>({
    patientWeight,
    patientAgeMonths,
    severity: 'mild',
    phase: 'assessment',
    oxygenStarted: false,
    salbutamolDoses: 0,
    ipratropiumDoses: 0,
    corticosteroidDoses: 0,
    magnesiumDoses: 0,
    responseToInitialTherapy: 'unknown',
  });

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
    }));
  }, [findings, patientAgeMonths]);

  const handleFindingChange = (key: string, value: any) => {
    setFindings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGiveMedication = (medicationType: string) => {
    const newState = { ...engineState };
    switch (medicationType) {
      case 'salbutamol':
        newState.salbutamolDoses = (newState.salbutamolDoses || 0) + 1;
        newState.lastBronchodilatorTime = Date.now() / 1000;
        break;
      case 'ipratropium':
        newState.ipratropiumDoses = (newState.ipratropiumDoses || 0) + 1;
        break;
      case 'corticosteroid':
        newState.corticosteroidDoses = (newState.corticosteroidDoses || 0) + 1;
        newState.lastSteroidTime = Date.now() / 1000;
        break;
      case 'magnesium':
        newState.magnesiumDoses = (newState.magnesiumDoses || 0) + 1;
        break;
    }
    setEngineState(newState);
    onSaveData?.(newState);
  };

  const medicationEligibility = evaluateMedicationEligibility(engineState as AsthmaticEngineState);
  const icuCriteria = evaluateIcuAdmissionCriteria(engineState as AsthmaticEngineState);
  const recommendation = generateRecommendation(engineState as AsthmaticEngineState);

  const salbutamolDose = calculateSalbutamolDose(patientWeight);
  const ipratropiumDose = calculateIpratropiumDose(patientWeight);
  const corticosteroidDose = calculateCorticosteroidDose(patientWeight);
  const magnesiumDose = calculateMagnesiumDose(patientWeight);

  return (
    <div className="space-y-6">
      {/* Header with Severity Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Asthmaticus</h1>
          <p className="mt-1 text-gray-600">Severe Asthma Exacerbation Management</p>
        </div>
        <Badge className={SeverityBadgeColor(engineState.severity || 'mild')}>
          {(engineState.severity || 'mild').toUpperCase().replace('_', ' ')}
        </Badge>
      </div>

      {/* Clinical Recommendation Alert */}
      <Alert
        className={`border-l-4 ${
          engineState.severity === 'life_threatening'
            ? 'border-red-500 bg-red-50'
            : engineState.severity === 'severe'
              ? 'border-orange-500 bg-orange-50'
              : 'border-yellow-500 bg-yellow-50'
        }`}
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="font-medium">{recommendation}</AlertDescription>
      </Alert>

      {/* Tabs for Assessment, Treatment, Monitoring */}
      <Tabs value={phase} onValueChange={(v) => setPhase(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Findings</CardTitle>
              <CardDescription>Enter patient vital signs and clinical observations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Respiratory Rate (breaths/min)</label>
                  <Input
                    type="number"
                    value={findings.respiratoryRate}
                    onChange={(e) => handleFindingChange('respiratoryRate', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 35"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Oxygen Saturation (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={findings.oxygenSaturation}
                    onChange={(e) => handleFindingChange('oxygenSaturation', parseInt(e.target.value) || 100)}
                    placeholder="e.g., 92"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Peak Flow (% predicted)</label>
                  <Input
                    type="number"
                    value={findings.peakFlowPercent}
                    onChange={(e) => handleFindingChange('peakFlowPercent', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 60"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Alertness</label>
                  <select
                    value={findings.alertness}
                    onChange={(e) => handleFindingChange('alertness', e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="alert">Alert</option>
                    <option value="agitated">Agitated</option>
                    <option value="drowsy">Drowsy</option>
                    <option value="unresponsive">Unresponsive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={findings.accessoryMusclUse}
                    onChange={(e) => handleFindingChange('accessoryMusclUse', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Accessory Muscle Use</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Speaking Ability</label>
                <select
                  value={findings.speakingAbility}
                  onChange={(e) => handleFindingChange('speakingAbility', e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="full_sentences">Full Sentences</option>
                  <option value="phrases">Phrases</option>
                  <option value="words">Words</option>
                  <option value="unable">Unable to Speak</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Salbutamol Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Salbutamol (Albuterol)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Dose</p>
                  <p className="text-lg font-bold text-blue-600">
                    {salbutamolDose.dose} {salbutamolDose.unit}
                  </p>
                  <p className="text-xs text-gray-600">{salbutamolDose.route}</p>
                </div>
                <p className="text-xs text-gray-600">{salbutamolDose.frequency}</p>
                <p className="text-sm text-gray-700">
                  <strong>Doses given:</strong> {engineState.salbutamolDoses || 0}
                </p>
                <Button
                  onClick={() => handleGiveMedication('salbutamol')}
                  disabled={!medicationEligibility.salbutamolEligible}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Salbutamol
                </Button>
              </CardContent>
            </Card>

            {/* Ipratropium Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Ipratropium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-purple-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Dose</p>
                  <p className="text-lg font-bold text-purple-600">
                    {ipratropiumDose.dose} {ipratropiumDose.unit}
                  </p>
                  <p className="text-xs text-gray-600">{ipratropiumDose.route}</p>
                </div>
                <p className="text-xs text-gray-600">{ipratropiumDose.indication}</p>
                <p className="text-sm text-gray-700">
                  <strong>Doses given:</strong> {engineState.ipratropiumDoses || 0}
                </p>
                <Button
                  onClick={() => handleGiveMedication('ipratropium')}
                  disabled={!medicationEligibility.ipratropiumEligible}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Ipratropium
                </Button>
              </CardContent>
            </Card>

            {/* Corticosteroid Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Corticosteroid
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-green-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Dose</p>
                  <p className="text-lg font-bold text-green-600">
                    {corticosteroidDose.dose} {corticosteroidDose.unit}
                  </p>
                  <p className="text-xs text-gray-600">{corticosteroidDose.route}</p>
                </div>
                <p className="text-xs text-gray-600">{corticosteroidDose.frequency}</p>
                <p className="text-sm text-gray-700">
                  <strong>Doses given:</strong> {engineState.corticosteroidDoses || 0}
                </p>
                <Button
                  onClick={() => handleGiveMedication('corticosteroid')}
                  disabled={!medicationEligibility.corticosteroidEligible}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Corticosteroid
                </Button>
              </CardContent>
            </Card>

            {/* Magnesium Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Magnesium Sulfate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded bg-orange-50 p-3">
                  <p className="text-sm font-semibold text-gray-700">Dose</p>
                  <p className="text-lg font-bold text-orange-600">
                    {magnesiumDose.dose} {magnesiumDose.unit}
                  </p>
                  <p className="text-xs text-gray-600">{magnesiumDose.route}</p>
                </div>
                <p className="text-xs text-gray-600">{magnesiumDose.indication}</p>
                <p className="text-sm text-gray-700">
                  <strong>Doses given:</strong> {engineState.magnesiumDoses || 0}
                </p>
                <Button
                  onClick={() => handleGiveMedication('magnesium')}
                  disabled={!medicationEligibility.magnesiumEligible}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Magnesium
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          {icuCriteria.requiresIcu && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>ICU Admission Criteria Met:</strong>
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
              <CardTitle>Treatment Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Response to Initial Therapy</label>
                <select
                  value={engineState.responseToInitialTherapy || 'unknown'}
                  onChange={(e) =>
                    setEngineState((prev) => ({ ...prev, responseToInitialTherapy: e.target.value as any }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="unknown">Unknown</option>
                  <option value="good">Good Response</option>
                  <option value="partial">Partial Response</option>
                  <option value="poor">Poor Response</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RespiratoryEmergencyFlow;

