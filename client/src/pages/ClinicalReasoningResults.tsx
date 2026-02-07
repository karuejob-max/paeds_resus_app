import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Syringe,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import type {
  Differential,
  Intervention,
  RequiredTest,
  PrimarySurveyData,
} from '../../../shared/clinical-types';

interface ClinicalReasoningResultsProps {
  surveyData: PrimarySurveyData;
  differentials: Differential[];
  immediateInterventions: Intervention[];
  urgentInterventions: Intervention[];
  confirmatoryInterventions: Intervention[];
  requiredTests: RequiredTest[];
}

export default function ClinicalReasoningResults({
  surveyData,
  differentials,
  immediateInterventions,
  urgentInterventions,
  confirmatoryInterventions,
  requiredTests,
}: ClinicalReasoningResultsProps) {
  const [, setLocation] = useLocation();
  const [completedInterventions, setCompletedInterventions] = useState<Set<string>>(new Set());
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());

  const topDifferential = differentials[0];

  const toggleIntervention = (id: string) => {
    const newSet = new Set(completedInterventions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCompletedInterventions(newSet);
  };

  const toggleTest = (name: string) => {
    const newSet = new Set(completedTests);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setCompletedTests(newSet);
  };

  const launchProtocol = () => {
    // Map differential IDs to protocol routes
    const protocolMap: Record<string, string> = {
      dka: '/clinical-assessment',
      septic_shock: '/clinical-assessment',
      eclampsia: '/eclampsia-protocol',
      status_epilepticus: '/clinical-assessment',
      anaphylaxis: '/clinical-assessment',
      pulmonary_embolism: '/clinical-assessment',
      hyperkalemia: '/clinical-assessment',
      hypoglycemia: '/clinical-assessment',
      postpartum_hemorrhage: '/postpartum-hemorrhage-protocol',
      status_asthmaticus: '/asthma-emergency',
      neonatal_sepsis: '/clinical-assessment',
    };

    const route = protocolMap[topDifferential.id] || '/clinical-assessment';
    setLocation(route);
  };

  const allImmediateComplete = immediateInterventions.every((i) => completedInterventions.has(i.id));
  const allTestsSent = requiredTests.filter(t => t.priority === 'stat').every((t) => completedTests.has(t.name));

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Clinical Reasoning Results</h1>
        <p className="text-muted-foreground">
          Based on primary survey findings, here's the analysis and recommended actions
        </p>
      </div>

      {/* Top Differential */}
      <Card className="p-6 mb-6 border-2 border-primary">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{topDifferential.diagnosis}</h2>
            <p className="text-lg text-muted-foreground">
              Probability: {(topDifferential.probability * 100).toFixed(0)}%
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            topDifferential.category === 'immediate_threat'
              ? 'bg-red-100 text-red-700'
              : topDifferential.category === 'critical'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {topDifferential.category.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Supporting Evidence:</h3>
            <ul className="list-disc list-inside space-y-1">
              {topDifferential.evidence.map((ev, idx) => (
                <li key={idx} className="text-sm">{ev}</li>
              ))}
            </ul>
          </div>

          {topDifferential.nextQuestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Confirmation Questions:</h3>
              <ul className="list-disc list-inside space-y-1">
                {topDifferential.nextQuestions.map((q, idx) => (
                  <li key={idx} className="text-sm">{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Alternative Differentials */}
      {differentials.length > 1 && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-3">Alternative Diagnoses to Consider:</h3>
          <div className="space-y-2">
            {differentials.slice(1, 4).map((diff) => (
              <div key={diff.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{diff.diagnosis}</p>
                  <p className="text-sm text-muted-foreground">
                    {diff.evidence.slice(0, 2).join(', ')}
                  </p>
                </div>
                <p className="text-sm font-semibold">{(diff.probability * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* IMMEDIATE Interventions */}
      {immediateInterventions.length > 0 && (
        <Card className="p-6 mb-6 border-2 border-red-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-red-600">START IMMEDIATELY (Don't wait for labs)</h2>
          </div>

          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These interventions have high benefit and low risk. Start now while sending tests.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {immediateInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className={`p-4 border-2 rounded-lg ${
                  completedInterventions.has(intervention.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={intervention.id}
                    checked={completedInterventions.has(intervention.id)}
                    onCheckedChange={() => toggleIntervention(intervention.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor={intervention.id} className="text-lg font-semibold cursor-pointer">
                      {intervention.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{intervention.indication}</p>
                    {intervention.dosing && (
                      <p className="text-sm mt-2">
                        <strong>Route:</strong> {intervention.dosing.route}
                      </p>
                    )}
                    {intervention.contraindications.length > 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Contraindications:</strong> {intervention.contraindications.join(', ')}
                      </p>
                    )}
                    {intervention.monitoring && intervention.monitoring.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Monitor:</strong> {intervention.monitoring.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Syringe className="h-4 w-4" />
                    <span className="font-semibold">
                      {intervention.timeWindow === 'minutes' ? 'Minutes' : 'Hours'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* URGENT Tests */}
      {requiredTests.length > 0 && (
        <Card className="p-6 mb-6 border-2 border-yellow-500">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="h-6 w-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-yellow-600">SEND THESE TESTS URGENTLY</h2>
          </div>

          <div className="space-y-3">
            {requiredTests.map((test) => (
              <div
                key={test.name}
                className={`p-3 border-2 rounded-lg flex items-start gap-3 ${
                  completedTests.has(test.name)
                    ? 'border-green-500 bg-green-50'
                    : 'border-yellow-300 bg-white'
                }`}
              >
                <Checkbox
                  id={test.name}
                  checked={completedTests.has(test.name)}
                  onCheckedChange={() => toggleTest(test.name)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={test.name} className="font-semibold cursor-pointer">
                    {test.name}
                  </Label>
                  {test.threshold && (
                    <p className="text-sm text-muted-foreground">{test.threshold}</p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  test.priority === 'stat'
                    ? 'bg-red-100 text-red-700'
                    : test.priority === 'urgent'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {test.priority.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* URGENT Interventions */}
      {urgentInterventions.length > 0 && (
        <Card className="p-6 mb-6 border-2 border-orange-500">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-orange-600">URGENT (Minimal confirmation needed)</h2>
          </div>

          <div className="space-y-4">
            {urgentInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className={`p-4 border-2 rounded-lg ${
                  completedInterventions.has(intervention.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-orange-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={intervention.id}
                    checked={completedInterventions.has(intervention.id)}
                    onCheckedChange={() => toggleIntervention(intervention.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor={intervention.id} className="text-lg font-semibold cursor-pointer">
                      {intervention.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{intervention.indication}</p>
                    {intervention.requiredTests.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Required:</strong> {intervention.requiredTests.map(t => t.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CONFIRMATORY Interventions */}
      {confirmatoryInterventions.length > 0 && (
        <Card className="p-6 mb-6 border-2 border-blue-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-blue-600">WAIT FOR LABS BEFORE STARTING</h2>
          </div>

          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These interventions require lab confirmation due to high risk if diagnosis is wrong.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {confirmatoryInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className={`p-4 border-2 rounded-lg ${
                  completedInterventions.has(intervention.id)
                    ? 'border-green-500 bg-green-50'
                    : allTestsSent
                    ? 'border-blue-300 bg-white'
                    : 'border-gray-300 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={intervention.id}
                    checked={completedInterventions.has(intervention.id)}
                    onCheckedChange={() => toggleIntervention(intervention.id)}
                    disabled={!allTestsSent}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={intervention.id}
                      className={`text-lg font-semibold ${allTestsSent ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      {intervention.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{intervention.indication}</p>
                    {intervention.requiredTests.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-red-600">Required tests:</p>
                        <ul className="list-disc list-inside text-sm">
                          {intervention.requiredTests.map((test, idx) => (
                            <li key={idx}>
                              {test.name} {test.threshold && `(${test.threshold})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {intervention.riskIfWrong === 'high' && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>⚠️ High risk if wrong diagnosis</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Launch Protocol Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ready to proceed?</h3>
            <p className="text-sm text-muted-foreground">
              {allImmediateComplete
                ? 'All immediate interventions completed. Launch full protocol for detailed management.'
                : 'Complete immediate interventions first, then launch protocol.'}
            </p>
          </div>
          <Button
            size="lg"
            onClick={launchProtocol}
            disabled={!allImmediateComplete}
          >
            Launch {topDifferential.diagnosis} Protocol
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
