// ============================================================================
// PROVIDER TRAINING MODE
// Guided walkthroughs for learning the clinical decision support system
// ============================================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Play,
  BookOpen,
  Target,
  Clock,
  AlertCircle,
  Heart,
  Droplets,
  Activity,
  Syringe,
  Stethoscope
} from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  steps: TrainingStep[];
}

interface TrainingStep {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  practicePrompt?: string;
  image?: string;
}

const trainingModules: TrainingModule[] = [
  {
    id: 'shock_assessment',
    title: 'Shock Assessment & Differentiation',
    description: 'Learn to rapidly identify and differentiate types of shock in pediatric patients',
    icon: <Droplets className="h-6 w-6" />,
    duration: '15 min',
    steps: [
      {
        id: 'shock_intro',
        title: 'What is Shock?',
        content: 'Shock is inadequate tissue perfusion and oxygen delivery. In children, compensated shock can maintain blood pressure until late - look for early signs!',
        keyPoints: [
          'Shock = inadequate oxygen delivery to tissues',
          'Children compensate well - BP drops LATE',
          'Early signs: tachycardia, prolonged CRT, altered mental status',
          'Hypotension = DECOMPENSATED shock (late finding)'
        ]
      },
      {
        id: 'shock_types',
        title: 'Types of Shock',
        content: 'There are 4 main types of shock, each requiring different treatment approaches.',
        keyPoints: [
          'HYPOVOLEMIC: Volume loss (diarrhea, bleeding, burns)',
          'DISTRIBUTIVE: Vasodilation (sepsis, anaphylaxis)',
          'CARDIOGENIC: Pump failure (myocarditis, arrhythmia)',
          'OBSTRUCTIVE: Flow obstruction (tension pneumothorax, PE)'
        ]
      },
      {
        id: 'shock_assessment_steps',
        title: 'Systematic Assessment',
        content: 'Use this systematic approach to assess perfusion and identify shock type.',
        keyPoints: [
          '1. Central vs peripheral pulses - weak peripherals = early shock',
          '2. Capillary refill time - >2 seconds is abnormal',
          '3. Skin color and temperature - cool extremities, mottling',
          '4. Temperature gradient - note where warm becomes cool',
          '5. Mental status - irritability, lethargy',
          '6. Urine output - ask about diaper frequency'
        ],
        practicePrompt: 'Practice: Assess CRT on your own hand - press nail bed for 5 seconds, release, count seconds to pink return'
      },
      {
        id: 'shock_history',
        title: 'History Clues for Shock Type',
        content: 'The history often reveals the shock type before examination.',
        keyPoints: [
          'Diarrhea/vomiting → Hypovolemic',
          'Fever + sick appearance → Septic (distributive)',
          'Allergic exposure + hives → Anaphylaxis (distributive)',
          'Known heart disease → Cardiogenic',
          'Trauma → Hypovolemic or obstructive',
          'Polyuria + fruity breath → DKA (hypovolemic)'
        ]
      },
      {
        id: 'shock_cold_warm',
        title: 'Cold vs Warm Shock',
        content: 'Differentiating cold from warm shock guides vasopressor choice.',
        keyPoints: [
          'COLD SHOCK: Vasoconstricted, cool extremities, weak pulses',
          '→ Treat with: Epinephrine (inotrope + vasoconstrictor)',
          'WARM SHOCK: Vasodilated, warm extremities, bounding pulses',
          '→ Treat with: Norepinephrine (vasoconstrictor)',
          'Most pediatric septic shock starts as COLD shock'
        ]
      }
    ]
  },
  {
    id: 'iv_io_access',
    title: 'IV/IO Access in Emergencies',
    description: 'Master the 90-second rule and IO insertion technique',
    icon: <Syringe className="h-6 w-6" />,
    duration: '12 min',
    steps: [
      {
        id: 'access_importance',
        title: 'Why Access Matters',
        content: 'Vascular access is the rate-limiting step in pediatric resuscitation. Children die waiting for IV access.',
        keyPoints: [
          'No access = no drugs, no fluids',
          'Peripheral IV is difficult in shocked children (vasoconstriction)',
          'IO is faster and equally effective',
          'The 90-second rule saves lives'
        ]
      },
      {
        id: 'ninety_second_rule',
        title: 'The 90-Second Rule',
        content: 'If IV access is not obtained within 90 seconds (or 2 attempts), immediately switch to IO.',
        keyPoints: [
          'Start timer when IV attempt begins',
          'Maximum 2 IV attempts OR 90 seconds total',
          'After 90 seconds → IO immediately',
          'Do NOT keep trying IV in a crashing patient',
          'IO works for ALL resuscitation drugs and fluids'
        ],
        practicePrompt: 'Practice: Set a 90-second timer on your phone. Visualize: if IV not in by timer end, you are placing IO.'
      },
      {
        id: 'io_sites',
        title: 'IO Insertion Sites',
        content: 'Know the preferred sites by age and contraindications.',
        keyPoints: [
          'PROXIMAL TIBIA: 1-2 cm below tibial tuberosity, medial flat surface',
          '→ Preferred in infants and young children',
          'DISTAL TIBIA: 1-2 cm above medial malleolus',
          '→ Alternative site, good in older children',
          'DISTAL FEMUR: Midline, 1-2 cm above patella',
          '→ Alternative if tibia unavailable'
        ]
      },
      {
        id: 'io_technique',
        title: 'IO Insertion Technique',
        content: 'Step-by-step IO insertion for manual needles.',
        keyPoints: [
          '1. Identify landmark, clean with antiseptic',
          '2. Stabilize leg, do NOT place hand behind leg',
          '3. Insert needle perpendicular to bone (90°)',
          '4. Use twisting motion with firm pressure',
          '5. Feel "pop" as you enter marrow cavity',
          '6. Remove stylet, confirm placement',
          '7. Flush with 5-10 mL saline, check for extravasation',
          '8. Secure needle, begin infusion'
        ]
      },
      {
        id: 'io_contraindications',
        title: 'IO Contraindications',
        content: 'Know when NOT to use a specific site.',
        keyPoints: [
          'Fracture in target bone',
          'Previous IO in same bone (within 24-48 hours)',
          'Infection at insertion site',
          'Inability to identify landmarks',
          'Osteogenesis imperfecta (relative)',
          'If one site fails → use different bone'
        ]
      }
    ]
  },
  {
    id: 'fluid_resuscitation',
    title: 'Fluid Bolus Tracking',
    description: 'Learn to give fluids safely with mandatory reassessment',
    icon: <Activity className="h-6 w-6" />,
    duration: '10 min',
    steps: [
      {
        id: 'fluid_basics',
        title: 'Fluid Resuscitation Basics',
        content: 'Fluid boluses are life-saving but require careful monitoring to avoid overload.',
        keyPoints: [
          'Standard bolus: 10-20 mL/kg crystalloid',
          'Give over 5-20 minutes depending on severity',
          'Ringer\'s Lactate preferred over Normal Saline',
          'MUST reassess after EVERY bolus',
          'Total fluid limit varies by shock type'
        ]
      },
      {
        id: 'fluid_reassessment',
        title: 'Mandatory Reassessment Signs',
        content: 'After each bolus, systematically check these 9 signs.',
        keyPoints: [
          '1. Heart rate - should decrease if responding',
          '2. Capillary refill - should improve (<2 sec)',
          '3. Peripheral pulses - should strengthen',
          '4. Mental status - should improve',
          '5. Urine output - should increase',
          '6. Liver size - enlarging = overload',
          '7. Lung sounds - crackles = overload',
          '8. JVD - distension = overload',
          '9. SpO2 - dropping = possible overload'
        ],
        practicePrompt: 'Practice: Say these 9 signs out loud: HR, CRT, pulses, mental status, urine, liver, lungs, JVD, SpO2'
      },
      {
        id: 'fluid_overload',
        title: 'Recognizing Fluid Overload',
        content: 'Stop fluids and consider inotropes if overload signs appear.',
        keyPoints: [
          'Hepatomegaly (liver edge below costal margin)',
          'Pulmonary crackles/rales',
          'Jugular venous distension',
          'Worsening SpO2 despite oxygen',
          'Periorbital or pedal edema',
          'If overloaded but still shocked → INOTROPES'
        ]
      },
      {
        id: 'fluid_limits',
        title: 'Fluid Limits by Shock Type',
        content: 'Different shock types have different fluid tolerance.',
        keyPoints: [
          'HYPOVOLEMIC: May need 40-60+ mL/kg',
          'SEPTIC: Usually 40-60 mL/kg, then inotropes',
          'CARDIOGENIC: SMALL boluses only (5-10 mL/kg)',
          '→ Early inotropes in cardiogenic shock',
          'ANAPHYLAXIS: May need large volumes + epinephrine'
        ]
      }
    ]
  },
  {
    id: 'asthma_escalation',
    title: 'Asthma Escalation Pathway',
    description: 'Master the stepwise approach from salbutamol to ventilation',
    icon: <Stethoscope className="h-6 w-6" />,
    duration: '12 min',
    steps: [
      {
        id: 'asthma_severity',
        title: 'Assessing Asthma Severity',
        content: 'Severity guides treatment escalation.',
        keyPoints: [
          'MILD: Speaks sentences, SpO2 >94%, no accessory muscles',
          'MODERATE: Speaks phrases, SpO2 90-94%, some accessory use',
          'SEVERE: Speaks words only, SpO2 <90%, significant accessory use',
          'LIFE-THREATENING: Silent chest, cyanosis, exhaustion, confusion'
        ]
      },
      {
        id: 'asthma_first_line',
        title: 'First-Line Treatment',
        content: 'Start with bronchodilators and steroids.',
        keyPoints: [
          'SALBUTAMOL: 2.5mg (<5yr) or 5mg (≥5yr) nebulized',
          '→ Can repeat every 20 min x3, then hourly',
          'IPRATROPIUM: 250mcg (<5yr) or 500mcg (≥5yr) nebulized',
          '→ Add to salbutamol for moderate-severe',
          'STEROIDS: Prednisolone 1-2 mg/kg PO (max 60mg)',
          '→ Or Dexamethasone 0.6 mg/kg PO (max 16mg)',
          '→ Or Hydrocortisone 4 mg/kg IV if unable to take PO'
        ]
      },
      {
        id: 'asthma_second_line',
        title: 'Second-Line: Magnesium',
        content: 'If not responding to first-line, add IV magnesium.',
        keyPoints: [
          'MAGNESIUM SULFATE: 50 mg/kg IV over 20 minutes',
          'Maximum dose: 2 grams',
          'Smooth muscle relaxant - works on bronchi',
          'Monitor for hypotension during infusion',
          'Can cause flushing, warmth - this is normal'
        ]
      },
      {
        id: 'asthma_third_line',
        title: 'Third-Line: IV Bronchodilators',
        content: 'For refractory cases, escalate to IV therapy.',
        keyPoints: [
          'SALBUTAMOL IV: 5-15 mcg/kg bolus, then 1-5 mcg/kg/min',
          '→ Monitor for tachycardia, hypokalemia',
          'AMINOPHYLLINE: 5 mg/kg loading over 20 min',
          '→ Then 0.5-1 mg/kg/hr infusion',
          '→ Narrow therapeutic window - monitor levels',
          'KETAMINE: 1-2 mg/kg IV for severe bronchospasm',
          '→ Bronchodilator + sedative properties'
        ]
      },
      {
        id: 'asthma_ventilation',
        title: 'Mechanical Ventilation',
        content: 'Last resort - specific settings for asthma.',
        keyPoints: [
          'Indication: Exhaustion, apnea, deteriorating despite max therapy',
          'Use KETAMINE for induction (bronchodilator)',
          'Settings: Low RR (10-15), long expiratory time',
          'I:E ratio 1:3 or 1:4 (allow full exhalation)',
          'Permissive hypercapnia acceptable (CO2 up to 60-80)',
          'Watch for auto-PEEP and air trapping'
        ]
      }
    ]
  },
  {
    id: 'arrhythmia_recognition',
    title: 'Pediatric Arrhythmia Recognition',
    description: 'Learn to identify and treat common pediatric arrhythmias',
    icon: <Heart className="h-6 w-6" />,
    duration: '15 min',
    steps: [
      {
        id: 'rhythm_approach',
        title: 'Systematic Rhythm Analysis',
        content: 'Use this approach for every rhythm strip.',
        keyPoints: [
          '1. Is there a pulse? (If no → arrest algorithm)',
          '2. Is the rate fast, slow, or normal?',
          '3. Is the rhythm regular or irregular?',
          '4. Are QRS complexes narrow (<120ms) or wide?',
          '5. Are P waves present and related to QRS?'
        ]
      },
      {
        id: 'arrest_rhythms',
        title: 'Arrest Rhythms (No Pulse)',
        content: 'Four rhythms seen in cardiac arrest.',
        keyPoints: [
          'VF (Ventricular Fibrillation): Chaotic, no QRS → SHOCK',
          'pVT (Pulseless VT): Wide, fast, regular → SHOCK',
          'Asystole: Flat line → CPR + Epinephrine',
          'PEA: Organized rhythm but NO PULSE → CPR + Epinephrine',
          'SHOCKABLE: VF, pVT | NON-SHOCKABLE: Asystole, PEA'
        ]
      },
      {
        id: 'svt_recognition',
        title: 'SVT Recognition',
        content: 'Most common pathological tachycardia in children.',
        keyPoints: [
          'Rate: Usually >220 in infants, >180 in children',
          'Rhythm: Regular, "metronome-like"',
          'QRS: Narrow (unless aberrant conduction)',
          'P waves: Usually not visible (buried in T waves)',
          'Onset: Sudden (not gradual like sinus tach)',
          'History: May have pallor, poor feeding, irritability'
        ]
      },
      {
        id: 'svt_treatment',
        title: 'SVT Treatment',
        content: 'Stepwise approach to SVT.',
        keyPoints: [
          '1. Vagal maneuvers: Ice to face (infant), Valsalva (older)',
          '2. Adenosine 0.1 mg/kg rapid IV push (max 6mg)',
          '→ Must be RAPID push followed by flush',
          '3. If no response: Adenosine 0.2 mg/kg (max 12mg)',
          '4. If unstable: Synchronized cardioversion 0.5-1 J/kg',
          '5. Consider: Amiodarone, procainamide, or expert consult'
        ]
      },
      {
        id: 'bradycardia_approach',
        title: 'Bradycardia Approach',
        content: 'In children, bradycardia is usually hypoxic.',
        keyPoints: [
          'FIRST: Optimize oxygenation and ventilation',
          'Most pediatric bradycardia = HYPOXIA',
          'If HR <60 with poor perfusion despite O2 → CPR',
          'Epinephrine 0.01 mg/kg IV/IO',
          'Atropine 0.02 mg/kg if vagal cause suspected',
          'Pacing rarely needed in children'
        ]
      }
    ]
  }
];

