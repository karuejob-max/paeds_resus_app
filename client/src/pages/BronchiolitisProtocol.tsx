/**
 * Bronchiolitis Protocol
 * 
 * Clinical workflow for acute viral bronchiolitis management:
 * 1. Age-based assessment (neonatal vs infant vs child - DIFFERENT protocols)
 * 2. Severity assessment (mild/moderate/severe based on work of breathing, oxygenation)
 * 3. Supportive care (oxygen, hydration, suctioning)
 * 4. Respiratory support escalation (HFNC → CPAP → intubation)
 * 5. Monitoring and reassessment
 * 
 * Key principle: Neonatal bronchiolitis (<28 days) managed DIFFERENTLY than older infants
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
  Heart,
  Thermometer
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type BronchiolitisStage = 
  | 'assessment'
  | 'supportive_care'
  | 'respiratory_support'
  | 'monitoring';

type SeverityLevel = 'mild' | 'moderate' | 'severe';
type AgeGroup = 'neonate' | 'infant' | 'child';

export default function BronchiolitisProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 5);
  const [patientAge, setPatientAge] = useState<number>(propAge || 0.25); // Default 3 months
  
  // Age group detection (CRITICAL: Neonates managed differently)
  const ageInDays = patientAge * 365;
  const ageGroup: AgeGroup = ageInDays < 28 ? 'neonate' : 
                              patientAge < 2 ? 'infant' : 'child';
  
  // Clinical state
  const [currentStage, setCurrentStage] = useState<BronchiolitisStage>('assessment');
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(50);
  const [spO2, setSpO2] = useState<number>(94);
  const [feedingTolerance, setFeedingTolerance] = useState<number>(75); // % of normal intake
  
  // Treatment tracking
  const [oxygenStarted, setOxygenStarted] = useState(false);
  const [hfncStarted, setHfncStarted] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [hoursSinceStart, setHoursSinceStart] = useState<number>(0);

  // Determine severity
  useEffect(() => {
    // Neonates: Lower threshold for "severe"
    if (ageGroup === 'neonate') {
      if (spO2 < 90 || respiratoryRate > 70 || feedingTolerance < 50) {
        setSeverity('severe');
      } else if (spO2 < 94 || respiratoryRate > 60) {
        setSeverity('moderate');
      } else {
        setSeverity('mild');
      }
    } else {
      // Infants/children: Standard criteria
      if (spO2 < 90 || respiratoryRate > 70 || feedingTolerance < 50) {
        setSeverity('severe');
      } else if (spO2 < 94 || respiratoryRate > 60) {
        setSeverity('moderate');
      } else {
        setSeverity('mild');
      }
    }
  }, [spO2, respiratoryRate, feedingTolerance, ageGroup]);

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
    if (!severity) return null;
    const colors = {
      mild: 'bg-green-600',
      moderate: 'bg-yellow-600',
      severe: 'bg-red-600'
    };
    return <Badge className={`${colors[severity]} text-white`}>{severity.toUpperCase()}</Badge>;
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

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wind className="h-8 w-8" />
              Bronchiolitis Protocol
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
            { id: 'supportive_care', label: 'Supportive Care', icon: Heart },
            { id: 'respiratory_support', label: 'Respiratory Support', icon: Wind },
            { id: 'monitoring', label: 'Monitoring', icon: Thermometer }
          ].map(stage => (
            <Button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id as BronchiolitisStage)}
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
                <CardTitle className="text-white">Clinical Assessment</CardTitle>
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
                      Normal: {ageGroup === 'neonate' ? '30-60' : ageGroup === 'infant' ? '25-50' : '20-30'}
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
                    <p className="text-xs text-gray-400 mt-1">Target: ≥90% (≥92% for neonates)</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-white">Feeding Tolerance (% of normal intake)</Label>
                    <Input
                      type="number"
                      value={feedingTolerance}
                      onChange={(e) => setFeedingTolerance(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="5"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {ageGroup === 'neonate' && 'CRITICAL: Neonates dehydrate rapidly'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Severity Classification</h3>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• <strong>Mild:</strong> SpO2 ≥94%, RR normal-mild elevation, feeding &gt;75%</li>
                    <li>• <strong>Moderate:</strong> SpO2 90-94%, RR 60-70, feeding 50-75%</li>
                    <li>• <strong>Severe:</strong> SpO2 &lt;90%, RR &gt;70, feeding &lt;50%, apnea</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('supportive_care')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Supportive Care
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
                      <span><strong>Apnea risk:</strong> Monitor continuously, lower threshold for admission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Feeding:</strong> May need NG/OG tube earlier than older infants</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Sepsis workup:</strong> Consider bacterial co-infection (blood culture, LP if febrile)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Admission threshold:</strong> LOWER - most neonates with bronchiolitis require hospitalization</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Supportive Care Stage */}
        {currentStage === 'supportive_care' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Supportive Care Measures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { id: 'oxygen', label: 'Oxygen Therapy', desc: `Target SpO2 ≥90% (≥92% for neonates). Start with nasal cannula 0.5-2 L/min.` },
                    { id: 'suction', label: 'Nasal Suctioning', desc: 'Gentle bulb suction before feeds. Avoid deep suctioning (can worsen bronchospasm).' },
                    { id: 'hydration', label: 'Hydration Support', desc: ageGroup === 'neonate' ? 'NG/OG feeds if <50% oral intake. IV fluids if unable to tolerate NG.' : 'NG feeds if <50% oral intake. IV fluids 80-100% maintenance if dehydrated.' },
                    { id: 'position', label: 'Positioning', desc: 'Elevate head of bed 30°. Allow position of comfort.' },
                    { id: 'monitoring', label: 'Continuous Monitoring', desc: ageGroup === 'neonate' ? 'Cardiorespiratory monitor + pulse ox (apnea risk HIGH)' : 'Pulse oximetry continuous. Cardiorespiratory monitor if severe.' }
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

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    What NOT to Do
                  </h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• <strong>NO bronchodilators:</strong> Salbutamol/albuterol ineffective in bronchiolitis</li>
                    <li>• <strong>NO steroids:</strong> No benefit, may prolong viral shedding</li>
                    <li>• <strong>NO antibiotics:</strong> Unless bacterial co-infection suspected</li>
                    <li>• <strong>NO chest physiotherapy:</strong> Not beneficial, may worsen distress</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentStage('assessment')}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  >
                    Back to Assessment
                  </Button>
                  <Button
                    onClick={() => setCurrentStage('respiratory_support')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Respiratory Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Respiratory Support Stage */}
        {currentStage === 'respiratory_support' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Respiratory Support Escalation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-gray-800 p-4 rounded border-2 border-gray-600">
                    <h3 className="font-semibold text-white mb-2">1. Standard Oxygen Therapy</h3>
                    <p className="text-sm text-gray-300">Nasal cannula 0.5-2 L/min or simple face mask 5-10 L/min</p>
                    <p className="text-xs text-gray-400 mt-1">Target: SpO2 ≥90% (≥92% for neonates)</p>
                  </div>

                  <div className="bg-blue-900/30 p-4 rounded border-2 border-blue-600">
                    <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                      2. High-Flow Nasal Cannula (HFNC)
                      {hfncStarted && <Badge className="bg-blue-600">ACTIVE</Badge>}
                    </h3>
                    <p className="text-sm text-blue-100 mb-2"><strong>Indications:</strong> SpO2 &lt;90% on standard O2, increasing work of breathing, apnea</p>
                    <div className="bg-blue-800 p-3 rounded mt-2">
                      <p className="text-white font-semibold mb-1">HFNC Settings:</p>
                      <ul className="text-sm text-blue-100 space-y-1">
                        <li>• <strong>Flow rate:</strong> {ageGroup === 'neonate' ? '2-8 L/min' : '1-2 L/kg/min (max 15 L/min for infants, 25 L/min for children)'}</li>
                        <li>• <strong>FiO2:</strong> Start 0.4-0.6, titrate to SpO2 ≥92%</li>
                        <li>• <strong>Temperature:</strong> 34-37°C (heated and humidified)</li>
                      </ul>
                    </div>
                    <Button
                      onClick={() => setHfncStarted(!hfncStarted)}
                      className={`w-full mt-3 ${hfncStarted ? 'bg-green-600' : 'bg-blue-600'}`}
                    >
                      {hfncStarted ? 'HFNC Started' : 'Start HFNC'}
                    </Button>
                  </div>

                  <div className="bg-orange-900/30 p-4 rounded border-2 border-orange-600">
                    <h3 className="font-semibold text-orange-200 mb-2">3. CPAP/BiPAP</h3>
                    <p className="text-sm text-orange-100 mb-2"><strong>Indications:</strong> Failing HFNC, persistent hypoxemia, severe work of breathing</p>
                    <div className="bg-orange-800 p-3 rounded mt-2">
                      <p className="text-white font-semibold mb-1">CPAP Settings:</p>
                      <ul className="text-sm text-orange-100 space-y-1">
                        <li>• <strong>CPAP:</strong> Start 5-7 cmH2O</li>
                        <li>• <strong>BiPAP:</strong> IPAP 10-15, EPAP 5-7 cmH2O</li>
                        <li>• <strong>FiO2:</strong> Titrate to SpO2 ≥92%</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-900/30 p-4 rounded border-2 border-red-600">
                    <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      4. Intubation & Mechanical Ventilation
                    </h3>
                    <p className="text-sm text-red-100 mb-2"><strong>Indications:</strong> Apnea, respiratory failure despite CPAP, exhaustion, unable to protect airway</p>
                    <div className="bg-red-800 p-3 rounded mt-2">
                      <p className="text-white font-semibold mb-1">Intubation Considerations:</p>
                      <ul className="text-sm text-red-100 space-y-1">
                        <li>• <strong>ETT size:</strong> {ageGroup === 'neonate' ? '2.5-3.0 mm' : ageGroup === 'infant' ? '3.0-3.5 mm' : '3.5-4.0 mm'}</li>
                        <li>• <strong>Initial vent settings:</strong> Pressure control, PEEP 5-7, PIP 18-25, Rate {ageGroup === 'neonate' ? '40-60' : '25-35'}</li>
                        <li>• <strong>Sedation:</strong> Fentanyl + midazolam infusions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentStage('supportive_care')}
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
                    { id: 'vitals', label: 'Vital Signs', desc: 'HR, RR, SpO2, BP every 1-2 hours (continuous if severe)' },
                    { id: 'wob', label: 'Work of Breathing', desc: 'Retractions, nasal flaring, grunting - reassess every 2-4 hours' },
                    { id: 'feeding', label: 'Feeding Tolerance', desc: 'Document intake every feed. Switch to NG if <50% oral' },
                    { id: 'hydration', label: 'Hydration Status', desc: 'Urine output, skin turgor, mucous membranes' },
                    { id: 'apnea', label: ageGroup === 'neonate' ? 'Apnea Monitoring (CRITICAL)' : 'Apnea Monitoring', desc: ageGroup === 'neonate' ? 'Continuous cardiorespiratory monitoring - HIGH RISK' : 'Monitor for apnea episodes especially in infants <6 months' },
                    { id: 'deterioration', label: 'Signs of Deterioration', desc: 'Increasing O2 requirement, worsening WOB, lethargy, poor perfusion' }
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
                    <li>• SpO2 ≥90% on room air for 12-24 hours</li>
                    <li>• Feeding &gt;75% of normal intake</li>
                    <li>• No respiratory distress at rest</li>
                    <li>• No apnea for 24 hours (especially neonates/young infants)</li>
                    <li>• Caregiver able to provide care at home</li>
                    {ageGroup === 'neonate' && (
                      <li className="text-yellow-200">• <strong>NEONATE:</strong> Consider longer observation (48-72h) due to apnea risk</li>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('respiratory_support')}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-600 text-white"
                >
                  Back to Respiratory Support
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
