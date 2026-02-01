/**
 * Inotrope/Vasopressor Escalation Component
 * 
 * Guides providers through inotrope/vasopressor selection and titration
 * based on shock type (cold vs warm) with real-time dilution calculations.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Heart, Activity, Phone, Calculator, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';

type ShockType = 'hypovolemic' | 'cardiogenic' | 'septic' | 'anaphylactic' | 'obstructive' | 'undifferentiated';
type ShockCharacter = 'cold' | 'warm' | 'unknown';

interface InotropeConfig {
  name: string;
  indication: string;
  startDose: number;
  maxDose: number;
  unit: string;
  dilutionFactor: number;
  dilutionUnit: string;
  rateFormula: string;
  monitoring: string[];
  sideEffects: string[];
  titrationStep: number;
}

interface Props {
  weightKg: number;
  shockType: ShockType;
  onReferralRequested: (reason: string) => void;
  onStabilized: () => void;
}

const INOTROPES: Record<string, InotropeConfig> = {
  epinephrine: {
    name: 'Epinephrine',
    indication: 'Cold shock (cool extremities, weak pulses, prolonged CRT)',
    startDose: 0.1,
    maxDose: 1.0,
    unit: 'mcg/kg/min',
    dilutionFactor: 0.6,
    dilutionUnit: 'mg',
    rateFormula: '1 mL/hr = 0.1 mcg/kg/min',
    monitoring: ['Heart rate', 'Blood pressure', 'Lactate', 'Glucose', 'Extremity perfusion'],
    sideEffects: ['Tachycardia', 'Arrhythmias', 'Hyperglycemia', 'Tissue necrosis if extravasates'],
    titrationStep: 0.05,
  },
  norepinephrine: {
    name: 'Norepinephrine',
    indication: 'Warm shock (warm extremities, bounding pulses, flash CRT, wide pulse pressure)',
    startDose: 0.1,
    maxDose: 2.0,
    unit: 'mcg/kg/min',
    dilutionFactor: 0.6,
    dilutionUnit: 'mg',
    rateFormula: '1 mL/hr = 0.1 mcg/kg/min',
    monitoring: ['Blood pressure', 'Heart rate', 'Urine output', 'Lactate'],
    sideEffects: ['Severe vasoconstriction', 'Tissue ischemia', 'Arrhythmias'],
    titrationStep: 0.05,
  },
  dopamine: {
    name: 'Dopamine',
    indication: 'Alternative if epinephrine/norepinephrine unavailable',
    startDose: 5,
    maxDose: 20,
    unit: 'mcg/kg/min',
    dilutionFactor: 6,
    dilutionUnit: 'mg',
    rateFormula: '1 mL/hr = 1 mcg/kg/min',
    monitoring: ['Heart rate', 'Blood pressure', 'Urine output', 'Arrhythmias'],
    sideEffects: ['Tachycardia', 'Arrhythmias', 'Tissue necrosis'],
    titrationStep: 2.5,
  },
  dobutamine: {
    name: 'Dobutamine',
    indication: 'Cardiogenic shock with adequate BP, need for inotropy without vasoconstriction',
    startDose: 5,
    maxDose: 20,
    unit: 'mcg/kg/min',
    dilutionFactor: 6,
    dilutionUnit: 'mg',
    rateFormula: '1 mL/hr = 1 mcg/kg/min',
    monitoring: ['Heart rate', 'Blood pressure (may drop)', 'Cardiac output'],
    sideEffects: ['Hypotension (vasodilation)', 'Tachycardia', 'Arrhythmias'],
    titrationStep: 2.5,
  },
};

export function InotropeEscalation({ weightKg, shockType, onReferralRequested, onStabilized }: Props) {
  const [shockCharacter, setShockCharacter] = useState<ShockCharacter>('unknown');
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [currentDose, setCurrentDose] = useState<number>(0);
  const [infusionStarted, setInfusionStarted] = useState(false);

  // Determine recommended drug based on shock character
  const getRecommendedDrug = (): string => {
    if (shockCharacter === 'cold') return 'epinephrine';
    if (shockCharacter === 'warm') return 'norepinephrine';
    if (shockType === 'cardiogenic') return 'dobutamine';
    return 'epinephrine'; // Default
  };

  const calculateDilution = (drug: InotropeConfig) => {
    const amount = drug.dilutionFactor * weightKg;
    return {
      amount: amount.toFixed(1),
      unit: drug.dilutionUnit,
      instructions: `Add ${amount.toFixed(1)} ${drug.dilutionUnit} to 100 mL D5W`,
      rate: drug.rateFormula,
    };
  };

  const calculateRate = (drug: InotropeConfig, dose: number) => {
    // For epinephrine/norepinephrine: 1 mL/hr = 0.1 mcg/kg/min
    // For dopamine/dobutamine: 1 mL/hr = 1 mcg/kg/min
    if (drug.name === 'Epinephrine' || drug.name === 'Norepinephrine') {
      return (dose / 0.1).toFixed(1);
    }
    return dose.toFixed(1);
  };

  const handleDrugSelect = (drugKey: string) => {
    setSelectedDrug(drugKey);
    setCurrentDose(INOTROPES[drugKey].startDose);
  };

  const startInfusion = () => {
    setInfusionStarted(true);
  };

  const titrateDose = (direction: 'up' | 'down') => {
    if (!selectedDrug) return;
    const drug = INOTROPES[selectedDrug];
    
    setCurrentDose(prev => {
      if (direction === 'up') {
        return Math.min(prev + drug.titrationStep, drug.maxDose);
      } else {
        return Math.max(prev - drug.titrationStep, 0);
      }
    });
  };

  // Step 1: Determine shock character
  if (shockCharacter === 'unknown') {
    return (
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-purple-500/10">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Determine Shock Character
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-center text-muted-foreground">
            Assess the child's extremities to determine if this is cold or warm shock:
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button
              className="h-auto py-6 bg-blue-600 hover:bg-blue-700"
              onClick={() => setShockCharacter('cold')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🥶</div>
                <div className="font-bold">COLD Shock</div>
                <div className="text-xs mt-2 opacity-80">
                  Cool extremities<br/>
                  Weak pulses<br/>
                  Prolonged CRT<br/>
                  Mottled skin
                </div>
              </div>
            </Button>

            <Button
              className="h-auto py-6 bg-red-600 hover:bg-red-700"
              onClick={() => setShockCharacter('warm')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-bold">WARM Shock</div>
                <div className="text-xs mt-2 opacity-80">
                  Warm extremities<br/>
                  Bounding pulses<br/>
                  Flash CRT<br/>
                  Wide pulse pressure
                </div>
              </div>
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShockCharacter('cold')} // Default to cold if unsure
          >
            Not sure - proceed with default (Epinephrine)
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Drug selection
  if (!selectedDrug) {
    const recommended = getRecommendedDrug();
    
    return (
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-purple-500/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Select Inotrope/Vasopressor
            </div>
            <Badge className={shockCharacter === 'cold' ? 'bg-blue-600' : 'bg-red-600'}>
              {shockCharacter.toUpperCase()} Shock
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
            <div className="font-semibold text-green-700">Recommended:</div>
            <div className="text-lg font-bold">{INOTROPES[recommended].name}</div>
            <div className="text-sm text-muted-foreground">{INOTROPES[recommended].indication}</div>
          </div>

          <div className="space-y-2">
            {Object.entries(INOTROPES).map(([key, drug]) => (
              <Button
                key={key}
                variant={key === recommended ? 'default' : 'outline'}
                className={`w-full justify-start h-auto py-3 ${key === recommended ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => handleDrugSelect(key)}
              >
                <div className="text-left">
                  <div className="font-medium">{drug.name}</div>
                  <div className="text-xs opacity-80">{drug.indication}</div>
                </div>
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full border-orange-500 text-orange-500"
            onClick={() => setShockCharacter('unknown')}
          >
            ← Re-assess shock character
          </Button>
        </CardContent>
      </Card>
    );
  }

  const drug = INOTROPES[selectedDrug];
  const dilution = calculateDilution(drug);
  const rate = calculateRate(drug, currentDose);

  // Step 3: Dilution and infusion management
  return (
    <div className="space-y-4">
      {/* Drug Info Card */}
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-purple-500/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {drug.name} Infusion
            </div>
            <Badge className={infusionStarted ? 'bg-green-600' : 'bg-orange-600'}>
              {infusionStarted ? 'Running' : 'Preparing'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Dilution Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Dilution for {weightKg} kg:</span>
            </div>
            <div className="text-xl font-bold text-blue-600 mb-2">
              {dilution.instructions}
            </div>
            <div className="text-sm text-muted-foreground">
              {dilution.rate}
            </div>
          </div>

          {/* Current Dose Display */}
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground mb-1">Current Dose</div>
            <div className="text-4xl font-bold">
              {currentDose.toFixed(2)} <span className="text-xl">{drug.unit}</span>
            </div>
            <div className="text-lg text-muted-foreground mt-1">
              Rate: {rate} mL/hr
            </div>
          </div>

          {/* Dose Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Min: {drug.startDose} {drug.unit}</span>
              <span>Max: {drug.maxDose} {drug.unit}</span>
            </div>
            <Slider
              value={[currentDose]}
              min={0}
              max={drug.maxDose}
              step={drug.titrationStep}
              onValueChange={(value) => setCurrentDose(value[0])}
              className="py-4"
            />
          </div>

          {/* Titration Buttons */}
          {infusionStarted && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-16"
                onClick={() => titrateDose('down')}
                disabled={currentDose <= 0}
              >
                <ArrowDown className="h-6 w-6 mr-2" />
                Decrease by {drug.titrationStep}
              </Button>
              <Button
                variant="outline"
                className="h-16"
                onClick={() => titrateDose('up')}
                disabled={currentDose >= drug.maxDose}
              >
                <ArrowUp className="h-6 w-6 mr-2" />
                Increase by {drug.titrationStep}
              </Button>
            </div>
          )}

          {/* Start/Stop Button */}
          {!infusionStarted ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={startInfusion}
            >
              <Activity className="h-4 w-4 mr-2" />
              Start Infusion at {currentDose} {drug.unit}
            </Button>
          ) : (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={onStabilized}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Patient Stabilizing - Continue Monitoring
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Monitoring Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoring Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">Monitor closely:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {drug.monitoring.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
            <h4 className="font-semibold text-sm text-orange-700 mb-2">Watch for side effects:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {drug.sideEffects.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {currentDose >= drug.maxDose * 0.8 && (
            <div className="bg-red-500/10 border border-red-500 rounded p-3">
              <AlertTriangle className="h-4 w-4 inline mr-2 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                Approaching maximum dose. Consider adding second agent or referral.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Second Line Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escalation Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSelectedDrug(null);
              setInfusionStarted(false);
            }}
          >
            Add second vasopressor/inotrope
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
          >
            Add Vasopressin (catecholamine-resistant)
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
          >
            Add Hydrocortisone (adrenal insufficiency)
          </Button>
        </CardContent>
      </Card>

      {/* Referral Button */}
      <Button
        variant="outline"
        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
        onClick={() => onReferralRequested(`Requiring ${drug.name} at ${currentDose} ${drug.unit}`)}
      >
        <Phone className="h-4 w-4 mr-2" />
        Initiate Referral
      </Button>
    </div>
  );
}

export default InotropeEscalation;