export const ProviderTrainingMode: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  const handleStartModule = (module: TrainingModule) => {
    setSelectedModule(module);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (selectedModule && currentStepIndex < selectedModule.steps.length - 1) {
      const currentStep = selectedModule.steps[currentStepIndex];
      setCompletedSteps(prev => new Set([...Array.from(prev), currentStep.id]));
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (selectedModule) {
      // Complete module
      const currentStep = selectedModule.steps[currentStepIndex];
      setCompletedSteps(prev => new Set([...Array.from(prev), currentStep.id]));
      setCompletedModules(prev => new Set([...Array.from(prev), selectedModule.id]));
      setSelectedModule(null);
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleExitModule = () => {
    setSelectedModule(null);
    setCurrentStepIndex(0);
  };

  // Module selection view
  if (!selectedModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-emerald-600/20 px-4 py-2 rounded-full mb-4">
              <GraduationCap className="h-6 w-6 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Training Mode</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Provider Training
            </h1>
            <p className="text-slate-400">
              Learn the clinical decision support system before using it in real emergencies
            </p>
          </div>

          {/* Progress Summary */}
          <Card className="bg-slate-800/50 border-slate-700 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Training Progress</p>
                <p className="text-white font-semibold">
                  {completedModules.size} of {trainingModules.length} modules completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Estimated Time</p>
                <p className="text-white font-semibold">~1 hour total</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(completedModules.size / trainingModules.length) * 100}%` }}
              />
            </div>
          </Card>

          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainingModules.map((module) => {
              const isCompleted = completedModules.has(module.id);
              return (
                <Card 
                  key={module.id}
                  className={`border p-4 cursor-pointer transition-all hover:border-orange-500 ${
                    isCompleted 
                      ? 'bg-emerald-900/20 border-emerald-600' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                  onClick={() => handleStartModule(module)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      isCompleted ? 'bg-emerald-600' : 'bg-orange-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-6 w-6 text-white" /> : module.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{module.title}</h3>
                      <p className="text-slate-400 text-sm mb-2">{module.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {module.steps.length} lessons
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Tips */}
          <Card className="bg-slate-800/30 border-slate-700 p-4 mt-6">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Training Tips
            </h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Complete modules in order for best learning progression</li>
              <li>• Practice the hands-on prompts when provided</li>
              <li>• Review completed modules periodically to reinforce learning</li>
              <li>• Use simulation mode after training to practice full scenarios</li>
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  // Module learning view
  const currentStep = selectedModule.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / selectedModule.steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handleExitModule}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Exit
          </Button>
          <div className="text-center">
            <p className="text-slate-400 text-sm">{selectedModule.title}</p>
            <p className="text-white text-sm">
              Lesson {currentStepIndex + 1} of {selectedModule.steps.length}
            </p>
          </div>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Content */}
        <Card className="bg-slate-800/90 border-slate-700 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-4">{currentStep.title}</h2>
          
          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            {currentStep.content}
          </p>

          {/* Key Points */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Points
            </h3>
            <ul className="space-y-2">
              {currentStep.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice Prompt */}
          {currentStep.practicePrompt && (
            <div className="bg-emerald-900/30 border border-emerald-600/50 rounded-lg p-4 mb-6">
              <h3 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                <Play className="h-5 w-5" />
                Practice Now
              </h3>
              <p className="text-emerald-200">{currentStep.practicePrompt}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </Button>
            
            <Button
              onClick={handleNextStep}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              {currentStepIndex === selectedModule.steps.length - 1 ? (
                <>
                  Complete Module
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {selectedModule.steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentStepIndex 
                  ? 'bg-orange-500 w-6' 
                  : completedSteps.has(step.id)
                    ? 'bg-emerald-500'
                    : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderTrainingMode;
