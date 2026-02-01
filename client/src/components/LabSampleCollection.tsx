// ============================================================================
// LAB SAMPLE COLLECTION COMPONENT
// Prompts providers to collect specific samples with interpretation guidance
// ============================================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Beaker, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info
} from 'lucide-react';

interface LabSample {
  id: string;
  name: string;
  tube: string;
  tubeColor: string;
  volume: string;
  priority: 'stat' | 'urgent' | 'routine';
  indication: string;
  timing: string;
}

interface LabResult {
  sampleId: string;
  value: number;
  unit: string;
}

interface InterpretationResult {
  status: 'critical' | 'abnormal' | 'normal';
  message: string;
  action?: string;
}

interface LabSampleCollectionProps {
  clinicalContext: 'shock' | 'respiratory' | 'neurological' | 'metabolic' | 'cardiac' | 'general';
  patientAge: number; // years
  patientWeight: number; // kg
  onSamplesCollected?: (samples: string[]) => void;
  onResultEntered?: (result: LabResult, interpretation: InterpretationResult) => void;
}

// Sample definitions by clinical context
const SAMPLE_SETS: Record<string, LabSample[]> = {
  shock: [
    { id: 'lactate', name: 'Lactate', tube: 'Grey top (fluoride)', tubeColor: 'bg-gray-400', volume: '1 mL', priority: 'stat', indication: 'Tissue perfusion marker', timing: 'Immediately on IV access' },
    { id: 'vbg', name: 'Venous Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-green-500', volume: '0.5 mL', priority: 'stat', indication: 'pH, pCO2, HCO3, BE', timing: 'Immediately on IV access' },
    { id: 'glucose', name: 'Blood Glucose', tube: 'Grey top or POC', tubeColor: 'bg-gray-400', volume: '0.3 mL', priority: 'stat', indication: 'Hypoglycemia screening', timing: 'Immediately' },
    { id: 'electrolytes', name: 'Electrolytes (Na, K, Cl, Ca)', tube: 'Green top (lithium heparin)', tubeColor: 'bg-green-500', volume: '2 mL', priority: 'stat', indication: 'Electrolyte disturbances', timing: 'With first draw' },
    { id: 'fbc', name: 'Full Blood Count', tube: 'Purple top (EDTA)', tubeColor: 'bg-purple-500', volume: '1 mL', priority: 'urgent', indication: 'Hb, WBC, platelets', timing: 'With first draw' },
    { id: 'creatinine', name: 'Creatinine/Urea', tube: 'Green top', tubeColor: 'bg-green-500', volume: '1 mL', priority: 'urgent', indication: 'Renal function', timing: 'With first draw' },
    { id: 'blood_culture', name: 'Blood Culture', tube: 'Culture bottles (aerobic + anaerobic)', tubeColor: 'bg-yellow-500', volume: '1-3 mL per bottle', priority: 'stat', indication: 'Sepsis workup', timing: 'BEFORE antibiotics' },
    { id: 'coags', name: 'Coagulation (PT/INR, APTT)', tube: 'Blue top (citrate)', tubeColor: 'bg-blue-500', volume: '2 mL', priority: 'urgent', indication: 'DIC screening', timing: 'If bleeding or DIC suspected' },
  ],
  respiratory: [
    { id: 'abg', name: 'Arterial Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-red-500', volume: '0.5 mL', priority: 'stat', indication: 'Oxygenation, ventilation status', timing: 'If severe distress or ventilated' },
    { id: 'vbg', name: 'Venous Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-green-500', volume: '0.5 mL', priority: 'stat', indication: 'pH, pCO2 (correlates with arterial)', timing: 'If ABG not feasible' },
    { id: 'glucose', name: 'Blood Glucose', tube: 'POC', tubeColor: 'bg-gray-400', volume: '0.3 mL', priority: 'stat', indication: 'Metabolic status', timing: 'Immediately' },
    { id: 'electrolytes', name: 'Electrolytes', tube: 'Green top', tubeColor: 'bg-green-500', volume: '2 mL', priority: 'urgent', indication: 'K+ (affects respiratory muscles)', timing: 'With first draw' },
  ],
  neurological: [
    { id: 'glucose', name: 'Blood Glucose', tube: 'POC', tubeColor: 'bg-gray-400', volume: '0.3 mL', priority: 'stat', indication: 'Hypoglycemia causes seizures', timing: 'Immediately' },
    { id: 'electrolytes', name: 'Electrolytes (Na, K, Ca, Mg)', tube: 'Green top', tubeColor: 'bg-green-500', volume: '2 mL', priority: 'stat', indication: 'Hyponatremia, hypocalcemia cause seizures', timing: 'Immediately' },
    { id: 'vbg', name: 'Venous Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-green-500', volume: '0.5 mL', priority: 'stat', indication: 'Metabolic acidosis, ammonia', timing: 'With first draw' },
    { id: 'ammonia', name: 'Ammonia', tube: 'Green top ON ICE', tubeColor: 'bg-green-500', volume: '1 mL', priority: 'urgent', indication: 'Hepatic encephalopathy, IEM', timing: 'If altered consciousness' },
    { id: 'anticonvulsant_levels', name: 'Anticonvulsant Levels', tube: 'Red top (serum)', tubeColor: 'bg-red-400', volume: '2 mL', priority: 'urgent', indication: 'If on anticonvulsants', timing: 'If breakthrough seizures' },
  ],
  metabolic: [
    { id: 'glucose', name: 'Blood Glucose', tube: 'POC', tubeColor: 'bg-gray-400', volume: '0.3 mL', priority: 'stat', indication: 'DKA, hypoglycemia', timing: 'Immediately' },
    { id: 'vbg', name: 'Venous Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-green-500', volume: '0.5 mL', priority: 'stat', indication: 'pH, HCO3, anion gap', timing: 'Immediately' },
    { id: 'electrolytes', name: 'Electrolytes (Na, K, Cl, Ca, Mg, PO4)', tube: 'Green top', tubeColor: 'bg-green-500', volume: '2 mL', priority: 'stat', indication: 'Corrected Na, K shifts', timing: 'Immediately' },
    { id: 'ketones', name: 'Blood Ketones (β-hydroxybutyrate)', tube: 'POC or Green top', tubeColor: 'bg-green-500', volume: '0.3 mL', priority: 'stat', indication: 'DKA confirmation', timing: 'Immediately' },
    { id: 'creatinine', name: 'Creatinine/Urea', tube: 'Green top', tubeColor: 'bg-green-500', volume: '1 mL', priority: 'urgent', indication: 'Renal function, dehydration', timing: 'With first draw' },
    { id: 'hba1c', name: 'HbA1c', tube: 'Purple top', tubeColor: 'bg-purple-500', volume: '1 mL', priority: 'routine', indication: 'New diagnosis vs known DM', timing: 'Non-urgent' },
  ],
  cardiac: [
    { id: 'electrolytes', name: 'Electrolytes (K, Ca, Mg)', tube: 'Green top', tubeColor: 'bg-green-500', volume: '2 mL', priority: 'stat', indication: 'Arrhythmia causes', timing: 'Immediately' },
    { id: 'vbg', name: 'Venous Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-green-500', volume: '0.5 mL', priority: 'stat', indication: 'Acidosis worsens arrhythmias', timing: 'Immediately' },
    { id: 'troponin', name: 'Troponin', tube: 'Red top (serum)', tubeColor: 'bg-red-400', volume: '2 mL', priority: 'urgent', indication: 'Myocardial injury', timing: 'If myocarditis suspected' },
    { id: 'bnp', name: 'BNP/NT-proBNP', tube: 'Purple top', tubeColor: 'bg-purple-500', volume: '1 mL', priority: 'urgent', indication: 'Heart failure marker', timing: 'If heart failure suspected' },
    { id: 'digoxin', name: 'Digoxin Level', tube: 'Red top', tubeColor: 'bg-red-400', volume: '2 mL', priority: 'stat', indication: 'If on digoxin', timing: 'If toxicity suspected' },
  ],
  general: [
    { id: 'glucose', name: 'Blood Glucose', tube: 'POC', tubeColor: 'bg-gray-400', volume: '0.3 mL', priority: 'stat', indication: 'Universal screening', timing: 'Immediately' },
    { id: 'vbg', name: 'Venous Blood Gas', tube: 'Heparinized syringe', tubeColor: 'bg-green-500', volume: '0.5 mL', priority: 'urgent', indication: 'Acid-base status', timing: 'With first draw' },
    { id: 'electrolytes', name: 'Electrolytes', tube: 'Green top', tubeColor: 'bg-green-500', volume: '2 mL', priority: 'urgent', indication: 'Baseline', timing: 'With first draw' },
    { id: 'fbc', name: 'Full Blood Count', tube: 'Purple top', tubeColor: 'bg-purple-500', volume: '1 mL', priority: 'urgent', indication: 'Baseline', timing: 'With first draw' },
  ],
};

