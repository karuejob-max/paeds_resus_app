import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Wind, 
  Syringe, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';

interface PatientData {
  weight: number;
  ageMonths: number;
}

type AsthmaStage = 
  | 'assessment'
  | 'initial_nebs'
  | 'steroids'
  | 'ipratropium'
  | 'iv_bronchodilators'
  | 'intubation_prep'
  | 'post_intubation';

type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'life_threatening';

export default function AsthmaEmergency() {
  const [, setLocation] = useLocation();
  const [patientWeight, setPatientWeight] = useState<number>(20);
  const [patientAge, setPatientAge] = useState<number>(60); // months
  const [currentStage, setCurrentStage] = useState<AsthmaStage>('assessment');
  const [severity, setSeverity] = useState<SeverityLevel>('moderate');
  const [completedInterventions, setCompletedInterventions] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());

  // Calculate medication doses
  const calculateDoses = () => {
    const weightKg = patientWeight;
    
    return {
      // Initial nebulizers
      salbutamol_neb: '2.5-5mg',
      ipratropium_neb: '250-500mcg',
      
      // Steroids
      prednisolone_oral: `${Math.round(weightKg * 1)} - ${Math.round(weightKg * 2)}mg (1-2mg/kg, max 40mg)`,
      hydrocortisone_iv: `${Math.round(weightKg * 4)}mg (4mg/kg, max 100mg)`,
      dexamethasone: `${Math.round(weightKg * 0.6)}mg (0.6mg/kg, max 16mg)`,
      
      // IV Bronchodilators
      mgso4_dose: `${Math.round(weightKg * 50)}mg (50mg/kg over 20min, max 2g)`,
      mgso4_concentration: '50% MgSO4 = 500mg/mL',
      mgso4_volume: `${Math.round((weightKg * 50) / 500 * 10) / 10}mL of 50% MgSO4`,
      mgso4_dilution: `Dilute in 50-100mL NS, infuse over 20 minutes`,
      
      salbutamol_iv_bolus: `${Math.round(weightKg * 15)}mcg (15mcg/kg over 10min)`,
      salbutamol_iv_infusion: `${Math.round(weightKg * 0.2)} - ${Math.round(weightKg * 5)}mcg/min (0.2-5mcg/kg/min)`,
      salbutamol_preparation: `1mg in 50mL = 20mcg/mL`,
      
      aminophylline_loading: `${Math.round(weightKg * 5)}mg (5mg/kg over 20min)`,
      aminophylline_infusion: `${Math.round(weightKg * 0.5)} - ${Math.round(weightKg * 1)}mg/hr (0.5-1mg/kg/hr)`,
      aminophylline_preparation: `250mg in 50mL NS = 5mg/mL`,
      
      // Intubation
      ketamine_dose: `${Math.round(weightKg * 1)} - ${Math.round(weightKg * 2)}mg (1-2mg/kg IV)`,
      ketamine_concentration: '50mg/mL',
      ketamine_volume: `${Math.round((weightKg * 1.5) / 50 * 10) / 10}mL`,
      
      // Equipment
      ett_size: patientAge < 12 ? '3.0-3.5mm' : patientAge < 24 ? '3.5-4.0mm' : patientAge < 60 ? '4.0-4.5mm' : patientAge < 120 ? '5.0-5.5mm' : '6.0-6.5mm',
      ett_depth: `${Math.round((patientAge / 12) * 3 + 12)}cm at lip`,
    };
  };

  const doses = calculateDoses();

  const markCompleted = (intervention: string) => {
    if (!completedInterventions.includes(intervention)) {
      setCompletedInterventions([...completedInterventions, intervention]);
    }
  };

  const getSeverityBadge = () => {
    const colors = {
      mild: 'bg-yellow-600',
      moderate: 'bg-orange-600',
      severe: 'bg-red-600',
      life_threatening: 'bg-purple-600 animate-pulse',
    };
    return <Badge className={`${colors[severity]} text-white`}>{severity.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
    return `${elapsed} min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* Header */}
      <div className="container mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4">
            {getSeverityBadge()}
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{getElapsedTime()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Wind className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Asthma Emergency Protocol</h1>
        </div>
        <p className="text-gray-400">Comprehensive escalation pathway - No stone left unturned</p>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Weight</p>
              <p className="text-2xl font-bold">{patientWeight}kg</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Age</p>
              <p className="text-2xl font-bold">{Math.floor(patientAge / 12)}y {patientAge % 12}m</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto">
        {/* Stage Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'assessment', label: 'Assessment', icon: Activity },
            { id: 'initial_nebs', label: 'Initial Nebs', icon: Wind },
            { id: 'steroids', label: 'Steroids', icon: Syringe },
            { id: 'ipratropium', label: 'Ipratropium', icon: Wind },
            { id: 'iv_bronchodilators', label: 'IV Bronchodilators', icon: Syringe },
            { id: 'intubation_prep', label: 'Intubation', icon: AlertTriangle },
            { id: 'post_intubation', label: 'Vent Settings', icon: Activity },
          ].map((stage) => {
            const Icon = stage.icon;
            const isActive = currentStage === stage.id;
            const isCompleted = completedInterventions.includes(stage.id);
            
            return (
              <Button
                key={stage.id}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setCurrentStage(stage.id as AsthmaStage)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  isCompleted ? 'border-green-500' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
                {stage.label}
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </Button>
            );
          })}
        </div>

        {/* Assessment Stage */}
        {currentStage === 'assessment' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-blue-400" />
                  Severity Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Severity Indicators */}
                  <div>
                    <h3 className="font-semibold mb-2 text-yellow-400">Moderate-Severe</h3>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• SpO2 90-95% on room air</li>
                      <li>• Moderate respiratory distress</li>
                      <li>• Talking in phrases</li>
                      <li>• Heart rate elevated</li>
                      <li>• Accessory muscle use</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-red-400">Life-Threatening</h3>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• SpO2 &lt;90% despite O2</li>
                      <li>• Silent chest (poor air entry)</li>
                      <li>• Exhaustion, altered consciousness</li>
                      <li>• Cyanosis</li>
                      <li>• Bradycardia (pre-arrest)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => { setSeverity('moderate'); setCurrentStage('initial_nebs'); }} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    Moderate-Severe
                  </Button>
                  <Button onClick={() => { setSeverity('life_threatening'); setCurrentStage('initial_nebs'); }} className="flex-1 bg-red-600 hover:bg-red-700">
                    Life-Threatening
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Initial Nebulizers Stage */}
        {currentStage === 'initial_nebs' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-6 w-6 text-blue-400" />
                  Step 1: Initial Nebulizers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Salbutamol Nebulizer</p>
                      <p className="text-sm text-gray-300 mb-2">Dose: <span className="font-bold text-white">{doses.salbutamol_neb}</span></p>
                      <p className="text-sm text-gray-400">• Give via oxygen-driven nebulizer (6-8 L/min)</p>
                      <p className="text-sm text-gray-400">• Can repeat every 20 minutes (continuous if life-threatening)</p>
                      <p className="text-sm text-gray-400">• Monitor heart rate (tachycardia expected)</p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => { markCompleted('initial_nebs'); setCurrentStage('steroids'); }} className="w-full bg-green-600 hover:bg-green-700">
                  Salbutamol Given → Next: Steroids
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Steroids Stage */}
        {currentStage === 'steroids' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-6 w-6 text-purple-400" />
                  Step 2: Corticosteroids
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                  <p className="font-semibold mb-2">Choose Route:</p>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-900/50 p-3 rounded">
                      <p className="font-semibold text-green-400">Oral (if tolerating)</p>
                      <p className="text-sm text-gray-300 mt-1">Prednisolone: <span className="font-bold">{doses.prednisolone_oral}</span></p>
                      <p className="text-xs text-gray-400 mt-1">• Equally effective as IV</p>
                      <p className="text-xs text-gray-400">• Faster to administer</p>
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded">
                      <p className="font-semibold text-yellow-400">IV (if vomiting/severe)</p>
                      <p className="text-sm text-gray-300 mt-1">Hydrocortisone: <span className="font-bold">{doses.hydrocortisone_iv}</span></p>
                      <p className="text-xs text-gray-400 mt-1">OR</p>
                      <p className="text-sm text-gray-300 mt-1">Dexamethasone: <span className="font-bold">{doses.dexamethasone}</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-sm text-yellow-200">⚠️ Steroids take 4-6 hours for full effect. Continue bronchodilators.</p>
                </div>

                <Button onClick={() => { markCompleted('steroids'); setCurrentStage('ipratropium'); }} className="w-full bg-green-600 hover:bg-green-700">
                  Steroid Given → Next: Ipratropium
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ipratropium Stage */}
        {currentStage === 'ipratropium' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-6 w-6 text-teal-400" />
                  Step 3: Add Ipratropium Bromide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Ipratropium Nebulizer</p>
                      <p className="text-sm text-gray-300 mb-2">Dose: <span className="font-bold text-white">{doses.ipratropium_neb}</span></p>
                      <p className="text-sm text-gray-400">• Mix with salbutamol in same nebulizer</p>
                      <p className="text-sm text-gray-400">• Give every 20-30 minutes for first hour</p>
                      <p className="text-sm text-gray-400">• Then every 4-6 hours</p>
                      <p className="text-sm text-gray-400">• Anticholinergic - reduces secretions</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-orange-200 mb-2">Reassess after 3 doses (60 minutes):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => { markCompleted('ipratropium'); setCurrentStage('assessment'); }} variant="outline" className="text-green-400 border-green-500">
                      Improving → Continue
                    </Button>
                    <Button onClick={() => { markCompleted('ipratropium'); setCurrentStage('iv_bronchodilators'); }} className="bg-red-600 hover:bg-red-700">
                      Not Improving → Escalate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* IV Bronchodilators Stage */}
        {currentStage === 'iv_bronchodilators' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-6 w-6 text-red-400" />
                  Step 4: IV Bronchodilators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-200 font-semibold">⚠️ Life-threatening asthma - Consider ICU/HDU transfer</p>
                </div>

                {/* Magnesium Sulfate */}
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <p className="font-semibold text-lg mb-2 text-blue-300">1. Magnesium Sulfate (First Line)</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">Dose: <span className="font-bold text-white">{doses.mgso4_dose}</span></p>
                    <p className="text-gray-400">Concentration: {doses.mgso4_concentration}</p>
                    <p className="text-gray-400">Volume: <span className="font-bold text-white">{doses.mgso4_volume}</span></p>
                    <p className="text-gray-400">{doses.mgso4_dilution}</p>
                    <div className="bg-yellow-900/30 border border-yellow-600 rounded p-2 mt-2">
                      <p className="text-xs text-yellow-200">• Monitor ECG during infusion</p>
                      <p className="text-xs text-yellow-200">• Can cause flushing, hypotension</p>
                      <p className="text-xs text-yellow-200">• Bronchodilator + smooth muscle relaxant</p>
                    </div>
                  </div>
                </div>

                {/* Salbutamol IV */}
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <p className="font-semibold text-lg mb-2 text-green-300">2. Salbutamol IV (If no response to MgSO4)</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">Loading: <span className="font-bold text-white">{doses.salbutamol_iv_bolus}</span></p>
                    <p className="text-gray-300">Infusion: <span className="font-bold text-white">{doses.salbutamol_iv_infusion}</span></p>
                    <p className="text-gray-400">Preparation: {doses.salbutamol_preparation}</p>
                    <div className="bg-red-900/30 border border-red-600 rounded p-2 mt-2">
                      <p className="text-xs text-red-200">⚠️ High risk of tachycardia, arrhythmias</p>
                      <p className="text-xs text-red-200">⚠️ Monitor ECG continuously</p>
                      <p className="text-xs text-red-200">⚠️ Check K+ (causes hypokalemia)</p>
                    </div>
                  </div>
                </div>

                {/* Aminophylline */}
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <p className="font-semibold text-lg mb-2 text-purple-300">3. Aminophylline (Third Line)</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">Loading: <span className="font-bold text-white">{doses.aminophylline_loading}</span></p>
                    <p className="text-gray-300">Infusion: <span className="font-bold text-white">{doses.aminophylline_infusion}</span></p>
                    <p className="text-gray-400">Preparation: {doses.aminophylline_preparation}</p>
                    <div className="bg-red-900/30 border border-red-600 rounded p-2 mt-2">
                      <p className="text-xs text-red-200">⚠️ Narrow therapeutic window</p>
                      <p className="text-xs text-red-200">⚠️ Can cause seizures, arrhythmias</p>
                      <p className="text-xs text-red-200">⚠️ Omit loading if on oral theophylline</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-orange-200 mb-2">Reassess after IV bronchodilators:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => { markCompleted('iv_bronchodilators'); setCurrentStage('assessment'); }} variant="outline" className="text-green-400 border-green-500">
                      Improving → Continue
                    </Button>
                    <Button onClick={() => { markCompleted('iv_bronchodilators'); setCurrentStage('intubation_prep'); }} className="bg-purple-600 hover:bg-purple-700">
                      Deteriorating → Intubate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Intubation Prep Stage */}
        {currentStage === 'intubation_prep' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
                  Step 5: Intubation Preparation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4">
                  <p className="font-bold text-red-200 text-lg mb-2">⚠️ CRITICAL: High-Risk Intubation</p>
                  <ul className="space-y-1 text-sm text-red-100">
                    <li>• Call for senior help (anesthetist/intensivist)</li>
                    <li>• Prepare for difficult airway</li>
                    <li>• Risk of cardiovascular collapse on induction</li>
                    <li>• Have resuscitation drugs ready</li>
                  </ul>
                </div>

                {/* Equipment */}
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <p className="font-semibold text-lg mb-3 text-blue-300">Equipment Preparation</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">ETT Size:</p>
                      <p className="font-bold text-white">{doses.ett_size}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">ETT Depth:</p>
                      <p className="font-bold text-white">{doses.ett_depth}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400">Have ready:</p>
                      <ul className="text-xs text-gray-300 mt-1 space-y-0.5">
                        <li>• ETT (size above and below)</li>
                        <li>• Laryngoscope (check light)</li>
                        <li>• Suction (Yankauer + catheter)</li>
                        <li>• Stylet</li>
                        <li>• Bougie</li>
                        <li>• Bag-mask ventilation ready</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Ketamine Induction */}
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <p className="font-semibold text-lg mb-2 text-green-300">Ketamine Induction (Drug of Choice)</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">Dose: <span className="font-bold text-white">{doses.ketamine_dose}</span></p>
                    <p className="text-gray-400">Concentration: {doses.ketamine_concentration}</p>
                    <p className="text-gray-400">Volume: <span className="font-bold text-white">{doses.ketamine_volume}</span></p>
                    <div className="bg-green-900/30 border border-green-600 rounded p-2 mt-2">
                      <p className="text-xs text-green-200">✓ Bronchodilator properties</p>
                      <p className="text-xs text-green-200">✓ Maintains cardiovascular stability</p>
                      <p className="text-xs text-green-200">✓ Preserves respiratory drive</p>
                      <p className="text-xs text-green-200">✓ Reduces airway reactivity</p>
                    </div>
                  </div>
                </div>

                {/* Pre-oxygenation */}
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">Pre-oxygenation Strategy:</p>
                  <ul className="text-xs text-yellow-100 space-y-1">
                    <li>• 100% O2 via non-rebreather mask</li>
                    <li>• Continue nebulized salbutamol during pre-ox</li>
                    <li>• Aim SpO2 &gt;95% before induction</li>
                    <li>• Have PEEP valve ready for bag-mask</li>
                  </ul>
                </div>

                <Button onClick={() => { markCompleted('intubation_prep'); setCurrentStage('post_intubation'); }} className="w-full bg-purple-600 hover:bg-purple-700">
                  Intubated → Ventilator Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Post-Intubation / Vent Settings Stage */}
        {currentStage === 'post_intubation' && (
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-400" />
                  Step 6: Ventilator Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                  <p className="font-bold text-purple-200 text-lg mb-3">Asthma-Specific Ventilator Strategy</p>
                  
                  {/* Key Principles */}
                  <div className="bg-gray-900/50 rounded p-3 mb-3">
                    <p className="font-semibold text-yellow-300 mb-2">Key Principles:</p>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• <span className="font-bold">Prolonged expiratory phase</span> (allow time for exhalation)</li>
                      <li>• <span className="font-bold">Low PEEP</span> (avoid air trapping)</li>
                      <li>• <span className="font-bold">Permissive hypercapnia</span> (tolerate high CO2 to avoid barotrauma)</li>
                      <li>• <span className="font-bold">Avoid high pressures</span> (risk of pneumothorax)</li>
                    </ul>
                  </div>

                  {/* Initial Settings */}
                  <div className="bg-gray-900/50 rounded p-3 mb-3">
                    <p className="font-semibold text-blue-300 mb-2">Initial Ventilator Settings:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400">Mode:</p>
                        <p className="font-bold text-white">Pressure Control (PC) or Volume Control (VC)</p>
                      </div>
                      <div>
                        <p className="text-gray-400">FiO2:</p>
                        <p className="font-bold text-white">100% initially, wean to SpO2 90-95%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Respiratory Rate:</p>
                        <p className="font-bold text-white">10-14 breaths/min (LOW)</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Tidal Volume:</p>
                        <p className="font-bold text-white">6-8 mL/kg (if VC mode)</p>
                      </div>
                      <div>
                        <p className="text-gray-400">PEEP:</p>
                        <p className="font-bold text-white">0-5 cmH2O (LOW)</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Inspiratory Time:</p>
                        <p className="font-bold text-white">0.8-1.0 seconds (SHORT)</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400">I:E Ratio:</p>
                        <p className="font-bold text-white">1:3 to 1:5 (PROLONGED EXPIRATION)</p>
                        <p className="text-xs text-gray-500 mt-1">Example: If I-time = 1 sec, E-time = 3-5 sec</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400">Peak Inspiratory Pressure (PIP):</p>
                        <p className="font-bold text-white">Aim &lt;30 cmH2O (if PC mode)</p>
                        <p className="text-xs text-gray-500 mt-1">Accept higher if needed, but monitor for pneumothorax</p>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring */}
                  <div className="bg-gray-900/50 rounded p-3 mb-3">
                    <p className="font-semibold text-red-300 mb-2">Critical Monitoring:</p>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• <span className="font-bold">Auto-PEEP / Air trapping:</span> Check expiratory flow waveform (should reach zero before next breath)</li>
                      <li>• <span className="font-bold">Peak/Plateau pressures:</span> Keep plateau &lt;30 cmH2O if possible</li>
                      <li>• <span className="font-bold">SpO2:</span> Target 88-95% (permissive hypoxemia acceptable)</li>
                      <li>• <span className="font-bold">EtCO2:</span> May be elevated (permissive hypercapnia - pH &gt;7.2 acceptable)</li>
                      <li>• <span className="font-bold">Pneumothorax:</span> High index of suspicion (sudden deterioration, asymmetric chest movement)</li>
                    </ul>
                  </div>

                  {/* Adjuncts */}
                  <div className="bg-gray-900/50 rounded p-3">
                    <p className="font-semibold text-green-300 mb-2">Inhaled Anesthetic Bronchodilators (If Available):</p>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p><span className="font-bold">Sevoflurane</span> or <span className="font-bold">Isoflurane</span></p>
                      <ul className="space-y-1 text-xs text-gray-400 ml-4">
                        <li>• Potent bronchodilators</li>
                        <li>• Delivered via anesthetic vaporizer on ventilator</li>
                        <li>• Requires ICU/anesthesia expertise</li>
                        <li>• Consider if refractory to all other therapies</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                  <p className="text-sm text-green-200">✓ Continue all bronchodilators (nebulized + IV)</p>
                  <p className="text-sm text-green-200">✓ Sedate adequately (ketamine infusion ideal)</p>
                  <p className="text-sm text-green-200">✓ Consider paralysis if severe dyssynchrony</p>
                </div>

                <Button onClick={() => { markCompleted('post_intubation'); setCurrentStage('assessment'); }} className="w-full bg-green-600 hover:bg-green-700">
                  Ventilator Optimized → Continue Monitoring
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
