/**
 * Adult ACLS Cardiac Arrest Protocol
 * 
 * Clinical workflow aligned with AHA 2025 ACLS guidelines:
 * 1. Immediate rhythm assessment
 * 2. High-quality CPR (100-120 compressions/min, 2-2.4" depth)
 * 3. Fixed-dose medications (not weight-based)
 * 4. Defibrillation 120-200J biphasic
 * 5. Reversible causes (5 H's & 5 T's)
 * 6. Post-ROSC care
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Zap, 
  Syringe, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

interface Props {
  patientAge: number; // in years
  patientWeight?: number; // in kg, optional
  onClose: () => void;
}

type ArrestPhase = 'initial_assessment' | 'compressions' | 'rhythm_check' | 'charging' | 'shock_ready' | 'post_shock';
type RhythmType = 'vf_vt' | 'pea' | 'asystole' | null;

interface ArrestEvent {
  id: string;
  timestamp: number;
  action: string;
  details?: string;
}

export function AdultACLS({ patientAge, patientWeight, onClose }: Props) {
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cycleTime, setCycleTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<ArrestPhase>('initial_assessment');
  
  // Clinical state
  const [rhythm, setRhythm] = useState<RhythmType>(null);
  const [shockCount, setShockCount] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [amiodaroneDoses, setAmiodaroneDoses] = useState(0);
  const [hasROSC, setHasROSC] = useState(false);
  
  // Patient data
  const [weight, setWeight] = useState(patientWeight || 70); // Default 70kg if not provided
  const [showWeightDialog, setShowWeightDialog] = useState(!patientWeight); // Show if weight not provided
  const [defibrillatorType, setDefibrillatorType] = useState<'biphasic' | 'monophasic'>('biphasic');
  const [shockEnergy, setShockEnergy] = useState(200); // 200J for biphasic, 360J for monophasic
  
  // UI state
  const [showRhythmDialog, setShowRhythmDialog] = useState(false);
  const [showReversibleCauses, setShowReversibleCauses] = useState(false);
  const [showPostROSC, setShowPostROSC] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [events, setEvents] = useState<ArrestEvent[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Update shock energy when defibrillator type changes
  useEffect(() => {
    setShockEnergy(defibrillatorType === 'biphasic' ? 200 : 360);
  }, [defibrillatorType]);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play beep sound
  const playBeep = (frequency: number, duration: number) => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  // Log event
  const logEvent = (action: string, details?: string) => {
    const event: ArrestEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: elapsedTime,
      action,
      details,
    };
    setEvents(prev => [event, ...prev]);
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setCycleTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // CPR cycle management (2 minutes)
  useEffect(() => {
    if (phase === 'compressions' && cycleTime >= 120) {
      playBeep(800, 0.5);
      setPhase('rhythm_check');
      setShowRhythmDialog(true);
      setCycleTime(0);
      logEvent('CPR Cycle Complete', '2 minutes - Check rhythm');
    }
  }, [cycleTime, phase]);

  // Audio prompts during compressions
  useEffect(() => {
    if (phase === 'compressions') {
      // Epinephrine every 3-5 minutes
      if (cycleTime === 60 && epiDoses === 0) {
        playBeep(600, 0.3);
        logEvent('Prompt', 'Consider first dose of epinephrine');
      }
    }
  }, [cycleTime, phase, epiDoses]);

  const startCPR = () => {
    setIsRunning(true);
    setPhase('compressions');
    setCycleTime(0);
    logEvent('CPR Started', 'Begin high-quality compressions');
    playBeep(1000, 0.2);
  };

  const handleRhythmCheck = (detectedRhythm: RhythmType) => {
    setRhythm(detectedRhythm);
    setShowRhythmDialog(false);
    logEvent('Rhythm Check', detectedRhythm === 'vf_vt' ? 'VF/VT' : detectedRhythm === 'pea' ? 'PEA' : 'Asystole');

    if (detectedRhythm === 'vf_vt') {
      setPhase('charging');
      setTimeout(() => {
        setPhase('shock_ready');
        playBeep(1200, 0.3);
      }, 3000);
    } else {
      // Non-shockable rhythm - resume CPR
      setPhase('compressions');
      setCycleTime(0);
    }
  };

  const deliverShock = () => {
    setShockCount(prev => prev + 1);
    setPhase('post_shock');
    logEvent('Shock Delivered', `Shock #${shockCount + 1} - ${shockEnergy}J ${defibrillatorType}`);
    playBeep(1500, 0.1);
    
    // Immediately resume CPR
    setTimeout(() => {
      setPhase('compressions');
      setCycleTime(0);
    }, 1000);
  };

  const giveEpinephrine = () => {
    setEpiDoses(prev => prev + 1);
    logEvent('Medication', `Epinephrine 1mg IV/IO - Dose #${epiDoses + 1}`);
    playBeep(700, 0.2);
  };

  const giveAmiodarone = () => {
    setAmiodaroneDoses(prev => prev + 1);
    const dose = amiodaroneDoses === 0 ? '300mg' : '150mg';
    logEvent('Medication', `Amiodarone ${dose} IV/IO - Dose #${amiodaroneDoses + 1}`);
    playBeep(700, 0.2);
  };

  const declareROSC = () => {
    setHasROSC(true);
    setIsRunning(false);
    setShowPostROSC(true);
    logEvent('ROSC Achieved', 'Return of spontaneous circulation');
    playBeep(1000, 1.0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Adult ACLS - Cardiac Arrest
            </h1>
            <p className="text-gray-400 text-sm">Patient Age: {patientAge} years | Weight: {weight}kg</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
              title="Defibrillator Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Main Timer Display */}
        <Card className="bg-gray-900 border-gray-700 mb-4">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-white mb-2">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xl text-gray-400 mb-4">
                Total Arrest Time
              </div>
              
              {phase === 'compressions' && (
                <div className="mb-4">
                  <div className="text-4xl font-mono font-bold text-blue-400">
                    {formatTime(cycleTime)}
                  </div>
                  <div className="text-sm text-gray-400">CPR Cycle Time (2 min cycles)</div>
                </div>
              )}

              {/* Phase Display */}
              <div className="flex justify-center mb-4">
                {phase === 'initial_assessment' && (
                  <Badge className="bg-yellow-600 text-white text-lg px-4 py-2">
                    Initial Assessment
                  </Badge>
                )}
                {phase === 'compressions' && (
                  <Badge className="bg-red-600 text-white text-lg px-4 py-2 animate-pulse">
                    CPR IN PROGRESS
                  </Badge>
                )}
                {phase === 'rhythm_check' && (
                  <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
                    Rhythm Check
                  </Badge>
                )}
                {phase === 'charging' && (
                  <Badge className="bg-orange-600 text-white text-lg px-4 py-2">
                    Charging Defibrillator...
                  </Badge>
                )}
                {phase === 'shock_ready' && (
                  <Badge className="bg-purple-600 text-white text-lg px-4 py-2 animate-pulse">
                    SHOCK READY - CLEAR!
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center flex-wrap">
                {phase === 'initial_assessment' && (
                  <Button
                    onClick={startCPR}
                    className="bg-red-600 hover:bg-red-700 text-white text-xl px-8 py-6"
                  >
                    <Play className="h-6 w-6 mr-2" />
                    START CPR
                  </Button>
                )}

                {phase === 'shock_ready' && (
                <Button
                  onClick={deliverShock}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xl px-8 py-6 animate-pulse"
                >
                  <Zap className="h-6 w-6 mr-2" />
                  DELIVER SHOCK ({shockEnergy}J)
                </Button>
                )}

                {isRunning && phase !== 'initial_assessment' && (
                  <>
                    <Button
                      onClick={() => setIsRunning(!isRunning)}
                      variant="outline"
                      className="text-lg px-6 py-4"
                    >
                      {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                      {isRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      onClick={declareROSC}
                      className="bg-green-600 hover:bg-green-700 text-lg px-6 py-4"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      ROSC Achieved
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Medications Panel */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Syringe className="h-5 w-5 text-green-400" />
                Medications
              </h3>
              
              <div className="space-y-2">
                <Button
                  onClick={giveEpinephrine}
                  disabled={!isRunning}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Epinephrine 1mg IV/IO
                  {epiDoses > 0 && <Badge className="ml-2 bg-white text-black">{epiDoses}x</Badge>}
                </Button>
                <p className="text-xs text-gray-400">Give every 3-5 minutes</p>

                {shockCount >= 2 && (
                  <>
                    <Button
                      onClick={giveAmiodarone}
                      disabled={!isRunning || amiodaroneDoses >= 2}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Amiodarone {amiodaroneDoses === 0 ? '300mg' : '150mg'} IV/IO
                      {amiodaroneDoses > 0 && <Badge className="ml-2 bg-white text-black">{amiodaroneDoses}x</Badge>}
                    </Button>
                    <p className="text-xs text-gray-400">
                      First dose: 300mg after 2nd shock. Second dose: 150mg after 4th shock.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-yellow-400" />
                Quick Actions
              </h3>
              
              <div className="space-y-2">
                <Button
                  onClick={() => setShowReversibleCauses(true)}
                  variant="outline"
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reversible Causes (H's & T's)
                </Button>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center p-2 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-white">{shockCount}</div>
                    <div className="text-xs text-gray-400">Shocks</div>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-white">{Math.floor(elapsedTime / 60)}</div>
                    <div className="text-xs text-gray-400">Minutes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Log */}
        <Card className="bg-gray-900 border-gray-700 mt-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Event Log</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 font-mono">{formatTime(event.timestamp)}</span>
                  <span className="text-white">{event.action}</span>
                  {event.details && <span className="text-gray-400">- {event.details}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rhythm Check Dialog */}
        {showRhythmDialog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Rhythm Check</h2>
                <p className="text-gray-300 mb-6">What rhythm do you see on the monitor?</p>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => handleRhythmCheck('vf_vt')}
                    className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    VF / Pulseless VT (Shockable)
                  </Button>
                  <Button
                    onClick={() => handleRhythmCheck('pea')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
                  >
                    PEA (Non-Shockable)
                  </Button>
                  <Button
                    onClick={() => handleRhythmCheck('asystole')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-lg py-6"
                  >
                    Asystole (Non-Shockable)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reversible Causes Overlay */}
        {showReversibleCauses && (
          <div className="fixed inset-0 bg-black/90 overflow-y-auto z-50 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Reversible Causes (H's & T's)</h2>
                <Button variant="outline" onClick={() => setShowReversibleCauses(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* H's */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="text-xl font-bold text-red-400 mb-4">The 5 H's</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white">Hypovolemia</h4>
                        <p className="text-sm text-gray-400">Fluid bolus, blood products if hemorrhage</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Hypoxia</h4>
                        <p className="text-sm text-gray-400">Secure airway, 100% O2, check ETT placement</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Hydrogen ion (Acidosis)</h4>
                        <p className="text-sm text-gray-400">Consider sodium bicarbonate if pH &lt;7.1</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Hypo/Hyperkalemia</h4>
                        <p className="text-sm text-gray-400">Check K+, calcium chloride, insulin/glucose</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Hypothermia</h4>
                        <p className="text-sm text-gray-400">Warm to 32-34°C, consider ECMO if &lt;28°C</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* T's */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="text-xl font-bold text-blue-400 mb-4">The 5 T's</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white">Tension Pneumothorax</h4>
                        <p className="text-sm text-gray-400">Needle decompression, chest tube</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Tamponade (Cardiac)</h4>
                        <p className="text-sm text-gray-400">Pericardiocentesis, consider surgery</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Toxins</h4>
                        <p className="text-sm text-gray-400">Specific antidotes, lipid emulsion therapy</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Thrombosis (Coronary)</h4>
                        <p className="text-sm text-gray-400">Consider PCI, thrombolytics during CPR</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Thrombosis (Pulmonary)</h4>
                        <p className="text-sm text-gray-400">Consider thrombolytics, ECMO</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Post-ROSC Protocol */}
        {showPostROSC && (
          <div className="fixed inset-0 bg-black/90 overflow-y-auto z-50 p-4">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-green-900 border-green-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6" />
                      Post-ROSC Care Protocol
                    </h2>
                    <Button variant="outline" onClick={() => setShowPostROSC(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4 text-white">
                    <div className="bg-gray-900 p-4 rounded">
                      <h3 className="font-semibold mb-2">1. Airway & Ventilation</h3>
                      <ul className="text-sm space-y-1 text-gray-300">
                        <li>• Secure advanced airway if not already done</li>
                        <li>• Target SpO2 92-98% (avoid hyperoxia)</li>
                        <li>• Target EtCO2 35-40 mmHg (avoid hypocapnia)</li>
                        <li>• Obtain chest X-ray</li>
                      </ul>
                    </div>

                    <div className="bg-gray-900 p-4 rounded">
                      <h3 className="font-semibold mb-2">2. Hemodynamics</h3>
                      <ul className="text-sm space-y-1 text-gray-300">
                        <li>• Target SBP ≥90 mmHg (MAP ≥65 mmHg)</li>
                        <li>• Start vasopressor if needed (norepinephrine preferred)</li>
                        <li>• Obtain 12-lead ECG</li>
                        <li>• Consider PCI if STEMI</li>
                      </ul>
                    </div>

                    <div className="bg-gray-900 p-4 rounded">
                      <h3 className="font-semibold mb-2">3. Targeted Temperature Management</h3>
                      <ul className="text-sm space-y-1 text-gray-300">
                        <li>• Maintain normothermia (36-37.5°C)</li>
                        <li>• Avoid hyperthermia (temp &gt;38°C)</li>
                        <li>• Consider TTM 32-36°C if comatose</li>
                      </ul>
                    </div>

                    <div className="bg-gray-900 p-4 rounded">
                      <h3 className="font-semibold mb-2">4. Neurological Care</h3>
                      <ul className="text-sm space-y-1 text-gray-300">
                        <li>• Assess mental status (GCS)</li>
                        <li>• Treat seizures if present</li>
                        <li>• Neuroprognostication after 72 hours</li>
                      </ul>
                    </div>

                    <div className="bg-gray-900 p-4 rounded">
                      <h3 className="font-semibold mb-2">5. Additional Care</h3>
                      <ul className="text-sm space-y-1 text-gray-300">
                        <li>• Treat reversible causes</li>
                        <li>• Glucose control (avoid hypoglycemia)</li>
                        <li>• Transfer to ICU</li>
                        <li>• Debrief team</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Weight Input Dialog */}
        {showWeightDialog && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Patient Weight Required</h2>
                <p className="text-gray-300 mb-6">
                  Adult medication dosing requires actual weight. Please enter the patient's weight.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight" className="text-white">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Typical adult range: 50-120 kg</p>
                  </div>
                  
                  <Button
                    onClick={() => setShowWeightDialog(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={weight < 30 || weight > 300}
                  >
                    Confirm Weight
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Dialog */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Defibrillator Settings</h2>
                  <Button variant="outline" size="icon" onClick={() => setShowSettings(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Defibrillator Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setDefibrillatorType('biphasic')}
                        className={defibrillatorType === 'biphasic' ? 'bg-blue-600' : 'bg-gray-700'}
                      >
                        Biphasic
                        <Badge className="ml-2 bg-white text-black">200J</Badge>
                      </Button>
                      <Button
                        onClick={() => setDefibrillatorType('monophasic')}
                        className={defibrillatorType === 'monophasic' ? 'bg-blue-600' : 'bg-gray-700'}
                      >
                        Monophasic
                        <Badge className="ml-2 bg-white text-black">360J</Badge>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Most modern defibrillators are biphasic. Check your device manual if unsure.
                    </p>
                  </div>

                  <div className="bg-gray-800 p-4 rounded">
                    <h3 className="font-semibold text-white mb-2">Current Settings</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Shock Energy: <span className="text-white font-bold">{shockEnergy}J</span></li>
                      <li>• Device Type: <span className="text-white font-bold">{defibrillatorType}</span></li>
                      <li>• Patient Weight: <span className="text-white font-bold">{weight}kg</span></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
