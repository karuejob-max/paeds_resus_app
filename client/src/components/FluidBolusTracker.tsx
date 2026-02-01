/**
 * Fluid Bolus Tracker Component
 * 
 * Tracks fluid boluses with mandatory reassessment after each bolus.
 * Prevents fluid overload by requiring providers to tap on specific signs.
 * Guides escalation to inotropes/vasopressors when indicated.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Droplets, Heart, Activity, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { triggerAlert, triggerHaptic } from '@/lib/alertSystem';

type ShockType = 'hypovolemic' | 'cardiogenic' | 'septic' | 'anaphylactic' | 'obstructive' | 'undifferentiated';

interface ReassessmentItem {
  parameter: string;
  question: string;
  improved: string;
  worsened: string;
  isOverloadSign: boolean;
  response?: 'improved' | 'same' | 'worsened';
}

interface BolusRecord {
  number: number;
  volumeMl: number;
  volumeMlKg: number;
  timeGiven: Date;
  reassessment: ReassessmentItem[];
  outcome: 'improved' | 'no_change' | 'worsened' | 'overloaded';
}

interface Props {
  weightKg: number;
  shockType: ShockType;
  onEscalateToInotropes: () => void;
  onFluidOverload: () => void;
  onReferralRequested: (reason: string) => void;
  onShockResolved: () => void;
}

const REASSESSMENT_ITEMS: Omit<ReassessmentItem, 'response'>[] = [
  {
    parameter: 'Heart Rate',
    question: 'Has the heart rate changed?',
    improved: 'Decreasing toward normal',
    worsened: 'Increasing or unchanged',
    isOverloadSign: false,
  },
  {
    parameter: 'Capillary Refill',
    question: 'Check capillary refill time (press sternum 5 sec):',
    improved: '< 2 seconds (improved)',
    worsened: 'Still > 3 seconds',
    isOverloadSign: false,
  },
  {
    parameter: 'Mental Status',
    question: 'Is the child more alert?',
    improved: 'More alert, interactive',
    worsened: 'Same or more lethargic',
    isOverloadSign: false,
  },
  {
    parameter: 'Peripheral Pulses',
    question: 'Check peripheral pulses:',
    improved: 'Stronger, easier to feel',
    worsened: 'Still weak or weaker',
    isOverloadSign: false,
  },
  {
    parameter: 'Blood Pressure',
    question: 'Recheck blood pressure:',
    improved: 'Increasing toward normal',
    worsened: 'Still hypotensive',
    isOverloadSign: false,
  },
  {
    parameter: 'Hepatomegaly',
    question: 'Palpate liver edge (mark before first bolus):',
    improved: 'No change from baseline',
    worsened: 'INCREASING liver size',
    isOverloadSign: true,
  },
  {
    parameter: 'Lung Crackles',
    question: 'Auscultate lung bases:',
    improved: 'Clear, no crackles',
    worsened: 'NEW crackles/rales heard',
    isOverloadSign: true,
  },
  {
    parameter: 'JVD',
    question: 'Check jugular venous distension:',
    improved: 'Not elevated',
    worsened: 'New or increasing JVD',
    isOverloadSign: true,
  },
  {
    parameter: 'SpO2',
    question: 'Check oxygen saturation:',
    improved: 'Stable or improving',
    worsened: 'DROPPING during fluids',
    isOverloadSign: true,
  },
];

export function FluidBolusTracker({ 
  weightKg, 
  shockType, 
  onEscalateToInotropes, 
  onFluidOverload,
  onReferralRequested,
  onShockResolved 
}: Props) {
  const [boluses, setBoluses] = useState<BolusRecord[]>([]);
  const [currentBolus, setCurrentBolus] = useState<BolusRecord | null>(null);
  const [reassessmentIndex, setReassessmentIndex] = useState(0);
  const [showReassessment, setShowReassessment] = useState(false);
  const [totalFluidMlKg, setTotalFluidMlKg] = useState(0);
  const [shockResolved, setShockResolved] = useState(false);
  const [fluidOverloaded, setFluidOverloaded] = useState(false);

  // Determine bolus size based on shock type
  const getBolusSize = () => {
    if (shockType === 'cardiogenic') {
      return { mlKg: 5, rate: 'Over 10-15 minutes', warning: 'Watch closely for worsening' };
    }
    return { mlKg: 10, rate: 'Over 5-10 minutes', warning: null };
  };

  const bolusConfig = getBolusSize();
  const maxFluidMlKg = shockType === 'cardiogenic' ? 20 : 60;

  const startBolus = () => {
    const volumeMlKg = bolusConfig.mlKg;
    const volumeMl = Math.round(weightKg * volumeMlKg);
    
    const newBolus: BolusRecord = {
      number: boluses.length + 1,
      volumeMl,
      volumeMlKg,
      timeGiven: new Date(),
      reassessment: REASSESSMENT_ITEMS.map(item => ({ ...item })),
      outcome: 'no_change',
    };

    setCurrentBolus(newBolus);
    setTotalFluidMlKg(prev => prev + volumeMlKg);
  };

  const completeBolus = () => {
    setShowReassessment(true);
    setReassessmentIndex(0);
    triggerAlert('reassessment_due');
  };

  const handleReassessmentResponse = (response: 'improved' | 'same' | 'worsened') => {
    if (!currentBolus) return;

    const updatedReassessment = [...currentBolus.reassessment];
    updatedReassessment[reassessmentIndex].response = response;

    // Check for overload signs
    const item = updatedReassessment[reassessmentIndex];
    if (item.isOverloadSign && response === 'worsened') {
      triggerAlert('critical_action');
      triggerHaptic('urgent');
    }

    setCurrentBolus({ ...currentBolus, reassessment: updatedReassessment });

    // Move to next item or complete reassessment
    if (reassessmentIndex < REASSESSMENT_ITEMS.length - 1) {
      setReassessmentIndex(prev => prev + 1);
    } else {
      // Calculate outcome
      const overloadSigns = updatedReassessment.filter(r => r.isOverloadSign && r.response === 'worsened');
      const improvedSigns = updatedReassessment.filter(r => r.response === 'improved');
      const worsenedSigns = updatedReassessment.filter(r => r.response === 'worsened' && !r.isOverloadSign);

      let outcome: BolusRecord['outcome'] = 'no_change';
      
      if (overloadSigns.length > 0) {
        outcome = 'overloaded';
        setFluidOverloaded(true);
        triggerAlert('critical_action');
      } else if (improvedSigns.length >= 4) {
        outcome = 'improved';
        if (improvedSigns.length >= 6) {
          setShockResolved(true);
        }
      } else if (worsenedSigns.length >= 3) {
        outcome = 'worsened';
      }

      const completedBolus = { ...currentBolus, reassessment: updatedReassessment, outcome };
      setBoluses(prev => [...prev, completedBolus]);
      setCurrentBolus(null);
      setShowReassessment(false);
    }
  };

  const progressPercent = (totalFluidMlKg / maxFluidMlKg) * 100;
  const isNearMax = totalFluidMlKg >= maxFluidMlKg * 0.7;
  const isAtMax = totalFluidMlKg >= maxFluidMlKg;

  // Fluid overload detected
  if (fluidOverloaded) {
    return (
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-red-500/10">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            FLUID OVERLOAD DETECTED
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-red-500/20 border border-red-500 rounded p-4">
            <h4 className="font-bold text-red-700 mb-2">IMMEDIATE ACTIONS:</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li className="font-semibold">STOP all fluid boluses</li>
              <li>Sit patient upright (if BP allows)</li>
              <li>Give oxygen - target SpO2 &gt; 94%</li>
              <li>Prepare Furosemide 1 mg/kg IV = <strong>{Math.round(weightKg)} mg</strong></li>
              <li>Start inotrope support</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={onFluidOverload}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Give Furosemide
            </Button>
            <Button 
              variant="outline"
              onClick={onEscalateToInotropes}
            >
              <Heart className="h-4 w-4 mr-2" />
              Start Inotrope
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full border-orange-500 text-orange-500"
            onClick={() => onReferralRequested('Fluid overload during resuscitation')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Initiate Referral
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Shock resolved
  if (shockResolved) {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-500/10">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            Shock Improving
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              Total Fluid: {totalFluidMlKg} mL/kg ({Math.round(totalFluidMlKg * weightKg)} mL)
            </Badge>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
            <h4 className="font-semibold mb-2">Signs of Improvement:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {boluses[boluses.length - 1]?.reassessment
                .filter(r => r.response === 'improved')
                .map((r, i) => (
                  <li key={i}>{r.parameter}: {r.improved}</li>
                ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Next Steps:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Continue monitoring vital signs every 15 minutes</li>
              <li>Maintain IV access</li>
              <li>Address underlying cause</li>
              <li>Consider maintenance fluids</li>
            </ul>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onShockResolved}
          >
            Continue Monitoring
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Reassessment in progress
  if (showReassessment && currentBolus) {
    const item = currentBolus.reassessment[reassessmentIndex];
    
    return (
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-500/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Reassessment After Bolus #{currentBolus.number}
            </div>
            <Badge variant="outline">
              {reassessmentIndex + 1} of {REASSESSMENT_ITEMS.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Progress value={(reassessmentIndex / REASSESSMENT_ITEMS.length) * 100} className="h-2" />

          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{item.parameter}</h3>
            <p className="text-muted-foreground">{item.question}</p>
          </div>

          {item.isOverloadSign && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-center">
              <AlertCircle className="h-5 w-5 inline mr-2 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">FLUID OVERLOAD SIGN</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button
              className="h-auto py-4 bg-green-600 hover:bg-green-700"
              onClick={() => handleReassessmentResponse('improved')}
            >
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                <div className="text-xs">Improved</div>
                <div className="text-xs opacity-80 mt-1">{item.improved}</div>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4"
              onClick={() => handleReassessmentResponse('same')}
            >
              <div className="text-center">
                <Activity className="h-6 w-6 mx-auto mb-1" />
                <div className="text-xs">Same</div>
                <div className="text-xs opacity-80 mt-1">No change</div>
              </div>
            </Button>
            <Button
              variant="destructive"
              className="h-auto py-4"
              onClick={() => handleReassessmentResponse('worsened')}
            >
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1" />
                <div className="text-xs">Worsened</div>
                <div className="text-xs opacity-80 mt-1">{item.worsened}</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main bolus tracking view
  return (
    <div className="space-y-4">
      {/* Fluid Progress */}
      <Card className={`border-2 ${isAtMax ? 'border-red-500' : isNearMax ? 'border-orange-500' : 'border-primary'}`}>
        <CardHeader className={isAtMax ? 'bg-red-500/10' : isNearMax ? 'bg-orange-500/10' : 'bg-primary/10'}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Fluid Resuscitation
            </div>
            <Badge variant={shockType === 'cardiogenic' ? 'destructive' : 'secondary'}>
              {shockType.charAt(0).toUpperCase() + shockType.slice(1)} Shock
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Total Fluid Given */}
          <div className="text-center">
            <div className="text-4xl font-bold">
              {totalFluidMlKg} <span className="text-xl">mL/kg</span>
            </div>
            <div className="text-sm text-muted-foreground">
              ({Math.round(totalFluidMlKg * weightKg)} mL total)
            </div>
          </div>

          {/* Progress to max */}
          <div className="space-y-1">
            <Progress 
              value={progressPercent} 
              className={`h-3 ${isAtMax ? '[&>div]:bg-red-500' : isNearMax ? '[&>div]:bg-orange-500' : ''}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className={isNearMax ? 'text-orange-500 font-bold' : ''}>
                {maxFluidMlKg * 0.7} mL/kg
              </span>
              <span className={isAtMax ? 'text-red-500 font-bold' : ''}>
                {maxFluidMlKg} mL/kg → Inotropes
              </span>
            </div>
          </div>

          {/* Bolus History */}
          {boluses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Bolus History:</h4>
              <div className="flex flex-wrap gap-2">
                {boluses.map((bolus) => (
                  <Badge 
                    key={bolus.number}
                    variant={
                      bolus.outcome === 'improved' ? 'default' :
                      bolus.outcome === 'worsened' ? 'destructive' :
                      bolus.outcome === 'overloaded' ? 'destructive' :
                      'secondary'
                    }
                    className={bolus.outcome === 'improved' ? 'bg-green-600' : ''}
                  >
                    #{bolus.number}: {bolus.volumeMlKg} mL/kg - {bolus.outcome}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Cardiogenic warning */}
          {shockType === 'cardiogenic' && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
              <AlertTriangle className="h-4 w-4 inline mr-2 text-orange-500" />
              <span className="text-sm">
                <strong>Cardiogenic Shock:</strong> Using smaller boluses (5 mL/kg). 
                Watch closely for worsening.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Bolus or Start New */}
      {currentBolus ? (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-500/10">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 animate-pulse" />
              Bolus #{currentBolus.number} In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {currentBolus.volumeMl} mL
              </div>
              <div className="text-sm text-muted-foreground">
                ({currentBolus.volumeMlKg} mL/kg of Normal Saline)
              </div>
            </div>

            <div className="bg-muted/50 rounded p-3 text-center">
              <div className="font-medium">{bolusConfig.rate}</div>
              {bolusConfig.warning && (
                <div className="text-sm text-orange-500 mt-1">{bolusConfig.warning}</div>
              )}
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={completeBolus}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Bolus Complete - Start Reassessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            {isAtMax ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500 rounded p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <h4 className="font-bold text-red-700">Maximum Fluid Reached</h4>
                  <p className="text-sm text-red-600">
                    {totalFluidMlKg} mL/kg given without resolution.
                    Escalate to inotrope/vasopressor support.
                  </p>
                </div>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={onEscalateToInotropes}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Start Inotrope/Vasopressor
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Next Bolus:</h4>
                  <div className="text-2xl font-bold">
                    {Math.round(weightKg * bolusConfig.mlKg)} mL
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({bolusConfig.mlKg} mL/kg of Normal Saline)
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={startBolus}
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  Start Bolus #{boluses.length + 1}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Escalation Options */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="border-purple-500 text-purple-500"
          onClick={onEscalateToInotropes}
        >
          <Heart className="h-4 w-4 mr-2" />
          Start Inotrope
        </Button>
        <Button
          variant="outline"
          className="border-orange-500 text-orange-500"
          onClick={() => onReferralRequested('Fluid-refractory shock')}
        >
          <Phone className="h-4 w-4 mr-2" />
          Initiate Referral
        </Button>
      </div>
    </div>
  );
}

export default FluidBolusTracker;
