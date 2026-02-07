/**
 * Septic Shock Protocol
 * 
 * Clinical workflow aligned with Surviving Sepsis Campaign 2021 guidelines:
 * 1. Shock recognition and severity assessment
 * 2. Fluid resuscitation (10-20 mL/kg boluses, max 40-60 mL/kg in first hour)
 * 3. Early goal-directed therapy (MAP, perfusion, lactate targets)
 * 4. Antibiotic administration (within 1 hour of recognition)
 * 5. Inotrope/vasopressor selection
 * 6. Source control
 * 7. Fluid overload monitoring and reassessment
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Droplet, 
  Syringe, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Info,
  Heart,
  Zap
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type ShockStage = 
  | 'recognition'
  | 'fluid_resuscitation'
  | 'antibiotics'
  | 'inotropes'
  | 'source_control'
  | 'ongoing_management';

type ShockType = 'warm' | 'cold' | 'mixed';

export default function SepticShockProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 20);
  const [patientAge, setPatientAge] = useState<number>(propAge || 5);
  
  // Clinical state
  const [currentStage, setCurrentStage] = useState<ShockStage>('recognition');
  const [shockType, setShockType] = useState<ShockType | null>(null);
  const [lactate, setLactate] = useState<number>(4.0);
  const [map, setMAP] = useState<number>(45);
  const [capRefillTime, setCapRefillTime] = useState<number>(4);
  
  // Treatment tracking
  const [fluidBoluses, setFluidBoluses] = useState<number>(0);
  const [totalFluidGiven, setTotalFluidGiven] = useState<number>(0);
  const [antibioticsGiven, setAntibioticsGiven] = useState(false);
  const [inotropeStarted, setInotropeStarted] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [minutesSinceStart, setMinutesSinceStart] = useState<number>(0);

  // Calculate fluid bolus size
  const bolusSize = Math.round(patientWeight * 10); // 10 mL/kg
  const maxFluidFirstHour = patientWeight * 60; // 60 mL/kg max in first hour
  
  // Calculate age-appropriate MAP target
  const mapTarget = patientAge < 1 ? 50 : patientAge < 10 ? 55 + (patientAge * 1.5) : 70;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);
      setMinutesSinceStart(elapsed);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [startTime]);

  const addFluidBolus = () => {
    setFluidBoluses(prev => prev + 1);
    setTotalFluidGiven(prev => prev + bolusSize);
  };

  const toggleCheck = (checkId: string) => {
    setCompletedChecks(prev =>
      prev.includes(checkId)
        ? prev.filter(id => id !== checkId)
        : [...prev, checkId]
    );
  };

  const getShockTypeBadge = () => {
    if (!shockType) return null;
    const colors = {
      warm: 'bg-red-600',
      cold: 'bg-blue-600',
      mixed: 'bg-purple-600',
    };
    return (
      <Badge className={`${colors[shockType]} text-white`}>
        {shockType.toUpperCase()} SHOCK
      </Badge>
    );
  };

  const getAntibioticUrgency = () => {
    if (minutesSinceStart < 30) return { color: 'text-green-400', message: 'On track' };
    if (minutesSinceStart < 60) return { color: 'text-yellow-400', message: 'Urgent' };
    return { color: 'text-red-400', message: 'DELAYED' };
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="h-6 w-6 text-red-500" />
              Septic Shock Protocol
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">
                Patient: {patientAge}y, {patientWeight}kg | Time: {minutesSinceStart} min
              </p>
              {getShockTypeBadge()}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {/* NEONATAL-SPECIFIC WARNING */}
        {patientAge * 365 < 28 && (
          <Card className="bg-orange-900/40 border-orange-600 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-300 flex-shrink-0" />
                <div>
                  <p className="text-orange-100 font-bold text-lg mb-1">
                    ⚠️ NEONATAL SEPTIC SHOCK: DIFFERENT FLUID LIMITS
                  </p>
                  <p className="text-orange-200 text-sm mb-2">
                    Neonates (&lt;28 days) have <strong>LOWER fluid tolerance</strong> and different inotrope choices.
                  </p>
                  <div className="bg-blue-900/50 border border-blue-600 p-3 rounded mt-2">
                    <p className="text-blue-100 font-semibold mb-1">Neonatal Fluid Resuscitation:</p>
                    <p className="text-blue-200 text-xs mb-1">
                      • <strong>10 mL/kg boluses</strong> (NOT 20 mL/kg)
                    </p>
                    <p className="text-blue-200 text-xs mb-1">
                      • <strong>Maximum 20-30 mL/kg total</strong> in first hour (NOT 40-60 mL/kg)
                    </p>
                    <p className="text-blue-200 text-xs">
                      • Reassess after EACH bolus (high risk of fluid overload)
                    </p>
                  </div>
                  <div className="bg-purple-900/50 border border-purple-600 p-3 rounded mt-2">
                    <p className="text-purple-100 font-semibold mb-1">Neonatal Inotrope Selection:</p>
                    <p className="text-purple-200 text-xs mb-1">
                      • <strong>Dopamine</strong> first-line (5-10 mcg/kg/min)
                    </p>
                    <p className="text-purple-200 text-xs mb-1">
                      • <strong>Dobutamine</strong> if warm shock (5-20 mcg/kg/min)
                    </p>
                    <p className="text-purple-200 text-xs">
                      • <strong>Avoid norepinephrine</strong> in neonates (immature alpha receptors)
                    </p>
                  </div>
                  <p className="text-orange-200 text-xs mt-2">
                    Neonatal sepsis etiology: GBS, E. coli, Listeria. Antibiotics: Ampicillin + Gentamicin. Always consider HSV if maternal history or vesicles present (add acyclovir).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Antibiotic Timer Alert */}
        {!antibioticsGiven && (
          <Card className="bg-red-900/30 border-red-700 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-400" />
                  <span className="text-white font-semibold">Antibiotics must be given within 60 minutes</span>
                </div>
                <div className={`text-2xl font-bold ${getAntibioticUrgency().color}`}>
                  {minutesSinceStart} / 60 min - {getAntibioticUrgency().message}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'recognition', label: 'Recognition', icon: Activity },
            { id: 'fluid_resuscitation', label: 'Fluids', icon: Droplet },
            { id: 'antibiotics', label: 'Antibiotics', icon: Syringe },
            { id: 'inotropes', label: 'Inotropes', icon: Heart },
            { id: 'source_control', label: 'Source Control', icon: AlertTriangle },
            { id: 'ongoing_management', label: 'Management', icon: CheckCircle2 },
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <Button
                key={stage.id}
                onClick={() => setCurrentStage(stage.id as ShockStage)}
                variant={currentStage === stage.id ? 'default' : 'outline'}
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4 mr-2" />
                {stage.label}
              </Button>
            );
          })}
        </div>

        {/* Recognition Stage */}
        {currentStage === 'recognition' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Shock Recognition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2">Septic Shock Criteria (MUST have ALL)</h3>
                  <ul className="text-sm text-red-100 space-y-1">
                    <li>• Suspected or proven infection</li>
                    <li>• Hypotension OR signs of poor perfusion</li>
                    <li>• Persistent despite 40-60 mL/kg fluid resuscitation</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Lactate (mmol/L)</Label>
                    <Input
                      type="number"
                      value={lactate}
                      onChange={(e) => setLactate(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: &lt;2.0</p>
                  </div>
                  <div>
                    <Label className="text-white">MAP (mmHg)</Label>
                    <Input
                      type="number"
                      value={map}
                      onChange={(e) => setMAP(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Target: {mapTarget} mmHg</p>
                  </div>
                  <div>
                    <Label className="text-white">Cap Refill (seconds)</Label>
                    <Input
                      type="number"
                      value={capRefillTime}
                      onChange={(e) => setCapRefillTime(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="0.5"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: &lt;2 sec</p>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Shock Type Classification</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setShockType('warm')}
                      variant={shockType === 'warm' ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      <span className="font-semibold">Warm Shock:</span>
                      <span className="ml-2 text-sm">Flash cap refill, bounding pulses, wide pulse pressure</span>
                    </Button>
                    <Button
                      onClick={() => setShockType('cold')}
                      variant={shockType === 'cold' ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      <span className="font-semibold">Cold Shock:</span>
                      <span className="ml-2 text-sm">Delayed cap refill, weak pulses, cool extremities</span>
                    </Button>
                    <Button
                      onClick={() => setShockType('mixed')}
                      variant={shockType === 'mixed' ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      <span className="font-semibold">Mixed Shock:</span>
                      <span className="ml-2 text-sm">Features of both warm and cold shock</span>
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('fluid_resuscitation')}
                  disabled={!shockType}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Start Fluid Resuscitation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fluid Resuscitation Stage */}
        {currentStage === 'fluid_resuscitation' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fluid Resuscitation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-800 p-4 rounded text-center">
                    <p className="text-blue-200 text-sm mb-1">Bolus Size</p>
                    <p className="text-3xl font-bold text-white">{bolusSize} mL</p>
                    <p className="text-blue-100 text-sm">10 mL/kg</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded text-center">
                    <p className="text-gray-400 text-sm mb-1">Boluses Given</p>
                    <p className="text-3xl font-bold text-white">{fluidBoluses}</p>
                    <p className="text-gray-500 text-sm">{totalFluidGiven} mL total</p>
                  </div>
                  <div className="bg-orange-800 p-4 rounded text-center">
                    <p className="text-orange-200 text-sm mb-1">Max (1st hour)</p>
                    <p className="text-3xl font-bold text-white">{maxFluidFirstHour} mL</p>
                    <p className="text-orange-100 text-sm">60 mL/kg</p>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Fluid Resuscitation Protocol
                  </h3>
                  <ul className="text-sm text-yellow-100 space-y-2">
                    <li>• <strong>Fluid type:</strong> 0.9% NaCl or Ringer's Lactate</li>
                    <li>• <strong>Bolus size:</strong> 10-20 mL/kg over 5-10 minutes</li>
                    <li>• <strong>Maximum:</strong> 40-60 mL/kg in first hour</li>
                    <li>• <strong>Reassess after EACH bolus:</strong> Perfusion, BP, heart rate, respiratory effort</li>
                    <li>• <strong>Watch for fluid overload:</strong> Crackles, hepatomegaly, increased work of breathing</li>
                  </ul>
                </div>

                <Button
                  onClick={addFluidBolus}
                  disabled={totalFluidGiven >= maxFluidFirstHour}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-lg"
                >
                  <Droplet className="h-6 w-6 mr-2" />
                  Give Fluid Bolus ({bolusSize} mL)
                </Button>

                {totalFluidGiven >= maxFluidFirstHour && (
                  <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                    <p className="text-red-200 font-semibold">
                      Maximum fluid reached. If still in shock, proceed to inotropes/vasopressors.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCurrentStage('antibiotics')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Proceed to Antibiotics
                  </Button>
                  <Button
                    onClick={() => setCurrentStage('inotropes')}
                    variant="outline"
                  >
                    Skip to Inotropes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fluid Overload Warning */}
            <Card className="bg-orange-900/30 border-orange-700">
              <CardHeader>
                <CardTitle className="text-orange-200 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Fluid Overload Warning Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-orange-100 space-y-2">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Increased work of breathing, crackles on auscultation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Hepatomegaly (liver edge &gt;2 cm below costal margin)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Gallop rhythm on cardiac auscultation</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-orange-800 rounded">
                  <p className="text-white font-semibold">If fluid overload develops:</p>
                  <ul className="text-sm text-orange-100 mt-2 space-y-1">
                    <li>1. STOP further fluid boluses</li>
                    <li>2. Start inotropes/vasopressors immediately</li>
                    <li>3. Consider diuretics if pulmonary edema</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Antibiotics Stage */}
        {currentStage === 'antibiotics' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Antibiotic Administration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    TIME-CRITICAL: Within 1 Hour of Recognition
                  </h3>
                  <p className="text-red-100 text-sm">
                    Every hour delay in antibiotic administration increases mortality by 7.6%
                  </p>
                  <div className="mt-2 text-2xl font-bold text-white">
                    Time elapsed: {minutesSinceStart} minutes
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-3">Empiric Antibiotic Selection</h3>
                  <div className="space-y-3 text-sm text-blue-100">
                    <div>
                      <p className="font-semibold">Community-Acquired Sepsis:</p>
                      <p className="ml-4">• Ceftriaxone 50-100 mg/kg/day (max 4g) OR</p>
                      <p className="ml-4">• Cefotaxime 150-200 mg/kg/day divided q6-8h</p>
                      <p className="ml-4 text-xs text-blue-300">Add vancomycin if MRSA suspected</p>
                    </div>
                    <div>
                      <p className="font-semibold">Hospital-Acquired/Healthcare-Associated:</p>
                      <p className="ml-4">• Piperacillin-Tazobactam 300 mg/kg/day OR</p>
                      <p className="ml-4">• Meropenem 60 mg/kg/day (max 6g)</p>
                      <p className="ml-4">• PLUS Vancomycin 60 mg/kg/day</p>
                    </div>
                    <div>
                      <p className="font-semibold">Immunocompromised:</p>
                      <p className="ml-4">• Meropenem + Vancomycin + Amikacin</p>
                      <p className="ml-4 text-xs text-blue-300">Consider antifungal coverage</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">Before Antibiotics (if time permits):</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Blood cultures (2 sets from different sites)</li>
                    <li>• Urine culture</li>
                    <li>• Other cultures as indicated (CSF, wound, etc.)</li>
                    <li className="text-yellow-300 font-semibold">⚠ Do NOT delay antibiotics for cultures if unstable</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="antibiotics-given"
                    checked={antibioticsGiven}
                    onChange={(e) => setAntibioticsGiven(e.target.checked)}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="antibiotics-given" className="text-white">
                    Broad-spectrum antibiotics administered
                  </Label>
                </div>

                <Button
                  onClick={() => setCurrentStage('inotropes')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Inotrope Selection
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inotropes Stage */}
        {currentStage === 'inotropes' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Inotrope/Vasopressor Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-200 font-semibold">
                    Indication: Persistent shock despite 40-60 mL/kg fluid resuscitation
                  </p>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-3">Selection Based on Shock Type</h3>
                  <div className="space-y-4">
                    {shockType === 'cold' || shockType === 'mixed' ? (
                      <div className="bg-blue-800 p-4 rounded">
                        <p className="font-semibold text-white mb-2">COLD SHOCK (Low Cardiac Output):</p>
                        <p className="text-blue-100 text-sm mb-2">First-line: <strong>Epinephrine</strong></p>
                        <ul className="text-sm text-blue-100 space-y-1 ml-4">
                          <li>• Start: 0.05-0.1 mcg/kg/min</li>
                          <li>• Titrate: Up to 0.3-1 mcg/kg/min</li>
                          <li>• Effect: Increases contractility + heart rate</li>
                        </ul>
                        <p className="text-blue-100 text-sm mt-3">Second-line: <strong>Dobutamine</strong></p>
                        <ul className="text-sm text-blue-100 space-y-1 ml-4">
                          <li>• Dose: 5-20 mcg/kg/min</li>
                          <li>• Use if epinephrine causes excessive tachycardia</li>
                        </ul>
                      </div>
                    ) : null}

                    {shockType === 'warm' || shockType === 'mixed' ? (
                      <div className="bg-red-800 p-4 rounded">
                        <p className="font-semibold text-white mb-2">WARM SHOCK (Low SVR):</p>
                        <p className="text-red-100 text-sm mb-2">First-line: <strong>Norepinephrine</strong></p>
                        <ul className="text-sm text-red-100 space-y-1 ml-4">
                          <li>• Start: 0.05-0.1 mcg/kg/min</li>
                          <li>• Titrate: Up to 1-2 mcg/kg/min</li>
                          <li>• Effect: Increases SVR (vasoconstriction)</li>
                        </ul>
                        <p className="text-red-100 text-sm mt-3">Alternative: <strong>Dopamine</strong></p>
                        <ul className="text-sm text-red-100 space-y-1 ml-4">
                          <li>• Dose: 5-20 mcg/kg/min</li>
                          <li>• Avoid if tachycardic (increases HR)</li>
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">Infusion Preparation</h3>
                  <ul className="text-sm text-yellow-100 space-y-2">
                    <li>• <strong>Epinephrine:</strong> 0.6 × weight (kg) = mg in 100 mL D5W → 1 mL/hr = 0.1 mcg/kg/min</li>
                    <li>• <strong>Norepinephrine:</strong> 0.6 × weight (kg) = mg in 100 mL D5W → 1 mL/hr = 0.1 mcg/kg/min</li>
                    <li>• <strong>Dopamine:</strong> 6 × weight (kg) = mg in 100 mL D5W → 1 mL/hr = 1 mcg/kg/min</li>
                    <li>• Requires central line (peripheral OK for short-term if no access)</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inotrope-started"
                    checked={inotropeStarted}
                    onChange={(e) => setInotropeStarted(e.target.checked)}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="inotrope-started" className="text-white">
                    Inotrope/vasopressor infusion started
                  </Label>
                </div>

                <Button
                  onClick={() => setCurrentStage('source_control')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Source Control
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Source Control Stage */}
        {currentStage === 'source_control' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Source Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                  <h3 className="font-semibold text-orange-200 mb-2">Identify and Control Infection Source</h3>
                  <p className="text-orange-100 text-sm">
                    Source control should be achieved as soon as possible, ideally within 6-12 hours
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-white">Common Sources Checklist</h3>
                  {[
                    { id: 'abscess', label: 'Abscess (requires drainage)' },
                    { id: 'appendicitis', label: 'Appendicitis (requires surgery)' },
                    { id: 'necrotizing', label: 'Necrotizing fasciitis (requires debridement)' },
                    { id: 'catheter', label: 'Infected catheter/line (remove immediately)' },
                    { id: 'empyema', label: 'Empyema (requires drainage)' },
                    { id: 'peritonitis', label: 'Peritonitis (requires surgery)' },
                    { id: 'osteomyelitis', label: 'Osteomyelitis with abscess (requires drainage)' },
                  ].map((check) => (
                    <div key={check.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={check.id}
                        checked={completedChecks.includes(check.id)}
                        onChange={() => toggleCheck(check.id)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={check.id} className="text-white text-sm">
                        {check.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">Imaging to Identify Source:</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Chest X-ray (pneumonia, empyema)</li>
                    <li>• Ultrasound (abscess, appendicitis)</li>
                    <li>• CT scan if source unclear (requires stabilization first)</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('ongoing_management')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Ongoing Management
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ongoing Management Stage */}
        {currentStage === 'ongoing_management' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Ongoing Management & Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                  <h3 className="font-semibold text-green-200 mb-2">Early Goal-Directed Therapy Targets</h3>
                  <ul className="text-sm text-green-100 space-y-2">
                    <li>• MAP ≥ {mapTarget} mmHg (age-appropriate)</li>
                    <li>• Normal capillary refill (&lt;2 seconds)</li>
                    <li>• Normal mental status</li>
                    <li>• Urine output ≥1 mL/kg/hr</li>
                    <li>• Lactate &lt;2 mmol/L (or decreasing)</li>
                    <li>• ScvO2 ≥70%</li>
                  </ul>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Monitoring Requirements</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Continuous cardiac monitoring</li>
                    <li>• Arterial line for BP monitoring (if on vasopressors)</li>
                    <li>• Central venous access</li>
                    <li>• Hourly vital signs and perfusion assessment</li>
                    <li>• Lactate every 2-4 hours</li>
                    <li>• Blood glucose monitoring</li>
                    <li>• Strict intake/output monitoring</li>
                  </ul>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Supportive Care</h3>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• Mechanical ventilation if respiratory failure</li>
                    <li>• Stress ulcer prophylaxis (H2 blocker or PPI)</li>
                    <li>• DVT prophylaxis (if age-appropriate)</li>
                    <li>• Tight glucose control (target 80-180 mg/dL)</li>
                    <li>• Nutritional support (enteral preferred)</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">De-escalation Strategy</h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• Narrow antibiotics based on culture results</li>
                    <li>• Wean vasopressors as perfusion improves</li>
                    <li>• Transition to maintenance fluids once resuscitated</li>
                    <li>• Monitor for complications (ARDS, AKI, DIC)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