// Interpretation functions
const interpretResult = (
  sampleId: string, 
  value: number, 
  patientAge: number
): InterpretationResult => {
  switch (sampleId) {
    case 'lactate':
      if (value > 4) return { status: 'critical', message: `Lactate ${value} mmol/L - Severe tissue hypoperfusion`, action: 'Aggressive fluid resuscitation, consider vasopressors' };
      if (value > 2) return { status: 'abnormal', message: `Lactate ${value} mmol/L - Elevated, tissue hypoperfusion`, action: 'Continue fluid resuscitation, reassess perfusion' };
      return { status: 'normal', message: `Lactate ${value} mmol/L - Normal` };
    
    case 'glucose':
      // Convert to mmol/L if in mg/dL
      const glucoseMmol = value > 30 ? value / 18 : value;
      if (glucoseMmol < 2.6) return { status: 'critical', message: `Glucose ${glucoseMmol.toFixed(1)} mmol/L - SEVERE HYPOGLYCEMIA`, action: 'Give D10W 2 mL/kg IV immediately' };
      if (glucoseMmol < 4.0) return { status: 'abnormal', message: `Glucose ${glucoseMmol.toFixed(1)} mmol/L - Hypoglycemia`, action: 'Give oral glucose or IV dextrose' };
      if (glucoseMmol > 14) return { status: 'critical', message: `Glucose ${glucoseMmol.toFixed(1)} mmol/L - Severe hyperglycemia`, action: 'Consider DKA protocol, check ketones' };
      if (glucoseMmol > 11) return { status: 'abnormal', message: `Glucose ${glucoseMmol.toFixed(1)} mmol/L - Hyperglycemia`, action: 'Monitor, consider insulin if persistent' };
      return { status: 'normal', message: `Glucose ${glucoseMmol.toFixed(1)} mmol/L - Normal` };
    
    case 'potassium':
      if (value < 2.5) return { status: 'critical', message: `K+ ${value} mmol/L - SEVERE HYPOKALEMIA`, action: 'IV KCl 0.5 mmol/kg over 1 hour with cardiac monitoring' };
      if (value < 3.5) return { status: 'abnormal', message: `K+ ${value} mmol/L - Hypokalemia`, action: 'Oral or IV potassium replacement' };
      if (value > 6.5) return { status: 'critical', message: `K+ ${value} mmol/L - SEVERE HYPERKALEMIA`, action: 'Calcium gluconate, insulin/dextrose, salbutamol neb, consider dialysis' };
      if (value > 5.5) return { status: 'abnormal', message: `K+ ${value} mmol/L - Hyperkalemia`, action: 'ECG, stop K+ containing fluids, consider treatment' };
      return { status: 'normal', message: `K+ ${value} mmol/L - Normal` };
    
    case 'sodium':
      if (value < 120) return { status: 'critical', message: `Na+ ${value} mmol/L - SEVERE HYPONATREMIA`, action: '3% NaCl 2-3 mL/kg over 10-15 min if symptomatic' };
      if (value < 130) return { status: 'abnormal', message: `Na+ ${value} mmol/L - Hyponatremia`, action: 'Fluid restriction, investigate cause' };
      if (value > 160) return { status: 'critical', message: `Na+ ${value} mmol/L - SEVERE HYPERNATREMIA`, action: 'Slow correction with hypotonic fluids (max 0.5 mmol/L/hr)' };
      if (value > 150) return { status: 'abnormal', message: `Na+ ${value} mmol/L - Hypernatremia`, action: 'Free water deficit calculation, slow correction' };
      return { status: 'normal', message: `Na+ ${value} mmol/L - Normal` };
    
    case 'calcium':
      // Ionized calcium
      if (value < 0.9) return { status: 'critical', message: `iCa ${value} mmol/L - SEVERE HYPOCALCEMIA`, action: 'Calcium gluconate 10% 0.5 mL/kg IV over 10 min' };
      if (value < 1.1) return { status: 'abnormal', message: `iCa ${value} mmol/L - Hypocalcemia`, action: 'IV or oral calcium replacement' };
      if (value > 1.4) return { status: 'abnormal', message: `iCa ${value} mmol/L - Hypercalcemia`, action: 'IV fluids, investigate cause' };
      return { status: 'normal', message: `iCa ${value} mmol/L - Normal` };
    
    case 'magnesium':
      if (value < 0.5) return { status: 'critical', message: `Mg ${value} mmol/L - SEVERE HYPOMAGNESEMIA`, action: 'MgSO4 25-50 mg/kg IV over 20 min' };
      if (value < 0.7) return { status: 'abnormal', message: `Mg ${value} mmol/L - Hypomagnesemia`, action: 'IV or oral magnesium replacement' };
      return { status: 'normal', message: `Mg ${value} mmol/L - Normal` };
    
    case 'ph':
      if (value < 7.1) return { status: 'critical', message: `pH ${value} - SEVERE ACIDOSIS`, action: 'Identify cause (respiratory vs metabolic), consider bicarbonate if pH <7.0' };
      if (value < 7.35) return { status: 'abnormal', message: `pH ${value} - Acidosis`, action: 'Identify and treat underlying cause' };
      if (value > 7.55) return { status: 'abnormal', message: `pH ${value} - Alkalosis`, action: 'Identify cause, usually respiratory' };
      return { status: 'normal', message: `pH ${value} - Normal` };
    
    case 'pco2':
      if (value > 70) return { status: 'critical', message: `pCO2 ${value} mmHg - SEVERE HYPERCAPNIA`, action: 'Assist ventilation, consider intubation' };
      if (value > 50) return { status: 'abnormal', message: `pCO2 ${value} mmHg - Hypercapnia`, action: 'Optimize ventilation, consider NIV' };
      if (value < 25) return { status: 'abnormal', message: `pCO2 ${value} mmHg - Hypocapnia`, action: 'Usually compensatory, check pH' };
      return { status: 'normal', message: `pCO2 ${value} mmHg - Normal` };
    
    case 'hco3':
      if (value < 10) return { status: 'critical', message: `HCO3 ${value} mmol/L - SEVERE METABOLIC ACIDOSIS`, action: 'Calculate anion gap, identify cause' };
      if (value < 18) return { status: 'abnormal', message: `HCO3 ${value} mmol/L - Metabolic acidosis`, action: 'Calculate anion gap, treat cause' };
      if (value > 30) return { status: 'abnormal', message: `HCO3 ${value} mmol/L - Metabolic alkalosis`, action: 'Usually from vomiting or diuretics' };
      return { status: 'normal', message: `HCO3 ${value} mmol/L - Normal` };
    
    case 'hemoglobin':
      if (value < 5) return { status: 'critical', message: `Hb ${value} g/dL - SEVERE ANEMIA`, action: 'Urgent blood transfusion 10-15 mL/kg' };
      if (value < 7) return { status: 'abnormal', message: `Hb ${value} g/dL - Moderate anemia`, action: 'Consider transfusion if symptomatic' };
      return { status: 'normal', message: `Hb ${value} g/dL - Acceptable` };
    
    case 'ketones':
      if (value > 3) return { status: 'critical', message: `Ketones ${value} mmol/L - Significant ketosis`, action: 'DKA protocol if glucose elevated' };
      if (value > 1) return { status: 'abnormal', message: `Ketones ${value} mmol/L - Mild ketosis`, action: 'Monitor, ensure adequate glucose intake' };
      return { status: 'normal', message: `Ketones ${value} mmol/L - Normal` };
    
    default:
      return { status: 'normal', message: `Value: ${value}` };
  }
};

