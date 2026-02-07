/**
 * Croup (Laryngotracheobronchitis) Protocol
 * 
 * Clinical workflow for acute croup management:
 * 1. Westley Croup Score assessment (severity stratification)
 * 2. Dexamethasone administration (ALL severities)
 * 3. Nebulized epinephrine for moderate-severe
 * 4. Heliox consideration for severe/refractory
 * 5. Airway management for impending obstruction
 * 
 * Key principle: Croup is primarily 6 months - 3 years, rare in neonates
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wind, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Info,
  Activity,
  Syringe
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type CroupStage = 
  | 'assessment'
  | 'dexamethasone'
  | 'epinephrine'
  | 'airway';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

export default function CroupProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 12);
  const [patientAge, setPatientAge] = useState<number>(propAge || 2); // Default 2 years
  
  // Westley Croup Score components (0-17 scale)
  const [stridor, setStridor] = useState<number>(0); // 0=none, 1=with agitation, 2=at rest
  const [retractions, setRetractions] = useState<number>(0); // 0=none, 1=mild, 2=moderate, 3=severe
  const [airEntry, setAirEntry] = useState<number>(0); // 0=normal, 1=decreased, 2=markedly decreased
  const [cyanosis, setCyanosis] = useState<number>(0); // 0=none, 4=with agitation, 5=at rest
  const [levelOfConsciousness, setLevelOfConsciousness] = useState<number>(0); // 0=normal, 5=altered
  
  // Calculate Westley score
  const wesleyScore = stridor + retractions + airEntry + cyanosis + levelOfConsciousness;
  
  // Determine severity
  const severity: SeverityLevel = wesleyScore <= 2 ? 'mild' : 
                                   wesleyScore <= 7 ? 'moderate' : 'severe';
  
  // Treatment tracking
  const [currentStage, setCurrentStage] = useState<CroupStage>('assessment');
  const [dexGiven, setDexGiven] = useState(false);
  const [epiGiven, setEpiGiven] = useState(false);
  const [epiDoses, setEpiDoses] = useState<Date[]>([]);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [hoursSinceStart, setHoursSinceStart] = useState<number>(0);

  // Dexamethasone dose
  const dexDose = (0.6 * patientWeight).toFixed(1); // 0.6 mg/kg, max 10mg
  const dexDoseActual = Math.min(parseFloat(dexDose), 10);

  // Epinephrine dose
  const epiDose = (0.5 * patientWeight).toFixed(1); // 0.5 mL/kg of 1:1000 (max 5 mL)
  const epiDoseActual = Math.min(parseFloat(epiDose), 5);

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
      mild: 'bg-green-600',
      moderate: 'bg-yellow-600',
      severe: 'bg-red-600'
    };
    return <Badge className={`${colors[severity]} text-white`}>{severity.toUpperCase()} (Westley: {wesleyScore})</Badge>;
  };

  const giveEpinephrine = () => {
    setEpiGiven(true);
    setEpiDoses([...epiDoses, new Date()]);
  };

  const canRepeatEpi = () => {
    if (epiDoses.length === 0) return false;
    const lastDose = epiDoses[epiDoses.length - 1];
    const minutesSinceLastDose = (Date.now() - lastDose.getTime()) / 1000 / 60;
    return minutesSinceLastDose >= 15; // Can repeat every 15-20 minutes
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wind className="h-8 w-8" />
              Croup (LTB) Protocol
            </h1>
            <p className="text-gray-400 mt-1">Age: {patientAge < 1 ? `${Math.round(patientAge * 12)} months` : `${patientAge.toFixed(1)} years`} | Weight: {patientWeight}kg</p>
            <div className="flex gap-2 mt-2">
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
            { id: 'dexamethasone', label: 'Dexamethasone', icon: Syringe },
            { id: 'epinephrine', label: 'Epinephrine', icon: AlertTriangle },
            { id: 'airway', label: 'Airway', icon: Wind }
          ].map(stage => (
            <Button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id as CroupStage)}
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
                <CardTitle className="text-white">Westley Croup Score Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Stridor</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: 0, label: 'None' },
                        { value: 1, label: 'With agitation' },
                        { value: 2, label: 'At rest' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          onClick={() => setStridor(option.value)}
                          variant={stridor === option.value ? 'default' : 'outline'}
                          className={stridor === option.value ? 'bg-blue-600' : 'bg-gray-800 border-gray-600'}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Retractions</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { value: 0, label: 'None' },
                        { value: 1, label: 'Mild' },
                        { value: 2, label: 'Moderate' },
                        { value: 3, label: 'Severe' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          onClick={() => setRetractions(option.value)}
                          variant={retractions === option.value ? 'default' : 'outline'}
                          className={retractions === option.value ? 'bg-blue-600' : 'bg-gray-800 border-gray-600'}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Air Entry</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: 0, label: 'Normal' },
                        { value: 1, label: 'Decreased' },
                        { value: 2, label: 'Markedly decreased' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          onClick={() => setAirEntry(option.value)}
                          variant={airEntry === option.value ? 'default' : 'outline'}
                          className={airEntry === option.value ? 'bg-blue-600' : 'bg-gray-800 border-gray-600'}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Cyanosis</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: 0, label: 'None' },
                        { value: 4, label: 'With agitation' },
                        { value: 5, label: 'At rest' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          onClick={() => setCyanosis(option.value)}
                          variant={cyanosis === option.value ? 'default' : 'outline'}
                          className={cyanosis === option.value ? 'bg-blue-600' : 'bg-gray-800 border-gray-600'}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Level of Consciousness</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { value: 0, label: 'Normal' },
                        { value: 5, label: 'Altered/Disoriented' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          onClick={() => setLevelOfConsciousness(option.value)}
                          variant={levelOfConsciousness === option.value ? 'default' : 'outline'}
                          className={levelOfConsciousness === option.value ? 'bg-blue-600' : 'bg-gray-800 border-gray-600'}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Westley Score Interpretation</h3>
                  <div className="text-2xl font-bold text-white mb-2">Total Score: {wesleyScore} / 17</div>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• <strong>Mild (0-2):</strong> Dexamethasone, observe, consider discharge</li>
                    <li>• <strong>Moderate (3-7):</strong> Dexamethasone + Nebulized epinephrine, observe 3-4h</li>
                    <li>• <strong>Severe (≥8):</strong> Dexamethasone + Nebulized epinephrine, consider heliox, ICU consultation</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('dexamethasone')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Treatment
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dexamethasone Stage */}
        {currentStage === 'dexamethasone' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Dexamethasone Administration
                  {dexGiven && <Badge className="bg-green-600">GIVEN</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-3">Dexamethasone Dosing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-800 p-3 rounded">
                      <p className="text-blue-200 text-sm">Dose</p>
                      <p className="text-2xl font-bold text-white">{dexDoseActual.toFixed(1)} mg</p>
                      <p className="text-xs text-blue-100">0.6 mg/kg (max 10 mg)</p>
                    </div>
                    <div className="bg-blue-800 p-3 rounded">
                      <p className="text-blue-200 text-sm">Route</p>
                      <p className="text-lg font-bold text-white">PO or IM</p>
                      <p className="text-xs text-blue-100">PO preferred if tolerated</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Clinical Pearls
                  </h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• <strong>Give to ALL severities:</strong> Even mild croup benefits from dexamethasone</li>
                    <li>• <strong>Single dose sufficient:</strong> No need for repeat dosing</li>
                    <li>• <strong>Onset:</strong> 30-60 minutes, peak effect 4-6 hours</li>
                    <li>• <strong>Duration:</strong> Lasts 24-72 hours</li>
                    <li>• <strong>Alternative:</strong> Prednisolone 1-2 mg/kg PO if dexamethasone unavailable</li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setDexGiven(true);
                    toggleCheck('dex_given');
                  }}
                  className={`w-full ${dexGiven ? 'bg-green-600' : 'bg-blue-600'}`}
                  disabled={dexGiven}
                >
                  {dexGiven ? '✓ Dexamethasone Given' : 'Confirm Dexamethasone Given'}
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
                    onClick={() => setCurrentStage('epinephrine')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Next: Epinephrine
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Epinephrine Stage */}
        {currentStage === 'epinephrine' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Nebulized Epinephrine
                  {epiGiven && <Badge className="bg-orange-600">GIVEN ({epiDoses.length}x)</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {severity === 'mild' ? (
                  <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                    <h3 className="font-semibold text-green-200 mb-2">Mild Croup - Epinephrine Not Indicated</h3>
                    <p className="text-sm text-green-100">
                      Dexamethasone alone is sufficient for mild croup (Westley ≤2). 
                      Observe for 1-2 hours. If symptoms worsen, reassess and consider epinephrine.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                      <h3 className="font-semibold text-orange-200 mb-3">Nebulized Epinephrine Dosing</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-800 p-3 rounded">
                          <p className="text-orange-200 text-sm">Dose</p>
                          <p className="text-2xl font-bold text-white">{epiDoseActual.toFixed(1)} mL</p>
                          <p className="text-xs text-orange-100">0.5 mL/kg of 1:1000 (max 5 mL)</p>
                        </div>
                        <div className="bg-orange-800 p-3 rounded">
                          <p className="text-orange-200 text-sm">Dilution</p>
                          <p className="text-lg font-bold text-white">Add NS to 5 mL total</p>
                          <p className="text-xs text-orange-100">Nebulize over 10-15 min</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                      <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Epinephrine Pearls
                      </h3>
                      <ul className="text-sm text-yellow-100 space-y-1">
                        <li>• <strong>Indications:</strong> Moderate-severe croup (Westley ≥3), stridor at rest, respiratory distress</li>
                        <li>• <strong>Onset:</strong> 10-30 minutes, peak 60-90 minutes</li>
                        <li>• <strong>Duration:</strong> 2-3 hours (REBOUND possible!)</li>
                        <li>• <strong>Repeat dosing:</strong> Can repeat every 15-20 minutes if needed</li>
                        <li>• <strong>Observation:</strong> MUST observe 3-4 hours after last dose (rebound risk)</li>
                      </ul>
                    </div>

                    {epiDoses.length > 0 && (
                      <div className="bg-gray-800 p-4 rounded">
                        <h3 className="font-semibold text-white mb-2">Epinephrine Doses Given</h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {epiDoses.map((dose, idx) => (
                            <li key={idx}>
                              Dose {idx + 1}: {dose.toLocaleTimeString()} 
                              {idx === epiDoses.length - 1 && !canRepeatEpi() && (
                                <span className="text-yellow-400 ml-2">(Wait 15 min before repeat)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={giveEpinephrine}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={epiDoses.length > 0 && !canRepeatEpi()}
                    >
                      {epiDoses.length === 0 ? 'Give Nebulized Epinephrine' : 'Give Repeat Dose'}
                    </Button>
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentStage('dexamethasone')}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStage('airway')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Airway Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Airway Stage */}
        {currentStage === 'airway' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Advanced Airway Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-blue-900/30 p-4 rounded border-2 border-blue-600">
                    <h3 className="font-semibold text-blue-200 mb-2">Heliox (Helium-Oxygen Mixture)</h3>
                    <p className="text-sm text-blue-100 mb-2"><strong>Indications:</strong> Severe croup not responding to epinephrine, impending respiratory failure</p>
                    <div className="bg-blue-800 p-3 rounded mt-2">
                      <ul className="text-sm text-blue-100 space-y-1">
                        <li>• <strong>Mixture:</strong> 70% helium / 30% oxygen (or 60/40 if higher FiO2 needed)</li>
                        <li>• <strong>Delivery:</strong> Non-rebreather mask, tight seal</li>
                        <li>• <strong>Mechanism:</strong> Lower density gas reduces turbulent flow, improves work of breathing</li>
                        <li>• <strong>Onset:</strong> Immediate effect if going to work</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-900/30 p-4 rounded border-2 border-red-600">
                    <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Intubation (LAST RESORT)
                    </h3>
                    <p className="text-sm text-red-100 mb-2"><strong>Indications:</strong> Complete airway obstruction, exhaustion, unable to maintain oxygenation/ventilation</p>
                    <div className="bg-red-800 p-3 rounded mt-2">
                      <p className="text-white font-semibold mb-1">⚠️ CRITICAL CONSIDERATIONS:</p>
                      <ul className="text-sm text-red-100 space-y-1">
                        <li>• <strong>ETT size:</strong> Use 0.5-1.0 mm SMALLER than age-appropriate (subglottic narrowing)</li>
                        <li>• <strong>Most experienced provider:</strong> Difficult airway, one attempt</li>
                        <li>• <strong>Prepare for surgical airway:</strong> Have cricothyrotomy kit ready</li>
                        <li>• <strong>Avoid agitation:</strong> Keep child calm, parent present if possible</li>
                        <li>• <strong>ENT/Anesthesia backup:</strong> Call before attempting intubation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                  <h3 className="font-semibold text-green-200 mb-2">Discharge Criteria</h3>
                  <ul className="text-sm text-green-100 space-y-1">
                    <li>• No stridor at rest for 3-4 hours after last epinephrine</li>
                    <li>• Westley score ≤2</li>
                    <li>• Normal air entry, no retractions</li>
                    <li>• Tolerating oral fluids</li>
                    <li>• Reliable caregiver, able to return if worsens</li>
                    <li>• <strong>If epinephrine given:</strong> MUST observe minimum 3-4 hours (rebound risk)</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('epinephrine')}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-600 text-white"
                >
                  Back to Epinephrine
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
