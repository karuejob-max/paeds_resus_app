import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, Activity, Flame, Droplets, Brain, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  TRAUMA_PRIMARY_SURVEY,
  HEMORRHAGE_INTERVENTIONS,
  HEMORRHAGE_CLASSES,
  calculateParklandFormula,
  calculateTXADose,
  calculateGCS,
  classifyHemorrhage,
  needsBurnResuscitation,
  meetsBurnTransferCriteria,
  calculateTraumaDrugDose,
  type PrimarySurveyStep,
  type HemorrhageClassification,
} from '../../../shared/traumaProtocol';

type TraumaMode = 'setup' | 'primary_survey' | 'hemorrhage' | 'burn' | 'summary';

interface PatientData {
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  mechanism: string;
}

export function TraumaAssessment() {
  const [, setLocation] = useLocation();

  // Swipe gesture: swipe right to go back home
  useSwipeGesture({
    onSwipeRight: () => {
      // Only navigate home if not in setup mode (to avoid accidental exits)
      if (mode !== 'setup') {
        setLocation('/clinical-assessment');
      }
    },
    minSwipeDistance: 80,
  });
  const [mode, setMode] = useState<TraumaMode>('setup');
  const [patientData, setPatientData] = useState<PatientData>({
    ageYears: 0,
    ageMonths: 0,
    weightKg: 0,
  mechanism: '',
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [criticalFindings, setCriticalFindings] = useState<string[]>([]);
  const [interventionsPerformed, setInterventionsPerformed] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // GCS state
  const [gcsEye, setGcsEye] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);

  // Hemorrhage state
  const [hemorrhageClass, setHemorrhageClass] = useState<HemorrhageClassification | null>(null);

  // Burn state
  const [tbsaPercent, setTbsaPercent] = useState(0);
  const [burnDepth, setBurnDepth] = useState<'superficial' | 'partial_thickness' | 'full_thickness'>('partial_thickness');
  const [burnLocations, setBurnLocations] = useState<string[]>([]);
  const [inhalationInjury, setInhalationInjury] = useState(false);
  const [hoursSinceBurn, setHoursSinceBurn] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto-calculate weight from age
  useEffect(() => {
    if (patientData.ageYears > 0 || patientData.ageMonths > 0) {
      const totalMonths = patientData.ageYears * 12 + patientData.ageMonths;
      let estimatedWeight: number;
      if (totalMonths <= 12) {
        estimatedWeight = (totalMonths + 9) / 2;
      } else if (totalMonths <= 60) {
        estimatedWeight = 2 * (patientData.ageYears + 5);
      } else {
        estimatedWeight = 4 * patientData.ageYears;
      }
      setPatientData((prev) => ({ ...prev, weightKg: Math.round(estimatedWeight * 10) / 10 }));
    }
  }, [patientData.ageYears, patientData.ageMonths]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStep = TRAUMA_PRIMARY_SURVEY[currentStepIndex];
  const gcsResult = calculateGCS(gcsEye, gcsVerbal, gcsMotor);

  const handleStartAssessment = () => {
    if (patientData.weightKg > 0) {
      setMode('primary_survey');
      setIsTimerRunning(true);
    }
  };

  const handleCompleteStep = () => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.add(currentStep.id);
      return newSet;
    });
    if (currentStepIndex < TRAUMA_PRIMARY_SURVEY.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setMode('summary');
      setIsTimerRunning(false);
    }
  };

  const handleCriticalFinding = (finding: string) => {
    if (!criticalFindings.includes(finding)) {
      setCriticalFindings((prev) => [...prev, finding]);
    }
  };

  const handleInterventionPerformed = (intervention: string) => {
    if (!interventionsPerformed.includes(intervention)) {
      setInterventionsPerformed((prev) => [...prev, intervention]);
    }
  };

  const renderSetup = () => (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <AlertTriangle className="h-6 w-6" />
            Pediatric Trauma Assessment
          </CardTitle>
          <p className="text-slate-400 text-sm">ATLS-based primary survey with C-spine protection</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Age (Years)</Label>
              <Input
                type="number"
                min="0"
                max="18"
                value={patientData.ageYears}
                onChange={(e) => setPatientData((prev) => ({ ...prev, ageYears: parseInt(e.target.value) || 0 }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Age (Months)</Label>
              <Input
                type="number"
                min="0"
                max="11"
                value={patientData.ageMonths}
                onChange={(e) => setPatientData((prev) => ({ ...prev, ageMonths: parseInt(e.target.value) || 0 }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Weight (kg) - Auto-calculated</Label>
            <Input
              type="number"
              value={patientData.weightKg}
              onChange={(e) => setPatientData((prev) => ({ ...prev, weightKg: parseFloat(e.target.value) || 0 }))}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Mechanism of Injury</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Motor Vehicle', 'Fall', 'Assault', 'Burn', 'Drowning', 'Penetrating'].map((mech) => (
                <Button
                  key={mech}
                  variant={patientData.mechanism === mech ? 'default' : 'outline'}
                  className={patientData.mechanism === mech ? 'bg-orange-600' : 'border-slate-600 text-slate-300'}
                  onClick={() => setPatientData((prev) => ({ ...prev, mechanism: mech }))}
                >
                  {mech}
                </Button>
              ))}
            </div>
          </div>

          {patientData.weightKg > 0 && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="pt-4">
                <p className="text-sm text-slate-400 mb-2">Quick Reference ({patientData.weightKg} kg)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-300">
                    <span className="text-slate-500">Fluid bolus:</span> {Math.round(patientData.weightKg * 20)} mL
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">TXA loading:</span> {Math.min(Math.round(patientData.weightKg * 15), 1000)} mg
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Blood volume:</span> {Math.round(patientData.weightKg * 80)} mL
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Defib:</span> {Math.round(patientData.weightKg * 2)} J
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleStartAssessment}
            disabled={patientData.weightKg <= 0}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6"
          >
            Start Primary Survey <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderPrimarySurvey = () => (
    <div className="space-y-4">
      {/* Timer and Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-400" />
          <span className="text-2xl font-mono text-orange-400">{formatTime(elapsedTime)}</span>
        </div>
        <div className="flex gap-1">
          {TRAUMA_PRIMARY_SURVEY.map((step, idx) => (
            <Badge
              key={step.id}
              variant={completedSteps.has(step.id) ? 'default' : idx === currentStepIndex ? 'outline' : 'secondary'}
              className={
                completedSteps.has(step.id)
                  ? 'bg-green-600'
                  : idx === currentStepIndex
                    ? 'border-orange-500 text-orange-400'
                    : 'bg-slate-700'
              }
            >
              {step.letter}
            </Badge>
          ))}
        </div>
      </div>

      {/* C-Spine Alert */}
      {currentStep.letter === 'A' && (
        <Card className="bg-red-900/30 border-red-500">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">C-SPINE IMMOBILIZATION</span>
            </div>
            <p className="text-sm text-red-300 mt-1">{currentStep.cSpineConsideration}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      <Card className="bg-slate-800/50 border-orange-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-4xl font-bold text-orange-400">{currentStep.letter}</span>
            <span className="text-xl text-white">{currentStep.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assessments */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2">ASSESS:</h4>
            <div className="space-y-2">
              {currentStep.assessments.map((assessment, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-400">•</span>
                  <span>{assessment}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Findings */}
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">CRITICAL FINDINGS (tap if present):</h4>
            <div className="flex flex-wrap gap-2">
              {currentStep.criticalFindings.map((finding, idx) => (
                <Button
                  key={idx}
                  variant={criticalFindings.includes(finding) ? 'destructive' : 'outline'}
                  size="sm"
                  className={criticalFindings.includes(finding) ? '' : 'border-red-500/50 text-red-400'}
                  onClick={() => handleCriticalFinding(finding)}
                >
                  {criticalFindings.includes(finding) && <AlertCircle className="h-4 w-4 mr-1" />}
                  {finding}
                </Button>
              ))}
            </div>
          </div>

          {/* Immediate Interventions */}
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">INTERVENTIONS (tap when performed):</h4>
            <div className="space-y-2">
              {currentStep.immediateInterventions.map((intervention, idx) => (
                <Button
                  key={idx}
                  variant={interventionsPerformed.includes(intervention) ? 'default' : 'outline'}
                  size="sm"
                  className={
                    interventionsPerformed.includes(intervention)
                      ? 'bg-green-600 w-full justify-start'
                      : 'border-green-500/50 text-green-400 w-full justify-start'
                  }
                  onClick={() => handleInterventionPerformed(intervention)}
                >
                  {interventionsPerformed.includes(intervention) ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <span className="h-4 w-4 mr-2 border border-green-500 rounded-full" />
                  )}
                  {intervention}
                </Button>
              ))}
            </div>
          </div>

          {/* GCS Calculator for D step */}
          {currentStep.letter === 'D' && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Glasgow Coma Scale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-slate-400">Eye (1-4)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      value={gcsEye}
                      onChange={(e) => setGcsEye(parseInt(e.target.value) || 1)}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Verbal (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={gcsVerbal}
                      onChange={(e) => setGcsVerbal(parseInt(e.target.value) || 1)}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Motor (1-6)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={gcsMotor}
                      onChange={(e) => setGcsMotor(parseInt(e.target.value) || 1)}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>
                <div className={`p-2 rounded ${gcsResult.airwayNeeded ? 'bg-red-900/50' : 'bg-slate-600'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">GCS: {gcsResult.total}/15</span>
                    {gcsResult.airwayNeeded && (
                      <Badge variant="destructive">INTUBATE</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{gcsResult.interpretation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-4">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="border-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
            )}
            <Button
              onClick={handleCompleteStep}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {currentStepIndex < TRAUMA_PRIMARY_SURVEY.length - 1 ? (
                <>
                  Continue to {TRAUMA_PRIMARY_SURVEY[currentStepIndex + 1].letter}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Complete Survey
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="border-red-500 text-red-400"
          onClick={() => setMode('hemorrhage')}
        >
          <Droplets className="h-4 w-4 mr-2" /> Hemorrhage Control
        </Button>
        <Button
          variant="outline"
          className="border-orange-500 text-orange-400"
          onClick={() => setMode('burn')}
        >
          <Flame className="h-4 w-4 mr-2" /> Burn Calculator
        </Button>
      </div>
    </div>
  );

  const renderHemorrhageControl = () => {
    const txaDose = calculateTXADose(patientData.weightKg);

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setMode('primary_survey')} className="text-slate-400">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Primary Survey
        </Button>

        <Card className="bg-red-900/20 border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Droplets className="h-6 w-6" />
              Hemorrhage Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hemorrhage Classification */}
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Hemorrhage Classification</h4>
              <div className="grid grid-cols-2 gap-2">
                {HEMORRHAGE_CLASSES.map((hClass) => (
                  <Button
                    key={hClass.class}
                    variant={hemorrhageClass?.class === hClass.class ? 'destructive' : 'outline'}
                    className={hemorrhageClass?.class === hClass.class ? '' : 'border-slate-600'}
                    onClick={() => setHemorrhageClass(hClass)}
                  >
                    <div className="text-left">
                      <div className="font-bold">Class {hClass.class}</div>
                      <div className="text-xs">{hClass.bloodLossPercent} blood loss</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {hemorrhageClass && (
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-400">HR:</span> <span className="text-white">{hemorrhageClass.heartRate}</span></div>
                    <div><span className="text-slate-400">BP:</span> <span className="text-white">{hemorrhageClass.bloodPressure}</span></div>
                    <div><span className="text-slate-400">Cap Refill:</span> <span className="text-white">{hemorrhageClass.capRefill}</span></div>
                    <div><span className="text-slate-400">Mental:</span> <span className="text-white">{hemorrhageClass.mentalStatus}</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-600">
                    <span className="text-green-400 font-semibold">Treatment: </span>
                    <span className="text-white">{hemorrhageClass.fluidReplacement}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interventions */}
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Hemorrhage Control Techniques</h4>
              <div className="space-y-2">
                {HEMORRHAGE_INTERVENTIONS.map((intervention) => (
                  <Card key={intervention.id} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-white">{intervention.name}</h5>
                          <p className="text-xs text-slate-400">{intervention.indication}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={interventionsPerformed.includes(intervention.name) ? 'default' : 'outline'}
                          className={interventionsPerformed.includes(intervention.name) ? 'bg-green-600' : 'border-green-500 text-green-400'}
                          onClick={() => handleInterventionPerformed(intervention.name)}
                        >
                          {interventionsPerformed.includes(intervention.name) ? 'Done' : 'Mark Done'}
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-slate-300">
                        {intervention.technique.slice(0, 2).map((step, idx) => (
                          <div key={idx}>• {step}</div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* TXA Dosing */}
            <Card className="bg-blue-900/20 border-blue-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-400">Tranexamic Acid (TXA) - {patientData.weightKg} kg</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Loading dose:</span>
                  <span className="text-white font-mono">{txaDose.loadingDose.mg} mg ({txaDose.loadingDose.mL} mL) IV over 10 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maintenance:</span>
                  <span className="text-white font-mono">{txaDose.maintenanceRate.mgPerHour} mg/hr ({txaDose.maintenanceRate.mLPerHour} mL/hr)</span>
                </div>
                <div className="text-xs text-yellow-400 mt-2">
                  ⚠️ Give within 3 hours of injury. Most effective within 1 hour.
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBurnCalculator = () => {
    const parkland = calculateParklandFormula(patientData.weightKg, tbsaPercent, hoursSinceBurn);
    const needsResus = needsBurnResuscitation(tbsaPercent, patientData.ageYears);
    const transferCriteria = meetsBurnTransferCriteria(
      tbsaPercent,
      burnDepth,
      burnLocations,
      inhalationInjury,
      false,
      'thermal'
    );

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setMode('primary_survey')} className="text-slate-400">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Primary Survey
        </Button>

        <Card className="bg-orange-900/20 border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Flame className="h-6 w-6" />
              Burn Resuscitation Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TBSA Input */}
            <div>
              <Label className="text-slate-300">Total Body Surface Area (TBSA) %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tbsaPercent}
                onChange={(e) => setTbsaPercent(parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white text-2xl text-center"
              />
            </div>

            {/* Burn Depth */}
            <div>
              <Label className="text-slate-300">Burn Depth</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['superficial', 'partial_thickness', 'full_thickness'] as const).map((depth) => (
                  <Button
                    key={depth}
                    variant={burnDepth === depth ? 'default' : 'outline'}
                    className={burnDepth === depth ? 'bg-orange-600' : 'border-slate-600'}
                    onClick={() => setBurnDepth(depth)}
                  >
                    {depth.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Hours Since Burn */}
            <div>
              <Label className="text-slate-300">Hours Since Burn</Label>
              <Input
                type="number"
                min="0"
                max="24"
                value={hoursSinceBurn}
                onChange={(e) => setHoursSinceBurn(parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Inhalation Injury */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inhalationInjury}
                onChange={(e) => setInhalationInjury(e.target.checked)}
                className="h-5 w-5"
              />
              <Label className="text-slate-300">Suspected Inhalation Injury</Label>
            </div>

            {/* Burn Locations */}
            <div>
              <Label className="text-slate-300">Burn Locations (select all)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['Face', 'Hands', 'Feet', 'Genitalia', 'Joints', 'Circumferential'].map((loc) => (
                  <Button
                    key={loc}
                    variant={burnLocations.includes(loc) ? 'default' : 'outline'}
                    size="sm"
                    className={burnLocations.includes(loc) ? 'bg-orange-600' : 'border-slate-600'}
                    onClick={() => {
                      if (burnLocations.includes(loc)) {
                        setBurnLocations((prev) => prev.filter((l) => l !== loc));
                      } else {
                        setBurnLocations((prev) => [...prev, loc]);
                      }
                    }}
                  >
                    {loc}
                  </Button>
                ))}
              </div>
            </div>

            {/* Parkland Formula Results */}
            {tbsaPercent > 0 && (
              <Card className={`${needsResus ? 'bg-red-900/30 border-red-500' : 'bg-slate-700/50 border-slate-600'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="text-white">Parkland Formula ({patientData.weightKg} kg × {tbsaPercent}% TBSA)</span>
                    {needsResus && <Badge variant="destructive">RESUSCITATE</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total 24hr fluid:</span>
                    <span className="text-white font-mono font-bold">{parkland.totalFluid24hr} mL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">First 8 hours rate:</span>
                    <span className="text-green-400 font-mono font-bold">{parkland.firstHalfRate} mL/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next 16 hours rate:</span>
                    <span className="text-white font-mono">{parkland.secondHalfRate} mL/hr</span>
                  </div>
                  <div className="pt-2 border-t border-slate-600">
                    <span className="text-slate-400">Fluid type:</span>
                    <span className="text-white ml-2">{parkland.fluidType}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transfer Criteria */}
            {transferCriteria.shouldTransfer && (
              <Card className="bg-yellow-900/30 border-yellow-500">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    TRANSFER TO BURN CENTER
                  </div>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    {transferCriteria.reasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Monitoring Targets */}
            {needsResus && (
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">Monitoring Targets</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300 space-y-1">
                  {parkland.monitoringTargets.map((target, idx) => (
                    <div key={idx}>• {target}</div>
                  ))}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="space-y-4">
      <Card className="bg-green-900/20 border-green-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            Primary Survey Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-mono text-orange-400">{formatTime(elapsedTime)}</div>
              <div className="text-xs text-slate-400">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{criticalFindings.length}</div>
              <div className="text-xs text-slate-400">Critical Findings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{interventionsPerformed.length}</div>
              <div className="text-xs text-slate-400">Interventions</div>
            </div>
          </div>

          {criticalFindings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-2">Critical Findings:</h4>
              <div className="flex flex-wrap gap-2">
                {criticalFindings.map((finding, idx) => (
                  <Badge key={idx} variant="destructive">{finding}</Badge>
                ))}
              </div>
            </div>
          )}

          {interventionsPerformed.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">Interventions Performed:</h4>
              <div className="flex flex-wrap gap-2">
                {interventionsPerformed.map((intervention, idx) => (
                  <Badge key={idx} className="bg-green-600">{intervention}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setMode('setup');
                setCurrentStepIndex(0);
                setCompletedSteps(new Set());
                setCriticalFindings([]);
                setInterventionsPerformed([]);
                setElapsedTime(0);
              }}
              className="flex-1 border-slate-600"
            >
              New Assessment
            </Button>
            <Button
              onClick={() => setLocation('/')}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation('/clinical-assessment')} className="text-slate-400">
            <ArrowLeft className="h-4 w-4 mr-2" /> Home
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-400" />
            <span className="font-semibold">Trauma</span>
          </div>
        </div>

        {/* Content */}
        {mode === 'setup' && renderSetup()}
        {mode === 'primary_survey' && renderPrimarySurvey()}
        {mode === 'hemorrhage' && renderHemorrhageControl()}
        {mode === 'burn' && renderBurnCalculator()}
        {mode === 'summary' && renderSummary()}
      </div>
    </div>
  );
}
