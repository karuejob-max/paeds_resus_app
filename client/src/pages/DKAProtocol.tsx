/**
 * DKA (Diabetic Ketoacidosis) Protocol
 * 
 * Clinical workflow aligned with ISPAD 2022 guidelines:
 * 1. Severity assessment (mild/moderate/severe based on pH and mental status)
 * 2. Fluid resuscitation (deficit + maintenance + ongoing losses over 48h)
 * 3. Insulin infusion (0.05-0.1 units/kg/hr, NO bolus)
 * 4. Electrolyte monitoring and replacement (especially potassium)
 * 5. Cerebral edema surveillance and management
 * 6. Glucose monitoring (target 150-250 mg/dL)
 * 7. Resolution criteria (pH >7.3, HCO3 >15, anion gap <12)
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
  Brain,
  Heart
} from 'lucide-react';

interface Props {
  patientAge?: number; // in years
  patientWeight?: number; // in kg
  onClose?: () => void;
}

type DKAStage = 
  | 'assessment'
  | 'fluid_resuscitation'
  | 'insulin_therapy'
  | 'electrolyte_monitoring'
  | 'ongoing_management';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

export default function DKAProtocol({ patientAge: propAge, patientWeight: propWeight, onClose }: Props = {}) {
  // Patient data
  const [patientWeight, setPatientWeight] = useState<number>(propWeight || 20);
  const [patientAge, setPatientAge] = useState<number>(propAge || 10);
  
  // Clinical state
  const [currentStage, setCurrentStage] = useState<DKAStage>('assessment');
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);
  const [dehydrationPercent, setDehydrationPercent] = useState<number>(5);
  const [pH, setPH] = useState<number>(7.2);
  const [glucose, setGlucose] = useState<number>(400);
  const [potassium, setPotassium] = useState<number>(3.5);
  
  // Treatment tracking
  const [fluidGiven, setFluidGiven] = useState<number>(0);
  const [insulinStarted, setInsulinStarted] = useState(false);
  const [hoursSinceStart, setHoursSinceStart] = useState<number>(0);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());

  // Calculate fluid requirements
  const fluidDeficit = (dehydrationPercent / 100) * patientWeight * 1000; // mL
  const maintenanceFluid = patientWeight <= 10 ? patientWeight * 100 : 
                          patientWeight <= 20 ? 1000 + (patientWeight - 10) * 50 :
                          1500 + (patientWeight - 20) * 20; // mL/24h
  const totalFluidNeeded = fluidDeficit + maintenanceFluid;
  const fluidRate = totalFluidNeeded / 48; // mL/hr over 48 hours

  // Calculate insulin dose
  const insulinRate = 0.1 * patientWeight; // units/hr (0.1 units/kg/hr)

  // Determine severity
  useEffect(() => {
    if (pH >= 7.3) {
      setSeverity('mild');
    } else if (pH >= 7.2) {
      setSeverity('moderate');
    } else {
      setSeverity('severe');
    }
  }, [pH]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60 / 60);
      setHoursSinceStart(elapsed);
    }, 60000); // Update every minute

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
      mild: 'bg-yellow-600',
      moderate: 'bg-orange-600',
      severe: 'bg-red-600',
    };
    return (
      <Badge className={`${colors[severity]} text-white`}>
        {severity.toUpperCase()} DKA
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Droplet className="h-6 w-6 text-blue-500" />
              DKA Protocol (ISPAD 2022)
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">
                Patient: {patientAge}y, {patientWeight}kg | Time: {hoursSinceStart}h
              </p>
              {getSeverityBadge()}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Stage Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'assessment', label: 'Assessment', icon: Activity },
            { id: 'fluid_resuscitation', label: 'Fluids', icon: Droplet },
            { id: 'insulin_therapy', label: 'Insulin', icon: Syringe },
            { id: 'electrolyte_monitoring', label: 'Electrolytes', icon: Heart },
            { id: 'ongoing_management', label: 'Management', icon: CheckCircle2 },
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <Button
                key={stage.id}
                onClick={() => setCurrentStage(stage.id as DKAStage)}
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
                <CardTitle className="text-white">Initial Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">pH</Label>
                    <Input
                      type="number"
                      value={pH}
                      onChange={(e) => setPH(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="0.01"
                      min="6.8"
                      max="7.4"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Glucose (mg/dL)</Label>
                    <Input
                      type="number"
                      value={glucose}
                      onChange={(e) => setGlucose(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="10"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Dehydration (%)</Label>
                    <Input
                      type="number"
                      value={dehydrationPercent}
                      onChange={(e) => setDehydrationPercent(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="1"
                      min="0"
                      max="15"
                    />
                    <p className="text-xs text-gray-400 mt-1">Typical: 5-10%</p>
                  </div>
                  <div>
                    <Label className="text-white">Potassium (mmol/L)</Label>
                    <Input
                      type="number"
                      value={potassium}
                      onChange={(e) => setPotassium(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">DKA Severity Classification</h3>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• <strong>Mild:</strong> pH 7.2-7.3, HCO3 10-15</li>
                    <li>• <strong>Moderate:</strong> pH 7.1-7.2, HCO3 5-10</li>
                    <li>• <strong>Severe:</strong> pH &lt;7.1, HCO3 &lt;5</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setCurrentStage('fluid_resuscitation')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Fluid Resuscitation
                </Button>
              </CardContent>
            </Card>

            {/* Cerebral Edema Warning */}
            <Card className="bg-red-900/30 border-red-700">
              <CardHeader>
                <CardTitle className="text-red-200 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Cerebral Edema Warning Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-red-100 space-y-2">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Headache, vomiting, altered mental status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Bradycardia, hypertension, decreased O2 saturation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Specific neurologic signs (cranial nerve palsy, pupillary changes)</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-red-800 rounded">
                  <p className="text-white font-semibold">If cerebral edema suspected:</p>
                  <ul className="text-sm text-red-100 mt-2 space-y-1">
                    <li>1. Reduce IV fluids by 1/3</li>
                    <li>2. Give 3% NaCl 2-5 mL/kg over 10-15 min OR Mannitol 0.5-1 g/kg</li>
                    <li>3. Elevate head of bed 30°</li>
                    <li>4. Notify ICU immediately</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fluid Resuscitation Stage */}
        {currentStage === 'fluid_resuscitation' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fluid Resuscitation Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-sm">Fluid Deficit</p>
                    <p className="text-2xl font-bold text-white">{fluidDeficit.toFixed(0)} mL</p>
                    <p className="text-xs text-gray-500">({dehydrationPercent}% × {patientWeight}kg)</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <p className="text-gray-400 text-sm">Maintenance (24h)</p>
                    <p className="text-2xl font-bold text-white">{maintenanceFluid.toFixed(0)} mL</p>
                    <p className="text-xs text-gray-500">({(maintenanceFluid/24).toFixed(1)} mL/hr)</p>
                  </div>
                  <div className="bg-blue-800 p-4 rounded col-span-2">
                    <p className="text-blue-200 text-sm">Total Fluid Over 48h</p>
                    <p className="text-3xl font-bold text-white">{totalFluidNeeded.toFixed(0)} mL</p>
                    <p className="text-lg text-blue-100 mt-1">Rate: {fluidRate.toFixed(1)} mL/hr</p>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Fluid Protocol
                  </h3>
                  <ul className="text-sm text-yellow-100 space-y-2">
                    <li>• <strong>Initial bolus:</strong> 10 mL/kg 0.9% NaCl over 1h (if shocked)</li>
                    <li>• <strong>Maintenance fluid:</strong> 0.9% NaCl (or 0.45% NaCl after initial rehydration)</li>
                    <li>• <strong>Add potassium:</strong> 20-40 mEq/L once urine output confirmed and K+ &lt;5.5</li>
                    <li>• <strong>Switch to D5 fluids:</strong> When glucose &lt;250 mg/dL</li>
                    <li>• <strong>Avoid rapid correction:</strong> Replace deficit over 48 hours</li>
                  </ul>
                </div>

                <div>
                  <Label className="text-white">Fluid Given So Far (mL)</Label>
                  <Input
                    type="number"
                    value={fluidGiven}
                    onChange={(e) => setFluidGiven(Number(e.target.value))}
                    className="bg-gray-800 border-gray-600 text-white"
                    step="100"
                  />
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${Math.min((fluidGiven / totalFluidNeeded) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {((fluidGiven / totalFluidNeeded) * 100).toFixed(1)}% of total fluid given
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStage('insulin_therapy')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Insulin Therapy
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insulin Therapy Stage */}
        {currentStage === 'insulin_therapy' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Insulin Infusion Protocol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    CRITICAL: NO INSULIN BOLUS
                  </h3>
                  <p className="text-red-100 text-sm">
                    Do NOT give insulin bolus in pediatric DKA. Start continuous infusion only.
                  </p>
                </div>

                <div className="bg-blue-800 p-6 rounded text-center">
                  <p className="text-blue-200 text-sm mb-2">Recommended Insulin Infusion Rate</p>
                  <p className="text-4xl font-bold text-white">{insulinRate.toFixed(2)} units/hr</p>
                  <p className="text-blue-100 mt-2">0.1 units/kg/hr × {patientWeight}kg</p>
                </div>

                <div className="bg-gray-800 p-4 rounded space-y-3">
                  <h3 className="font-semibold text-white">Insulin Preparation</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>• Mix 50 units regular insulin in 500 mL 0.9% NaCl (0.1 units/mL)</p>
                    <p>• Prime tubing with 20 mL solution (insulin binds to plastic)</p>
                    <p>• Use dedicated IV line with pump</p>
                    <p>• Start infusion at {insulinRate.toFixed(2)} units/hr = {(insulinRate * 10).toFixed(1)} mL/hr</p>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">Insulin Adjustment Guidelines</h3>
                  <ul className="text-sm text-yellow-100 space-y-2">
                    <li>• <strong>Target glucose drop:</strong> 50-100 mg/dL per hour</li>
                    <li>• <strong>If glucose drops too fast:</strong> Increase dextrose in IV fluids</li>
                    <li>• <strong>Do NOT decrease insulin:</strong> Needed to clear ketones</li>
                    <li>• <strong>Minimum rate:</strong> 0.05 units/kg/hr (never stop until DKA resolved)</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="insulin-started"
                    checked={insulinStarted}
                    onChange={(e) => setInsulinStarted(e.target.checked)}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="insulin-started" className="text-white">
                    Insulin infusion started at {insulinRate.toFixed(2)} units/hr
                  </Label>
                </div>

                <Button
                  onClick={() => setCurrentStage('electrolyte_monitoring')}
                  disabled={!insulinStarted}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Electrolyte Monitoring
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Electrolyte Monitoring Stage */}
        {currentStage === 'electrolyte_monitoring' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Electrolyte Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Current Potassium Level</h3>
                  <Input
                    type="number"
                    value={potassium}
                    onChange={(e) => setPotassium(Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white text-2xl h-14"
                    step="0.1"
                  />
                  <p className="text-gray-400 text-sm mt-2">mmol/L (Normal: 3.5-5.0)</p>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <h3 className="font-semibold text-blue-200 mb-2">Potassium Replacement Protocol</h3>
                  <ul className="text-sm text-blue-100 space-y-2">
                    <li>• <strong>K+ &lt;3.0:</strong> Hold insulin, give 0.5 mEq/kg/hr until &gt;3.0</li>
                    <li>• <strong>K+ 3.0-3.5:</strong> Add 40 mEq/L to IV fluids</li>
                    <li>• <strong>K+ 3.5-5.0:</strong> Add 20-40 mEq/L to IV fluids</li>
                    <li>• <strong>K+ &gt;5.5:</strong> Hold potassium supplementation</li>
                    <li>• <strong>Monitor:</strong> Check K+ every 2-4 hours</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-white">Monitoring Checklist</h3>
                  {[
                    { id: 'glucose-1h', label: 'Glucose every 1 hour' },
                    { id: 'electrolytes-2h', label: 'Electrolytes (Na, K, Cl, HCO3) every 2-4 hours' },
                    { id: 'vitals-1h', label: 'Vital signs every 1 hour' },
                    { id: 'neuro-1h', label: 'Neurological assessment every 1 hour' },
                    { id: 'urine-output', label: 'Urine output monitoring (catheter if needed)' },
                    { id: 'cardiac-monitor', label: 'Continuous cardiac monitoring' },
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
                <CardTitle className="text-white">Ongoing Management & Resolution Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                  <h3 className="font-semibold text-green-200 mb-2">DKA Resolution Criteria (ALL must be met)</h3>
                  <ul className="text-sm text-green-100 space-y-2">
                    <li>• pH &gt;7.3</li>
                    <li>• Bicarbonate &gt;15 mmol/L</li>
                    <li>• Anion gap &lt;12</li>
                    <li>• Patient able to tolerate oral intake</li>
                  </ul>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-3">Transition to Subcutaneous Insulin</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>1. Give first SC insulin dose</li>
                    <li>2. Continue IV insulin for 1-2 hours after SC dose</li>
                    <li>3. Then discontinue IV insulin</li>
                    <li>4. Start regular meals and snacks</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <h3 className="font-semibold text-yellow-200 mb-2">Common Pitfalls to Avoid</h3>
                  <ul className="text-sm text-yellow-100 space-y-2">
                    <li>• <strong>Insulin bolus:</strong> Never give in pediatric DKA</li>
                    <li>• <strong>Rapid fluid correction:</strong> Increases cerebral edema risk</li>
                    <li>• <strong>Stopping insulin too early:</strong> Continue until ketones clear</li>
                    <li>• <strong>Inadequate K+ replacement:</strong> Monitor and replace aggressively</li>
                    <li>• <strong>Bicarbonate administration:</strong> Not recommended (increases cerebral edema risk)</li>
                  </ul>
                </div>

                <div className="bg-blue-800 p-4 rounded">
                  <h3 className="font-semibold text-white mb-2">Discharge Planning</h3>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• Diabetes education (insulin administration, glucose monitoring)</li>
                    <li>• Sick day management plan</li>
                    <li>• Follow-up with endocrinology</li>
                    <li>• Psychological support referral</li>
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
