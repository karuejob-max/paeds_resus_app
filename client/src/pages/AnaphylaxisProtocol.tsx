/**
 * Anaphylaxis Protocol
 * 
 * Clinical workflow aligned with EAACI (European Academy of Allergy and Clinical Immunology) guidelines:
 * 1. Severity assessment and diagnosis
 * 2. IM epinephrine administration (FIRST-LINE, TIME-CRITICAL)
 * 3. Adjunct medications (H1/H2 antihistamines, corticosteroids)
 * 4. Supportive care (oxygen, fluids, positioning)
 * 5. Biphasic reaction monitoring (4-8 hours)
 * 6. Discharge planning and follow-up
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Syringe, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Info,
  Heart,
  Activity,
  Droplet
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type AnaphylaxisStage = 
  | 'assessment'
  | 'epinephrine'
  | 'adjunct_meds'
  | 'supportive_care'
  | 'monitoring'
  | 'discharge';

type Severity = 'mild' | 'moderate' | 'severe';

export default function AnaphylaxisProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 20);
  const [patientAge, setPatientAge] = useState<number>(propAge || 5);
  
  // Clinical state
  const [currentStage, setCurrentStage] = useState<AnaphylaxisStage>('assessment');
  const [severity, setSeverity] = useState<Severity | null>(null);
  
  // Treatment tracking
  const [epiDoses, setEpiDoses] = useState<Date[]>([]);
  const [h1Given, setH1Given] = useState(false);
  const [h2Given, setH2Given] = useState(false);
  const [steroidGiven, setSteroidGiven] = useState(false);
  const [oxygenStarted, setOxygenStarted] = useState(false);
  const [ivFluidsGiven, setIVFluidsGiven] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [minutesSinceStart, setMinutesSinceStart] = useState<number>(0);
  const [minutesSinceLastEpi, setMinutesSinceLastEpi] = useState<number | null>(null);

  // Calculate epinephrine dose
  const epiDose = Math.min(patientWeight * 0.01, 0.5); // 0.01 mg/kg, max 0.5mg
  const epiVolume = epiDose; // 1:1000 concentration (1 mg/mL)

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);
      setMinutesSinceStart(elapsed);

      if (epiDoses.length > 0) {
        const lastEpiTime = epiDoses[epiDoses.length - 1];
        const sinceLastEpi = Math.floor((Date.now() - lastEpiTime.getTime()) / 1000 / 60);
        setMinutesSinceLastEpi(sinceLastEpi);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [startTime, epiDoses]);

  const giveEpinephrine = () => {
    setEpiDoses(prev => [...prev, new Date()]);
  };

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
      mild: 'bg-yellow-600',
      moderate: 'bg-orange-600',
      severe: 'bg-red-600',
    };
    return (
      <Badge className={`${colors[severity]} text-white`}>
        {severity.toUpperCase()} ANAPHYLAXIS
      </Badge>
    );
  };

  const needsRepeatEpi = () => {
    if (epiDoses.length === 0) return false;
    if (minutesSinceLastEpi === null) return false;
    return minutesSinceLastEpi >= 5 && minutesSinceLastEpi <= 15;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Anaphylaxis Protocol
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">
                Patient: {patientAge}y, {patientWeight}kg | Time: {minutesSinceStart} min | Epi doses: {epiDoses.length}
              </p>
              {getSeverityBadge()}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {/* NEONATAL-SPECIFIC WARNING */}
        {patientAge * 365 < 28 && (
          <Card className="bg-yellow-900/40 border-yellow-600 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-300 flex-shrink-0" />
                <div>
                  <p className="text-yellow-100 font-bold text-lg mb-1">
                    ⚠️ NEONATAL ANAPHYLAXIS: SPECIAL CONSIDERATIONS
                  </p>
                  <p className="text-yellow-200 text-sm mb-2">
                    Neonates (&lt;28 days) have <strong>RARE anaphylaxis</strong> but require different monitoring.
                  </p>
                  <div className="bg-red-900/50 border border-red-600 p-3 rounded mt-2">
                    <p className="text-red-100 font-semibold mb-1">Neonatal Epinephrine Dosing:</p>
                    <p className="text-red-200 text-xs mb-1">
                      • <strong>IM epinephrine 0.01 mg/kg</strong> (same as older children)
                    </p>
                    <p className="text-red-200 text-xs mb-1">
                      • <strong>Anterolateral thigh</strong> (vastus lateralis muscle)
                    </p>
                    <p className="text-red-200 text-xs">
                      • Dose: {epiDose.toFixed(2)} mg = {epiVolume.toFixed(2)} mL of 1:1000 (1 mg/mL)
                    </p>
                  </div>
                  <div className="bg-blue-900/50 border border-blue-600 p-3 rounded mt-2">
                    <p className="text-blue-100 font-semibold mb-1">Neonatal Monitoring:</p>
                    <p className="text-blue-200 text-xs mb-1">
                      • <strong>Continuous cardiorespiratory monitoring</strong> (apnea risk)
                    </p>
                    <p className="text-blue-200 text-xs mb-1">
                      • <strong>Glucose monitoring</strong> (hypoglycemia common)
                    </p>
                    <p className="text-blue-200 text-xs">
                      • <strong>Admit for 24h observation</strong> (NOT 4-8h like older children)
                    </p>
                  </div>
                  <p className="text-yellow-200 text-xs mt-2">
                    Neonatal anaphylaxis triggers: Maternal medications (antibiotics, NSAIDs), cow's milk protein (formula), latex. Consider sepsis in differential (similar presentation).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Epinephrine Urgency Alert */}
        {epiDoses.length === 0 && (
          <Card className="bg-red-900/30 border-red-700 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-lg">IM EPINEPHRINE IS FIRST-LINE TREATMENT</p>
                  <p className="text-red-200 text-sm">Do NOT delay for IV access or other medications. Give IM epinephrine IMMEDIATELY.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Repeat Epinephrine Alert */}
        {needsRepeatEpi() && (
          <Card className="bg-orange-900/30 border-orange-700 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <span className="text-white font-semibold">Consider repeat epinephrine dose</span>
                </div>
                <div className="text-orange-300">
                  {minutesSinceLastEpi} minutes since last dose
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'assessment', label: 'Assessment', icon: Activity },
            { id: 'epinephrine', label: 'Epinephrine', icon: Syringe },
            { id: 'adjunct_meds', label: 'Adjunct Meds', icon: Heart },
            { id: 'supportive_care', label: 'Supportive Care', icon: Droplet },
            { id: 'monitoring', label: 'Monitoring', icon: Clock },
            { id: 'discharge', label: 'Discharge', icon: CheckCircle2 },
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <Button
                key={stage.id}
                onClick={() => setCurrentStage(stage.id as AnaphylaxisStage)}
                variant={currentStage === stage.id ? 'default' : 'outline'}
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4 mr-2" />
                {stage.label}
              </Button>
            );
          })}
        </div>

        {/* Assessment Stage */}
        {currentStage === 'assessment' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Anaphylaxis Diagnosis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2">Diagnostic Criteria (ANY ONE confirms anaphylaxis)</h3>
                  <ul className="text-sm text-red-100 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Acute onset (&lt;2 hours) involving skin/mucosa AND respiratory compromise OR hypotension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>Two or more of: skin/mucosa involvement, respiratory compromise, hypotension, GI symptoms AFTER likely allergen exposure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>Hypotension after exposure to KNOWN allergen for that patient</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Clinical Features Checklist</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-blue-300 mb-2">Skin/Mucosa:</p>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Urticaria (hives)</li>
                        <li>• Angioedema</li>
                        <li>• Flushing</li>
                        <li>• Pruritus</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300 mb-2">Respiratory:</p>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Wheeze/bronchospasm</li>
                        <li>• Stridor</li>
                        <li>• Dyspnea</li>
                        <li>• Hypoxia</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300 mb-2">Cardiovascular:</p>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Hypotension</li>
                        <li>• Tachycardia</li>
                        <li>• Syncope</li>
                        <li>• Chest pain</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300 mb-2">Gastrointestinal:</p>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Nausea/vomiting</li>
                        <li>• Abdominal pain</li>
                        <li>• Diarrhea</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Severity Classification</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setSeverity('mild')}
                      variant={severity === 'mild' ? 'default' : 'outline'}
                      className="w-full justify-start text-left"
                    >
                      <div>
                        <p className="font-semibold">Mild: Skin/mucosa only</p>
                        <p className="text-xs opacity-80">Urticaria, angioedema, flushing</p>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setSeverity('moderate')}
                      variant={severity === 'moderate' ? 'default' : 'outline'}
                      className="w-full justify-start text-left"
                    >
                      <div>
                        <p className="font-semibold">Moderate: Respiratory or GI involvement</p>
                        <p className="text-xs opacity-80">Wheeze, dyspnea, vomiting, abdominal pain</p>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setSeverity('severe')}
                      variant={severity === 'severe' ? 'default' : 'outline'}
                      className="w-full justify-start text-left"
                    >
                      <div>
                        <p className="font-semibold">Severe: Hypotension, hypoxia, or neurological</p>
                        <p className="text-xs opacity-80">Shock, cyanosis, confusion, collapse</p>
                      </div>
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('epinephrine')}
                  disabled={!severity}
                  className="w-full bg-red-600 hover:bg-red-700 h-16 text-lg"
                >
                  <Syringe className="h-6 w-6 mr-2" />
                  GIVE IM EPINEPHRINE NOW
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Epinephrine Stage */}
        {currentStage === 'epinephrine' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">IM Epinephrine Administration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-800 p-4 rounded text-center">
                    <p className="text-red-200 text-sm mb-1">Dose</p>
                    <p className="text-3xl font-bold text-white">{epiDose.toFixed(2)} mg</p>
                    <p className="text-red-100 text-sm">0.01 mg/kg</p>
                  </div>
                  <div className="bg-blue-800 p-4 rounded text-center">
                    <p className="text-blue-200 text-sm mb-1">Volume</p>
                    <p className="text-3xl font-bold text-white">{epiVolume.toFixed(2)} mL</p>
                    <p className="text-blue-100 text-sm">1:1000 (1 mg/mL)</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded text-center">
                    <p className="text-gray-400 text-sm mb-1">Doses Given</p>
                    <p className="text-3xl font-bold text-white">{epiDoses.length}</p>
                    {minutesSinceLastEpi !== null && (
                      <p className="text-gray-500 text-sm">{minutesSinceLastEpi} min ago</p>
                    )}
                  </div>
                </div>

                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    IM Epinephrine Administration
                  </h3>
                  <ul className="text-sm text-red-100 space-y-2">
                    <li>• <strong>Route:</strong> Intramuscular (IM) - anterolateral thigh (vastus lateralis)</li>
                    <li>• <strong>Concentration:</strong> 1:1000 (1 mg/mL) - NOT 1:10,000</li>
                    <li>• <strong>Dose:</strong> 0.01 mg/kg (max 0.5 mg for adults, 0.3 mg for children)</li>
                    <li>• <strong>Repeat:</strong> Every 5-15 minutes if no improvement</li>
                    <li>• <strong>Auto-injector:</strong> EpiPen 0.15 mg (&lt;25 kg) or 0.3 mg (≥25 kg)</li>
                  </ul>
                </div>

                <Button
                  onClick={giveEpinephrine}
                  className="w-full bg-red-600 hover:bg-red-700 h-20 text-xl"
                >
                  <Syringe className="h-8 w-8 mr-2" />
                  GIVE IM EPINEPHRINE ({epiDose.toFixed(2)} mg)
                </Button>

                {epiDoses.length > 0 && (
                  <div className="bg-gray-800 p-4 rounded">
                    <h3 className="font-semibold text-white mb-2">Epinephrine Administration Log</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {epiDoses.map((time, index) => (
                        <li key={index}>
                          Dose {index + 1}: {time.toLocaleTimeString()} ({Math.floor((Date.now() - time.getTime()) / 1000 / 60)} min ago)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">When to Repeat Epinephrine</h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• No improvement in symptoms after 5-15 minutes</li>
                    <li>• Persistent wheeze or stridor</li>
                    <li>• Persistent hypotension</li>
                    <li>• Worsening symptoms</li>
                    <li>• Most patients respond to 1-2 doses</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('adjunct_meds')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Adjunct Medications
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Adjunct Medications Stage */}
        {currentStage === 'adjunct_meds' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Adjunct Medications (AFTER Epinephrine)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                  <p className="text-orange-200 font-semibold">
                    These are ADJUNCT medications. They do NOT replace epinephrine and should only be given AFTER epinephrine.
                  </p>
                </div>

                {/* H1 Antihistamine */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">H1 Antihistamine</h3>
                    <input
                      type="checkbox"
                      checked={h1Given}
                      onChange={(e) => setH1Given(e.target.checked)}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div>
                      <p className="font-semibold text-blue-300">Diphenhydramine (Benadryl):</p>
                      <p className="ml-4">• Dose: 1-2 mg/kg (max 50 mg)</p>
                      <p className="ml-4">• Route: IV, IM, or PO</p>
                      <p className="ml-4">• Calculated: {Math.min(patientWeight * 1, 50).toFixed(0)} mg</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300">OR Cetirizine (Zyrtec):</p>
                      <p className="ml-4">• Dose: &lt;6y: 2.5-5 mg, ≥6y: 5-10 mg</p>
                      <p className="ml-4">• Route: PO only</p>
                    </div>
                  </div>
                </div>

                {/* H2 Antihistamine */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">H2 Antihistamine</h3>
                    <input
                      type="checkbox"
                      checked={h2Given}
                      onChange={(e) => setH2Given(e.target.checked)}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div>
                      <p className="font-semibold text-blue-300">Ranitidine (Zantac):</p>
                      <p className="ml-4">• Dose: 1 mg/kg (max 50 mg)</p>
                      <p className="ml-4">• Route: IV or PO</p>
                      <p className="ml-4">• Calculated: {Math.min(patientWeight * 1, 50).toFixed(0)} mg</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300">OR Famotidine (Pepcid):</p>
                      <p className="ml-4">• Dose: 0.25 mg/kg (max 20 mg)</p>
                      <p className="ml-4">• Route: IV or PO</p>
                      <p className="ml-4">• Calculated: {Math.min(patientWeight * 0.25, 20).toFixed(1)} mg</p>
                    </div>
                  </div>
                </div>

                {/* Corticosteroid */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Corticosteroid</h3>
                    <input
                      type="checkbox"
                      checked={steroidGiven}
                      onChange={(e) => setSteroidGiven(e.target.checked)}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div>
                      <p className="font-semibold text-blue-300">Methylprednisolone (Solu-Medrol):</p>
                      <p className="ml-4">• Dose: 1-2 mg/kg (max 125 mg)</p>
                      <p className="ml-4">• Route: IV or IM</p>
                      <p className="ml-4">• Calculated: {Math.min(patientWeight * 1, 125).toFixed(0)} mg</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300">OR Hydrocortisone:</p>
                      <p className="ml-4">• Dose: 5 mg/kg (max 200 mg)</p>
                      <p className="ml-4">• Route: IV or IM</p>
                      <p className="ml-4">• Calculated: {Math.min(patientWeight * 5, 200).toFixed(0)} mg</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300">OR Prednisone:</p>
                      <p className="ml-4">• Dose: 1 mg/kg (max 60 mg)</p>
                      <p className="ml-4">• Route: PO</p>
                      <p className="ml-4">• Calculated: {Math.min(patientWeight * 1, 60).toFixed(0)} mg</p>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-300 mt-2">
                    Note: May reduce biphasic reactions but does NOT affect acute symptoms
                  </p>
                </div>

                <Button
                  onClick={() => setCurrentStage('supportive_care')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Supportive Care
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Supportive Care Stage */}
        {currentStage === 'supportive_care' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Supportive Care</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Positioning */}
                  <div className="bg-gray-800 p-4 rounded">
                    <h3 className="font-semibold text-white mb-2">Positioning</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Supine with legs elevated</strong> (if hypotensive)</li>
                      <li>• <strong>Semi-recumbent</strong> (if respiratory distress)</li>
                      <li>• <strong>Position of comfort</strong> (if pregnant or obese)</li>
                      <li className="text-red-300 font-semibold">⚠ DO NOT sit patient upright if hypotensive (can cause cardiac arrest)</li>
                    </ul>
                  </div>

                  {/* Oxygen */}
                  <div className="bg-gray-800 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">Oxygen</h3>
                      <input
                        type="checkbox"
                        checked={oxygenStarted}
                        onChange={(e) => setOxygenStarted(e.target.checked)}
                        className="h-5 w-5"
                      />
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• High-flow oxygen (10-15 L/min via non-rebreather mask)</li>
                      <li>• Target SpO2 &gt;94%</li>
                      <li>• Consider nebulized salbutamol if persistent wheeze</li>
                    </ul>
                  </div>

                  {/* IV Fluids */}
                  <div className="bg-gray-800 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">IV Fluid Resuscitation</h3>
                      <input
                        type="checkbox"
                        checked={ivFluidsGiven}
                        onChange={(e) => setIVFluidsGiven(e.target.checked)}
                        className="h-5 w-5"
                      />
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Indication:</strong> Hypotension not responding to epinephrine</li>
                      <li>• <strong>Fluid:</strong> 0.9% NaCl or Ringer's Lactate</li>
                      <li>• <strong>Bolus:</strong> 10-20 mL/kg over 5-10 minutes</li>
                      <li>• <strong>Calculated:</strong> {Math.round(patientWeight * 10)}-{Math.round(patientWeight * 20)} mL</li>
                      <li>• May need large volumes (20-30 mL/kg) due to vasodilation</li>
                    </ul>
                  </div>

                  {/* Airway Management */}
                  <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                    <h3 className="font-semibold text-red-200 mb-2">Airway Management (if needed)</h3>
                    <ul className="text-sm text-red-100 space-y-1">
                      <li>• Intubation may be difficult due to angioedema</li>
                      <li>• Have smaller ETT sizes ready</li>
                      <li>• Consider cricothyrotomy if cannot intubate</li>
                      <li>• Call for senior help early if airway compromise</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('monitoring')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Monitoring
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monitoring Stage */}
        {currentStage === 'monitoring' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Biphasic Reaction Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                  <h3 className="font-semibold text-orange-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Biphasic Reactions Occur in 5-20% of Cases
                  </h3>
                  <p className="text-orange-100 text-sm">
                    Symptoms can recur 4-8 hours (sometimes up to 72 hours) after initial resolution, even without re-exposure to allergen.
                  </p>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Observation Period</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">Mild:</span>
                      <span>4-6 hours observation minimum</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">Moderate:</span>
                      <span>6-8 hours observation, consider admission</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">Severe:</span>
                      <span>Admit for 24 hours monitoring</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Monitoring Requirements</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Continuous pulse oximetry</li>
                    <li>• Vital signs every 15-30 minutes initially</li>
                    <li>• Assess for recurrence of symptoms</li>
                    <li>• Keep IV access in place</li>
                    <li>• Have epinephrine immediately available</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">Risk Factors for Biphasic Reaction</h3>
                  <ul className="text-sm text-yellow-100 space-y-1">
                    <li>• Severe initial reaction</li>
                    <li>• Delayed epinephrine administration (&gt;30 min)</li>
                    <li>• Required multiple epinephrine doses</li>
                    <li>• Unknown trigger</li>
                    <li>• History of biphasic reaction</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('discharge')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Discharge Planning
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Discharge Stage */}
        {currentStage === 'discharge' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Discharge Planning & Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                  <h3 className="font-semibold text-green-200 mb-2">Discharge Criteria</h3>
                  <ul className="text-sm text-green-100 space-y-1">
                    <li>• Complete resolution of symptoms</li>
                    <li>• Stable vital signs for at least 2 hours</li>
                    <li>• Adequate observation period completed (4-8 hours minimum)</li>
                    <li>• Patient/family understands discharge instructions</li>
                    <li>• Epinephrine auto-injector prescribed and demonstrated</li>
                  </ul>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Discharge Checklist</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'epipen', label: 'Prescribe TWO epinephrine auto-injectors (EpiPen/Anapen)' },
                      { id: 'demo', label: 'Demonstrate auto-injector use to patient/family' },
                      { id: 'plan', label: 'Provide written anaphylaxis action plan' },
                      { id: 'avoid', label: 'Counsel on trigger avoidance' },
                      { id: 'bracelet', label: 'Recommend medical alert bracelet' },
                      { id: 'antihistamine', label: 'Prescribe oral antihistamine (3-5 days)' },
                      { id: 'steroid', label: 'Prescribe oral corticosteroid (3-5 days)' },
                      { id: 'followup', label: 'Arrange allergy specialist follow-up (2-4 weeks)' },
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
                </div>

                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2">Return Precautions</h3>
                  <p className="text-red-100 text-sm mb-2">Instruct patient/family to return immediately if:</p>
                  <ul className="text-sm text-red-100 space-y-1">
                    <li>• Any symptoms recur (even mild)</li>
                    <li>• Difficulty breathing</li>
                    <li>• Swelling of face, lips, or tongue</li>
                    <li>• Dizziness or feeling faint</li>
                    <li>• Use auto-injector and call 911 if symptoms return</li>
                  </ul>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Allergy Testing & Immunotherapy</h3>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• Refer to allergist for skin testing or specific IgE testing</li>
                    <li>• Consider immunotherapy for venom allergies</li>
                    <li>• Oral immunotherapy available for some food allergies</li>
                    <li>• Testing should be done 4-6 weeks after reaction</li>
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
