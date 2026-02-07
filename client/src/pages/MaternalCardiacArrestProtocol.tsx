import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Heart, X, Clock, Activity } from "lucide-react";

interface MaternalCardiacArrestProtocolProps {
  patientAge: number;
  patientWeight: number;
  gestationalAge?: number; // weeks
  onClose: () => void;
}

export default function MaternalCardiacArrestProtocol({
  patientAge,
  patientWeight,
  gestationalAge = 20,
  onClose,
}: MaternalCardiacArrestProtocolProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStage, setCurrentStage] = useState<
    | "positioning"
    | "cpr"
    | "perimortem_cs"
    | "post_rosc"
  >("positioning");
  const [leftDisplacementDone, setLeftDisplacementDone] = useState(false);
  const [cprStarted, setCprStarted] = useState(false);
  const [csDecisionMade, setCSDecisionMade] = useState(false);

  // Timer
  useEffect(() => {
    if (cprStarted) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cprStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimingBadge = () => {
    if (elapsedTime < 240) {
      return <Badge className="bg-green-600">Within 4-min Window</Badge>;
    } else if (elapsedTime < 300) {
      return <Badge className="bg-orange-600">Approaching 5-min Limit</Badge>;
    } else {
      return <Badge className="bg-red-600">Perimortem CS Overdue</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="container max-w-4xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Maternal Cardiac Arrest
            </h1>
            <p className="text-gray-400 text-sm">
              Gestational Age: {gestationalAge} weeks | Weight: {patientWeight} kg
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Timer and Status */}
        {cprStarted && (
          <Card className="mb-4 bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-3xl font-bold text-white">{formatTime(elapsedTime)}</p>
                    <p className="text-sm text-gray-400">Time Since Arrest</p>
                  </div>
                </div>
                {gestationalAge >= 20 && getTimingBadge()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Critical Alert */}
        <Card className="mb-4 bg-red-900/30 border-red-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-red-100 font-bold mb-2">Pregnancy-Specific ACLS Modifications:</p>
                <p className="text-red-200 text-sm mb-1">• LEFT UTERINE DISPLACEMENT (manual or wedge) - MANDATORY</p>
                <p className="text-red-200 text-sm mb-1">• Perimortem cesarean section if ≥20 weeks AND no ROSC in 4 minutes</p>
                <p className="text-red-200 text-sm mb-1">• Standard ACLS drugs and doses (NO dose adjustments for pregnancy)</p>
                <p className="text-red-200 text-sm">• Consider pregnancy-specific reversible causes (H's & T's)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage 1: Positioning and Left Uterine Displacement */}
        {currentStage === "positioning" && (
          <Card className="mb-4 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Stage 1: Positioning & Left Uterine Displacement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                <p className="text-blue-100 font-bold mb-2">LEFT UTERINE DISPLACEMENT (Choose One Method):</p>
                <p className="text-blue-200 text-sm mb-1"><strong>Method 1 - Manual Displacement:</strong> Assistant places hands on right side of uterus and pushes leftward</p>
                <p className="text-blue-200 text-sm mb-1"><strong>Method 2 - Left Lateral Tilt:</strong> Place 15-30° wedge under right hip/back</p>
                <p className="text-blue-200 text-sm"><strong>Goal:</strong> Relieve aortocaval compression, improve venous return</p>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                <p className="text-yellow-100 font-semibold mb-2">Why This Matters:</p>
                <p className="text-yellow-200 text-sm mb-1">• Gravid uterus (≥20 weeks) compresses inferior vena cava when supine</p>
                <p className="text-yellow-200 text-sm mb-1">• Reduces venous return by up to 30%, decreasing cardiac output</p>
                <p className="text-yellow-200 text-sm">• Left displacement MUST be maintained throughout resuscitation</p>
              </div>

              <Button
                onClick={() => {
                  setLeftDisplacementDone(true);
                  setCurrentStage("cpr");
                  setCprStarted(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Left Displacement Complete - Start CPR
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 2: Standard ACLS with Pregnancy Modifications */}
        {currentStage === "cpr" && (
          <Card className="mb-4 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Stage 2: Modified ACLS Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                <p className="text-green-100 font-bold mb-2">Standard ACLS Algorithm:</p>
                <p className="text-green-200 text-sm mb-1">• High-quality CPR (100-120/min, 2-2.4 inch depth)</p>
                <p className="text-green-200 text-sm mb-1">• Epinephrine 1 mg IV every 3-5 minutes</p>
                <p className="text-green-200 text-sm mb-1">• Defibrillation 200J biphasic for shockable rhythms</p>
                <p className="text-green-200 text-sm mb-1">• Amiodarone 300mg IV for VF/pVT (then 150mg)</p>
                <p className="text-green-200 text-sm">• Advanced airway (ETT size 7.0-7.5mm)</p>
              </div>

              <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                <p className="text-purple-100 font-bold mb-2">Pregnancy-Specific Reversible Causes (H's & T's):</p>
                <p className="text-purple-200 text-sm mb-1"><strong>Hemorrhage:</strong> Postpartum hemorrhage, placental abruption, uterine rupture</p>
                <p className="text-purple-200 text-sm mb-1"><strong>Hypertension:</strong> Eclampsia, intracranial hemorrhage</p>
                <p className="text-purple-200 text-sm mb-1"><strong>Thromboembolism:</strong> Pulmonary embolism (consider tPA), amniotic fluid embolism</p>
                <p className="text-purple-200 text-sm mb-1"><strong>Toxins:</strong> Magnesium toxicity (give calcium gluconate 1g IV)</p>
                <p className="text-purple-200 text-sm"><strong>Tension pneumothorax:</strong> From positive pressure ventilation</p>
              </div>

              {gestationalAge >= 20 && elapsedTime >= 240 && !csDecisionMade && (
                <div className="bg-red-900/30 border border-red-700 p-4 rounded animate-pulse">
                  <p className="text-red-100 font-bold mb-2">⚠️ 4 MINUTES ELAPSED - PERIMORTEM CS DECISION REQUIRED</p>
                  <p className="text-red-200 text-sm mb-3">No ROSC achieved. Proceed with perimortem cesarean section to improve maternal resuscitation chances and potentially save fetus.</p>
                  <Button
                    onClick={() => {
                      setCSDecisionMade(true);
                      setCurrentStage("perimortem_cs");
                    }}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    Proceed to Perimortem Cesarean Section
                  </Button>
                </div>
              )}

              {gestationalAge >= 20 && elapsedTime < 240 && (
                <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                  <p className="text-orange-100 font-semibold mb-2">Perimortem CS Timing:</p>
                  <p className="text-orange-200 text-sm mb-1">• Decision to deliver: 4 minutes from arrest</p>
                  <p className="text-orange-200 text-sm mb-1">• Delivery completed: 5 minutes from arrest</p>
                  <p className="text-orange-200 text-sm">• Goal: Improve maternal hemodynamics and potentially save fetus</p>
                </div>
              )}

              <Button
                onClick={() => setCurrentStage("post_rosc")}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                ROSC Achieved - Post-Resuscitation Care
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 3: Perimortem Cesarean Section */}
        {currentStage === "perimortem_cs" && (
          <Card className="mb-4 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Stage 3: Perimortem Cesarean Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-bold mb-2">Perimortem CS Protocol:</p>
                <p className="text-red-200 text-sm mb-1">• Performed AT THE BEDSIDE (do NOT transport to OR)</p>
                <p className="text-red-200 text-sm mb-1">• Continue CPR throughout procedure</p>
                <p className="text-red-200 text-sm mb-1">• Vertical midline incision (fastest approach)</p>
                <p className="text-red-200 text-sm mb-1">• Deliver fetus within 5 minutes of arrest</p>
                <p className="text-red-200 text-sm">• NO anesthesia required (patient in cardiac arrest)</p>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                <p className="text-yellow-100 font-semibold mb-2">Rationale:</p>
                <p className="text-yellow-200 text-sm mb-1">• Relieves aortocaval compression completely</p>
                <p className="text-yellow-200 text-sm mb-1">• Improves maternal venous return by 60-70%</p>
                <p className="text-yellow-200 text-sm mb-1">• Increases chest compression effectiveness</p>
                <p className="text-yellow-200 text-sm">• Fetal survival possible if delivered within 5 minutes</p>
              </div>

              <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                <p className="text-green-100 font-semibold mb-2">Post-Delivery Actions:</p>
                <p className="text-green-200 text-sm mb-1">• Continue ACLS protocol</p>
                <p className="text-green-200 text-sm mb-1">• Administer uterotonics (oxytocin 10 units IM/IV)</p>
                <p className="text-green-200 text-sm mb-1">• Neonatal team resuscitates infant</p>
                <p className="text-green-200 text-sm">• Reassess maternal hemodynamics (often improves dramatically)</p>
              </div>

              <Button
                onClick={() => setCurrentStage("post_rosc")}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                ROSC Achieved - Post-Resuscitation Care
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 4: Post-ROSC Care */}
        {currentStage === "post_rosc" && (
          <Card className="mb-4 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Stage 4: Post-Resuscitation Care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                <p className="text-green-100 font-bold mb-2">Immediate Post-ROSC Actions:</p>
                <p className="text-green-200 text-sm mb-1">• Maintain left uterine displacement until delivery</p>
                <p className="text-green-200 text-sm mb-1">• Target MAP ≥65 mmHg with vasopressors if needed</p>
                <p className="text-green-200 text-sm mb-1">• Avoid hypoxia (SpO2 ≥94%) and hyperoxia (SpO2 ≤98%)</p>
                <p className="text-green-200 text-sm mb-1">• Targeted temperature management (36°C)</p>
                <p className="text-green-200 text-sm">• 12-lead ECG, labs (ABG, lactate, troponin, coags)</p>
              </div>

              <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                <p className="text-purple-100 font-semibold mb-2">Obstetric Considerations:</p>
                <p className="text-purple-200 text-sm mb-1">• Continuous fetal monitoring if fetus in utero</p>
                <p className="text-purple-200 text-sm mb-1">• Obstetric consult for delivery timing</p>
                <p className="text-purple-200 text-sm mb-1">• Check for uterine rupture, placental abruption</p>
                <p className="text-purple-200 text-sm">• Postpartum hemorrhage monitoring</p>
              </div>

              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                <p className="text-blue-100 font-semibold mb-2">ICU Transfer Checklist:</p>
                <p className="text-blue-200 text-sm mb-1">• Mechanical ventilation with lung-protective settings</p>
                <p className="text-blue-200 text-sm mb-1">• Continuous hemodynamic monitoring</p>
                <p className="text-blue-200 text-sm mb-1">• Neurological assessment (GCS, pupils)</p>
                <p className="text-blue-200 text-sm">• Multidisciplinary team (ICU, OB/GYN, Cardiology)</p>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gray-600 hover:bg-gray-700"
                size="lg"
              >
                Close Protocol
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
