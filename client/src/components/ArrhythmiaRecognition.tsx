// ============================================================================
// ARRHYTHMIA RECOGNITION MODULE
// ECG rhythm identification with visual patterns and immediate treatment pathways
// ============================================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Activity,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ECGVisuals, ECGQuickReference } from './ECGVisuals';

interface ArrhythmiaPattern {
  id: string;
  name: string;
  category: 'bradycardia' | 'tachycardia' | 'arrest';
  description: string;
  ecgFeatures: string[];
  causes: string[];
  treatment: TreatmentStep[];
  electrolyteCauses?: string[];
  urgency: 'immediate' | 'urgent' | 'monitor';
}

interface TreatmentStep {
  step: number;
  action: string;
  dose?: string;
  notes?: string;
}

interface ArrhythmiaRecognitionProps {
  patientWeight: number;
  patientAge: number;
  onTreatmentSelected?: (treatment: TreatmentStep[], arrhythmiaId: string) => void;
}

const ARRHYTHMIA_PATTERNS: ArrhythmiaPattern[] = [
  // BRADYCARDIAS
  {
    id: 'sinus_bradycardia',
    name: 'Sinus Bradycardia',
    category: 'bradycardia',
    description: 'Slow heart rate with normal P waves before each QRS',
    ecgFeatures: [
      'Regular rhythm',
      'Normal P waves before each QRS',
      'Normal PR interval (0.12-0.20s)',
      'Narrow QRS (<0.09s)',
      'Rate < normal for age',
    ],
    causes: [
      'Hypoxia (most common in children)',
      'Increased vagal tone',
      'Hypothermia',
      'Drug effect (beta-blockers, digoxin)',
      'Raised intracranial pressure',
      'Hypothyroidism',
    ],
    electrolyteCauses: ['Hyperkalemia', 'Hypercalcemia'],
    treatment: [
      { step: 1, action: 'Ensure adequate oxygenation and ventilation', notes: 'Most pediatric bradycardia is hypoxic' },
      { step: 2, action: 'If HR <60 with poor perfusion despite oxygenation, start CPR' },
      { step: 3, action: 'Epinephrine IV/IO', dose: '0.01 mg/kg (0.1 mL/kg of 1:10,000)', notes: 'Repeat every 3-5 minutes' },
      { step: 4, action: 'Atropine IV/IO (if increased vagal tone or AV block)', dose: '0.02 mg/kg (min 0.1 mg, max 0.5 mg child, 1 mg adolescent)' },
      { step: 5, action: 'Consider transcutaneous pacing if unresponsive to drugs' },
    ],
    urgency: 'urgent',
  },
  {
    id: 'heart_block_complete',
    name: 'Complete Heart Block (3rd Degree AV Block)',
    category: 'bradycardia',
    description: 'Complete dissociation between P waves and QRS complexes',
    ecgFeatures: [
      'P waves and QRS complexes completely independent',
      'Regular P-P intervals',
      'Regular R-R intervals (but different rate from P waves)',
      'No relationship between P waves and QRS',
      'Wide QRS if ventricular escape rhythm',
    ],
    causes: [
      'Congenital (maternal lupus)',
      'Post-cardiac surgery',
      'Myocarditis',
      'Drug toxicity (digoxin, beta-blockers)',
      'Lyme disease',
    ],
    electrolyteCauses: ['Severe hyperkalemia'],
    treatment: [
      { step: 1, action: 'Ensure adequate oxygenation' },
      { step: 2, action: 'Epinephrine infusion', dose: '0.1-1 mcg/kg/min', notes: 'Titrate to effect' },
      { step: 3, action: 'Isoproterenol infusion', dose: '0.05-2 mcg/kg/min', notes: 'If epinephrine ineffective' },
      { step: 4, action: 'Transcutaneous pacing', notes: 'Bridge to transvenous pacing' },
      { step: 5, action: 'Urgent cardiology consult for permanent pacemaker' },
    ],
    urgency: 'immediate',
  },
  
  // TACHYCARDIAS
  {
    id: 'svt',
    name: 'Supraventricular Tachycardia (SVT)',
    category: 'tachycardia',
    description: 'Rapid regular narrow-complex tachycardia, often >220 bpm in infants',
    ecgFeatures: [
      'Very regular rhythm',
      'Rate: Infants >220 bpm, Children >180 bpm',
      'Narrow QRS (<0.09s)',
      'P waves often not visible (hidden in T waves)',
      'Abrupt onset and offset',
      'No beat-to-beat variability',
    ],
    causes: [
      'Accessory pathway (WPW)',
      'AV nodal reentrant tachycardia',
      'Atrial flutter with 1:1 conduction',
      'Fever, dehydration (sinus tachycardia mimic)',
    ],
    treatment: [
      { step: 1, action: 'Vagal maneuvers (if stable)', notes: 'Ice to face (infants), Valsalva (older children)' },
      { step: 2, action: 'Adenosine IV (rapid push)', dose: '0.1 mg/kg (max 6 mg) first dose', notes: 'Follow with rapid saline flush' },
      { step: 3, action: 'Adenosine IV (if no response)', dose: '0.2 mg/kg (max 12 mg) second dose' },
      { step: 4, action: 'If unstable: Synchronized cardioversion', dose: '0.5-1 J/kg, increase to 2 J/kg if needed' },
      { step: 5, action: 'Consider amiodarone or procainamide for refractory SVT', dose: 'Amiodarone: 5 mg/kg IV over 20-60 min' },
    ],
    urgency: 'urgent',
  },
  {
    id: 'sinus_tachycardia',
    name: 'Sinus Tachycardia',
    category: 'tachycardia',
    description: 'Elevated heart rate with normal P waves - usually compensatory',
    ecgFeatures: [
      'Regular rhythm',
      'Normal P waves before each QRS',
      'Rate usually <220 in infants, <180 in children',
      'Beat-to-beat variability present',
      'Gradual onset/offset',
      'Rate varies with activity/stimulation',
    ],
    causes: [
      'Fever',
      'Pain/anxiety',
      'Hypovolemia/dehydration',
      'Anemia',
      'Hypoxia',
      'Sepsis',
      'Heart failure',
      'Drugs (salbutamol, caffeine)',
    ],
    treatment: [
      { step: 1, action: 'Identify and treat underlying cause', notes: 'Do NOT cardiovert sinus tachycardia' },
      { step: 2, action: 'If fever: Antipyretics', dose: 'Paracetamol 15 mg/kg PO/PR' },
      { step: 3, action: 'If hypovolemia: Fluid bolus', dose: '10-20 mL/kg crystalloid' },
      { step: 4, action: 'If pain: Appropriate analgesia' },
      { step: 5, action: 'If hypoxia: Supplemental oxygen' },
    ],
    urgency: 'monitor',
  },
  {
    id: 'vt_with_pulse',
    name: 'Ventricular Tachycardia (with pulse)',
    category: 'tachycardia',
    description: 'Wide-complex tachycardia originating from ventricles',
    ecgFeatures: [
      'Wide QRS (>0.09s)',
      'Regular or slightly irregular',
      'Rate usually 150-250 bpm',
      'AV dissociation (P waves march through)',
      'Fusion beats or capture beats',
      'Concordance in precordial leads',
    ],
    causes: [
      'Electrolyte abnormalities (K+, Mg2+, Ca2+)',
      'Long QT syndrome',
      'Cardiomyopathy',
      'Myocarditis',
      'Drug toxicity',
      'Post-cardiac surgery',
    ],
    electrolyteCauses: ['Hypokalemia', 'Hypomagnesemia', 'Hypocalcemia'],
    treatment: [
      { step: 1, action: 'If stable: Amiodarone IV', dose: '5 mg/kg over 20-60 min', notes: 'Can repeat x2' },
      { step: 2, action: 'Alternative: Procainamide IV', dose: '15 mg/kg over 30-60 min' },
      { step: 3, action: 'If unstable: Synchronized cardioversion', dose: '0.5-1 J/kg, increase to 2 J/kg' },
      { step: 4, action: 'Correct electrolytes', notes: 'Check and correct K+, Mg2+, Ca2+' },
      { step: 5, action: 'If Torsades de Pointes: Magnesium sulfate', dose: '25-50 mg/kg IV over 10-20 min (max 2g)' },
    ],
    urgency: 'immediate',
  },
  
  // ARREST RHYTHMS
  {
    id: 'vf',
    name: 'Ventricular Fibrillation (VF)',
    category: 'arrest',
    description: 'Chaotic ventricular activity - no cardiac output',
    ecgFeatures: [
      'Chaotic, irregular waveform',
      'No identifiable P waves, QRS, or T waves',
      'Varying amplitude and frequency',
      'No organized electrical activity',
    ],
    causes: [
      'Hypoxia',
      'Electrolyte abnormalities',
      'Hypothermia',
      'Drug toxicity',
      'Cardiomyopathy',
      'Commotio cordis',
    ],
    electrolyteCauses: ['Severe hypokalemia', 'Severe hyperkalemia', 'Hypomagnesemia'],
    treatment: [
      { step: 1, action: 'Start CPR immediately' },
      { step: 2, action: 'Defibrillate', dose: '2 J/kg first shock, 4 J/kg subsequent', notes: 'Minimize interruptions' },
      { step: 3, action: 'Resume CPR for 2 minutes' },
      { step: 4, action: 'Epinephrine IV/IO', dose: '0.01 mg/kg (0.1 mL/kg of 1:10,000)', notes: 'Every 3-5 min' },
      { step: 5, action: 'Amiodarone IV/IO (after 3rd shock)', dose: '5 mg/kg bolus, can repeat x2' },
      { step: 6, action: 'Search for reversible causes (Hs and Ts)' },
    ],
    urgency: 'immediate',
  },
  {
    id: 'pulseless_vt',
    name: 'Pulseless Ventricular Tachycardia',
    category: 'arrest',
    description: 'Wide-complex tachycardia without palpable pulse',
    ecgFeatures: [
      'Wide QRS (>0.09s)',
      'Regular or slightly irregular',
      'Rate usually 150-250 bpm',
      'No pulse palpable',
    ],
    causes: [
      'Same as VT with pulse',
      'Progression from VT with pulse',
    ],
    electrolyteCauses: ['Hypokalemia', 'Hyperkalemia', 'Hypomagnesemia'],
    treatment: [
      { step: 1, action: 'Start CPR immediately' },
      { step: 2, action: 'Defibrillate', dose: '2 J/kg first shock, 4 J/kg subsequent' },
      { step: 3, action: 'Resume CPR for 2 minutes' },
      { step: 4, action: 'Epinephrine IV/IO', dose: '0.01 mg/kg', notes: 'Every 3-5 min' },
      { step: 5, action: 'Amiodarone IV/IO', dose: '5 mg/kg bolus' },
    ],
    urgency: 'immediate',
  },
  {
    id: 'asystole',
    name: 'Asystole',
    category: 'arrest',
    description: 'Flat line - no electrical activity',
    ecgFeatures: [
      'Flat line (isoelectric)',
      'No P waves, QRS, or T waves',
      'Confirm in 2 leads',
      'Check leads and gain',
    ],
    causes: [
      'Prolonged hypoxia',
      'Severe acidosis',
      'Severe hyperkalemia',
      'Hypothermia',
      'Drug overdose',
    ],
    electrolyteCauses: ['Severe hyperkalemia'],
    treatment: [
      { step: 1, action: 'Start CPR immediately' },
      { step: 2, action: 'Epinephrine IV/IO', dose: '0.01 mg/kg', notes: 'Every 3-5 min' },
      { step: 3, action: 'DO NOT defibrillate asystole' },
      { step: 4, action: 'Search for reversible causes (Hs and Ts)' },
      { step: 5, action: 'Consider termination if no ROSC after 20+ min' },
    ],
    urgency: 'immediate',
  },
  {
    id: 'pea',
    name: 'Pulseless Electrical Activity (PEA)',
    category: 'arrest',
    description: 'Organized rhythm on monitor but no palpable pulse',
    ecgFeatures: [
      'Organized electrical activity visible',
      'Can look like any rhythm',
      'No palpable pulse',
      'Often wide, slow complexes',
    ],
    causes: [
      'Hypovolemia',
      'Hypoxia',
      'Hydrogen ion (acidosis)',
      'Hypo/hyperkalemia',
      'Hypothermia',
      'Tension pneumothorax',
      'Tamponade (cardiac)',
      'Toxins',
      'Thrombosis (pulmonary/coronary)',
    ],
    electrolyteCauses: ['Hyperkalemia', 'Hypokalemia', 'Hypocalcemia'],
    treatment: [
      { step: 1, action: 'Start CPR immediately' },
      { step: 2, action: 'Epinephrine IV/IO', dose: '0.01 mg/kg', notes: 'Every 3-5 min' },
      { step: 3, action: 'DO NOT defibrillate PEA' },
      { step: 4, action: 'Aggressively search for and treat reversible causes' },
      { step: 5, action: 'Fluid bolus if hypovolemia suspected', dose: '20 mL/kg' },
      { step: 6, action: 'Needle decompression if tension pneumothorax suspected' },
    ],
    urgency: 'immediate',
  },
];

