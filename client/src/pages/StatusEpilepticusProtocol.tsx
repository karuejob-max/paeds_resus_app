/**
 * Status Epilepticus Protocol
 * 
 * Clinical workflow aligned with Neurocritical Care Society and AES guidelines:
 * 1. Initial stabilization (ABCs, glucose, oxygen)
 * 2. First-line benzodiazepines (0-5 minutes)
 * 3. Second-line antiepileptics (5-20 minutes)
 * 4. Third-line therapy and RSI (20-40 minutes)
 * 5. Refractory status management (40+ minutes)
 * 
 * Time is critical: Every minute of ongoing seizure increases risk of:
 * - Permanent neurological damage
 * - Pharmacoresistance
 * - Mortality
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Syringe, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Info,
  Brain,
  Activity,
  Zap
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type SEStage = 
  | 'stabilization'
  | 'first_line'
  | 'second_line'
  | 'third_line'
  | 'refractory';

export default function StatusEpilepticusProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 20);
  const [patientAge, setPatientAge] = useState<number>(propAge || 5);
  
  // Clinical state
  const [currentStage, setCurrentStage] = useState<SEStage>('stabilization');
  const [seizureOngoing, setSeizureOngoing] = useState(true);
  
  // Treatment tracking
  const [benzoGiven, setBenzoGiven] = useState<Date[]>([]);
  const [secondLineGiven, setSecondLineGiven] = useState<string[]>([]);
  const [rsiPerformed, setRSIPerformed] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [minutesSinceStart, setMinutesSinceStart] = useState<number>(0);

  // Calculate medication doses
  const lorazepamDose = Math.min(patientWeight * 0.1, 4); // 0.1 mg/kg, max 4mg
  const diazepamDose = Math.min(patientWeight * 0.3, 10); // 0.3 mg/kg, max 10mg (IV) or 20mg (rectal)
  const midazolamDose = Math.min(patientWeight * 0.2, 10); // 0.2 mg/kg, max 10mg (IM/IN)
  const levetiracetamDose = Math.min(patientWeight * 60, 4500); // 60 mg/kg, max 4500mg
  const valproateDose = Math.min(patientWeight * 40, 3000); // 40 mg/kg, max 3000mg
  const phenytoinDose = Math.min(patientWeight * 20, 1500); // 20 mg/kg, max 1500mg
  const fosphenytoinDose = Math.min(patientWeight * 20, 1500); // 20 PE/kg, max 1500 PE

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);
      setMinutesSinceStart(elapsed);

      // Auto-advance stages based on time
      if (elapsed >= 5 && elapsed < 20 && currentStage === 'first_line' && benzoGiven.length >= 2) {
        setCurrentStage('second_line');
      } else if (elapsed >= 20 && elapsed < 40 && currentStage === 'second_line') {
        setCurrentStage('third_line');
      } else if (elapsed >= 40 && currentStage === 'third_line') {
        setCurrentStage('refractory');
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [startTime, currentStage, benzoGiven.length]);

  const giveBenzo = () => {
    setBenzoGiven(prev => [...prev, new Date()]);
  };

  const giveSecondLine = (medication: string) => {
    setSecondLineGiven(prev => [...prev, medication]);
  };

  const toggleCheck = (checkId: string) => {
    setCompletedChecks(prev =>
      prev.includes(checkId)
        ? prev.filter(id => id !== checkId)
        : [...prev, checkId]
    );
  };

  const getUrgencyBadge = () => {
    if (minutesSinceStart < 5) {
      return <Badge className="bg-yellow-600 text-white">EARLY (0-5 min)</Badge>;
    } else if (minutesSinceStart < 20) {
      return <Badge className="bg-orange-600 text-white">ESTABLISHED (5-20 min)</Badge>;
    } else if (minutesSinceStart < 40) {
      return <Badge className="bg-red-600 text-white">REFRACTORY (20-40 min)</Badge>;
    } else {
      return <Badge className="bg-purple-600 text-white">SUPER-REFRACTORY (40+ min)</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-500" />
              Status Epilepticus Protocol
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">
                Patient: {patientAge}y, {patientWeight}kg | Time: {minutesSinceStart} min | Benzos: {benzoGiven.length}
              </p>
              {getUrgencyBadge()}
              {seizureOngoing && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  SEIZING
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Time-Critical Alert */}
        {minutesSinceStart >= 5 && seizureOngoing && (
          <Card className="bg-red-900/30 border-red-700 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-lg">
                    {minutesSinceStart >= 20 ? 'REFRACTORY STATUS EPILEPTICUS' : 'PROLONGED SEIZURE'}
                  </p>
                  <p className="text-red-200 text-sm">
                    {minutesSinceStart} minutes of seizure activity. Risk of permanent brain damage increases with time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'stabilization', label: 'Stabilization', icon: Activity, time: '0 min' },
            { id: 'first_line', label: 'Benzos', icon: Syringe, time: '0-5 min' },
            { id: 'second_line', label: '2nd Line', icon: Syringe, time: '5-20 min' },
            { id: 'third_line', label: '3rd Line/RSI', icon: Brain, time: '20-40 min' },
            { id: 'refractory', label: 'Refractory', icon: AlertTriangle, time: '40+ min' },
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <Button
                key={stage.id}
                onClick={() => setCurrentStage(stage.id as SEStage)}
                variant={currentStage === stage.id ? 'default' : 'outline'}
                className="flex-shrink-0 flex-col h-auto py-2"
              >
                <Icon className="h-4 w-4 mb-1" />
                <span className="text-xs">{stage.label}</span>
                <span className="text-xs opacity-70">{stage.time}</span>
              </Button>
            );
          })}
        </div>

        {/* Stabilization Stage */}
        {currentStage === 'stabilization' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Initial Stabilization (SIMULTANEOUS with treatment)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Definition: Status Epilepticus
                  </h3>
                  <ul className="text-sm text-red-100 space-y-1">
                    <li>• Continuous seizure activity lasting &gt;5 minutes</li>
                    <li>• OR ≥2 seizures without full recovery of consciousness between</li>
                    <li>• This is a MEDICAL EMERGENCY requiring immediate treatment</li>
                  </ul>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">ABCs - Immediate Actions</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'airway', label: 'Position airway (lateral decubitus to prevent aspiration)', detail: 'Head tilt-chin lift, suction if needed' },
                      { id: 'oxygen', label: 'High-flow oxygen (10-15 L/min)', detail: 'Target SpO2 >94%' },
                      { id: 'iv', label: 'Establish IV/IO access', detail: 'Two large-bore IVs if possible' },
                      { id: 'monitor', label: 'Attach monitors', detail: 'Continuous pulse ox, BP, cardiac monitor' },
                      { id: 'glucose', label: 'Check blood glucose IMMEDIATELY', detail: 'Treat if <60 mg/dL' },
                    ].map((check) => (
                      <div key={check.id} className="flex items-start gap-2 bg-gray-700 p-3 rounded">
                        <input
                          type="checkbox"
                          id={check.id}
                          checked={completedChecks.includes(check.id)}
                          onChange={() => toggleCheck(check.id)}
                          className="h-5 w-5 mt-0.5"
                        />
                        <div className="flex-1">
                          <Label htmlFor={check.id} className="text-white font-semibold cursor-pointer">
                            {check.label}
                          </Label>
                          <p className="text-gray-400 text-xs mt-0.5">{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">Hypoglycemia Treatment (if glucose &lt;60 mg/dL)</h3>
                  <div className="text-sm text-yellow-100 space-y-2">
                    <div>
                      <p className="font-semibold">Dextrose 10% (D10):</p>
                      <p className="ml-4">• Dose: 5 mL/kg IV push</p>
                      <p className="ml-4">• Calculated: {Math.round(patientWeight * 5)} mL</p>
                      <p className="ml-4">• Recheck glucose after 5 minutes</p>
                    </div>
                    <p className="text-xs">Note: If no IV access, give glucagon 0.5 mg (&lt;20 kg) or 1 mg (≥20 kg) IM</p>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('first_line')}
                  className="w-full bg-red-600 hover:bg-red-700 h-16 text-lg"
                >
                  <Syringe className="h-6 w-6 mr-2" />
                  PROCEED TO BENZODIAZEPINES
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* First-Line: Benzodiazepines */}
        {currentStage === 'first_line' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">First-Line: Benzodiazepines (0-5 minutes)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-200 font-semibold">
                    Give benzodiazepine IMMEDIATELY. Do NOT delay for labs or imaging. Time is brain.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-800 p-4 rounded text-center">
                    <p className="text-purple-200 text-sm mb-1">Time Elapsed</p>
                    <p className="text-3xl font-bold text-white">{minutesSinceStart} min</p>
                    <p className="text-purple-100 text-sm">Target: &lt;5 min</p>
                  </div>
                  <div className="bg-blue-800 p-4 rounded text-center">
                    <p className="text-blue-200 text-sm mb-1">Benzos Given</p>
                    <p className="text-3xl font-bold text-white">{benzoGiven.length}</p>
                    <p className="text-blue-100 text-sm">Max: 2 doses</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded text-center">
                    <p className="text-gray-400 text-sm mb-1">Seizure Status</p>
                    <p className="text-xl font-bold text-white">
                      {seizureOngoing ? (
                        <span className="text-red-400">Ongoing</span>
                      ) : (
                        <span className="text-green-400">Stopped</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Lorazepam */}
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">Lorazepam (PREFERRED if IV access)</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">Dose:</p>
                        <p className="text-2xl font-bold text-white">{lorazepamDose.toFixed(1)} mg</p>
                        <p className="text-gray-400">0.1 mg/kg (max 4 mg)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Route:</p>
                        <p className="text-white">IV push over 2 minutes</p>
                        <p className="text-gray-400">Concentration: 2 or 4 mg/mL</p>
                      </div>
                    </div>
                    <p className="text-yellow-300 text-xs">• Can repeat ONCE after 5 minutes if seizure continues</p>
                    <p className="text-yellow-300 text-xs">• Longer duration of action than diazepam (6-12 hours vs 15-30 min)</p>
                  </div>
                  <Button
                    onClick={giveBenzo}
                    disabled={benzoGiven.length >= 2}
                    className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                  >
                    <Syringe className="h-4 w-4 mr-2" />
                    Give Lorazepam {lorazepamDose.toFixed(1)} mg IV
                  </Button>
                </div>

                {/* Diazepam */}
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">Diazepam (Alternative)</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">IV Dose:</p>
                        <p className="text-2xl font-bold text-white">{diazepamDose.toFixed(1)} mg</p>
                        <p className="text-gray-400">0.3 mg/kg (max 10 mg)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Rectal Dose:</p>
                        <p className="text-2xl font-bold text-white">{Math.min(diazepamDose * 2, 20).toFixed(1)} mg</p>
                        <p className="text-gray-400">0.5 mg/kg (max 20 mg)</p>
                      </div>
                    </div>
                    <p className="text-yellow-300 text-xs">• Faster onset than lorazepam but shorter duration</p>
                    <p className="text-yellow-300 text-xs">• Rectal route useful if no IV access</p>
                  </div>
                  <Button
                    onClick={giveBenzo}
                    disabled={benzoGiven.length >= 2}
                    className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                  >
                    <Syringe className="h-4 w-4 mr-2" />
                    Give Diazepam {diazepamDose.toFixed(1)} mg IV/PR
                  </Button>
                </div>

                {/* Midazolam */}
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">Midazolam (If NO IV access)</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">IM/IN Dose:</p>
                        <p className="text-2xl font-bold text-white">{midazolamDose.toFixed(1)} mg</p>
                        <p className="text-gray-400">0.2 mg/kg (max 10 mg)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Route:</p>
                        <p className="text-white">IM or Intranasal</p>
                        <p className="text-gray-400">Concentration: 5 mg/mL</p>
                      </div>
                    </div>
                    <p className="text-yellow-300 text-xs">• IM midazolam as effective as IV lorazepam in prehospital setting</p>
                    <p className="text-yellow-300 text-xs">• Intranasal: divide dose between nostrils (max 0.5 mL per nostril)</p>
                  </div>
                  <Button
                    onClick={giveBenzo}
                    disabled={benzoGiven.length >= 2}
                    className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                  >
                    <Syringe className="h-4 w-4 mr-2" />
                    Give Midazolam {midazolamDose.toFixed(1)} mg IM/IN
                  </Button>
                </div>

                {benzoGiven.length > 0 && (
                  <div className="bg-gray-800 p-4 rounded">
                    <h3 className="font-semibold text-white mb-2">Benzodiazepine Administration Log</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {benzoGiven.map((time, index) => (
                        <li key={index}>
                          Dose {index + 1}: {time.toLocaleTimeString()} ({Math.floor((Date.now() - time.getTime()) / 1000 / 60)} min ago)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                  <h3 className="font-semibold text-orange-200 mb-2">After 2 Benzodiazepine Doses</h3>
                  <p className="text-orange-100 text-sm mb-2">
                    If seizure continues after 2 doses of benzodiazepines, proceed to second-line antiepileptics.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="seizure_stopped"
                      checked={!seizureOngoing}
                      onChange={(e) => setSeizureOngoing(!e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="seizure_stopped" className="text-white">
                      Seizure has stopped
                    </Label>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('second_line')}
                  disabled={benzoGiven.length < 2 && seizureOngoing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Second-Line Antiepileptics
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Second-Line: Antiepileptics */}
        {currentStage === 'second_line' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Second-Line: Antiepileptic Drugs (5-20 minutes)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-200 font-semibold">
                    Choose ONE second-line agent. Levetiracetam or valproate preferred (fewer side effects).
                  </p>
                </div>

                {/* Levetiracetam */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Levetiracetam (Keppra) - PREFERRED</h3>
                    <input
                      type="checkbox"
                      checked={secondLineGiven.includes('levetiracetam')}
                      onChange={() => giveSecondLine('levetiracetam')}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">Dose:</p>
                        <p className="text-2xl font-bold text-white">{levetiracetamDose.toFixed(0)} mg</p>
                        <p className="text-gray-400">60 mg/kg (max 4500 mg)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Administration:</p>
                        <p className="text-white">IV over 15 minutes</p>
                        <p className="text-gray-400">Dilute in NS or D5W</p>
                      </div>
                    </div>
                    <div className="bg-green-900/30 border border-green-700 p-2 rounded mt-2">
                      <p className="text-green-200 text-xs font-semibold">Advantages:</p>
                      <ul className="text-green-100 text-xs space-y-1 ml-4">
                        <li>• No respiratory depression</li>
                        <li>• No hypotension</li>
                        <li>• Minimal drug interactions</li>
                        <li>• Can give rapidly</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Valproate */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Valproate (Depakote)</h3>
                    <input
                      type="checkbox"
                      checked={secondLineGiven.includes('valproate')}
                      onChange={() => giveSecondLine('valproate')}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">Dose:</p>
                        <p className="text-2xl font-bold text-white">{valproateDose.toFixed(0)} mg</p>
                        <p className="text-gray-400">40 mg/kg (max 3000 mg)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Administration:</p>
                        <p className="text-white">IV over 10 minutes</p>
                        <p className="text-gray-400">Max rate: 6 mg/kg/min</p>
                      </div>
                    </div>
                    <div className="bg-red-900/30 border border-red-700 p-2 rounded mt-2">
                      <p className="text-red-200 text-xs font-semibold">Contraindications:</p>
                      <ul className="text-red-100 text-xs space-y-1 ml-4">
                        <li>• Hepatic dysfunction</li>
                        <li>• Mitochondrial disorders</li>
                        <li>• Pregnancy (teratogenic)</li>
                        <li>• Age &lt;2 years with metabolic disorder</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phenytoin */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Phenytoin (Dilantin)</h3>
                    <input
                      type="checkbox"
                      checked={secondLineGiven.includes('phenytoin')}
                      onChange={() => giveSecondLine('phenytoin')}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">Dose:</p>
                        <p className="text-2xl font-bold text-white">{phenytoinDose.toFixed(0)} mg</p>
                        <p className="text-gray-400">20 mg/kg (max 1500 mg)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Administration:</p>
                        <p className="text-white">IV over 20 minutes</p>
                        <p className="text-gray-400">Max rate: 1 mg/kg/min</p>
                      </div>
                    </div>
                    <div className="bg-yellow-900/30 border border-yellow-700 p-2 rounded mt-2">
                      <p className="text-yellow-200 text-xs font-semibold">Cautions:</p>
                      <ul className="text-yellow-100 text-xs space-y-1 ml-4">
                        <li>• Cardiac monitoring required (can cause arrhythmias, hypotension)</li>
                        <li>• Must dilute in NS only (precipitates in dextrose)</li>
                        <li>• Extravasation causes purple glove syndrome</li>
                        <li>• Slower infusion than levetiracetam/valproate</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Fosphenytoin */}
                <div className="bg-gray-800 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Fosphenytoin (Cerebyx) - Phenytoin Prodrug</h3>
                    <input
                      type="checkbox"
                      checked={secondLineGiven.includes('fosphenytoin')}
                      onChange={() => giveSecondLine('fosphenytoin')}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 font-semibold">Dose:</p>
                        <p className="text-2xl font-bold text-white">{fosphenytoinDose.toFixed(0)} PE</p>
                        <p className="text-gray-400">20 PE/kg (max 1500 PE)</p>
                      </div>
                      <div>
                        <p className="text-blue-300 font-semibold">Administration:</p>
                        <p className="text-white">IV/IM over 10 minutes</p>
                        <p className="text-gray-400">Max rate: 3 PE/kg/min</p>
                      </div>
                    </div>
                    <div className="bg-green-900/30 border border-green-700 p-2 rounded mt-2">
                      <p className="text-green-200 text-xs font-semibold">Advantages over phenytoin:</p>
                      <ul className="text-green-100 text-xs space-y-1 ml-4">
                        <li>• Can give faster (3× rate)</li>
                        <li>• Can give IM if no IV access</li>
                        <li>• Less risk of extravasation injury</li>
                        <li>• Can mix with dextrose solutions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('third_line')}
                  disabled={secondLineGiven.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Third-Line Therapy
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Third-Line & RSI */}
        {currentStage === 'third_line' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Third-Line: RSI & Continuous Infusions (20-40 minutes)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Refractory Status Epilepticus
                  </h3>
                  <p className="text-red-100 text-sm">
                    Seizure persisting after benzodiazepines AND second-line agent. Intubation and continuous infusions required.
                  </p>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Rapid Sequence Intubation (RSI)</h3>
                  <div className="space-y-3">
                    <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded">
                      <p className="text-yellow-200 font-semibold text-sm">Indications for Intubation:</p>
                      <ul className="text-yellow-100 text-xs space-y-1 ml-4 mt-1">
                        <li>• Persistent seizures after 2nd-line therapy</li>
                        <li>• Respiratory failure (hypoxia, hypoventilation)</li>
                        <li>• Loss of airway protective reflexes</li>
                        <li>• Need for continuous infusion sedation</li>
                      </ul>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-white font-semibold text-sm mb-2">RSI Medications:</p>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div>
                          <p className="text-blue-300 font-semibold">Induction: Propofol</p>
                          <p className="ml-4">• Dose: 2-3 mg/kg IV push</p>
                          <p className="ml-4">• Calculated: {Math.round(patientWeight * 2)}-{Math.round(patientWeight * 3)} mg</p>
                          <p className="ml-4 text-green-300">• Bonus: Anticonvulsant properties</p>
                        </div>
                        <div>
                          <p className="text-blue-300 font-semibold">Paralysis: Rocuronium</p>
                          <p className="ml-4">• Dose: 1-1.2 mg/kg IV push</p>
                          <p className="ml-4">• Calculated: {Math.round(patientWeight * 1)}-{Math.round(patientWeight * 1.2)} mg</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rsi_done"
                        checked={rsiPerformed}
                        onChange={(e) => setRSIPerformed(e.target.checked)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="rsi_done" className="text-white font-semibold">
                        RSI performed, patient intubated and ventilated
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Continuous Infusion Options</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-white font-semibold">Midazolam Infusion (FIRST CHOICE)</p>
                      <div className="text-sm text-gray-300 space-y-1 mt-2">
                        <p>• Loading dose: 0.2 mg/kg IV (max 10 mg)</p>
                        <p>• Infusion: Start 0.1 mg/kg/hr, titrate up to 2 mg/kg/hr</p>
                        <p>• Calculated loading: {Math.min(patientWeight * 0.2, 10).toFixed(1)} mg</p>
                        <p>• Calculated starting rate: {(patientWeight * 0.1).toFixed(1)} mg/hr</p>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-white font-semibold">Propofol Infusion</p>
                      <div className="text-sm text-gray-300 space-y-1 mt-2">
                        <p>• Loading dose: 2 mg/kg IV</p>
                        <p>• Infusion: Start 20 mcg/kg/min, titrate up to 200 mcg/kg/min</p>
                        <p>• Calculated loading: {Math.round(patientWeight * 2)} mg</p>
                        <p className="text-red-300 text-xs mt-2">⚠ Risk of propofol infusion syndrome if prolonged (&gt;48 hrs) or high dose</p>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-white font-semibold">Pentobarbital Infusion</p>
                      <div className="text-sm text-gray-300 space-y-1 mt-2">
                        <p>• Loading dose: 5-15 mg/kg IV over 1 hour</p>
                        <p>• Infusion: Start 1 mg/kg/hr, titrate to burst suppression on EEG</p>
                        <p>• Requires continuous EEG monitoring</p>
                        <p className="text-yellow-300 text-xs mt-2">⚠ Causes hypotension, may need vasopressors</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Continuous EEG Monitoring</h3>
                  <p className="text-blue-100 text-sm mb-2">
                    Once intubated and paralyzed, clinical seizure activity may not be visible. Continuous EEG required to:
                  </p>
                  <ul className="text-blue-100 text-xs space-y-1 ml-4">
                    <li>• Detect ongoing electrical seizures</li>
                    <li>• Titrate infusions to burst suppression pattern</li>
                    <li>• Monitor for seizure recurrence during wean</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('refractory')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Proceed to Refractory Status Management
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Refractory Status */}
        {currentStage === 'refractory' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Super-Refractory Status Epilepticus (40+ minutes)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                  <h3 className="font-semibold text-purple-200 mb-2">Definition: Super-Refractory SE</h3>
                  <p className="text-purple-100 text-sm">
                    Seizures continuing or recurring despite anesthetic doses of medications. Requires ICU care and specialized interventions.
                  </p>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Investigate Underlying Cause</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'metabolic', label: 'Metabolic: Glucose, Na, Ca, Mg, ammonia, lactate' },
                      { id: 'infectious', label: 'Infectious: LP for meningitis/encephalitis, blood cultures' },
                      { id: 'structural', label: 'Structural: CT/MRI brain for bleed, mass, stroke' },
                      { id: 'toxic', label: 'Toxic: Drug screen, medication levels (if on AEDs)' },
                      { id: 'autoimmune', label: 'Autoimmune: Anti-NMDA, anti-VGKC, other antibodies' },
                    ].map((check) => (
                      <div key={check.id} className="flex items-start gap-2 bg-gray-700 p-2 rounded">
                        <input
                          type="checkbox"
                          id={check.id}
                          checked={completedChecks.includes(check.id)}
                          onChange={() => toggleCheck(check.id)}
                          className="h-4 w-4 mt-0.5"
                        />
                        <Label htmlFor={check.id} className="text-white text-sm cursor-pointer">
                          {check.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Additional Therapies (Consult Neurology)</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold text-blue-300">Ketamine Infusion</p>
                      <p className="ml-4">• Loading: 1-2 mg/kg IV</p>
                      <p className="ml-4">• Infusion: 0.3-7.5 mg/kg/hr</p>
                      <p className="ml-4 text-green-300">• NMDA antagonist, may work when GABAergic agents fail</p>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold text-blue-300">Ketogenic Diet</p>
                      <p className="ml-4">• Initiate via NG tube</p>
                      <p className="ml-4">• 4:1 ratio (fat:carb+protein)</p>
                      <p className="ml-4">• May take 2-7 days to see effect</p>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold text-blue-300">Immunotherapy (if autoimmune suspected)</p>
                      <p className="ml-4">• IV methylprednisolone</p>
                      <p className="ml-4">• IVIG</p>
                      <p className="ml-4">• Plasmapheresis</p>
                    </div>

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold text-blue-300">Hypothermia</p>
                      <p className="ml-4">• Target 32-34°C</p>
                      <p className="ml-4">• Neuroprotective, reduces metabolic demand</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2">Critical Care Considerations</h3>
                  <ul className="text-red-100 text-sm space-y-1">
                    <li>• Continuous EEG monitoring 24/7</li>
                    <li>• Arterial line for BP monitoring (infusions cause hypotension)</li>
                    <li>• Central line for vasopressors if needed</li>
                    <li>• Frequent neurological exams when sedation lightened</li>
                    <li>• Monitor for complications: aspiration pneumonia, rhabdomyolysis, DIC</li>
                    <li>• Consult pediatric neurology and critical care</li>
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
