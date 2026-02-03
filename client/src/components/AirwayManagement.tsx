/**
 * Airway Management Component
 * 
 * Handles stridor, croup, epiglottitis, and foreign body airway obstruction.
 * Provides croup severity scoring and treatment escalation.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wind, Syringe, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  weightKg: number;
  onTreatmentComplete: () => void;
  onReferralRequested: (reason: string) => void;
}

type CroupSeverity = 'mild' | 'moderate' | 'severe' | null;
type AirwayCondition = 'croup' | 'epiglottitis' | 'foreign_body' | 'anaphylaxis' | null;

export function AirwayManagement({ weightKg, onTreatmentComplete, onReferralRequested }: Props) {
  const [condition, setCondition] = useState<AirwayCondition>(null);
  const [croupSeverity, setCroupSeverity] = useState<CroupSeverity>(null);
  const [treatmentGiven, setTreatmentGiven] = useState<string[]>([]);

  // Calculate doses
  const dexamethasoneDose = Math.min(weightKg * 0.6, 10); // 0.6 mg/kg, max 10 mg
  const nebulizedEpinephrineDose = Math.min(weightKg * 0.5, 5); // 0.5 mL/kg of 1:1000, max 5 mL
  const imEpinephrineDose = weightKg * 0.01; // 0.01 mg/kg = 0.01 mL/kg of 1:1000

  const handleTreatmentGiven = (treatment: string) => {
    setTreatmentGiven(prev => [...prev, treatment]);
  };

  // Condition selection screen
  if (!condition) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center mb-4">
          <Wind className="h-12 w-12 mx-auto text-orange-500 mb-2" />
          <h3 className="text-xl font-bold">Airway Assessment</h3>
          <p className="text-sm text-muted-foreground">Select the suspected condition</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start"
            onClick={() => setCondition('croup')}
          >
            <div className="font-bold">Croup (Laryngotracheobronchitis)</div>
            <div className="text-xs text-muted-foreground">Barky cough, stridor, gradual onset</div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start border-red-500 hover:bg-red-50"
            onClick={() => setCondition('epiglottitis')}
          >
            <div className="font-bold text-red-600">Epiglottitis (EMERGENCY)</div>
            <div className="text-xs text-muted-foreground">Drooling, tripod position, toxic appearance</div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start border-red-500 hover:bg-red-50"
            onClick={() => setCondition('foreign_body')}
          >
            <div className="font-bold text-red-600">Foreign Body Obstruction</div>
            <div className="text-xs text-muted-foreground">Sudden onset, choking episode, unilateral wheeze</div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start border-red-500 hover:bg-red-50"
            onClick={() => setCondition('anaphylaxis')}
          >
            <div className="font-bold text-red-600">Anaphylaxis with Airway Swelling</div>
            <div className="text-xs text-muted-foreground">Urticaria, angioedema, rapid progression</div>
          </Button>
        </div>
      </div>
    );
  }

  // Epiglottitis - EMERGENCY
  if (condition === 'epiglottitis') {
    return (
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-red-500/10">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            SUSPECTED EPIGLOTTITIS - EMERGENCY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-red-500/20 border border-red-500 rounded p-4">
            <h4 className="font-bold text-red-700 mb-2">IMMEDIATE ACTIONS:</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li className="font-semibold">DO NOT examine throat - may cause complete obstruction</li>
              <li>Keep child calm - crying worsens obstruction</li>
              <li>Allow position of comfort (usually sitting upright)</li>
              <li>Give high-flow oxygen (do not force if child resists)</li>
              <li>Call for senior help + anesthesia IMMEDIATELY</li>
              <li>Prepare for emergency intubation/tracheostomy</li>
            </ol>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500 rounded p-3">
            <p className="text-sm font-medium">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              This is a true airway emergency. The child needs urgent airway management in the operating room.
            </p>
          </div>

          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => onReferralRequested('Suspected epiglottitis - urgent airway management required')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Activate Emergency Response Team
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Foreign Body Obstruction
  if (condition === 'foreign_body') {
    return (
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-red-500/10">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-6 w-6" />
            Foreign Body Airway Obstruction
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500 rounded p-4">
            <h4 className="font-bold mb-2">INFANT (&lt;1 year):</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>5 back blows (between shoulder blades, head lower than chest)</li>
              <li>5 chest thrusts (2 fingers on lower sternum)</li>
              <li>Repeat until object expelled or child unconscious</li>
              <li>If unconscious: start CPR (chest compressions may dislodge object)</li>
            </ol>
          </div>

          <div className="bg-green-500/10 border border-green-500 rounded p-4">
            <h4 className="font-bold mb-2">CHILD (&gt;1 year):</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>5 back blows (between shoulder blades, child leaning forward)</li>
              <li>5 abdominal thrusts (Heimlich maneuver)</li>
              <li>Repeat until object expelled or child unconscious</li>
              <li>If unconscious: start CPR</li>
            </ol>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500 rounded p-3">
            <p className="text-sm font-medium">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              If partial obstruction with effective cough: encourage coughing. Do NOT perform back blows/thrusts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                handleTreatmentGiven('Foreign body maneuvers performed');
                onTreatmentComplete();
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Object Removed
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onReferralRequested('Foreign body obstruction - unable to clear')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call for Help
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Anaphylaxis with Airway Swelling
  if (condition === 'anaphylaxis') {
    return (
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-red-500/10">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            Anaphylaxis with Airway Swelling
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-red-500/20 border border-red-500 rounded p-4">
            <h4 className="font-bold text-red-700 mb-2">IMMEDIATE TREATMENT:</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">IM Epinephrine (1:1000):</span>
                <Badge variant="destructive" className="text-lg">
                  {imEpinephrineDose.toFixed(2)} mL ({(imEpinephrineDose * 1000).toFixed(0)} mcg)
                </Badge>
              </div>
              <p className="text-sm">Inject into anterolateral thigh. Repeat every 5-15 minutes if needed.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Additional Treatments:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>High-flow oxygen</li>
              <li>IV fluid bolus 20 mL/kg if hypotensive</li>
              <li>Nebulized epinephrine if stridor persists</li>
              <li>Consider IM dexamethasone {dexamethasoneDose.toFixed(1)} mg</li>
              <li>Antihistamines (secondary - do NOT delay epinephrine)</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500 rounded p-3">
            <p className="text-sm font-medium">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Airway swelling can progress rapidly. Prepare for intubation. Call for senior help early.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                handleTreatmentGiven('IM Epinephrine given');
                onTreatmentComplete();
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Treatment Given
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onReferralRequested('Anaphylaxis with airway compromise')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call for Help
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Croup - Severity Assessment
  if (condition === 'croup' && !croupSeverity) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center mb-4">
          <Wind className="h-12 w-12 mx-auto text-orange-500 mb-2" />
          <h3 className="text-xl font-bold">Croup Severity Assessment</h3>
          <p className="text-sm text-muted-foreground">Select severity based on clinical findings</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start"
            onClick={() => setCroupSeverity('mild')}
          >
            <div className="font-bold">Mild Croup</div>
            <div className="text-xs text-muted-foreground">
              • Occasional barky cough<br />
              • No stridor at rest<br />
              • No retractions<br />
              • Normal air entry
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start border-orange-500"
            onClick={() => setCroupSeverity('moderate')}
          >
            <div className="font-bold text-orange-600">Moderate Croup</div>
            <div className="text-xs text-muted-foreground">
              • Frequent barky cough<br />
              • Stridor at rest<br />
              • Mild-moderate retractions<br />
              • Good air entry
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 text-left flex-col items-start border-red-500 hover:bg-red-50"
            onClick={() => setCroupSeverity('severe')}
          >
            <div className="font-bold text-red-600">Severe Croup</div>
            <div className="text-xs text-muted-foreground">
              • Prominent stridor at rest<br />
              • Severe retractions<br />
              • Decreased air entry<br />
              • Agitation or lethargy
            </div>
          </Button>
        </div>
      </div>
    );
  }

  // Croup Treatment
  if (condition === 'croup' && croupSeverity) {
    return (
      <Card className={`border-2 ${croupSeverity === 'severe' ? 'border-red-500' : croupSeverity === 'moderate' ? 'border-orange-500' : 'border-blue-500'}`}>
        <CardHeader className={croupSeverity === 'severe' ? 'bg-red-500/10' : croupSeverity === 'moderate' ? 'bg-orange-500/10' : 'bg-blue-500/10'}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              {croupSeverity.charAt(0).toUpperCase() + croupSeverity.slice(1)} Croup Treatment
            </div>
            <Badge variant={croupSeverity === 'severe' ? 'destructive' : 'secondary'}>
              {weightKg} kg
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Dexamethasone - All severities */}
          <div className="bg-blue-500/10 border border-blue-500 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">Dexamethasone (PO/IV/IM)</h4>
              <Badge className="bg-blue-600 text-lg">
                {dexamethasoneDose.toFixed(1)} mg
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              0.6 mg/kg, max 10 mg. Single dose. Oral preferred if child can swallow.
            </p>
            {!treatmentGiven.includes('dexamethasone') && (
              <Button
                size="sm"
                className="mt-2"
                onClick={() => handleTreatmentGiven('dexamethasone')}
              >
                <Syringe className="h-4 w-4 mr-2" />
                Mark as Given
              </Button>
            )}
            {treatmentGiven.includes('dexamethasone') && (
              <div className="mt-2 flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Given</span>
              </div>
            )}
          </div>

          {/* Nebulized Epinephrine - Moderate/Severe */}
          {(croupSeverity === 'moderate' || croupSeverity === 'severe') && (
            <div className="bg-orange-500/10 border border-orange-500 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">Nebulized Epinephrine (1:1000)</h4>
                <Badge variant="destructive" className="text-lg">
                  {nebulizedEpinephrineDose.toFixed(1)} mL
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                0.5 mL/kg (max 5 mL) of 1:1000 epinephrine. Dilute to 5 mL total with NS. Nebulize over 10-15 minutes.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ Effect lasts 2 hours. Observe for rebound stridor. May need repeat dose.
              </p>
              {!treatmentGiven.includes('nebulized_epi') && (
                <Button
                  size="sm"
                  className="mt-2 bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleTreatmentGiven('nebulized_epi')}
                >
                  <Syringe className="h-4 w-4 mr-2" />
                  Mark as Given
                </Button>
              )}
              {treatmentGiven.includes('nebulized_epi') && (
                <div className="mt-2 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Given</span>
                </div>
              )}
            </div>
          )}

          {/* Severe Croup - Additional Actions */}
          {croupSeverity === 'severe' && (
            <div className="bg-red-500/20 border border-red-500 rounded p-4">
              <h4 className="font-bold text-red-700 mb-2">SEVERE CROUP - ADDITIONAL ACTIONS:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Keep child calm - crying worsens obstruction</li>
                <li>High-flow oxygen (if tolerated)</li>
                <li>Call for senior help + anesthesia</li>
                <li>Prepare for intubation if deteriorating</li>
                <li>Observe for at least 4 hours after nebulized epinephrine</li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                onTreatmentComplete();
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Treatment Complete
            </Button>
            {croupSeverity === 'severe' && (
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => onReferralRequested('Severe croup - may need intubation')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call for Help
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