// Electrolyte correction protocols
const ELECTROLYTE_CORRECTIONS = {
  hyperkalemia: {
    name: 'Hyperkalemia Treatment',
    steps: [
      { action: 'Calcium gluconate 10%', dose: '0.5 mL/kg IV over 5-10 min', notes: 'Cardioprotection - does not lower K+' },
      { action: 'Insulin + Dextrose', dose: 'Insulin 0.1 U/kg + D25W 2 mL/kg', notes: 'Shifts K+ intracellularly' },
      { action: 'Salbutamol nebulized', dose: '2.5-5 mg', notes: 'Shifts K+ intracellularly' },
      { action: 'Sodium bicarbonate', dose: '1-2 mEq/kg IV', notes: 'If acidotic' },
      { action: 'Consider dialysis', notes: 'If refractory or K+ >7 mmol/L' },
    ],
  },
  hypokalemia: {
    name: 'Hypokalemia Treatment',
    steps: [
      { action: 'IV Potassium chloride', dose: '0.5 mmol/kg over 1 hour', notes: 'Max rate 0.5 mmol/kg/hr via central line' },
      { action: 'Cardiac monitoring required' },
      { action: 'Check and correct magnesium', notes: 'Hypomagnesemia impairs K+ correction' },
    ],
  },
  hypomagnesemia: {
    name: 'Hypomagnesemia Treatment',
    steps: [
      { action: 'Magnesium sulfate', dose: '25-50 mg/kg IV over 20 min', notes: 'Max 2g' },
      { action: 'For Torsades: faster infusion over 1-2 min' },
    ],
  },
  hypocalcemia: {
    name: 'Hypocalcemia Treatment',
    steps: [
      { action: 'Calcium gluconate 10%', dose: '0.5 mL/kg IV over 10 min', notes: 'Max 20 mL' },
      { action: 'Calcium chloride 10%', dose: '0.2 mL/kg IV', notes: 'Central line preferred - caustic' },
    ],
  },
};

