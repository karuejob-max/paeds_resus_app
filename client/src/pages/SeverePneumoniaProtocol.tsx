/**
 * Severe Pneumonia Protocol
 * 
 * Clinical workflow for severe community-acquired pneumonia management:
 * 1. WHO severity classification (pneumonia vs severe pneumonia vs very severe pneumonia)
 * 2. Age-appropriate antibiotic selection (neonatal vs infant vs child - DIFFERENT regimens)
 * 3. Oxygen therapy escalation
 * 4. Fluid management (careful - avoid overload)
 * 5. Monitoring and reassessment
 * 
 * Key principle: Neonatal pneumonia requires DIFFERENT antibiotics (ampicillin + gentamicin) than older children
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wind, 
  Droplet, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Info,
  Baby,
  Syringe,
  Heart
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type PneumoniaStage = 
  | 'assessment'
  | 'antibiotics'
  | 'oxygen'
  | 'fluids'
  | 'monitoring';

type SeverityLevel = 'pneumonia' | 'severe' | 'very_severe';
type AgeGroup = 'neonate' | 'infant' | 'child';

export default function SeverePneumoniaProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 10);
  const [patientAge, setPatientAge] = useState<number>(propAge || 1); // Default 1 year
  
  // Age group detection (CRITICAL: Neonates need different antibiotics)
  const ageInDays = patientAge * 365;
  const ageInMonths = patientAge * 12;
  const ageGroup: AgeGroup = ageInDays < 28 ? 'neonate' : 
                              ageInMonths < 24 ? 'infant' : 'child';
  
  // Clinical state
  const [currentStage, setCurrentStage] = useState<PneumoniaStage>('assessment');
  const [respiratoryRate, setRespiratoryRate] = useState<number>(50);
  const [spO2, setSpO2] = useState<number>(92);
  const [chestIndrawing, setChestIndrawing] = useState(false);
  const [unableToFeed, setUnableToFeed] = useState(false);
  const [alteredConsciousness, setAlteredConsciousness] = useState(false);
  const [centralCyanosis, setCentralCyanosis] = useState(false);
  const [severeRespiratoryDistress, setSevereRespiratoryDistress] = useState(false);
  
  // Treatment tracking
  const [antibioticsGiven, setAntibioticsGiven] = useState(false);
  const [oxygenStarted, setOxygenStarted] = useState(false);
  const [fluidsGiven, setFluidsGiven] = useState<number>(0);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [hoursSinceStart, setHoursSinceStart] = useState<number>(0);

  // Determine severity (WHO classification)
  const severity: SeverityLevel = 
    centralCyanosis || alteredConsciousness || severeRespiratoryDistress || spO2 < 90
      ? 'very_severe'
      : chestIndrawing || unableToFeed || (spO2 >= 90 && spO2 < 93)
      ? 'severe'
      : 'pneumonia';

  // Fast breathing thresholds by age
  const fastBreathingThreshold = 
    ageInMonths < 2 ? 60 :
    ageInMonths < 12 ? 50 :
    ageInMonths < 60 ? 40 : 30;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60 / 60);
      setHoursSinceStart(elapsed);
    }, 60000);

    return () => clearInterval(interval);
  }, [startTime]);

  const toggleCheck = (checkId: string) => {
    setCompletedChecks(prev =>
      prev.includes(checkId)
        ? prev.filter(id => id !== checkId)
        : [...prev, checkId]
    );
  };

  const getSeverityBadge = () => {
    const colors = {
      pneumonia: 'bg-yellow-600',
      severe: 'bg-orange-600',
      very_severe: 'bg-red-600'
    };
    const labels = {
      pneumonia: 'PNEUMONIA',
      severe: 'SEVERE PNEUMONIA',
      very_severe: 'VERY SEVERE PNEUMONIA'
    };
    return <Badge className={`${colors[severity]} text-white`}>{labels[severity]}</Badge>;
  };

  const getAgeGroupBadge = () => {
    const colors = {
      neonate: 'bg-purple-600',
      infant: 'bg-blue-600',
      child: 'bg-cyan-600'
    };
    const labels = {
      neonate: 'NEONATE (<28 days)',
      infant: 'INFANT (28d-2y)',
      child: 'CHILD (>2y)'
    };
    return <Badge className={`${colors[ageGroup]} text-white`}>{labels[ageGroup]}</Badge>;
  };

  // Age-appropriate antibiotic regimens
  const getAntibioticRegimen = () => {
    if (ageGroup === 'neonate') {
      return {
        first: {
          name: 'Ampicillin',
          dose: `${(50 * patientWeight).toFixed(0)} mg IV q6-12h`,
          detail: '50 mg/kg/dose IV every 6-12h (age-dependent dosing)'
        },
        second: {
          name: 'Gentamicin',
          dose: `${(5 * patientWeight).toFixed(1)} mg IV q24-48h`,
          detail: '5 mg/kg/dose IV every 24-48h (age-dependent dosing)'
        },
        rationale: 'Neonatal pneumonia: Cover GBS, E. coli, Listeria'
      };
    } else if (severity === 'very_severe') {
      return {
        first: {
          name: 'Ceftriaxone',
          dose: `${(100 * patientWeight).toFixed(0)} mg IV q24h`,
          detail: '100 mg/kg/dose IV once daily (max 4g)'
        },
        second: {
          name: 'Azithromycin',
          dose: `${(10 * patientWeight).toFixed(0)} mg IV q24h`,
          detail: '10 mg/kg/dose IV once daily (if atypical suspected)'
        },
        rationale: 'Very severe: Broad-spectrum + atypical coverage'
      };
    } else {
      return {
        first: {
          name: 'Amoxicillin',
          dose: `${(90 * patientWeight).toFixed(0)} mg PO q12h`,
          detail: '90 mg/kg/day divided q12h (max 4g/day)'
        },
        second: {
          name: 'Ceftriaxone (if unable to tolerate PO)',
          dose: `${(50 * patientWeight).toFixed(0)} mg IV q24h`,
          detail: '50 mg/kg/dose IV once daily'
        },
        rationale: 'Severe: High-dose amoxicillin covers S. pneumoniae'
      };
    }
  };

  const antibioticRegimen = getAntibioticRegimen();

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wind className="h-8 w-8" />
              Severe Pneumonia Protocol
            </h1>
            <p className="text-gray-400 mt-1">Age: {patientAge < 1 ? `${Math.round(patientAge * 12)} months` : `${patientAge.toFixed(1)} years`} | Weight: {patientWeight}kg</p>
            <div className="flex gap-2 mt-2">
              {getAgeGroupBadge()}
              {getSeverityBadge()}
              <Badge className="bg-gray-700 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {hoursSinceStart}h since start
              </Badge>
            </div>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Stage Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'assessment', label: 'Assessment', icon: Activity },
            { id: 'antibiotics', label: 'Antibiotics', icon: Syringe },
            { id: 'oxygen', label: 'Oxygen', icon: Wind },
            { id: 'fluids', label: 'Fluids', icon: Droplet },
            { id: 'monitoring', label: 'Monitoring', icon: Heart }
          ].map(stage => (
            <Button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id as PneumoniaStage)}
              variant={currentStage === stage.id ? 'default' : 'outline'}
              className={`flex-shrink-0 ${
                currentStage === stage.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 border-gray-700'
              }`}
            >
              <stage.icon className="h-4 w-4 mr-2" />
              {stage.label}
            </Button>
          ))}
        </div>

        {/* Assessment Stage */}
        {currentStage === 'assessment' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">WHO Pneumonia Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Respiratory Rate (breaths/min)</Label>
                    <Input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Fast breathing if ≥{fastBreathingThreshold}
                    </p>
                  </div>
                  <div>
                    <Label className="text-white">SpO2 (%)</Label>
                    <Input
                      type="number"
                      value={spO2}
                      onChange={(e) => setSpO2(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="1"
                      min="70"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Danger Signs</h3>
                  {[
                    { id: 'chest_indrawing', label: 'Lower chest wall indrawing', state: chestIndrawing, setState: setChestIndrawing },
                    { id: 'unable_feed', label: 'Unable to drink/feed', state: unableToFeed, setState: setUnableToFeed },
                    { id: 'altered_consciousness', label: 'Altered consciousness/lethargy', state: alteredConsciousness, setState: setAlteredConsciousness },
                    { id: 'central_cyanosis', label: 'Central cyanosis', state: centralCyanosis, setState: setCentralCyanosis },
                    { id: 'severe_distress', label: 'Severe respiratory distress', state: severeRespiratoryDistress, setState: setSevereRespiratoryDistress }
                  ].map(sign => (
                    <div
                      key={sign.id}
                      className={`p-3 rounded border-2 cursor-pointer transition-all ${
                        sign.state
                          ? 'bg-red-900/30 border-red-600'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                      onClick={() => sign.setState(!sign.state)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="mt-1">
                          {sign.state ? (
                            <CheckCircle2 className="h-5 w-5 text-red-400" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-500" />
                          )}
                        </div>
                        <p className="text-white">{sign.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">WHO Classification</h3>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• <strong>Pneumonia:</strong> Fast breathing, no danger signs → Oral antibiotics, home care</li>
                    <li>• <strong>Severe Pneumonia:</strong> Chest indrawing OR SpO2 90-92% → Hospitalize, IV/IM antibiotics, oxygen</li>
                    <li>• <strong>Very Severe Pneumonia:</strong> Danger signs (cyanosis, altered consciousness, severe distress) OR SpO2 &lt;90% → ICU, broad-spectrum IV antibiotics, respiratory support</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('antibiotics')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Antibiotics
                </Button>
              </CardContent>
            </Card>

            {/* Neonatal-Specific Warning */}
            {ageGroup === 'neonate' && (
              <Card className="bg-purple-900/30 border-purple-700">
                <CardHeader>
                  <CardTitle className="text-purple-200 flex items-center gap-2">
                    <Baby className="h-5 w-5" />
                    NEONATE-SPECIFIC CONSIDERATIONS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-purple-100 space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Different antibiotics:</strong> Ampicillin + Gentamicin (NOT amoxicillin/ceftriaxone)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Sepsis workup:</strong> Blood culture, LP if febrile, CRP/CBC</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Lower threshold for ICU:</strong> Neonates decompensate rapidly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Feeding support:</strong> NG feeds if respiratory rate &gt;60 (aspiration risk)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Antibiotics Stage */}
        {currentStage === 'antibiotics' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Age-Appropriate Antibiotic Regimen
                  {antibioticsGiven && <Badge className="bg-green-600">GIVEN</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-3">Recommended Regimen</h3>
                  <p className="text-xs text-blue-100 mb-3">{antibioticRegimen.rationale}</p>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-800 p-3 rounded">
                      <p className="text-white font-semibold">{antibioticRegimen.first.name}</p>
                      <p className="text-2xl font-bold text-white mt-1">{antibioticRegimen.first.dose}</p>
                      <p className="text-xs text-blue-100 mt-1">{antibioticRegimen.first.detail}</p>
                    </div>

                    <div className="bg-blue-800 p-3 rounded">
                      <p className="text-white font-semibold">{antibioticRegimen.second.name}</p>
                      <p className="text-2xl font-bold text-white mt-1">{antibioticRegimen.second.dose}</p>
                      <p className="text-xs text-blue-100 mt-1">{antibioticRegimen.second.detail}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Antibiotic Pearls
                  </h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• <strong>Timing:</strong> Give first dose within 1 hour of diagnosis</li>
                    <li>• <strong>Duration:</strong> 5-7 days for uncomplicated, 10-14 days if severe/complicated</li>
                    <li>• <strong>Switch to PO:</strong> When afebrile 24h, tolerating feeds, SpO2 stable</li>
                    <li>• <strong>Blood culture:</strong> Before antibiotics if possible, but don't delay treatment</li>
                    {ageGroup === 'neonate' && (
                      <li className="text-orange-200">• <strong>Neonatal dosing:</strong> Adjust ampicillin/gentamicin frequency based on postnatal age</li>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setAntibioticsGiven(true);
                    toggleCheck('antibiotics_given');
                  }}
                  className={`w-full ${antibioticsGiven ? 'bg-green-600' : 'bg-blue-600'}`}
                  disabled={antibioticsGiven}
                >
                  {antibioticsGiven ? '✓ Antibiotics Given' : 'Confirm Antibiotics Given'}
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentStage('assessment')}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStage('oxygen')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Oxygen Therapy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Oxygen Stage */}
        {currentStage === 'oxygen' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Oxygen Therapy Escalation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-gray-800 p-4 rounded border-2 border-gray-600">
                    <h3 className="font-semibold text-white mb-2">Indications for Oxygen</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• SpO2 &lt;93% on room air</li>
                      <li>• Severe respiratory distress</li>
                      <li>• Central cyanosis</li>
                      <li>• Altered consciousness</li>
                    </ul>
                    <p className="text-xs text-gray-400 mt-2">Target: SpO2 ≥93% (≥95% for neonates)</p>
                  </div>

                  <div className="bg-blue-900/30 p-4 rounded border-2 border-blue-600">
                    <h3 className="font-semibold text-blue-200 mb-2">Oxygen Delivery Methods</h3>
                    <div className="space-y-2">
                      <div className="bg-blue-800 p-3 rounded">
                        <p className="text-white font-semibold">1. Nasal Cannula</p>
                        <p className="text-sm text-blue-100">0.5-2 L/min (up to 4 L/min for older children)</p>
                      </div>
                      <div className="bg-blue-800 p-3 rounded">
                        <p className="text-white font-semibold">2. Simple Face Mask</p>
                        <p className="text-sm text-blue-100">5-10 L/min</p>
                      </div>
                      <div className="bg-blue-800 p-3 rounded">
                        <p className="text-white font-semibold">3. Non-Rebreather Mask</p>
                        <p className="text-sm text-blue-100">10-15 L/min (FiO2 up to 0.9)</p>
                      </div>
                      <div className="bg-orange-800 p-3 rounded">
                        <p className="text-white font-semibold">4. High-Flow Nasal Cannula (HFNC)</p>
                        <p className="text-sm text-orange-100">
                          {ageGroup === 'neonate' ? '2-8 L/min' : '1-2 L/kg/min (max 15 L/min infants, 25 L/min children)'}
                        </p>
                      </div>
                      <div className="bg-red-800 p-3 rounded">
                        <p className="text-white font-semibold">5. CPAP/BiPAP or Intubation</p>
                        <p className="text-sm text-red-100">If failing HFNC, persistent hypoxemia, exhaustion</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentStage('antibiotics')}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStage('fluids')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Fluid Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fluids Stage */}
        {currentStage === 'fluids' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fluid Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    CRITICAL: Avoid Fluid Overload
                  </h3>
                  <p className="text-sm text-red-100 mb-2">
                    Pneumonia patients are at HIGH RISK for fluid overload and pulmonary edema. Use restrictive fluid strategy.
                  </p>
                  <ul className="text-sm text-red-100 space-y-1">
                    <li>• <strong>Maintenance:</strong> 60-80% of calculated maintenance (NOT 100%)</li>
                    <li>• <strong>Boluses:</strong> ONLY if shock present (10 mL/kg cautiously, reassess)</li>
                    <li>• <strong>Monitor:</strong> Respiratory status, work of breathing, crackles (signs of overload)</li>
                  </ul>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-3">Fluid Calculation</h3>
                  <div className="bg-blue-800 p-3 rounded">
                    <p className="text-blue-200 text-sm">Maintenance Fluid (24h)</p>
                    <p className="text-2xl font-bold text-white">
                      {(patientWeight <= 10 
                        ? patientWeight * 100 
                        : patientWeight <= 20 
                        ? 1000 + (patientWeight - 10) * 50 
                        : 1500 + (patientWeight - 20) * 20
                      ).toFixed(0)} mL/day
                    </p>
                    <p className="text-lg text-blue-100 mt-1">
                      Rate: {((patientWeight <= 10 
                        ? patientWeight * 100 
                        : patientWeight <= 20 
                        ? 1000 + (patientWeight - 10) * 50 
                        : 1500 + (patientWeight - 20) * 20
                      ) / 24).toFixed(1)} mL/hr
                    </p>
                    <p className="text-xs text-yellow-200 mt-2">
                      ⚠️ Give 60-80% of this rate for pneumonia (restrictive strategy)
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Fluid Management Pearls
                  </h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• <strong>Fluid type:</strong> 0.9% NaCl or Ringer's Lactate</li>
                    <li>• <strong>If dehydrated:</strong> Correct over 24-48h, not rapidly</li>
                    <li>• <strong>If shock:</strong> 10 mL/kg bolus, reassess after each bolus</li>
                    <li>• <strong>Transition to enteral:</strong> As soon as tolerating (NG if needed)</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentStage('oxygen')}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStage('monitoring')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Monitoring
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monitoring Stage */}
        {currentStage === 'monitoring' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Ongoing Monitoring & Reassessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { id: 'vitals', label: 'Vital Signs', desc: 'HR, RR, SpO2, BP, temp every 2-4 hours' },
                    { id: 'wob', label: 'Work of Breathing', desc: 'Retractions, nasal flaring, grunting - reassess q4h' },
                    { id: 'oxygenation', label: 'Oxygenation', desc: 'SpO2 continuous, titrate O2 to maintain ≥93%' },
                    { id: 'feeding', label: 'Feeding Tolerance', desc: 'Oral intake, NG if needed, IV if unable to tolerate enteral' },
                    { id: 'fluid_balance', label: 'Fluid Balance', desc: 'Strict I&O, daily weights, watch for overload (crackles, increased WOB)' },
                    { id: 'clinical_response', label: 'Clinical Response to Antibiotics', desc: 'Expect improvement 48-72h. If worsening, consider complications or resistant organism' },
                    { id: 'complications', label: 'Complications Screening', desc: 'Pleural effusion, empyema, pneumothorax, sepsis' }
                  ].map(item => (
                    <div
                      key={item.id}
                      className={`p-4 rounded border-2 cursor-pointer transition-all ${
                        completedChecks.includes(item.id)
                          ? 'bg-green-900/30 border-green-600'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                      onClick={() => toggleCheck(item.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {completedChecks.includes(item.id) ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{item.label}</p>
                          <p className="text-sm text-gray-300 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                  <h3 className="font-semibold text-green-200 mb-2">Discharge Criteria</h3>
                  <ul className="text-sm text-green-100 space-y-1">
                    <li>• Afebrile for 24 hours</li>
                    <li>• SpO2 ≥93% on room air</li>
                    <li>• Tolerating oral feeds and medications</li>
                    <li>• No respiratory distress at rest</li>
                    <li>• Completed minimum 48h IV antibiotics (if applicable)</li>
                    <li>• Reliable caregiver, able to complete oral antibiotic course</li>
                    {ageGroup === 'neonate' && (
                      <li className="text-yellow-200">• <strong>NEONATE:</strong> Consider longer observation (5-7 days) and follow-up within 24-48h</li>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('fluids')}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-600 text-white"
                >
                  Back to Fluids
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
