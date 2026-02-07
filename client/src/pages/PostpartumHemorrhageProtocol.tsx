import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, Heart, Syringe, Activity, CheckCircle2, Clock, Droplet } from 'lucide-react';

interface PostpartumHemorrhageProtocolProps {
  onClose: () => void;
}

type Stage = 'assessment' | 'initial_management' | 'uterotonics' | 'advanced' | 'surgical';

export default function PostpartumHemorrhageProtocol({ onClose }: PostpartumHemorrhageProtocolProps) {
  const [stage, setStage] = useState<Stage>('assessment');
  const [startTime] = useState(Date.now());
  const [minutesSinceStart, setMinutesSinceStart] = useState(0);
  
  // Blood loss tracking
  const [estimatedBloodLoss, setEstimatedBloodLoss] = useState(500);
  
  // Uterotonic tracking
  const [oxytocinGiven, setOxytocinGiven] = useState(false);
  const [misoprostolGiven, setMisoprostolGiven] = useState(false);
  const [ergometrineGiven, setErgometrineGiven] = useState(false);
  const [tranexamicAcidGiven, setTranexamicAcidGiven] = useState(false);
  
  // Interventions tracking
  const [uterineMassageStarted, setUterineMassageStarted] = useState(false);
  const [bladderEmptied, setBladderEmptied] = useState(false);
  const [ivAccessEstablished, setIvAccessEstablished] = useState(false);
  const [fluidResuscStarted, setFluidResuscStarted] = useState(false);
  
  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesSinceStart(Math.floor((Date.now() - startTime) / 60000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  const getSeverityBadge = () => {
    if (estimatedBloodLoss < 500) {
      return <Badge className="bg-green-600">Normal</Badge>;
    } else if (estimatedBloodLoss < 1000) {
      return <Badge className="bg-yellow-600">PPH (500-1000 mL)</Badge>;
    } else if (estimatedBloodLoss < 1500) {
      return <Badge className="bg-orange-600">Severe PPH (1000-1500 mL)</Badge>;
    } else {
      return <Badge className="bg-red-600">Life-Threatening PPH (&gt;1500 mL)</Badge>;
    }
  };
  
  const getStageIcon = (stageId: Stage) => {
    const icons = {
      assessment: Activity,
      initial_management: Heart,
      uterotonics: Syringe,
      advanced: AlertTriangle,
      surgical: CheckCircle2
    };
    return icons[stageId];
  };
  
  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Droplet className="h-6 w-6 text-red-500" />
              Postpartum Hemorrhage Protocol
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">
                Time: {minutesSinceStart} min | Est. Blood Loss: {estimatedBloodLoss} mL
              </p>
              {getSeverityBadge()}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        
        {/* Critical Time Alert */}
        {minutesSinceStart >= 20 && !tranexamicAcidGiven && (
          <Card className="bg-red-900/30 border-red-700 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-lg">TRANEXAMIC ACID WINDOW CLOSING</p>
                  <p className="text-red-200 text-sm">Tranexamic acid is most effective within 3 hours of delivery. Give 1g IV over 10 minutes NOW.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stage Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'assessment', label: 'Assessment', icon: Activity },
            { id: 'initial_management', label: 'Initial Mgmt', icon: Heart },
            { id: 'uterotonics', label: 'Uterotonics', icon: Syringe },
            { id: 'advanced', label: 'Advanced', icon: AlertTriangle },
            { id: 'surgical', label: 'Surgical', icon: CheckCircle2 }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={stage === id ? 'default' : 'outline'}
              onClick={() => setStage(id as Stage)}
              className="flex-shrink-0"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
        
        {/* Assessment Stage */}
        {stage === 'assessment' && (
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  PPH Assessment & Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-100 font-semibold mb-2">WHO Definition of PPH:</p>
                  <p className="text-red-200 text-sm mb-1">• Blood loss ≥500 mL after vaginal delivery</p>
                  <p className="text-red-200 text-sm mb-1">• Blood loss ≥1000 mL after cesarean section</p>
                  <p className="text-red-200 text-sm">• ANY blood loss with signs of hypovolemia</p>
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Estimated Blood Loss (mL):</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={estimatedBloodLoss}
                      onChange={(e) => setEstimatedBloodLoss(parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded text-white"
                      min="0"
                    />
                    <Button onClick={() => setEstimatedBloodLoss(estimatedBloodLoss + 100)}>
                      +100 mL
                    </Button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Tip: 1 soaked pad ≈ 100 mL, 1 full kidney basin ≈ 500 mL
                  </p>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <p className="text-yellow-100 font-semibold mb-2">4 T's of PPH (Causes):</p>
                  <p className="text-yellow-200 text-sm mb-1">• <strong>Tone</strong> (70%): Uterine atony - soft, boggy uterus</p>
                  <p className="text-yellow-200 text-sm mb-1">• <strong>Trauma</strong> (20%): Lacerations, uterine rupture, inversion</p>
                  <p className="text-yellow-200 text-sm mb-1">• <strong>Tissue</strong> (10%): Retained placenta, clots</p>
                  <p className="text-yellow-200 text-sm">• <strong>Thrombin</strong> (&lt;1%): Coagulopathy</p>
                </div>
                
                <Button 
                  onClick={() => setStage('initial_management')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Proceed to Initial Management
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Initial Management Stage */}
        {stage === 'initial_management' && (
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  Initial Management (First 5 Minutes)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-100 font-bold text-lg mb-2">CALL FOR HELP</p>
                  <p className="text-red-200 text-sm">Activate obstetric emergency team, anesthesia, blood bank</p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => setUterineMassageStarted(true)}
                    variant={uterineMassageStarted ? 'outline' : 'default'}
                    className="w-full justify-start"
                    size="lg"
                  >
                    {uterineMassageStarted && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                    1. START UTERINE MASSAGE (Bimanual if needed)
                  </Button>
                  <p className="text-gray-400 text-sm ml-4">
                    Massage fundus with one hand on abdomen, other hand in vagina if atony persists
                  </p>
                  
                  <Button
                    onClick={() => setBladderEmptied(true)}
                    variant={bladderEmptied ? 'outline' : 'default'}
                    className="w-full justify-start"
                    size="lg"
                  >
                    {bladderEmptied && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                    2. EMPTY BLADDER (Catheterize)
                  </Button>
                  <p className="text-gray-400 text-sm ml-4">
                    Full bladder prevents uterine contraction
                  </p>
                  
                  <Button
                    onClick={() => setIvAccessEstablished(true)}
                    variant={ivAccessEstablished ? 'outline' : 'default'}
                    className="w-full justify-start"
                    size="lg"
                  >
                    {ivAccessEstablished && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                    3. ESTABLISH 2 LARGE-BORE IV LINES (14-16G)
                  </Button>
                  
                  <Button
                    onClick={() => setFluidResuscStarted(true)}
                    variant={fluidResuscStarted ? 'outline' : 'default'}
                    className="w-full justify-start"
                    size="lg"
                  >
                    {fluidResuscStarted && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                    4. START FLUID RESUSCITATION (Crystalloid wide open)
                  </Button>
                  <p className="text-gray-400 text-sm ml-4">
                    Normal saline or Ringer's lactate. Type & crossmatch for 4 units PRBCs
                  </p>
                </div>
                
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <p className="text-blue-100 font-semibold mb-2">Labs to Send:</p>
                  <p className="text-blue-200 text-sm">CBC, Type & Screen, Coags (PT/PTT/INR), Fibrinogen, Blood gas</p>
                </div>
                
                <Button 
                  onClick={() => setStage('uterotonics')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  disabled={!uterineMassageStarted || !ivAccessEstablished}
                >
                  Proceed to Uterotonic Medications
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Uterotonics Stage */}
        {stage === 'uterotonics' && (
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-purple-400" />
                  Uterotonic Medications (Sequential)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-100 font-bold mb-2">FIRST-LINE: Oxytocin</p>
                  <p className="text-red-200 text-sm mb-2">
                    <strong>10 units IM</strong> (preferred) OR <strong>20-40 units in 1L crystalloid IV</strong> at 150-200 mL/hr
                  </p>
                  <p className="text-red-300 text-xs">
                    ⚠️ DO NOT give oxytocin as IV bolus (causes hypotension, cardiac arrest)
                  </p>
                  <Button
                    onClick={() => setOxytocinGiven(true)}
                    variant={oxytocinGiven ? 'outline' : 'default'}
                    className="w-full mt-2"
                  >
                    {oxytocinGiven && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                    Oxytocin Given
                  </Button>
                </div>
                
                {oxytocinGiven && (
                  <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                    <p className="text-orange-100 font-bold mb-2">SECOND-LINE: Misoprostol</p>
                    <p className="text-orange-200 text-sm mb-2">
                      <strong>800 mcg sublingual</strong> (4 tablets of 200 mcg)
                    </p>
                    <p className="text-orange-300 text-xs mb-2">
                      Side effects: Fever, shivering (common and benign)
                    </p>
                    <Button
                      onClick={() => setMisoprostolGiven(true)}
                      variant={misoprostolGiven ? 'outline' : 'default'}
                      className="w-full"
                    >
                      {misoprostolGiven && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                      Misoprostol 800 mcg Given
                    </Button>
                  </div>
                )}
                
                {misoprostolGiven && (
                  <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                    <p className="text-yellow-100 font-bold mb-2">THIRD-LINE: Ergometrine</p>
                    <p className="text-yellow-200 text-sm mb-2">
                      <strong>0.2 mg IM</strong> (can repeat after 15 min, max 5 doses)
                    </p>
                    <p className="text-red-300 text-xs mb-2">
                      ⚠️ CONTRAINDICATIONS: Hypertension, preeclampsia, cardiac disease
                    </p>
                    <Button
                      onClick={() => setErgometrineGiven(true)}
                      variant={ergometrineGiven ? 'outline' : 'default'}
                      className="w-full"
                    >
                      {ergometrineGiven && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                      Ergometrine 0.2 mg IM Given
                    </Button>
                  </div>
                )}
                
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <p className="text-blue-100 font-bold mb-2">Tranexamic Acid (Antifibrinolytic)</p>
                  <p className="text-blue-200 text-sm mb-2">
                    <strong>1 g IV over 10 minutes</strong> (within 3 hours of delivery)
                  </p>
                  <p className="text-blue-300 text-xs mb-2">
                    Can repeat 1g dose after 30 min if bleeding continues
                  </p>
                  <Button
                    onClick={() => setTranexamicAcidGiven(true)}
                    variant={tranexamicAcidGiven ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {tranexamicAcidGiven && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                    Tranexamic Acid 1g Given
                  </Button>
                </div>
                
                <Button 
                  onClick={() => setStage('advanced')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Proceed to Advanced Interventions
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Advanced Interventions Stage */}
        {stage === 'advanced' && (
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Advanced Interventions (If Bleeding Continues)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-100 font-bold mb-2">1. Bimanual Uterine Compression</p>
                  <p className="text-red-200 text-sm">
                    One fist in anterior fornix pushing uterus up, other hand on abdomen compressing posteriorly
                  </p>
                </div>
                
                <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                  <p className="text-orange-100 font-bold mb-2">2. Intrauterine Balloon Tamponade</p>
                  <p className="text-orange-200 text-sm mb-1">
                    Bakri balloon or Foley catheter (60-80 mL condom if unavailable)
                  </p>
                  <p className="text-orange-300 text-xs">
                    Fill with 300-500 mL saline until bleeding stops
                  </p>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                  <p className="text-yellow-100 font-bold mb-2">3. Uterine Artery Embolization (if available)</p>
                  <p className="text-yellow-200 text-sm">
                    Interventional radiology procedure - preserves fertility
                  </p>
                </div>
                
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                  <p className="text-blue-100 font-bold mb-2">4. Non-Pneumatic Anti-Shock Garment (NASG)</p>
                  <p className="text-blue-200 text-sm">
                    Compression garment to stabilize hemodynamics during transfer
                  </p>
                </div>
                
                <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                  <p className="text-purple-100 font-bold mb-2">Blood Product Resuscitation:</p>
                  <p className="text-purple-200 text-sm mb-1">• Massive transfusion protocol if &gt;1500 mL blood loss</p>
                  <p className="text-purple-200 text-sm mb-1">• PRBCs : FFP : Platelets = 1:1:1 ratio</p>
                  <p className="text-purple-200 text-sm">• Target Hgb &gt;7 g/dL, Platelets &gt;50k, Fibrinogen &gt;200 mg/dL</p>
                </div>
                
                <Button 
                  onClick={() => setStage('surgical')}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  Proceed to Surgical Options
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Surgical Stage */}
        {stage === 'surgical' && (
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-400" />
                  Surgical Management (Last Resort)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                  <p className="text-red-100 font-bold text-lg mb-2">CALL SENIOR OBSTETRICIAN & SURGICAL TEAM</p>
                  <p className="text-red-200 text-sm">These procedures require experienced surgical team</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                    <p className="text-orange-100 font-bold mb-2">1. Uterine Compression Sutures</p>
                    <p className="text-orange-200 text-sm">
                      B-Lynch suture, Cho square sutures - preserves fertility
                    </p>
                  </div>
                  
                  <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                    <p className="text-yellow-100 font-bold mb-2">2. Uterine Artery Ligation</p>
                    <p className="text-yellow-200 text-sm">
                      O'Leary sutures at uterine arteries - preserves uterus
                    </p>
                  </div>
                  
                  <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                    <p className="text-blue-100 font-bold mb-2">3. Internal Iliac Artery Ligation</p>
                    <p className="text-blue-200 text-sm">
                      Reduces pulse pressure to uterus - complex procedure
                    </p>
                  </div>
                  
                  <div className="bg-red-900/50 border border-red-600 p-4 rounded">
                    <p className="text-red-100 font-bold mb-2">4. Hysterectomy (Life-Saving)</p>
                    <p className="text-red-200 text-sm mb-2">
                      Subtotal (supracervical) or total hysterectomy
                    </p>
                    <p className="text-red-300 text-xs">
                      Last resort when all other measures fail. Discuss with family if time permits.
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                  <p className="text-green-100 font-bold mb-2">Post-Procedure Monitoring:</p>
                  <p className="text-green-200 text-sm mb-1">• Continuous vital signs monitoring</p>
                  <p className="text-green-200 text-sm mb-1">• Urine output (target &gt;0.5 mL/kg/hr)</p>
                  <p className="text-green-200 text-sm mb-1">• Serial Hgb/Hct every 4-6 hours</p>
                  <p className="text-green-200 text-sm">• Watch for DIC, renal failure, ARDS</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