const ArrhythmiaRecognition: React.FC<ArrhythmiaRecognitionProps> = ({
  patientWeight,
  patientAge,
  onTreatmentSelected,
}) => {
  const [selectedArrhythmia, setSelectedArrhythmia] = useState<ArrhythmiaPattern | null>(null);
  const [showElectrolytes, setShowElectrolytes] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bradycardia': return 'bg-blue-600';
      case 'tachycardia': return 'bg-orange-600';
      case 'arrest': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'text-red-400 bg-red-900/30';
      case 'urgent': return 'text-yellow-400 bg-yellow-900/30';
      default: return 'text-green-400 bg-green-900/30';
    }
  };
  
  const calculateDose = (doseTemplate: string): string => {
    if (!doseTemplate) return '';
    
    // Replace weight-based calculations
    let dose = doseTemplate;
    
    // Epinephrine 0.01 mg/kg
    if (dose.includes('0.01 mg/kg')) {
      const epinephrineDose = (patientWeight * 0.01).toFixed(3);
      const volume = (patientWeight * 0.1).toFixed(1);
      dose = dose.replace('0.01 mg/kg', `${epinephrineDose} mg`);
      dose = dose.replace('0.1 mL/kg of 1:10,000', `${volume} mL of 1:10,000`);
    }
    
    // Adenosine
    if (dose.includes('0.1 mg/kg')) {
      const adenosineDose = Math.min(patientWeight * 0.1, 6).toFixed(1);
      dose = dose.replace('0.1 mg/kg', `${adenosineDose} mg`);
    }
    if (dose.includes('0.2 mg/kg')) {
      const adenosineDose = Math.min(patientWeight * 0.2, 12).toFixed(1);
      dose = dose.replace('0.2 mg/kg', `${adenosineDose} mg`);
    }
    
    // Amiodarone
    if (dose.includes('5 mg/kg')) {
      const amiodaroneDose = (patientWeight * 5).toFixed(0);
      dose = dose.replace('5 mg/kg', `${amiodaroneDose} mg`);
    }
    
    // Atropine
    if (dose.includes('0.02 mg/kg')) {
      const atropineDose = Math.max(0.1, Math.min(patientWeight * 0.02, patientAge < 12 ? 0.5 : 1)).toFixed(2);
      dose = dose.replace('0.02 mg/kg', `${atropineDose} mg`);
    }
    
    // Cardioversion
    if (dose.includes('J/kg')) {
      const joules1 = (patientWeight * 0.5).toFixed(0);
      const joules2 = (patientWeight * 1).toFixed(0);
      const joules4 = (patientWeight * 2).toFixed(0);
      dose = dose.replace('0.5-1 J/kg', `${joules1}-${joules2} J`);
      dose = dose.replace('2 J/kg', `${joules4} J`);
    }
    
    // Defibrillation
    if (dose.includes('2 J/kg first')) {
      const joules2 = (patientWeight * 2).toFixed(0);
      const joules4 = (patientWeight * 4).toFixed(0);
      dose = `${joules2} J first shock, ${joules4} J subsequent`;
    }
    
    // Magnesium
    if (dose.includes('25-50 mg/kg')) {
      const mgLow = (patientWeight * 25).toFixed(0);
      const mgHigh = Math.min(patientWeight * 50, 2000).toFixed(0);
      dose = dose.replace('25-50 mg/kg', `${mgLow}-${mgHigh} mg`);
    }
    
    // Fluid bolus
    if (dose.includes('20 mL/kg')) {
      const fluidVolume = (patientWeight * 20).toFixed(0);
      dose = dose.replace('20 mL/kg', `${fluidVolume} mL`);
    }
    
    // Procainamide
    if (dose.includes('15 mg/kg')) {
      const procainamideDose = (patientWeight * 15).toFixed(0);
      dose = dose.replace('15 mg/kg', `${procainamideDose} mg`);
    }
    
    return dose;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-slate-800/90 border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Arrhythmia Recognition</h3>
              <p className="text-slate-400 text-sm">Identify rhythm and get treatment pathway</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowElectrolytes(!showElectrolytes)}
            className={`border-slate-600 ${showElectrolytes ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
          >
            <Zap className="h-4 w-4 mr-1" />
            Electrolyte Corrections
          </Button>
        </div>
      </Card>
      
      {/* Electrolyte Correction Protocols */}
      {showElectrolytes && (
        <Card className="bg-cyan-900/30 border-cyan-600 p-4">
          <h4 className="text-white font-bold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            Electrolyte Correction Protocols
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ELECTROLYTE_CORRECTIONS).map(([key, protocol]) => (
              <div key={key} className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-cyan-300 font-semibold mb-2">{protocol.name}</h5>
                <ol className="space-y-2">
                  {protocol.steps.map((step, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="text-white">{step.action}</span>
                      {step.dose && (
                        <span className="text-yellow-300 block ml-4">
                          Dose: {calculateDose(step.dose)}
                        </span>
                      )}
                      {step.notes && (
                        <span className="text-slate-400 block ml-4 text-xs">{step.notes}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Rhythm Selection */}
      {!selectedArrhythmia && (
        <div className="space-y-4">
          {/* Arrest Rhythms - Most Critical First */}
          <div>
            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Arrest Rhythms (Shockable & Non-Shockable)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ARRHYTHMIA_PATTERNS.filter(p => p.category === 'arrest').map(pattern => (
                <Button
                  key={pattern.id}
                  variant="outline"
                  onClick={() => setSelectedArrhythmia(pattern)}
                  className="h-auto py-3 px-4 border-red-600 bg-red-900/20 hover:bg-red-900/40 text-left justify-start"
                >
                  <div>
                    <span className="text-white font-medium block">{pattern.name}</span>
                    <span className="text-red-300 text-xs">{pattern.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Tachycardias */}
          <div>
            <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tachyarrhythmias
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ARRHYTHMIA_PATTERNS.filter(p => p.category === 'tachycardia').map(pattern => (
                <Button
                  key={pattern.id}
                  variant="outline"
                  onClick={() => setSelectedArrhythmia(pattern)}
                  className="h-auto py-3 px-4 border-orange-600 bg-orange-900/20 hover:bg-orange-900/40 text-left justify-start"
                >
                  <div>
                    <span className="text-white font-medium block">{pattern.name}</span>
                    <span className="text-orange-300 text-xs">{pattern.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Bradycardias */}
          <div>
            <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bradyarrhythmias
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ARRHYTHMIA_PATTERNS.filter(p => p.category === 'bradycardia').map(pattern => (
                <Button
                  key={pattern.id}
                  variant="outline"
                  onClick={() => setSelectedArrhythmia(pattern)}
                  className="h-auto py-3 px-4 border-blue-600 bg-blue-900/20 hover:bg-blue-900/40 text-left justify-start"
                >
                  <div>
                    <span className="text-white font-medium block">{pattern.name}</span>
                    <span className="text-blue-300 text-xs">{pattern.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Selected Arrhythmia Detail */}
      {selectedArrhythmia && (
        <Card className={`border-2 p-4 ${
          selectedArrhythmia.category === 'arrest' ? 'bg-red-900/30 border-red-500' :
          selectedArrhythmia.category === 'tachycardia' ? 'bg-orange-900/30 border-orange-500' :
          'bg-blue-900/30 border-blue-500'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(selectedArrhythmia.category)} text-white`}>
                  {selectedArrhythmia.category.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${getUrgencyColor(selectedArrhythmia.urgency)}`}>
                  {selectedArrhythmia.urgency.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{selectedArrhythmia.name}</h3>
              <p className="text-slate-300 text-sm">{selectedArrhythmia.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedArrhythmia(null);
                setCurrentStep(0);
              }}
              className="text-slate-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
          
          {/* ECG Visual Strip */}
          <div className="mb-4">
            <ECGVisuals rhythm={selectedArrhythmia.id} size="large" />
          </div>
          
          {/* ECG Features */}
          <div className="bg-black/30 p-3 rounded-lg mb-4">
            <h4 className="text-slate-300 text-sm font-semibold mb-2">ECG Features to Identify:</h4>
            <ul className="space-y-1">
              {selectedArrhythmia.ecgFeatures.map((feature, idx) => (
                <li key={idx} className="text-white text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Causes */}
          <details className="mb-4">
            <summary className="text-slate-300 cursor-pointer hover:text-white flex items-center gap-2">
              <Info className="h-4 w-4" />
              Common Causes
            </summary>
            <div className="mt-2 pl-6 grid grid-cols-2 gap-2">
              {selectedArrhythmia.causes.map((cause, idx) => (
                <span key={idx} className="text-slate-400 text-sm">• {cause}</span>
              ))}
            </div>
            {selectedArrhythmia.electrolyteCauses && (
              <div className="mt-2 pl-6">
                <span className="text-yellow-400 text-sm font-semibold">Electrolyte causes: </span>
                <span className="text-yellow-300 text-sm">{selectedArrhythmia.electrolyteCauses.join(', ')}</span>
              </div>
            )}
          </details>
          
          {/* Treatment Steps */}
          <div className="space-y-2">
            <h4 className="text-white font-bold flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-green-400" />
              Treatment Protocol
            </h4>
            {selectedArrhythmia.treatment.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive ? 'bg-green-900/50 border-green-500' :
                    isCompleted ? 'bg-slate-700/50 border-slate-600 opacity-60' :
                    'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-green-500 text-white' :
                      isCompleted ? 'bg-slate-500 text-white' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{step.action}</p>
                      {step.dose && (
                        <p className="text-yellow-300 text-sm mt-1">
                          <strong>Dose:</strong> {calculateDose(step.dose)}
                        </p>
                      )}
                      {step.notes && (
                        <p className="text-slate-400 text-xs mt-1">{step.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setCurrentStep(currentStep + 1);
                          if (currentStep + 1 >= selectedArrhythmia.treatment.length) {
                            onTreatmentSelected?.(selectedArrhythmia.treatment, selectedArrhythmia.id);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Done - Next Step
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Electrolyte Warning */}
          {selectedArrhythmia.electrolyteCauses && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold">Check Electrolytes!</p>
                  <p className="text-yellow-200 text-sm">
                    This arrhythmia can be caused by: {selectedArrhythmia.electrolyteCauses.join(', ')}.
                    Correct electrolytes for sustained rhythm control.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ArrhythmiaRecognition;
