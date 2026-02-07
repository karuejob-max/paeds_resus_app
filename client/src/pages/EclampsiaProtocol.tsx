import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Check, X } from 'lucide-react';

interface EclampsiaProtocolProps {
  patientWeight: number;
  onClose: () => void;
}

type Stage = 'assessment' | 'magnesium_loading' | 'seizure_management' | 'maintenance' | 'delivery_planning' | 'ongoing_care';

export default function EclampsiaProtocol({ patientWeight, onClose }: EclampsiaProtocolProps) {
  const [stage, setStage] = useState<Stage>('assessment');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Assessment findings
  const [systolicBP, setSystolicBP] = useState(160);
  const [diastolicBP, setDiastolicBP] = useState(110);
  const [seizureOccurred, setSeizureOccurred] = useState(false);
  const [headache, setHeadache] = useState(false);
  const [visualChanges, setVisualChanges] = useState(false);
  const [rUQPain, setRUQPain] = useState(false);
  
  // Magnesium tracking
  const [magnesiumLoadingGiven, setMagnesiumLoadingGiven] = useState(false);
  const [magnesiumMaintenanceStarted, setMagnesiumMaintenanceStarted] = useState(false);
  const [lastMagnesiumCheck, setLastMagnesiumCheck] = useState<Date | null>(null);
  
  // Antihypertensive tracking
  const [labetalolGiven, setLabetalolGiven] = useState(false);
  const [hydralazineGiven, setHydralazineGiven] = useState(false);
  const [nifedipineGiven, setNifedipineGiven] = useState(false);
  
  // Delivery tracking
  const [deliveryPlanned, setDeliveryPlanned] = useState(false);
  
  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getSeverityBadge = () => {
    if (seizureOccurred) {
      return <Badge className="bg-red-600">Eclampsia</Badge>;
    } else if (systolicBP >= 160 || diastolicBP >= 110) {
      if (headache || visualChanges || rUQPain) {
        return <Badge className="bg-orange-600">Severe Preeclampsia with Features</Badge>;
      }
      return <Badge className="bg-orange-600">Severe Preeclampsia</Badge>;
    }
    return <Badge className="bg-yellow-600">Preeclampsia</Badge>;
  };
  
  const getMagnesiumLoadingDose = () => {
    return {
      dose: 4,
      volume: 20,
      rate: '15-20 minutes'
    };
  };
  
  const getMagnesiumMaintenanceDose = () => {
    return {
      dose: 1,
      concentration: '1 g/hr',
      preparation: '40 g MgSO4 in 1000 mL NS (40 mg/mL) at 25 mL/hr'
    };
  };
  
  const getStageIcon = (stageId: Stage) => {
    if (stageId === stage) return <Activity className="w-5 h-5 text-blue-400 animate-pulse" />;
    
    const completedStages: Stage[] = [];
    const stageOrder: Stage[] = ['assessment', 'magnesium_loading', 'seizure_management', 'maintenance', 'delivery_planning', 'ongoing_care'];
    const currentIndex = stageOrder.indexOf(stage);
    const checkIndex = stageOrder.indexOf(stageId);
    
    if (checkIndex < currentIndex) {
      return <Check className="w-5 h-5 text-green-400" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
  };
  
  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="container max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Eclampsia/Severe Preeclampsia Protocol</h1>
            <div className="flex items-center gap-4">
              {getSeverityBadge()}
              <span className="text-gray-400">Weight: {patientWeight} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-white">{formatTime(timer)}</div>
              <div className="text-sm text-gray-400">Protocol Time</div>
            </div>
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-white border-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Stage Progress */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStageIcon('assessment')}
                <span className="text-white text-sm">Assessment</span>
              </div>
              <div className="flex items-center gap-2">
                {getStageIcon('magnesium_loading')}
                <span className="text-white text-sm">MgSO4 Loading</span>
              </div>
              <div className="flex items-center gap-2">
                {getStageIcon('seizure_management')}
                <span className="text-white text-sm">Seizure Mgmt</span>
              </div>
              <div className="flex items-center gap-2">
                {getStageIcon('maintenance')}
                <span className="text-white text-sm">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                {getStageIcon('delivery_planning')}
                <span className="text-white text-sm">Delivery Plan</span>
              </div>
              <div className="flex items-center gap-2">
                {getStageIcon('ongoing_care')}
                <span className="text-white text-sm">Ongoing Care</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stage Content */}
        {stage === 'assessment' && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Initial Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-semibold mb-2">ACOG Definitions:</p>
                <p className="text-red-200 text-sm mb-1"><strong>Severe Preeclampsia:</strong> BP ≥160/110 on 2 occasions 4h apart + proteinuria</p>
                <p className="text-red-200 text-sm mb-1"><strong>Severe Features:</strong> Headache, visual changes, RUQ pain, platelets &lt;100k, Cr &gt;1.1, pulmonary edema</p>
                <p className="text-red-200 text-sm"><strong>Eclampsia:</strong> New-onset grand mal seizures in preeclampsia</p>
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Blood Pressure:</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      value={systolicBP}
                      onChange={(e) => setSystolicBP(Number(e.target.value))}
                      className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700"
                      placeholder="Systolic"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={diastolicBP}
                      onChange={(e) => setDiastolicBP(Number(e.target.value))}
                      className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700"
                      placeholder="Diastolic"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Clinical Features:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={seizureOccurred}
                      onChange={(e) => setSeizureOccurred(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Seizure occurred</span>
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={headache}
                      onChange={(e) => setHeadache(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Severe headache</span>
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={visualChanges}
                      onChange={(e) => setVisualChanges(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Visual changes (scotomata, blurred vision)</span>
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={rUQPain}
                      onChange={(e) => setRUQPain(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Right upper quadrant/epigastric pain</span>
                  </label>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  setStage('magnesium_loading');
                  setIsRunning(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Start Magnesium Sulfate Protocol
              </Button>
            </CardContent>
          </Card>
        )}
        
        {stage === 'magnesium_loading' && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Magnesium Sulfate Loading Dose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                <p className="text-purple-100 font-bold mb-2">Loading Dose:</p>
                <p className="text-purple-200 text-lg mb-2"><strong>{getMagnesiumLoadingDose().dose} g MgSO4 IV</strong></p>
                <p className="text-purple-200 text-sm mb-1">• Dilute in {getMagnesiumLoadingDose().volume} mL NS or D5W</p>
                <p className="text-purple-200 text-sm">• Infuse over {getMagnesiumLoadingDose().rate}</p>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                <p className="text-yellow-100 font-semibold mb-2">Monitoring During Infusion:</p>
                <p className="text-yellow-200 text-sm mb-1">• Continuous pulse oximetry and BP monitoring</p>
                <p className="text-yellow-200 text-sm mb-1">• Check deep tendon reflexes (DTRs) every 15 min</p>
                <p className="text-yellow-200 text-sm mb-1">• Monitor respiratory rate (target &gt;12/min)</p>
                <p className="text-yellow-200 text-sm">• Urine output (target &gt;25 mL/hr)</p>
              </div>
              
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-bold mb-2">⚠️ Magnesium Toxicity Signs:</p>
                <p className="text-red-200 text-sm mb-1">• Loss of deep tendon reflexes (first sign)</p>
                <p className="text-red-200 text-sm mb-1">• Respiratory depression (RR &lt;12/min)</p>
                <p className="text-red-200 text-sm mb-1">• Decreased level of consciousness</p>
                <p className="text-red-200 text-sm mb-2">• Cardiac arrest (late sign)</p>
                <p className="text-red-200 text-sm font-bold">ANTIDOTE: Calcium gluconate 1 g IV over 3 min</p>
              </div>
              
              <Button 
                onClick={() => {
                  setMagnesiumLoadingGiven(true);
                  setLastMagnesiumCheck(new Date());
                  if (seizureOccurred) {
                    setStage('seizure_management');
                  } else {
                    setStage('maintenance');
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                Loading Dose Complete → {seizureOccurred ? 'Seizure Management' : 'Start Maintenance'}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {stage === 'seizure_management' && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Eclamptic Seizure Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-bold mb-2">Immediate Actions During Seizure:</p>
                <p className="text-red-200 text-sm mb-1">1. Protect airway - turn patient to left side</p>
                <p className="text-red-200 text-sm mb-1">2. Suction oropharynx if needed</p>
                <p className="text-red-200 text-sm mb-1">3. Administer oxygen 10-15 L/min via non-rebreather</p>
                <p className="text-red-200 text-sm mb-1">4. Do NOT restrain patient</p>
                <p className="text-red-200 text-sm">5. Prepare for possible intubation</p>
              </div>
              
              <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                <p className="text-purple-100 font-bold mb-2">If Seizure Persists After MgSO4 Loading:</p>
                <p className="text-purple-200 text-sm mb-2"><strong>Give additional 2 g MgSO4 IV over 3-5 minutes</strong></p>
                <p className="text-purple-200 text-sm mb-1">If still seizing after 2nd dose:</p>
                <p className="text-purple-200 text-sm mb-1">• Lorazepam 2-4 mg IV OR</p>
                <p className="text-purple-200 text-sm">• Diazepam 5-10 mg IV</p>
              </div>
              
              <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                <p className="text-orange-100 font-semibold mb-2">Post-Seizure Care:</p>
                <p className="text-orange-200 text-sm mb-1">• Continuous pulse oximetry and BP monitoring</p>
                <p className="text-orange-200 text-sm mb-1">• Assess for aspiration</p>
                <p className="text-orange-200 text-sm mb-1">• Check fetal heart rate (if antepartum)</p>
                <p className="text-orange-200 text-sm">• Plan for expedited delivery</p>
              </div>
              
              <Button 
                onClick={() => setStage('maintenance')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                Seizure Controlled → Start Maintenance Infusion
              </Button>
            </CardContent>
          </Card>
        )}
        
        {stage === 'maintenance' && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Magnesium Sulfate Maintenance & Antihypertensives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                <p className="text-purple-100 font-bold mb-2">Maintenance Infusion:</p>
                <p className="text-purple-200 text-lg mb-2"><strong>{getMagnesiumMaintenanceDose().concentration} continuous IV</strong></p>
                <p className="text-purple-200 text-sm mb-1">• Preparation: {getMagnesiumMaintenanceDose().preparation}</p>
                <p className="text-purple-200 text-sm mb-1">• Continue for 24 hours postpartum (or 24h after last seizure)</p>
                <p className="text-purple-200 text-sm">• Check magnesium level if toxicity suspected (therapeutic: 4-7 mEq/L)</p>
              </div>
              
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-bold mb-2">Antihypertensive Therapy (if BP ≥160/110):</p>
                <p className="text-red-200 text-sm mb-2"><strong>Goal: Systolic 140-150, Diastolic 90-100</strong></p>
                
                <p className="text-red-200 text-sm font-semibold mb-1">First-line options:</p>
                <p className="text-red-200 text-sm mb-1">• <strong>Labetalol:</strong> 20 mg IV, then 40 mg, then 80 mg q10min (max 300 mg)</p>
                <p className="text-red-200 text-sm mb-1">• <strong>Hydralazine:</strong> 5-10 mg IV q20min (max 30 mg)</p>
                <p className="text-red-200 text-sm mb-2">• <strong>Nifedipine:</strong> 10-20 mg PO q30min (max 50 mg/hr)</p>
                
                <div className="space-y-2 mt-3">
                  <Button 
                    onClick={() => setLabetalolGiven(true)}
                    disabled={labetalolGiven}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {labetalolGiven ? '✓ Labetalol Given' : 'Give Labetalol 20 mg IV'}
                  </Button>
                  <Button 
                    onClick={() => setHydralazineGiven(true)}
                    disabled={hydralazineGiven}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {hydralazineGiven ? '✓ Hydralazine Given' : 'Give Hydralazine 5-10 mg IV'}
                  </Button>
                  <Button 
                    onClick={() => setNifedipineGiven(true)}
                    disabled={nifedipineGiven}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {nifedipineGiven ? '✓ Nifedipine Given' : 'Give Nifedipine 10-20 mg PO'}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  setMagnesiumMaintenanceStarted(true);
                  setStage('delivery_planning');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Maintenance Started → Delivery Planning
              </Button>
            </CardContent>
          </Card>
        )}
        
        {stage === 'delivery_planning' && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Delivery Planning & Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-900/30 border border-orange-700 p-4 rounded">
                <p className="text-orange-100 font-bold mb-2">ACOG Delivery Recommendations:</p>
                <p className="text-orange-200 text-sm mb-1"><strong>Eclampsia:</strong> Deliver after maternal stabilization (regardless of gestational age)</p>
                <p className="text-orange-200 text-sm mb-1"><strong>Severe Preeclampsia ≥34 weeks:</strong> Deliver within 24-48 hours</p>
                <p className="text-orange-200 text-sm mb-1"><strong>Severe Preeclampsia &lt;34 weeks:</strong> Consider expectant management with close monitoring</p>
                <p className="text-orange-200 text-sm">• Betamethasone for fetal lung maturity if &lt;34 weeks</p>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                <p className="text-yellow-100 font-semibold mb-2">Mode of Delivery:</p>
                <p className="text-yellow-200 text-sm mb-1">• Vaginal delivery preferred if cervix favorable</p>
                <p className="text-yellow-200 text-sm mb-1">• Cesarean section if maternal/fetal instability or unfavorable cervix</p>
                <p className="text-yellow-200 text-sm">• Continue MgSO4 throughout labor and 24h postpartum</p>
              </div>
              
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-bold mb-2">⚠️ Absolute Indications for Delivery:</p>
                <p className="text-red-200 text-sm mb-1">• Eclampsia</p>
                <p className="text-red-200 text-sm mb-1">• Pulmonary edema</p>
                <p className="text-red-200 text-sm mb-1">• Placental abruption</p>
                <p className="text-red-200 text-sm mb-1">• Nonreassuring fetal status</p>
                <p className="text-red-200 text-sm">• HELLP syndrome with deterioration</p>
              </div>
              
              <Button 
                onClick={() => {
                  setDeliveryPlanned(true);
                  setStage('ongoing_care');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                Delivery Plan Established → Ongoing Care
              </Button>
            </CardContent>
          </Card>
        )}
        
        {stage === 'ongoing_care' && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Ongoing Care & Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                <p className="text-green-100 font-bold mb-2">Postpartum Monitoring (24-48 hours):</p>
                <p className="text-green-200 text-sm mb-1">• Continue MgSO4 for 24h postpartum</p>
                <p className="text-green-200 text-sm mb-1">• BP every 4 hours (more frequent if elevated)</p>
                <p className="text-green-200 text-sm mb-1">• Strict I&O monitoring (watch for oliguria)</p>
                <p className="text-green-200 text-sm mb-1">• Daily CBC, CMP, LFTs</p>
                <p className="text-green-200 text-sm">• Assess for postpartum hemorrhage risk</p>
              </div>
              
              <div className="bg-purple-900/30 border border-purple-700 p-4 rounded">
                <p className="text-purple-100 font-semibold mb-2">Postpartum Antihypertensive Management:</p>
                <p className="text-purple-200 text-sm mb-1">• Continue if BP ≥150/100</p>
                <p className="text-purple-200 text-sm mb-1">• Transition to oral agents: Labetalol, Nifedipine, Methyldopa</p>
                <p className="text-purple-200 text-sm">• Avoid ACE inhibitors/ARBs if breastfeeding</p>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
                <p className="text-yellow-100 font-semibold mb-2">Discharge Criteria:</p>
                <p className="text-yellow-200 text-sm mb-1">• BP controlled on oral medications</p>
                <p className="text-yellow-200 text-sm mb-1">• No signs of magnesium toxicity</p>
                <p className="text-yellow-200 text-sm mb-1">• Platelet count improving</p>
                <p className="text-yellow-200 text-sm mb-1">• Urine output adequate</p>
                <p className="text-yellow-200 text-sm">• Patient educated on warning signs</p>
              </div>
              
              <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                <p className="text-red-100 font-bold mb-2">⚠️ Warning Signs for Readmission:</p>
                <p className="text-red-200 text-sm mb-1">• Severe headache not relieved by medication</p>
                <p className="text-red-200 text-sm mb-1">• Visual changes</p>
                <p className="text-red-200 text-sm mb-1">• RUQ/epigastric pain</p>
                <p className="text-red-200 text-sm mb-1">• Shortness of breath</p>
                <p className="text-red-200 text-sm">• Seizure activity</p>
              </div>
              
              <Button 
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Protocol Complete - Close
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