const LabSampleCollection: React.FC<LabSampleCollectionProps> = ({
  clinicalContext,
  patientAge,
  patientWeight,
  onSamplesCollected,
  onResultEntered,
}) => {
  const [collectedSamples, setCollectedSamples] = useState<Set<string>>(new Set());
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});
  const [showResultEntry, setShowResultEntry] = useState<string | null>(null);
  
  const samples = SAMPLE_SETS[clinicalContext] || SAMPLE_SETS.general;
  
  const handleCollect = (sampleId: string) => {
    const newCollected = new Set(collectedSamples);
    newCollected.add(sampleId);
    setCollectedSamples(newCollected);
    onSamplesCollected?.(Array.from(newCollected));
  };
  
  const handleResultEntry = (sampleId: string, value: number) => {
    setResults({ ...results, [sampleId]: value });
    const interpretation = interpretResult(sampleId, value, patientAge);
    onResultEntered?.({ sampleId, value, unit: '' }, interpretation);
    setShowResultEntry(null);
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'text-red-400 bg-red-900/30';
      case 'urgent': return 'text-yellow-400 bg-yellow-900/30';
      default: return 'text-slate-400 bg-slate-700/30';
    }
  };

  return (
    <Card className="bg-slate-800/90 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Beaker className="h-6 w-6 text-cyan-400" />
        <div>
          <h3 className="text-lg font-bold text-white">Lab Sample Collection</h3>
          <p className="text-slate-400 text-sm">
            {clinicalContext.charAt(0).toUpperCase() + clinicalContext.slice(1)} workup
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {samples.map((sample) => {
          const isCollected = collectedSamples.has(sample.id);
          const hasResult = results[sample.id] !== undefined;
          const interpretation = hasResult 
            ? interpretResult(sample.id, results[sample.id], patientAge)
            : null;
          
          return (
            <div key={sample.id} className="border border-slate-600 rounded-lg overflow-hidden">
              {/* Sample Header */}
              <div 
                className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 ${
                  isCollected ? 'bg-slate-700/30' : ''
                }`}
                onClick={() => setExpandedSample(expandedSample === sample.id ? null : sample.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Tube Color Indicator */}
                  <div className={`w-3 h-8 rounded ${sample.tubeColor}`} />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{sample.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(sample.priority)}`}>
                        {sample.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{sample.tube} • {sample.volume}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isCollected && (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  )}
                  {hasResult && interpretation && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      interpretation.status === 'critical' ? 'bg-red-600 text-white' :
                      interpretation.status === 'abnormal' ? 'bg-yellow-600 text-black' :
                      'bg-green-600 text-white'
                    }`}>
                      {interpretation.status === 'critical' ? 'CRITICAL' :
                       interpretation.status === 'abnormal' ? 'ABNORMAL' : 'NORMAL'}
                    </span>
                  )}
                  {expandedSample === sample.id ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedSample === sample.id && (
                <div className="p-3 bg-slate-900/50 border-t border-slate-600 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Indication</p>
                      <p className="text-white">{sample.indication}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Timing</p>
                      <p className="text-white">{sample.timing}</p>
                    </div>
                  </div>
                  
                  {/* Result Entry */}
                  {showResultEntry === sample.id ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter result value"
                        className="bg-slate-700 border-slate-600 text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(value)) handleResultEntry(sample.id, value);
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResultEntry(null)}
                        className="border-slate-600 text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {!isCollected && (
                        <Button
                          size="sm"
                          onClick={() => handleCollect(sample.id)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Mark Collected
                        </Button>
                      )}
                      {isCollected && !hasResult && (
                        <Button
                          size="sm"
                          onClick={() => setShowResultEntry(sample.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Enter Result
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Result Interpretation */}
                  {hasResult && interpretation && (
                    <div className={`p-3 rounded-lg ${
                      interpretation.status === 'critical' ? 'bg-red-900/50 border border-red-500' :
                      interpretation.status === 'abnormal' ? 'bg-yellow-900/50 border border-yellow-500' :
                      'bg-green-900/50 border border-green-500'
                    }`}>
                      <div className="flex items-start gap-2">
                        {interpretation.status === 'critical' ? (
                          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        ) : interpretation.status === 'abnormal' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-white font-medium">{interpretation.message}</p>
                          {interpretation.action && (
                            <p className="text-slate-300 text-sm mt-1">
                              <strong>Action:</strong> {interpretation.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Collected: {collectedSamples.size} / {samples.length}
          </span>
          <span className="text-slate-400">
            Results: {Object.keys(results).length} / {collectedSamples.size}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default LabSampleCollection;
