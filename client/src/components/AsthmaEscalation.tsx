/**
 * Asthma Escalation Protocol Component
 * 
 * Complete escalation pathway from first-line to mechanical ventilation.
 * GPS-like guidance for severe/life-threatening asthma.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Wind, Phone, ArrowRight, Clock, Activity, Syringe } from 'lucide-react';
import { triggerAlert, triggerHaptic } from '@/lib/alertSystem';

type SeverityLevel = 'moderate' | 'severe' | 'life_threatening';
type TreatmentPhase = 'first_line' | 'second_line' | 'third_line' | 'intubation';

interface TreatmentStep {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration?: string;
  notes: string[];
  completed: boolean;
  responseAssessed: boolean;
}

interface Props {
  weightKg: number;
  severity: SeverityLevel;
  onReferralRequested: (reason: string) => void;
  onImproved: () => void;
}

const STEROID_OPTIONS = [
  { name: 'Prednisolone', dose: '1-2 mg/kg', route: 'PO', max: '60 mg', preferred: true },
  { name: 'Methylprednisolone', dose: '1-2 mg/kg', route: 'IV', max: '60 mg', preferred: false },
  { name: 'Dexamethasone', dose: '0.6 mg/kg', route: 'PO/IV', max: '16 mg', preferred: false },
  { name: 'Hydrocortisone', dose: '5 mg/kg', route: 'IV', max: '100 mg', preferred: false },
];

export function AsthmaEscalation({ weightKg, severity, onReferralRequested, onImproved }: Props) {
  const [currentPhase, setCurrentPhase] = useState<TreatmentPhase>('first_line');
  const [treatments, setTreatments] = useState<TreatmentStep[]>([]);
  const [selectedSteroid, setSelectedSteroid] = useState<string>('Prednisolone');
  const [reassessmentTimer, setReassessmentTimer] = useState<number>(0);
  const [showReassessment, setShowReassessment] = useState(false);
  const [salbutamolDoses, setSalbutamolDoses] = useState(0);
  const [mgso4Given, setMgso4Given] = useState(false);
  const [aminophyllineStarted, setAminophyllineStarted] = useState(false);
  const [ketamineStarted, setKetamineStarted] = useState(false);

  // Calculate doses
  const doses = {
    salbutamol: {
      neb: `${Math.min(5, Math.max(2.5, weightKg * 0.15)).toFixed(1)} mg (${weightKg < 20 ? '2.5 mg' : '5 mg'})`,
      mdi: `${Math.min(10, Math.max(4, Math.round(weightKg / 3)))} puffs via spacer`,
      continuous: `0.5 mg/kg/hr (max 15 mg/hr) = ${Math.min(15, weightKg * 0.5).toFixed(1)} mg/hr`,
      iv: `15 mcg/kg over 10 min = ${(weightKg * 15 / 1000).toFixed(2)} mg, then 1-5 mcg/kg/min`,
    },
    ipratropium: {
      neb: `${weightKg < 20 ? '250' : '500'} mcg`,
    },
    prednisolone: {
      dose: `${Math.min(60, Math.round(weightKg * 2))} mg PO`,
    },
    methylpred: {
      dose: `${Math.min(60, Math.round(weightKg * 2))} mg IV`,
    },
    dexamethasone: {
      dose: `${Math.min(16, weightKg * 0.6).toFixed(1)} mg PO/IV`,
    },
    mgso4: {
      dose: `${Math.min(2000, Math.round(weightKg * 50))} mg (50 mg/kg) IV over 20 min`,
      volume: `${(Math.min(2000, weightKg * 50) / 500).toFixed(1)} mL of 50% MgSO4`,
    },
    aminophylline: {
      loading: `${Math.round(weightKg * 5)} mg (5 mg/kg) IV over 20 min`,
      maintenance: `${(weightKg * 0.9).toFixed(1)} mg/hr (0.9 mg/kg/hr)`,
    },
    ketamine: {
      bolus: `${(weightKg * 1).toFixed(1)} mg (1 mg/kg) IV`,
      infusion: `${(weightKg * 0.5).toFixed(1)} - ${(weightKg * 2).toFixed(1)} mg/hr (0.5-2 mg/kg/hr)`,
    },
    adrenaline: {
      im: `${Math.min(0.5, weightKg * 0.01).toFixed(2)} mg (0.01 mg/kg) IM`,
      neb: `${Math.min(5, Math.max(2, weightKg * 0.1)).toFixed(1)} mg nebulized`,
    },
  };

  // Reassessment timer effect
  useEffect(() => {
    if (reassessmentTimer > 0) {
      const interval = setInterval(() => {
        setReassessmentTimer(prev => {
          if (prev <= 1) {
            setShowReassessment(true);
            triggerAlert('reassessment_due');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [reassessmentTimer]);

  const startReassessmentTimer = (minutes: number) => {
    setReassessmentTimer(minutes * 60);
    setShowReassessment(false);
  };

  const handleTreatmentGiven = (treatment: string) => {
    if (treatment === 'salbutamol') {
      setSalbutamolDoses(prev => prev + 1);
      startReassessmentTimer(20); // Reassess after 20 min
    } else if (treatment === 'mgso4') {
      setMgso4Given(true);
      startReassessmentTimer(30);
    } else if (treatment === 'aminophylline') {
      setAminophyllineStarted(true);
    } else if (treatment === 'ketamine') {
      setKetamineStarted(true);
    }
  };

  const handleReassessmentResponse = (response: 'improved' | 'same' | 'worse') => {
    setShowReassessment(false);
    
    if (response === 'improved') {
      if (currentPhase === 'first_line' || currentPhase === 'second_line') {
        // Continue current treatment, may be able to wean
        triggerAlert('success');
      }
    } else if (response === 'same' || response === 'worse') {
      // Escalate to next phase
      if (currentPhase === 'first_line') {
        setCurrentPhase('second_line');
        triggerAlert('critical_action');
      } else if (currentPhase === 'second_line') {
        setCurrentPhase('third_line');
        triggerAlert('critical_action');
      } else if (currentPhase === 'third_line') {
        setCurrentPhase('intubation');
        triggerAlert('critical_action');
        triggerHaptic('urgent');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reassessment Modal
  if (showReassessment) {
    return (
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-500/10">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Time to Reassess
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">How is the patient responding?</h3>
            <p className="text-muted-foreground mb-4">
              Check: Work of breathing, wheeze, SpO2, ability to speak, air entry
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              className="h-auto py-6 bg-green-600 hover:bg-green-700"
              onClick={() => handleReassessmentResponse('improved')}
            >
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <div className="font-bold">IMPROVED</div>
                <div className="text-xs mt-1 opacity-80">
                  Less wheeze<br/>
                  Better air entry<br/>
                  SpO2 improving
                </div>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-6"
              onClick={() => handleReassessmentResponse('same')}
            >
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <div className="font-bold">SAME</div>
                <div className="text-xs mt-1 opacity-80">
                  No change<br/>
                  Still struggling<br/>
                  Needs escalation
                </div>
              </div>
            </Button>
            <Button
              variant="destructive"
              className="h-auto py-6"
              onClick={() => handleReassessmentResponse('worse')}
            >
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <div className="font-bold">WORSE</div>
                <div className="text-xs mt-1 opacity-80">
                  Silent chest<br/>
                  Exhaustion<br/>
                  Altered mental status
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Phase Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Treatment Escalation</span>
            <Badge variant={
              currentPhase === 'intubation' ? 'destructive' :
              currentPhase === 'third_line' ? 'destructive' :
              currentPhase === 'second_line' ? 'secondary' : 'default'
            }>
              {currentPhase.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-1">
            {['first_line', 'second_line', 'third_line', 'intubation'].map((phase, i) => (
              <div
                key={phase}
                className={`h-2 flex-1 rounded ${
                  phase === currentPhase ? 'bg-primary' :
                  ['first_line', 'second_line', 'third_line', 'intubation'].indexOf(currentPhase) > i 
                    ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reassessment Timer */}
      {reassessmentTimer > 0 && (
        <Card className="border-2 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Reassessment in:</span>
              </div>
              <Badge variant="outline" className="text-lg font-mono">
                {formatTime(reassessmentTimer)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FIRST LINE */}
      {currentPhase === 'first_line' && (
        <>
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-green-500/10">
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                First Line Treatment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Oxygen */}
              <div className="p-3 border rounded bg-muted/50">
                <div className="font-semibold">1. Oxygen</div>
                <div className="text-sm">Target SpO2 ≥ 94%</div>
                <div className="text-xs text-muted-foreground">Use nasal cannula or face mask as needed</div>
              </div>

              {/* Salbutamol */}
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">2. Salbutamol (Albuterol)</div>
                    <div className="text-sm text-blue-600">{doses.salbutamol.neb} nebulized</div>
                    <div className="text-xs text-muted-foreground">
                      OR {doses.salbutamol.mdi}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Repeat every 20 min × 3, then hourly
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleTreatmentGiven('salbutamol')}
                  >
                    Given ({salbutamolDoses})
                  </Button>
                </div>
              </div>

              {/* Ipratropium */}
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">3. Ipratropium Bromide</div>
                    <div className="text-sm text-blue-600">{doses.ipratropium.neb} nebulized</div>
                    <div className="text-xs text-muted-foreground">
                      Add to first 3 salbutamol nebs
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Given</Button>
                </div>
              </div>

              {/* Steroids */}
              <div className="p-3 border rounded">
                <div className="font-semibold mb-2">4. Corticosteroid (choose one):</div>
                <div className="space-y-2">
                  {STEROID_OPTIONS.map(steroid => (
                    <div 
                      key={steroid.name}
                      className={`p-2 rounded flex items-center justify-between ${
                        selectedSteroid === steroid.name ? 'bg-green-500/10 border border-green-500' : 'bg-muted/50'
                      }`}
                    >
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {steroid.name}
                          {steroid.preferred && <Badge className="bg-green-600 text-xs">Preferred</Badge>}
                        </div>
                        <div className="text-sm text-blue-600">
                          {steroid.name === 'Prednisolone' && doses.prednisolone.dose}
                          {steroid.name === 'Methylprednisolone' && doses.methylpred.dose}
                          {steroid.name === 'Dexamethasone' && doses.dexamethasone.dose}
                          {steroid.name === 'Hydrocortisone' && `${Math.min(100, Math.round(weightKg * 5))} mg IV`}
                        </div>
                        <div className="text-xs text-muted-foreground">{steroid.route}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={selectedSteroid === steroid.name ? 'default' : 'outline'}
                        onClick={() => setSelectedSteroid(steroid.name)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {salbutamolDoses >= 3 && (
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => setCurrentPhase('second_line')}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Not Responding - Escalate to Second Line
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* SECOND LINE */}
      {currentPhase === 'second_line' && (
        <Card className="border-2 border-orange-500">
          <CardHeader className="bg-orange-500/10">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Second Line - Severe Asthma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Continue first line */}
            <div className="bg-muted/50 p-3 rounded text-sm">
              <strong>Continue:</strong> Oxygen, Salbutamol nebs (continuous if needed), Steroids
            </div>

            {/* Continuous Salbutamol */}
            <div className="p-3 border rounded">
              <div className="font-semibold">Continuous Salbutamol Nebulization</div>
              <div className="text-sm text-blue-600">{doses.salbutamol.continuous}</div>
              <div className="text-xs text-muted-foreground">
                Back-to-back nebs or continuous nebulization
              </div>
            </div>

            {/* Magnesium Sulfate */}
            <div className={`p-3 border rounded ${mgso4Given ? 'bg-green-500/10 border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Magnesium Sulfate (MgSO4)
                    {!mgso4Given && <Badge variant="destructive">GIVE NOW</Badge>}
                  </div>
                  <div className="text-sm text-blue-600">{doses.mgso4.dose}</div>
                  <div className="text-xs text-muted-foreground">
                    = {doses.mgso4.volume} diluted in 50 mL NS
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Monitor: BP, respiratory rate (may cause hypotension)
                  </div>
                </div>
                <Button 
                  size="sm"
                  className={mgso4Given ? 'bg-green-600' : 'bg-red-600'}
                  onClick={() => handleTreatmentGiven('mgso4')}
                >
                  {mgso4Given ? '✓ Given' : 'Give Now'}
                </Button>
              </div>
            </div>

            {/* IV Salbutamol */}
            <div className="p-3 border rounded">
              <div className="font-semibold">IV Salbutamol (if nebulized not working)</div>
              <div className="text-sm text-blue-600">{doses.salbutamol.iv}</div>
              <div className="text-xs text-muted-foreground">
                Requires cardiac monitoring - risk of arrhythmias
              </div>
            </div>

            {/* Adrenaline */}
            <div className="p-3 border rounded">
              <div className="font-semibold">Adrenaline (if anaphylaxis suspected)</div>
              <div className="text-sm text-blue-600">{doses.adrenaline.im}</div>
              <div className="text-xs text-muted-foreground">
                OR {doses.adrenaline.neb}
              </div>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setCurrentPhase('third_line')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Still Not Responding - Escalate to Third Line
            </Button>
          </CardContent>
        </Card>
      )}

      {/* THIRD LINE */}
      {currentPhase === 'third_line' && (
        <Card className="border-2 border-red-500">
          <CardHeader className="bg-red-500/10">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              Third Line - Life-Threatening Asthma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="bg-red-500/20 border border-red-500 rounded p-3">
              <strong>⚠️ CALL FOR SENIOR HELP / PICU CONSULT NOW</strong>
            </div>

            {/* Aminophylline */}
            <div className={`p-3 border rounded ${aminophyllineStarted ? 'bg-green-500/10 border-green-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Aminophylline</div>
                  <div className="text-sm text-blue-600">
                    Loading: {doses.aminophylline.loading}
                  </div>
                  <div className="text-sm text-blue-600">
                    Then: {doses.aminophylline.maintenance}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Contraindicated if already on theophylline<br/>
                    Monitor: HR, BP, theophylline levels, seizures
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleTreatmentGiven('aminophylline')}
                >
                  {aminophyllineStarted ? '✓ Started' : 'Start'}
                </Button>
              </div>
            </div>

            {/* Ketamine */}
            <div className={`p-3 border rounded ${ketamineStarted ? 'bg-green-500/10 border-green-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Ketamine (Bronchodilator effect)</div>
                  <div className="text-sm text-blue-600">
                    Bolus: {doses.ketamine.bolus}
                  </div>
                  <div className="text-sm text-blue-600">
                    Infusion: {doses.ketamine.infusion}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Causes bronchodilation + sedation<br/>
                    May facilitate intubation if needed
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleTreatmentGiven('ketamine')}
                >
                  {ketamineStarted ? '✓ Started' : 'Start'}
                </Button>
              </div>
            </div>

            {/* NIV */}
            <div className="p-3 border rounded">
              <div className="font-semibold">Non-Invasive Ventilation (BiPAP/CPAP)</div>
              <div className="text-sm">
                Start: IPAP 10-12, EPAP 5-6 cm H2O
              </div>
              <div className="text-xs text-muted-foreground">
                May avoid intubation in some patients
              </div>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setCurrentPhase('intubation')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Failing - Prepare for Intubation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* INTUBATION */}
      {currentPhase === 'intubation' && (
        <Card className="border-2 border-red-500 animate-pulse">
          <CardHeader className="bg-red-500/20">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              INTUBATION REQUIRED
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="bg-red-500/20 border border-red-500 rounded p-4">
              <h4 className="font-bold text-red-700 mb-2">INDICATIONS FOR INTUBATION:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Respiratory arrest or impending arrest</li>
                <li>Severe hypoxemia despite max O2</li>
                <li>Exhaustion / altered mental status</li>
                <li>Silent chest with poor air entry</li>
              </ul>
            </div>

            <div className="p-3 border rounded">
              <div className="font-semibold mb-2">Intubation Drugs for Asthma:</div>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>Ketamine</strong> (preferred - bronchodilator)<br/>
                  {(weightKg * 2).toFixed(1)} mg IV (2 mg/kg)
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <strong>Rocuronium</strong> (paralytic)<br/>
                  {(weightKg * 1.2).toFixed(1)} mg IV (1.2 mg/kg)
                </div>
              </div>
            </div>

            <div className="p-3 border rounded">
              <div className="font-semibold mb-2">Ventilator Settings for Asthma:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Mode:</strong> Volume Control or Pressure Control</li>
                <li><strong>Tidal Volume:</strong> 6-8 mL/kg = {Math.round(weightKg * 6)}-{Math.round(weightKg * 8)} mL</li>
                <li><strong>Rate:</strong> 8-12 breaths/min (allow long expiratory time)</li>
                <li><strong>I:E ratio:</strong> 1:3 to 1:4 (prolonged expiration)</li>
                <li><strong>PEEP:</strong> Low (0-5 cm H2O) - risk of auto-PEEP</li>
                <li><strong>FiO2:</strong> Start 100%, wean to SpO2 ≥ 92%</li>
              </ul>
            </div>

            <div className="bg-orange-500/10 border border-orange-500 rounded p-3">
              <strong>⚠️ PERMISSIVE HYPERCAPNIA:</strong>
              <p className="text-sm mt-1">
                Accept higher CO2 (up to 60-70 mmHg) to avoid barotrauma.
                Target pH &gt; 7.2, not normal CO2.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Button */}
      <Button
        variant="outline"
        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
        onClick={() => onReferralRequested(`Severe asthma - ${currentPhase.replace('_', ' ')}`)}
      >
        <Phone className="h-4 w-4 mr-2" />
        Initiate Referral
      </Button>

      {/* Improved Button */}
      <Button
        variant="outline"
        className="w-full border-green-500 text-green-500 hover:bg-green-500/10"
        onClick={onImproved}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Patient Improving - Continue Current Treatment
      </Button>
    </div>
  );
}

export default AsthmaEscalation;
