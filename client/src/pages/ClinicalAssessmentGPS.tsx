/**
 * Clinical Assessment - GPS Mode
 * 
 * This is the redesigned clinical assessment flow that works like GPS:
 * - Non-blocking interventions (actions appear but don't stop the flow)
 * - Active interventions sidebar (track all ongoing interventions)
 * - Automatic module triggers (advanced components appear as overlays)
 * - Parallel processing (multiple interventions run simultaneously)
 * 
 * DNA Compliance:
 * - Safety > Speed > Completeness (1.2.1)
 * - One patient, one moment, one best next step (1.2.6)
 * - One immediate priority action + visible timer (5.2)
 * - Mandatory reassessment after every intervention (8.1)
 * - Weight-based dosing with caps (9.1)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ShoutForHelp } from '@/components/ShoutForHelp';
import { 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Info,
  Activity,
  Heart,
  Wind,
  Droplets,
  Brain,
  Thermometer,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Zap,
  Baby,
  Shield,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import components
import { ClinicalHeader } from '@/components/clinical/ClinicalHeader';
import { 
  ActiveInterventionsSidebar, 
  ActiveIntervention,
  interventionTemplates,
  createIntervention
} from '@/components/clinical/ActiveInterventionsSidebar';
import { CPRClockStreamlined } from '@/components/CPRClockStreamlined';
import QuickStartPanel from '@/components/QuickStartPanel';
import AlertSettings from '@/components/AlertSettings';
import { HandoverModal } from '@/components/HandoverModal';
import { generateSBARHandover, SBARHandover } from '@/lib/sbarHandover';
import { initAudioContext, triggerAlert, playCountdownBeep } from '@/lib/alertSystem';

// Import advanced modules for overlay triggers
import { ShockAssessment } from '@/components/ShockAssessment';
import { AsthmaEscalation } from '@/components/AsthmaEscalation';
import { IVIOAccessTimer } from '@/components/IVIOAccessTimer';
import { FluidBolusTracker } from '@/components/FluidBolusTracker';
import { InotropeEscalation } from '@/components/InotropeEscalation';
import LabSampleCollection from '@/components/LabSampleCollection';
import ArrhythmiaRecognition from '../components/ArrhythmiaRecognition';
import { AirwayManagement } from '../components/AirwayManagement';
import { CPRSimulation } from '@/components/CPRSimulation';
import { EmergencyLauncher } from '@/components/EmergencyLauncher';
import { AdultACLS } from '@/components/AdultACLS';
import AsthmaEmergency from '@/pages/AsthmaEmergency';
import DKAProtocol from '@/pages/DKAProtocol';
import SepticShockProtocol from '@/pages/SepticShockProtocol';
import AnaphylaxisProtocol from '@/pages/AnaphylaxisProtocol';
import StatusEpilepticusProtocol from '@/pages/StatusEpilepticusProtocol';
import BronchiolitisProtocol from '@/pages/BronchiolitisProtocol';
import CroupProtocol from '@/pages/CroupProtocol';
import SeverePneumoniaProtocol from '@/pages/SeverePneumoniaProtocol';
// Types
interface PatientData {
  ageYears: number;
  ageMonths: number;
  weight: number;
  glucoseUnit: 'mmol/L' | 'mg/dL';
}

type AssessmentPhase = 
  | 'setup'
  | 'signs_of_life'
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability'
  | 'exposure'
  | 'complete';

interface ClinicalFinding {
  id: string;
  question: string;
  answer: any;
  timestamp: Date;
  phase: AssessmentPhase;
  severity?: 'normal' | 'abnormal' | 'critical';
  triggeredInterventions?: string[];
}

interface TriggeredAction {
  id: string;
  severity: 'critical' | 'urgent' | 'routine';
  title: string;
  instruction: string;
  rationale: string;
  dose?: string;
  route?: string;
  timer?: number;
  reassessAfter?: string;
  interventionTemplate?: keyof typeof interventionTemplates;
  relatedModule?: string;
}

// Question definition
interface ClinicalQuestion {
  id: string;
  phase: AssessmentPhase;
  question: string;
  subtext?: string;
  placeholder?: string;
  type: 'boolean' | 'select' | 'number' | 'multi-select';
  options?: { value: string; label: string; severity?: 'normal' | 'abnormal' | 'critical' }[];
  unit?: string;
  min?: number;
  max?: number;
  criticalTrigger?: (answer: any, patient: PatientData, weight: number) => TriggeredAction | null;
  getNextQuestion?: (answer: any) => string | null;
}

// Active module overlay
type ActiveModule = 
  | 'shock'
  | 'asthma'
  | 'ivio'
  | 'fluid'
  | 'inotrope'
  | 'lab'
  | 'arrhythmia'
  | 'airway'
  | null;

export const ClinicalAssessmentGPS: React.FC = () => {
  // Router hooks for scenario handling
  const [, setLocation] = useLocation();

  // PWA install hook
  const { isInstallable, handleInstallClick } = usePWAInstall();

  // Swipe gestures: right = home, left = browser back
  useSwipeGesture({
    onSwipeRight: () => {
      // Navigate home on swipe-right (no phase restriction)
      setLocation('/clinical-assessment');
    },
    onSwipeLeft: () => {
      // Browser back navigation
      window.history.back();
    },
    minSwipeDistance: 80, // Require longer swipe to avoid accidental triggers
  });
  const searchString = useSearch();
  const scenarioParam = new URLSearchParams(searchString).get('scenario');

  // Patient state
  const [patientData, setPatientData] = useState<PatientData>({
    ageYears: 0,
    ageMonths: 0,
    weight: 0,
    glucoseUnit: 'mmol/L'
  });

  // Assessment state
  const [currentPhase, setCurrentPhase] = useState<AssessmentPhase>('setup');
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('breathing');
  const [findings, setFindings] = useState<ClinicalFinding[]>([]);
  const [caseStartTime, setCaseStartTime] = useState<Date>(new Date());

  // Intervention state
  const [activeInterventions, setActiveInterventions] = useState<ActiveIntervention[]>([]);
  const [pendingAction, setPendingAction] = useState<TriggeredAction | null>(null);
  const [showActionCard, setShowActionCard] = useState(false);

  // Module overlay state
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);
  const [moduleContext, setModuleContext] = useState<any>(null);

  // UI state
  // Collapse sidebar by default on mobile screens (< 768px)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [emergencyActivated, setEmergencyActivated] = useState(false);
  
  // Clinical safety flags - track conditions that contraindicate certain interventions
  const [svtDetected, setSvtDetected] = useState(false);
  const [heartFailureDetected, setHeartFailureDetected] = useState(false);
  const [cprActive, setCprActive] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showHandover, setShowHandover] = useState(false);
  const [currentHandover, setCurrentHandover] = useState<SBARHandover | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showEmergencyLauncher, setShowEmergencyLauncher] = useState(false);
  const [launchedProtocol, setLaunchedProtocol] = useState<{ type: string; age: number; weight: number } | null>(null);

  // Handle protocol launch from emergency launcher
  const handleProtocolLaunch = (protocol: string, age: number, weight: number) => {
    setLaunchedProtocol({ type: protocol, age, weight });
    setShowEmergencyLauncher(false);
  };

  // Audio alerts - using imported functions directly

  // Calculate weight using age-based formula
  const totalAgeMonths = patientData.ageYears * 12 + patientData.ageMonths;
  const calculateWeight = (months: number): number => {
    if (months < 12) {
      return (months + 9) / 2;
    } else if (months < 60) {
      return (Math.floor(months / 12) + 4) * 2;
    } else {
      return Math.floor(months / 12) * 4;
    }
  };
  const estimatedWeight = calculateWeight(totalAgeMonths);
  const weight = patientData.weight > 0 ? patientData.weight : estimatedWeight;

  // Question definitions with critical triggers
  const clinicalQuestions: ClinicalQuestion[] = [
    // SIGNS OF LIFE
    {
      id: 'breathing',
      phase: 'signs_of_life',
      question: 'Is the child breathing?',
      subtext: 'Look for chest movement, listen for breath sounds',
      type: 'boolean',
      criticalTrigger: (answer) => {
        if (answer === false) {
          return {
            id: 'start-bvm',
            severity: 'critical',
            title: 'START BAG-VALVE-MASK VENTILATION',
            instruction: 'Open airway (head tilt-chin lift). Apply mask with good seal. Squeeze bag to see chest rise. Give 1 breath every 3 seconds.',
            rationale: 'Apneic child requires immediate ventilation to prevent hypoxic cardiac arrest.',
            timer: 30,
            reassessAfter: 'After 5 breaths, check for chest rise and SpO2',
            interventionTemplate: 'bvmVentilation'
          };
        }
        return null;
      }
    },
    {
      id: 'pulse',
      phase: 'signs_of_life',
      question: 'Is there a palpable pulse?',
      subtext: 'Check brachial (infant) or carotid (child) pulse for 10 seconds max',
      type: 'select',
      options: [
        { value: 'present_strong', label: 'Present and strong', severity: 'normal' },
        { value: 'present_weak', label: 'Present but weak', severity: 'abnormal' },
        { value: 'absent', label: 'No pulse', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'absent') {
          return {
            id: 'start-cpr',
            severity: 'critical',
            title: 'START CPR IMMEDIATELY',
            instruction: 'Begin chest compressions: 100-120/min, depth 1/3 chest. 15:2 ratio with BVM. Minimize interruptions.',
            rationale: 'Pulseless child requires immediate CPR. Every minute without CPR decreases survival by 10%.',
            timer: 120,
            reassessAfter: 'Rhythm check at 2 minutes',
            interventionTemplate: 'cpr'
          };
        }
        if (answer === 'present_weak') {
          return {
            id: 'weak-pulse-shock',
            severity: 'urgent',
            title: 'WEAK PULSE - EARLY SHOCK SUSPECTED',
            instruction: 'Weak pulse indicates poor perfusion. Prepare for IV/IO access. Continue assessment to identify shock type. Do NOT give fluid bolus until heart failure is ruled out.',
            rationale: 'Weak pulse is an early sign of compensated shock. Early recognition and treatment improves outcomes.',
            timer: 300,
            reassessAfter: 'After circulation assessment'
          };
        }
        return null;
      }
    },
    {
      id: 'responsiveness',
      phase: 'signs_of_life',
      question: 'What is the level of responsiveness?',
      subtext: 'AVPU scale assessment',
      type: 'select',
      options: [
        { value: 'alert', label: 'A - Alert (eyes open spontaneously)', severity: 'normal' },
        { value: 'voice', label: 'V - Voice (responds to verbal stimuli)', severity: 'abnormal' },
        { value: 'pain', label: 'P - Pain (responds only to painful stimuli)', severity: 'critical' },
        { value: 'unresponsive', label: 'U - Unresponsive (no response)', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'unresponsive') {
          return {
            id: 'protect-airway',
            severity: 'critical',
            title: 'PROTECT AIRWAY - UNRESPONSIVE CHILD',
            instruction: 'Position in recovery position if breathing. Prepare for intubation if not protecting airway. Call for senior help.',
            rationale: 'Unresponsive child cannot protect airway. Risk of aspiration and respiratory failure.',
            relatedModule: 'airway'
          };
        }
        if (answer === 'pain') {
          return {
            id: 'altered-consciousness',
            severity: 'urgent',
            title: 'ALTERED CONSCIOUSNESS - ASSESS CAUSE',
            instruction: 'Check blood glucose immediately. Consider: hypoxia, hypoglycemia, seizure, head injury, poisoning, sepsis. Protect airway - may deteriorate rapidly.',
            rationale: 'A child responding only to pain has significantly altered consciousness. This is a red flag requiring immediate investigation.',
            timer: 300,
            reassessAfter: 'After glucose check and disability assessment'
          };
        }
        if (answer === 'voice') {
          return {
            id: 'decreased-consciousness',
            severity: 'routine',
            title: 'DECREASED CONSCIOUSNESS - MONITOR CLOSELY',
            instruction: 'Monitor for deterioration. Check blood glucose. Continue systematic assessment.',
            rationale: 'Child not fully alert may deteriorate. Frequent reassessment needed.'
          };
        }
        return null;
      }
    },

    // AIRWAY
    {
      id: 'airway_patency',
      phase: 'airway',
      question: 'Is the airway patent?',
      subtext: 'Can you hear air movement? Is there stridor or gurgling?',
      type: 'select',
      options: [
        { value: 'patent', label: 'Patent - clear air movement', severity: 'normal' },
        { value: 'partial', label: 'Partial obstruction - stridor/gurgling', severity: 'abnormal' },
        { value: 'complete', label: 'Complete obstruction - no air movement', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'complete') {
          return {
            id: 'relieve-obstruction',
            severity: 'critical',
            title: 'RELIEVE AIRWAY OBSTRUCTION NOW',
            instruction: 'If foreign body suspected: 5 back blows + 5 chest thrusts (infant) or abdominal thrusts (child >1y). If secretions: suction. Reposition airway.',
            rationale: 'Complete airway obstruction is immediately life-threatening. Must be relieved before any other intervention.',
            timer: 60
          };
        }
        if (answer === 'partial') {
          return {
            id: 'optimize-airway',
            severity: 'urgent',
            title: 'OPTIMIZE AIRWAY POSITION',
            instruction: 'Head tilt-chin lift (if no trauma) or jaw thrust. Consider oropharyngeal airway if unconscious. Suction if secretions present.',
            rationale: 'Partial obstruction can progress to complete obstruction. Optimize position before continuing.',
            timer: 30
          };
        }
        return null;
      }
    },
    {
      id: 'airway_sounds',
      phase: 'airway',
      question: 'Are there abnormal airway sounds?',
      type: 'multi-select',
      options: [
        { value: 'none', label: 'None - clear', severity: 'normal' },
        { value: 'stridor', label: 'Stridor (inspiratory)', severity: 'abnormal' },
        { value: 'stertor', label: 'Stertor (snoring)', severity: 'abnormal' },
        { value: 'gurgling', label: 'Gurgling (secretions)', severity: 'abnormal' },
        { value: 'hoarse', label: 'Hoarse voice/cry', severity: 'abnormal' }
      ],
      criticalTrigger: (answer) => {
        if (Array.isArray(answer)) {
          if (answer.includes('stridor')) {
            return {
              id: 'stridor-assessment',
              severity: 'urgent',
              title: 'STRIDOR DETECTED - ASSESS SEVERITY',
              instruction: 'Assess for croup vs epiglottitis vs foreign body. Keep child calm. Do NOT examine throat if epiglottitis suspected. Give nebulized epinephrine if severe.',
              rationale: 'Stridor indicates upper airway narrowing. Agitation worsens obstruction.',
              relatedModule: 'airway'
            };
          }
          if (answer.includes('stertor')) {
            return {
              id: 'stertor-intervention',
              severity: 'urgent',
              title: 'STERTOR (SNORING) - REPOSITION AND SUCTION',
              instruction: 'Stertor indicates tongue/soft tissue obstruction. Head tilt-chin lift or jaw thrust. Suction oropharynx if secretions. Consider oropharyngeal airway if unconscious.',
              rationale: 'Stertor is caused by partial upper airway obstruction from tongue or soft tissue. Repositioning often resolves it.',
              timer: 60
            };
          }
          if (answer.includes('gurgling')) {
            return {
              id: 'gurgling-suction',
              severity: 'urgent',
              title: 'GURGLING - SUCTION AIRWAY NOW',
              instruction: 'Gurgling indicates secretions/blood/vomit in airway. Suction immediately. Position in recovery position if unconscious. Have suction ready continuously.',
              rationale: 'Gurgling sounds mean fluid in the airway. Risk of aspiration. Suction is priority.',
              timer: 30
            };
          }
        }
        return null;
      }
    },

    // BREATHING
    {
      id: 'breathing_effort',
      phase: 'breathing',
      question: 'What is the work of breathing?',
      subtext: 'Look for retractions, nasal flaring, accessory muscle use',
      type: 'select',
      options: [
        { value: 'normal', label: 'Normal - no distress', severity: 'normal' },
        { value: 'mild', label: 'Mild - some retractions', severity: 'abnormal' },
        { value: 'moderate', label: 'Moderate - intercostal retractions, nasal flaring', severity: 'abnormal' },
        { value: 'severe', label: 'Severe - subcostal retractions, head bobbing, grunting', severity: 'critical' },
        { value: 'exhaustion', label: 'Exhaustion - minimal effort, ominous sign', severity: 'critical' }
      ],
      criticalTrigger: (answer, patient, weight) => {
        if (answer === 'severe' || answer === 'exhaustion') {
          return {
            id: 'respiratory-support',
            severity: 'critical',
            title: answer === 'exhaustion' ? 'RESPIRATORY FAILURE - PREPARE FOR INTUBATION' : 'SEVERE RESPIRATORY DISTRESS',
            instruction: answer === 'exhaustion' 
              ? 'Child is tiring. Prepare RSI equipment. Call anesthesia/senior help. Start BVM if deteriorates.'
              : 'High-flow oxygen. Consider CPAP/BiPAP. Treat underlying cause (bronchodilators if wheeze).',
            rationale: answer === 'exhaustion'
              ? 'Exhaustion is a pre-arrest sign. Child will decompensate rapidly without intervention.'
              : 'Severe distress indicates respiratory failure. Need aggressive support.',
            relatedModule: 'asthma'
          };
        }
        return null;
      }
    },
    {
      id: 'spo2',
      phase: 'breathing',
      question: 'What is the SpO2?',
      subtext: 'On room air or current oxygen. Normal: 94-100%. Enter value 0-100.',
      placeholder: 'e.g., 98',
      type: 'number',
      unit: '%',
      min: 0,
      max: 100,
      criticalTrigger: (answer) => {
        if (answer < 90) {
          return {
            id: 'oxygen-therapy',
            severity: 'critical',
            title: 'HYPOXIA - START HIGH-FLOW OXYGEN',
            instruction: 'Apply non-rebreather mask at 15 L/min. Target SpO2 94-98%. If not improving, prepare for BVM or CPAP.',
            rationale: 'SpO2 <90% indicates severe hypoxemia. Hypoxia causes organ damage and cardiac arrest.',
            timer: 60,
            reassessAfter: 'Recheck SpO2 in 1 minute'
          };
        }
        if (answer < 94) {
          return {
            id: 'supplemental-oxygen',
            severity: 'urgent',
            title: 'START SUPPLEMENTAL OXYGEN',
            instruction: 'Apply nasal cannula 2-4 L/min or simple face mask 6-10 L/min. Target SpO2 94-98%.',
            rationale: 'SpO2 <94% indicates hypoxemia requiring supplemental oxygen.',
            timer: 120
          };
        }
        return null;
      }
    },
    {
      id: 'respiratory_rate',
      phase: 'breathing',
      question: 'What is the respiratory rate?',
      subtext: 'Count for 30 seconds × 2. Normal: <1y: 30-60, 1-5y: 24-40, >5y: 12-20 breaths/min',
      placeholder: 'e.g., 24',
      type: 'number',
      unit: 'breaths/min',
      min: 0,
      max: 100,
      criticalTrigger: (answer, patient) => {
        const ageMonths = patient.ageYears * 12 + patient.ageMonths;
        // Age-appropriate thresholds
        let upperLimit = 60;
        let lowerLimit = 12;
        if (ageMonths < 12) {
          upperLimit = 60;
          lowerLimit = 30;
        } else if (ageMonths < 60) {
          upperLimit = 40;
          lowerLimit = 20;
        } else {
          upperLimit = 30;
          lowerLimit = 12;
        }

        if (answer > upperLimit * 1.5) {
          return {
            id: 'severe-tachypnea',
            severity: 'critical',
            title: 'SEVERE TACHYPNEA',
            instruction: 'Assess for respiratory failure. High-flow oxygen. Treat underlying cause. Prepare for respiratory support.',
            rationale: `RR ${answer} is severely elevated for age. Indicates significant respiratory compromise or metabolic acidosis.`
          };
        }
        if (answer < lowerLimit) {
          return {
            id: 'bradypnea',
            severity: 'critical',
            title: 'BRADYPNEA - RESPIRATORY DEPRESSION',
            instruction: 'Assess airway. Prepare BVM. Consider naloxone if opioid exposure. This is a pre-arrest sign.',
            rationale: 'Low respiratory rate indicates respiratory failure or CNS depression. Imminent arrest risk.',
            interventionTemplate: 'bvmVentilation'
          };
        }
        return null;
      }
    },
    {
      id: 'breath_sounds',
      phase: 'breathing',
      question: 'What are the breath sounds?',
      type: 'multi-select',
      options: [
        { value: 'clear', label: 'Clear bilateral', severity: 'normal' },
        { value: 'wheeze', label: 'Wheeze (expiratory)', severity: 'abnormal' },
        { value: 'crackles', label: 'Crackles/rales', severity: 'abnormal' },
        { value: 'decreased', label: 'Decreased air entry', severity: 'abnormal' },
        { value: 'absent_left', label: 'Absent left side', severity: 'critical' },
        { value: 'absent_right', label: 'Absent right side', severity: 'critical' }
      ],
      criticalTrigger: (answer, patient, weight) => {
        if (Array.isArray(answer)) {
          if (answer.includes('absent_left') || answer.includes('absent_right')) {
            const side = answer.includes('absent_left') ? 'LEFT' : 'RIGHT';
            return {
              id: 'absent-breath-sounds',
              severity: 'critical',
              title: `ABSENT BREATH SOUNDS ${side} SIDE`,
              instruction: `Consider: Pneumothorax (needle decompress if tension), Pleural effusion, Mucus plug, ETT malposition. Get CXR urgently.`,
              rationale: 'Unilateral absent breath sounds indicates serious pathology requiring immediate diagnosis and treatment.'
            };
          }
          if (answer.includes('wheeze')) {
            return {
              id: 'wheeze-treatment',
              severity: 'urgent',
              title: 'WHEEZE DETECTED - START BRONCHODILATOR',
              instruction: `Give salbutamol ${weight < 20 ? '2.5 mg' : '5 mg'} nebulizer. Add ipratropium 250 mcg if severe. Give prednisolone ${Math.min(weight * 2, 60)} mg PO.`,
              rationale: 'Wheeze indicates bronchospasm. Bronchodilators are first-line treatment.',
              dose: weight < 20 ? 'Salbutamol 2.5 mg' : 'Salbutamol 5 mg',
              route: 'Nebulizer',
              timer: 600,
              interventionTemplate: 'salbutamolNeb',
              relatedModule: 'asthma'
            };
          }
        }
        return null;
      }
    },

    // CIRCULATION
    // CRITICAL: Heart failure assessment MUST come before fluid bolus to prevent pulmonary edema
    {
      id: 'jvp',
      phase: 'circulation',
      question: 'Is the jugular venous pressure (JVP) elevated?',
      subtext: 'Look for distended neck veins (difficult in infants - check hepatomegaly instead)',
      type: 'select',
      options: [
        { value: 'not_visible', label: 'Not visible/normal', severity: 'normal' },
        { value: 'elevated', label: 'Elevated - visible above clavicle', severity: 'abnormal' },
        { value: 'very_elevated', label: 'Very elevated - visible to jaw', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'elevated' || answer === 'very_elevated') {
          return {
            id: 'elevated-jvp',
            severity: 'critical',
            title: 'ELEVATED JVP - HEART FAILURE OR FLUID OVERLOAD',
            instruction: 'DO NOT GIVE FLUID BOLUS. This child has elevated central venous pressure. Consider diuretics. Assess for heart failure. Get senior help.',
            rationale: 'Elevated JVP indicates volume overload or heart failure. Fluid bolus will cause pulmonary edema.',
            relatedModule: 'shock'
          };
        }
        return null;
      }
    },
    {
      id: 'hepatomegaly',
      phase: 'circulation',
      question: 'Is the liver enlarged?',
      subtext: 'Palpate liver edge - should not be >2cm below costal margin',
      type: 'select',
      options: [
        { value: 'normal', label: 'Normal - not palpable or <2cm below costal margin', severity: 'normal' },
        { value: 'mild', label: 'Mildly enlarged - 2-4cm below costal margin', severity: 'abnormal' },
        { value: 'severe', label: 'Severely enlarged - >4cm below costal margin', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'mild' || answer === 'severe') {
          return {
            id: 'hepatomegaly',
            severity: 'critical',
            title: 'HEPATOMEGALY - HEART FAILURE OR FLUID OVERLOAD',
            instruction: 'DO NOT GIVE FLUID BOLUS. Hepatomegaly indicates venous congestion. Assess for heart failure. Consider diuretics. Get senior help.',
            rationale: 'Hepatomegaly from venous congestion indicates the child cannot handle more fluid.',
            relatedModule: 'shock'
          };
        }
        return null;
      }
    },
    {
      id: 'heart_sounds',
      phase: 'circulation',
      question: 'Auscultate the heart - what do you hear?',
      subtext: 'Listen for gallop rhythm (S3), murmurs, muffled sounds',
      type: 'multi-select',
      options: [
        { value: 'normal', label: 'Normal S1 and S2 only', severity: 'normal' },
        { value: 'gallop', label: 'Gallop rhythm (S3) - sounds like "Kentucky"', severity: 'critical' },
        { value: 'murmur', label: 'Heart murmur present', severity: 'abnormal' },
        { value: 'muffled', label: 'Muffled heart sounds', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (Array.isArray(answer)) {
          if (answer.includes('gallop')) {
            return {
              id: 'gallop-rhythm',
              severity: 'critical',
              title: 'GALLOP RHYTHM - HEART FAILURE',
              instruction: 'DO NOT GIVE FLUID BOLUS. S3 gallop indicates heart failure. Start diuretics (furosemide 1 mg/kg). Get cardiology consult. Consider inotropes.',
              rationale: 'Gallop rhythm (S3) is a specific sign of heart failure. Fluid will worsen pulmonary edema.',
              relatedModule: 'shock'
            };
          }
          if (answer.includes('muffled')) {
            return {
              id: 'muffled-sounds',
              severity: 'critical',
              title: 'MUFFLED HEART SOUNDS - PERICARDIAL EFFUSION OR TAMPONADE',
              instruction: 'DO NOT GIVE FLUID BOLUS (unless tamponade confirmed). Get urgent ECHO. Assess for Beck\'s triad. Prepare for pericardiocentesis.',
              rationale: 'Muffled sounds suggest pericardial effusion or tamponade. Requires urgent cardiac assessment.',
              relatedModule: 'shock'
            };
          }
          if (answer.includes('murmur')) {
            return {
              id: 'heart-murmur',
              severity: 'urgent',
              title: 'HEART MURMUR DETECTED',
              instruction: 'Note murmur characteristics. Consider structural heart disease. Be cautious with fluid bolus - give slowly and reassess frequently.',
              rationale: 'Murmur may indicate structural heart disease. Fluid bolus must be given cautiously to avoid overload.',
              relatedModule: 'shock'
            };
          }
        }
        return null;
      }
    },
    {
      id: 'pulmonary_crackles',
      phase: 'circulation',
      question: 'Are there pulmonary crackles/rales on auscultation?',
      subtext: 'Listen to lung bases - crackles suggest pulmonary edema',
      type: 'select',
      options: [
        { value: 'none', label: 'No crackles - clear lung fields', severity: 'normal' },
        { value: 'bases', label: 'Crackles at bases only', severity: 'abnormal' },
        { value: 'bilateral', label: 'Bilateral crackles throughout', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'bases' || answer === 'bilateral') {
          return {
            id: 'pulmonary-edema',
            severity: 'critical',
            title: 'PULMONARY CRACKLES - FLUID OVERLOAD OR HEART FAILURE',
            instruction: 'DO NOT GIVE FLUID BOLUS. Crackles indicate pulmonary edema. Start diuretics (furosemide 1 mg/kg). Consider CPAP/BiPAP. Get senior help.',
            rationale: 'Pulmonary crackles indicate fluid in the lungs. More fluid will worsen respiratory failure.',
            relatedModule: 'shock'
          };
        }
        return null;
      }
    },
    {
      id: 'heart_rate',
      phase: 'circulation',
      question: 'What is the heart rate?',
      subtext: 'Count for 15 seconds × 4. Normal ranges by age: <1y: 100-180, 1-5y: 80-160, >5y: 60-140 bpm',
      type: 'number',
      unit: 'bpm',
      min: 0,
      max: 300,
      criticalTrigger: (answer, patient) => {
        const ageMonths = patient.ageYears * 12 + patient.ageMonths;
        // Age-appropriate thresholds
        let upperLimit = 180;
        let lowerLimit = 60;
        if (ageMonths < 12) {
          upperLimit = 180;
          lowerLimit = 100;
        } else if (ageMonths < 60) {
          upperLimit = 160;
          lowerLimit = 80;
        } else {
          upperLimit = 140;
          lowerLimit = 60;
        }

        if (answer > 220) {
          return {
            id: 'svt',
            severity: 'critical',
            title: 'POSSIBLE SVT - ASSESS RHYTHM',
            instruction: 'Get 12-lead ECG. If SVT confirmed and stable: vagal maneuvers, then adenosine. If unstable: synchronized cardioversion.',
            rationale: 'HR >220 in children suggests SVT rather than sinus tachycardia. Requires rhythm assessment.',
            relatedModule: 'arrhythmia'
          };
        }
        if (answer < lowerLimit && answer > 0) {
          return {
            id: 'bradycardia',
            severity: 'critical',
            title: 'BRADYCARDIA - ASSESS PERFUSION',
            instruction: 'If poor perfusion: start CPR if HR <60 with poor perfusion. Give epinephrine. Consider atropine for vagal causes.',
            rationale: 'Bradycardia in children is usually hypoxic. Treat the cause (oxygenation) first.',
            relatedModule: 'arrhythmia'
          };
        }
        return null;
      }
    },
    {
      id: 'rhythm_regularity',
      phase: 'circulation',
      question: 'Is the heart rhythm regular?',
      subtext: 'Palpate pulse or listen to heart - is it regular or irregular?',
      type: 'select',
      options: [
        { value: 'regular', label: 'Regular rhythm', severity: 'normal' },
        { value: 'regularly_irregular', label: 'Regularly irregular (e.g., sinus arrhythmia)', severity: 'normal' },
        { value: 'irregularly_irregular', label: 'Irregularly irregular', severity: 'critical' },
        { value: 'narrow_complex_tachy', label: 'Very fast and regular (possible SVT)', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'irregularly_irregular') {
          return {
            id: 'irregular-rhythm',
            severity: 'critical',
            title: 'IRREGULAR RHYTHM - GET ECG',
            instruction: 'Get 12-lead ECG immediately. Consider atrial fibrillation (rare in children), frequent ectopics, or heart block. Consult cardiology.',
            rationale: 'Irregularly irregular rhythm in children is abnormal and requires urgent rhythm identification.',
            relatedModule: 'arrhythmia'
          };
        }
        if (answer === 'narrow_complex_tachy') {
          return {
            id: 'svt-suspected',
            severity: 'critical',
            title: 'SUSPECTED SVT - DO NOT GIVE FLUID BOLUS YET',
            instruction: 'Get 12-lead ECG first. If SVT confirmed: vagal maneuvers, then adenosine. Fluid bolus will NOT help SVT and may worsen heart failure.',
            rationale: 'SVT causes shock from poor cardiac output, not hypovolemia. Fluid bolus is not the treatment.',
            relatedModule: 'arrhythmia'
          };
        }
        return null;
      }
    },
    {
      id: 'perfusion',
      phase: 'circulation',
      question: 'What is the perfusion status?',
      subtext: 'Assess capillary refill, skin color, peripheral pulses',
      type: 'select',
      options: [
        { value: 'normal', label: 'Normal - CRT <2s, warm, pink', severity: 'normal' },
        { value: 'poor', label: 'Poor - CRT 2-4s, cool peripheries', severity: 'abnormal' },
        { value: 'shock', label: 'Shock - CRT >4s, mottled, weak pulses', severity: 'critical' }
      ],
      criticalTrigger: (answer, patient, weight) => {
        if (answer === 'shock') {
          return {
            id: 'shock-treatment',
            severity: 'critical',
            title: 'SHOCK - GET IV ACCESS AND GIVE FLUID',
            instruction: `Establish IV/IO access NOW. Give ${Math.round(weight * 10)} mL (10 mL/kg) NS or RL bolus over 5-10 min. Reassess after each bolus.`,
            rationale: 'Shock requires immediate fluid resuscitation. Early aggressive treatment improves outcomes.',
            dose: `${Math.round(weight * 10)} mL`,
            route: 'IV/IO bolus',
            timer: 300,
            interventionTemplate: 'fluidBolus',
            relatedModule: 'shock'
          };
        }
        if (answer === 'poor') {
          return {
            id: 'poor-perfusion',
            severity: 'urgent',
            title: 'POOR PERFUSION - ESTABLISH IV ACCESS',
            instruction: 'Establish IV access. Prepare for fluid bolus if perfusion worsens. Identify and treat underlying cause.',
            rationale: 'Poor perfusion may progress to shock. Early IV access allows rapid intervention if needed.',
            interventionTemplate: 'ivAccess'
          };
        }
        return null;
      }
    },
    {
      id: 'cap_refill',
      phase: 'circulation',
      question: 'What is the capillary refill time?',
      subtext: 'Press on sternum or forehead for 5 seconds',
      type: 'select',
      options: [
        { value: 'less_2', label: '<2 seconds (normal)', severity: 'normal' },
        { value: '2_to_4', label: '2-4 seconds (prolonged)', severity: 'abnormal' },
        { value: 'more_4', label: '>4 seconds (severely prolonged)', severity: 'critical' }
      ]
    },
    {
      id: 'pulse_quality',
      phase: 'circulation',
      question: 'Compare central and peripheral pulses',
      subtext: 'Central: femoral/carotid. Peripheral: radial/dorsalis pedis',
      type: 'select',
      options: [
        { value: 'both_strong', label: 'Both strong and equal', severity: 'normal' },
        { value: 'central_strong', label: 'Central strong, peripheral weak', severity: 'abnormal' },
        { value: 'both_weak', label: 'Both weak', severity: 'critical' },
        { value: 'central_only', label: 'Central only palpable', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'central_only' || answer === 'both_weak') {
          return {
            id: 'severe-shock',
            severity: 'critical',
            title: 'SEVERE SHOCK - IMMEDIATE RESUSCITATION',
            instruction: 'This is decompensated shock. Aggressive fluid resuscitation. Prepare inotropes. Call for senior help.',
            rationale: 'Weak or absent peripheral pulses indicate severe circulatory compromise.',
            relatedModule: 'shock'
          };
        }
        return null;
      }
    },
    {
      id: 'skin_temp',
      phase: 'circulation',
      question: 'Assess skin temperature gradient',
      subtext: 'Run hand from thigh to foot - note where it becomes cool',
      type: 'select',
      options: [
        { value: 'warm_throughout', label: 'Warm throughout', severity: 'normal' },
        { value: 'cool_feet', label: 'Cool feet only', severity: 'abnormal' },
        { value: 'cool_below_knee', label: 'Cool below knees', severity: 'abnormal' },
        { value: 'cool_below_thigh', label: 'Cool below mid-thigh', severity: 'critical' },
        { value: 'warm_flushed', label: 'Warm and flushed (vasodilated)', severity: 'abnormal' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'cool_below_thigh') {
          return {
            id: 'cold-shock',
            severity: 'critical',
            title: 'COLD SHOCK PATTERN',
            instruction: 'This suggests cardiogenic or hypovolemic shock. Fluid bolus first. If no response, consider epinephrine infusion.',
            rationale: 'Proximal temperature gradient indicates severe vasoconstriction from poor cardiac output.',
            relatedModule: 'shock'
          };
        }
        if (answer === 'warm_flushed') {
          return {
            id: 'warm-shock',
            severity: 'urgent',
            title: 'WARM SHOCK PATTERN',
            instruction: 'This suggests distributive shock (sepsis, anaphylaxis). Fluid bolus. If no response, consider norepinephrine.',
            rationale: 'Warm, vasodilated peripheries with poor perfusion suggests distributive shock.',
            relatedModule: 'shock'
          };
        }
        return null;
      }
    },
    {
      id: 'blood_pressure',
      phase: 'circulation',
      question: 'What is the blood pressure?',
      subtext: 'Use appropriate cuff size',
      type: 'number',
      unit: 'mmHg (systolic)',
      min: 0,
      max: 200,
      criticalTrigger: (answer, patient) => {
        const ageYears = patient.ageYears;
        // Hypotension threshold: 70 + (2 × age in years) for children 1-10
        const hypotensionThreshold = ageYears < 1 ? 60 : Math.min(70 + (2 * ageYears), 90);
        
        if (answer > 0 && answer < hypotensionThreshold) {
          return {
            id: 'hypotension',
            severity: 'critical',
            title: 'HYPOTENSION - DECOMPENSATED SHOCK',
            instruction: 'This is late shock. Aggressive fluid resuscitation. Start inotropes. Call for senior help immediately.',
            rationale: `BP ${answer} is below threshold of ${hypotensionThreshold} for age. Hypotension is a late and ominous sign in children.`,
            relatedModule: 'shock'
          };
        }
        return null;
      }
    },

    // DISABILITY
    {
      id: 'glucose',
      phase: 'disability',
      question: 'What is the blood glucose?',
      type: 'number',
      unit: 'mmol/L',
      min: 0,
      max: 50,
      criticalTrigger: (answer, patient) => {
        // Convert if needed (assuming mmol/L input)
        const glucoseMmol = answer;
        
        if (glucoseMmol < 3.0) {
          const ageMonths = patient.ageYears * 12 + patient.ageMonths;
          const calcWeight = ageMonths < 12 ? (ageMonths + 9) / 2 : ageMonths < 60 ? (Math.floor(ageMonths / 12) + 4) * 2 : Math.floor(ageMonths / 12) * 4;
          const weight = patient.weight || calcWeight;
          const dextroseVolume = Math.round(weight * 2); // 2 mL/kg of D10%
          return {
            id: 'hypoglycemia',
            severity: 'critical',
            title: 'HYPOGLYCEMIA - GIVE DEXTROSE NOW',
            instruction: `Give D10% ${dextroseVolume} mL (2 mL/kg) IV bolus. Recheck glucose in 15 minutes. Start maintenance dextrose infusion.`,
            rationale: 'Hypoglycemia causes brain injury. Must be corrected immediately before other interventions.',
            dose: `D10% ${dextroseVolume} mL`,
            route: 'IV bolus',
            timer: 900 // 15 min recheck
          };
        }
        if (glucoseMmol > 14) {
          return {
            id: 'hyperglycemia',
            severity: 'urgent',
            title: 'HYPERGLYCEMIA - ASSESS FOR DKA',
            instruction: 'Check ketones, blood gas, electrolytes. If DKA: start IV fluids (10 mL/kg NS), then insulin infusion after 1 hour.',
            rationale: 'Hyperglycemia may indicate DKA. Need to assess severity and start protocol.',
            relatedModule: 'lab'
          };
        }
        return null;
      }
    },
    {
      id: 'pupils',
      phase: 'disability',
      question: 'What are the pupil findings?',
      type: 'select',
      options: [
        { value: 'normal', label: 'Equal, round, reactive (PERRL)', severity: 'normal' },
        { value: 'dilated_reactive', label: 'Dilated but reactive', severity: 'abnormal' },
        { value: 'constricted', label: 'Pinpoint (constricted)', severity: 'abnormal' },
        { value: 'unequal', label: 'Unequal (anisocoria)', severity: 'critical' },
        { value: 'fixed_dilated', label: 'Fixed and dilated', severity: 'critical' }
      ],
      criticalTrigger: (answer) => {
        if (answer === 'unequal') {
          return {
            id: 'anisocoria',
            severity: 'critical',
            title: 'UNEQUAL PUPILS - POSSIBLE RAISED ICP',
            instruction: 'Elevate head 30°. Avoid hypoxia and hypotension. Consider mannitol 0.5 g/kg if herniation suspected. Urgent CT head.',
            rationale: 'Anisocoria suggests uncal herniation from raised intracranial pressure. Neurosurgical emergency.'
          };
        }
        if (answer === 'fixed_dilated') {
          return {
            id: 'fixed-pupils',
            severity: 'critical',
            title: 'FIXED DILATED PUPILS',
            instruction: 'If bilateral: consider brainstem death, severe hypoxia, or drug toxicity. If post-arrest: continue resuscitation, this is not a reliable prognostic sign.',
            rationale: 'Fixed dilated pupils indicate severe neurological injury but may be reversible in some cases.'
          };
        }
        if (answer === 'constricted') {
          return {
            id: 'pinpoint-pupils',
            severity: 'urgent',
            title: 'PINPOINT PUPILS - CONSIDER OPIOID TOXICITY',
            instruction: 'If respiratory depression present: give naloxone 0.1 mg/kg IV (max 2 mg). May need repeated doses.',
            rationale: 'Pinpoint pupils with respiratory depression suggests opioid toxicity.'
          };
        }
        return null;
      }
    },
    {
      id: 'seizure',
      phase: 'disability',
      question: 'Is there seizure activity?',
      type: 'select',
      options: [
        { value: 'none', label: 'No seizure activity', severity: 'normal' },
        { value: 'resolved', label: 'Recent seizure, now resolved', severity: 'abnormal' },
        { value: 'active', label: 'Active seizure NOW', severity: 'critical' }
      ],
      criticalTrigger: (answer, patient, weight) => {
        if (answer === 'active') {
          const lorazepamDose = Math.min(weight * 0.1, 4).toFixed(1);
          const diazepamDose = Math.min(weight * 0.3, 10).toFixed(1);
          return {
            id: 'active-seizure',
            severity: 'critical',
            title: 'ACTIVE SEIZURE - GIVE BENZODIAZEPINE',
            instruction: `Position safely. Give lorazepam ${lorazepamDose} mg IV OR diazepam ${diazepamDose} mg PR. Check glucose. Time the seizure.`,
            rationale: 'Prolonged seizures cause brain injury. Benzodiazepines are first-line treatment.',
            dose: `Lorazepam ${lorazepamDose} mg IV or Diazepam ${diazepamDose} mg PR`,
            route: 'IV or PR',
            timer: 300 // 5 min to reassess
          };
        }
        return null;
      }
    },

    // EXPOSURE
    {
      id: 'temperature',
      phase: 'exposure',
      question: 'What is the temperature?',
      type: 'number',
      unit: '°C',
      min: 30,
      max: 45,
      criticalTrigger: (answer) => {
        if (answer > 40) {
          return {
            id: 'hyperthermia',
            severity: 'urgent',
            title: 'HYPERTHERMIA - ACTIVE COOLING',
            instruction: 'Remove clothing. Tepid sponging. Paracetamol 15 mg/kg. Consider sepsis workup.',
            rationale: 'Temperature >40°C increases metabolic demand and can cause seizures.'
          };
        }
        if (answer < 35) {
          return {
            id: 'hypothermia',
            severity: 'urgent',
            title: 'HYPOTHERMIA - ACTIVE WARMING',
            instruction: 'Remove wet clothing. Warm blankets. Warm IV fluids. Consider sepsis in infants.',
            rationale: 'Hypothermia impairs coagulation and cardiac function. Warm slowly to avoid arrhythmias.'
          };
        }
        return null;
      }
    },
    {
      id: 'rash',
      phase: 'exposure',
      question: 'Is there a rash?',
      type: 'select',
      options: [
        { value: 'none', label: 'No rash', severity: 'normal' },
        { value: 'blanching', label: 'Blanching rash (viral)', severity: 'normal' },
        { value: 'urticarial', label: 'Urticarial (hives)', severity: 'abnormal' },
        { value: 'petechial', label: 'Petechial/purpuric (non-blanching)', severity: 'critical' }
      ],
      criticalTrigger: (answer, patient, weight) => {
        if (answer === 'petechial') {
          const ceftriaxoneDose = Math.min(weight * 80, 4000);
          return {
            id: 'petechial-rash',
            severity: 'critical',
            title: 'PETECHIAL RASH - ASSUME MENINGOCOCCEMIA',
            instruction: `Give ceftriaxone ${ceftriaxoneDose} mg IV NOW. Do NOT delay for LP. Fluid resuscitation if shocked.`,
            rationale: 'Petechial rash with fever = meningococcal sepsis until proven otherwise. Mortality high without immediate antibiotics.',
            dose: `Ceftriaxone ${ceftriaxoneDose} mg`,
            route: 'IV',
            relatedModule: 'lab'
          };
        }
        if (answer === 'urticarial') {
          return {
            id: 'urticarial-rash',
            severity: 'urgent',
            title: 'URTICARIAL RASH - ASSESS FOR ANAPHYLAXIS',
            instruction: 'Check for airway swelling, breathing difficulty, hypotension. If anaphylaxis: give IM epinephrine immediately.',
            rationale: 'Urticaria may be part of anaphylaxis. Need to assess for systemic involvement.'
          };
        }
        return null;
      }
    }
  ];

  // Get current question
  const getCurrentQuestion = (): ClinicalQuestion | null => {
    return clinicalQuestions.find(q => q.id === currentQuestionId) || null;
  };

  // Question flow by phase
  const questionFlowByPhase: Record<AssessmentPhase, string[]> = {
    setup: [],
    signs_of_life: ['breathing', 'pulse', 'responsiveness'],
    airway: ['airway_patency', 'airway_sounds'],
    breathing: ['breathing_effort', 'spo2', 'respiratory_rate', 'breath_sounds'],
    circulation: ['jvp', 'hepatomegaly', 'heart_sounds', 'pulmonary_crackles', 'heart_rate', 'rhythm_regularity', 'perfusion', 'cap_refill', 'pulse_quality', 'skin_temp', 'blood_pressure'],
    disability: ['glucose', 'pupils', 'seizure'],
    exposure: ['temperature', 'rash'],
    complete: []
  };

  // Get all questions in order
  const getAllQuestionsInOrder = (): string[] => {
    return [
      ...questionFlowByPhase.signs_of_life,
      ...questionFlowByPhase.airway,
      ...questionFlowByPhase.breathing,
      ...questionFlowByPhase.circulation,
      ...questionFlowByPhase.disability,
      ...questionFlowByPhase.exposure
    ];
  };

  // Get next question
  const getNextQuestionId = (currentId: string): string | null => {
    const allQuestions = getAllQuestionsInOrder();
    const currentIndex = allQuestions.indexOf(currentId);
    if (currentIndex === -1 || currentIndex === allQuestions.length - 1) {
      return null;
    }
    return allQuestions[currentIndex + 1];
  };

  // Get previous question
  const getPreviousQuestionId = (currentId: string): string | null => {
    const allQuestions = getAllQuestionsInOrder();
    const currentIndex = allQuestions.indexOf(currentId);
    if (currentIndex <= 0) {
      return null;
    }
    return allQuestions[currentIndex - 1];
  };

  // Get current phase from question
  const getPhaseFromQuestion = (questionId: string): AssessmentPhase => {
    for (const [phase, questions] of Object.entries(questionFlowByPhase)) {
      if (questions.includes(questionId)) {
        return phase as AssessmentPhase;
      }
    }
    return 'setup';
  };

  // Handle answer - NON-BLOCKING with visual feedback
  const handleAnswer = (answer: any) => {
    const question = getCurrentQuestion();
    if (!question || isTransitioning) return;

    // Show selected state briefly
    setSelectedAnswer(answer);
    setIsTransitioning(true);

    // Check for critical trigger - ONLY if answer is not null (Skip)
    // Skip should just move to next question without triggering any alerts
    const action = answer !== null ? question.criticalTrigger?.(answer, patientData, weight) : undefined;

    // Record finding
    const finding: ClinicalFinding = {
      id: `${question.id}-${Date.now()}`,
      question: question.question,
      answer,
      timestamp: new Date(),
      phase: question.phase,
      severity: question.options?.find(o => o.value === answer)?.severity || 'normal',
      triggeredInterventions: action ? [action.id] : undefined
    };
    setFindings(prev => [...prev, finding]);

    // If critical action, show it but DON'T BLOCK
    if (action) {
      // CRITICAL SAFETY CHECK: Block fluid bolus if SVT or heart failure detected
      let modifiedAction = action;
      if (action.interventionTemplate === 'fluidBolus' && (svtDetected || heartFailureDetected)) {
        // Override the action to NOT give fluid bolus
        const contraindication = svtDetected ? 'SVT' : 'heart failure signs';
        modifiedAction = {
          ...action,
          id: 'shock-no-fluid',
          title: `SHOCK DETECTED - BUT ${contraindication.toUpperCase()} PRESENT`,
          instruction: svtDetected 
            ? `DO NOT GIVE FLUID BOLUS. Treat SVT first: vagal maneuvers, then adenosine 0.1 mg/kg (max 6mg). If unstable, synchronized cardioversion 1 J/kg.`
            : `DO NOT GIVE FLUID BOLUS. Heart failure signs present. Consider diuretics (furosemide 1 mg/kg IV), inotropes (epinephrine infusion). Get senior help.`,
          rationale: svtDetected
            ? 'SVT causes cardiogenic shock from poor cardiac output. Fluid will worsen heart failure. Treat the rhythm first.'
            : 'Heart failure signs indicate the heart cannot handle more volume. Fluid bolus will cause pulmonary edema.',
          interventionTemplate: undefined, // Don't trigger fluid bolus intervention
          relatedModule: svtDetected ? 'arrhythmia' : 'inotrope'
        };
      }
      
      initAudioContext();
      triggerAlert(modifiedAction.severity === 'critical' ? 'critical_action' : 'timer_warning');
      setPendingAction(modifiedAction);
      setShowActionCard(true);

      // Auto-add intervention to sidebar (only if not blocked)
      if (modifiedAction.interventionTemplate) {
        const templateKey = modifiedAction.interventionTemplate as keyof typeof interventionTemplates;
        const template = interventionTemplates[templateKey];
        if (template) {
          const intervention: ActiveIntervention = typeof template === 'function' 
            ? (template as (weight: number) => ActiveIntervention)(weight) 
            : template as ActiveIntervention;
          setActiveInterventions(prev => [...prev, intervention]);
        }
      }

      // Activate emergency if critical
      if (modifiedAction.severity === 'critical') {
        setEmergencyActivated(true);
      }
      
      // Track clinical safety flags that contraindicate certain interventions
      // Use original action.id since modifiedAction.id may have changed
      if (action.id === 'svt-suspected' || action.id === 'svt') {
        setSvtDetected(true);
      }
      if (action.id === 'elevated-jvp' || action.id === 'hepatomegaly-enlarged' || 
          action.id === 'gallop-rhythm' || action.id === 'pulmonary-crackles') {
        setHeartFailureDetected(true);
      }

      // Start CPR clock if needed
      if (modifiedAction.id === 'start-cpr') {
        setCprActive(true);
      }
    }

    // ALWAYS move to next question (non-blocking) with brief delay for visual feedback
    setTimeout(() => {
      const nextId = getNextQuestionId(currentQuestionId);
      if (nextId) {
        setCurrentQuestionId(nextId);
        setCurrentPhase(getPhaseFromQuestion(nextId));
      } else {
        setCurrentPhase('complete');
      }
      setSelectedAnswer(null);
      setIsTransitioning(false);
    }, 300); // 300ms delay to show selected state
  };

  // Handle going back
  const handleBack = () => {
    const prevId = getPreviousQuestionId(currentQuestionId);
    if (prevId) {
      setCurrentQuestionId(prevId);
      setCurrentPhase(getPhaseFromQuestion(prevId));
    }
  };

  // Handle intervention complete
  const handleInterventionComplete = (id: string) => {
    const intervention = activeInterventions.find(i => i.id === id);
    
    // For fluid bolus interventions, MUST trigger reassessment before marking complete
    if (intervention?.type === 'fluid_bolus' && intervention.relatedModule === 'FluidBolusTracker') {
      // Open FluidBolusTracker for mandatory 9-sign reassessment
      setActiveModule('fluid');
      setModuleContext({ 
        interventionId: id, 
        weight,
        bolusNumber: intervention.bolusNumber || 1,
        volumeGiven: intervention.volumeGiven || 0,
        maxVolume: intervention.maxVolume || (weight * 60)
      });
      // Don't mark complete yet - FluidBolusTracker will handle completion after reassessment
      return;
    }
    
    // For other interventions, mark as complete directly
    setActiveInterventions(prev => 
      prev.map(i => i.id === id ? { ...i, status: 'completed' } : i)
    );
  };

  // Handle intervention escalate
  const handleInterventionEscalate = (id: string, reason: string) => {
    const intervention = activeInterventions.find(i => i.id === id);
    if (intervention) {
      setActiveInterventions(prev => 
        prev.map(i => i.id === id ? { ...i, status: 'escalated' } : i)
      );
      
      // Trigger escalation action
      if (intervention.type === 'iv_access') {
        // Escalate to IO
        const ioIntervention = interventionTemplates.ioAccess(weight);
        setActiveInterventions(prev => [...prev, ioIntervention]);
      }
    }
  };

  // Handle reassessment trigger
  const handleReassessmentTrigger = (id: string) => {
    const intervention = activeInterventions.find(i => i.id === id);
    if (intervention?.relatedModule) {
      setActiveModule(intervention.relatedModule as ActiveModule);
      setModuleContext({ interventionId: id, weight });
    }
  };

  // Handle intervention cancel
  const handleInterventionCancel = (id: string) => {
    setActiveInterventions(prev => prev.filter(i => i.id !== id));
  };

  // Handle module trigger
  const handleModuleTrigger = (moduleName: string, interventionId: string) => {
    setActiveModule(moduleName as ActiveModule);
    setModuleContext({ interventionId, weight });
  };

  // Close module overlay
  const closeModule = () => {
    setActiveModule(null);
    setModuleContext(null);
  };

  // Dismiss action card
  const dismissActionCard = () => {
    setShowActionCard(false);
    setPendingAction(null);
  };

  // Call for help
  const handleCallForHelp = () => {
    setEmergencyActivated(true);
    triggerAlert('critical_action');
    // Could also trigger handover generation
  };

  // Generate handover
  const handleGenerateHandover = () => {
    const assessmentData = {
      patientName: 'Patient',
      age: patientData.ageYears,
      ageMonths: patientData.ageMonths,
      weight: weight,
      chiefComplaint: 'Emergency presentation',
      findings: findings.map(f => ({
        category: f.phase,
        finding: f.question,
        value: String(f.answer),
        severity: f.severity || 'normal'
      })),
      interventions: activeInterventions.map(i => ({
        name: i.title,
        time: i.startTime.toISOString(),
        status: i.status
      }))
    };
    const handover = generateSBARHandover(assessmentData);
    setCurrentHandover(handover);
    setShowHandover(true);
  };

  // New case
  const handleNewCase = () => {
    setPatientData({ ageYears: 0, ageMonths: 0, weight: 0, glucoseUnit: 'mmol/L' });
    setCurrentPhase('setup');
    setCurrentQuestionId('breathing');
    setFindings([]);
    setActiveInterventions([]);
    setPendingAction(null);
    setShowActionCard(false);
    setEmergencyActivated(false);
    setCprActive(false);
    setCaseStartTime(new Date());
  };

  // Start assessment
  const handleStartAssessment = () => {
    setCurrentPhase('signs_of_life');
    setCurrentQuestionId('breathing');
    setCaseStartTime(new Date());
  };

  // Handle Quick Start scenarios - auto-start specific pathways
  useEffect(() => {
    if (scenarioParam && currentPhase === 'setup') {
      // Use default weight if none set (4.5kg for newborn)
      const effectiveWeight = weight > 0 ? weight : 4.5;
      
      switch (scenarioParam) {
        case 'cardiac_arrest':
          // Cardiac arrest - immediately start CPR, skip to pulse assessment
          // Set weight to effective weight if not already set
          if (weight === 0) {
            setPatientData(prev => ({ ...prev, weight: effectiveWeight }));
          }
          setCaseStartTime(new Date());
          setCurrentPhase('signs_of_life');
          setCurrentQuestionId('pulse');
          setCprActive(true);
          setEmergencyActivated(true);
          // Add CPR intervention
          const cprTemplate = interventionTemplates.cpr;
          if (cprTemplate) {
            const cprIntervention = typeof cprTemplate === 'function' ? cprTemplate() : cprTemplate;
            setActiveInterventions(prev => [...prev, cprIntervention as ActiveIntervention]);
          }
          // Show immediate action
          setPendingAction({
            id: 'start-cpr',
            severity: 'critical',
            title: 'CPR IN PROGRESS',
            instruction: `Chest compressions: 100-120/min, depth 1/3 chest. 15:2 ratio with BVM.\nEpinephrine: ${(effectiveWeight * 0.01).toFixed(2)} mg IV/IO every 3-5 min\nDefibrillation: ${Math.round(effectiveWeight * 2)} J`,
            rationale: 'Cardiac arrest pathway activated. Continue CPR with minimal interruptions.',
            timer: 120,
            reassessAfter: 'Rhythm check at 2 minutes'
          });
          setShowActionCard(true);
          initAudioContext();
          triggerAlert('critical_action');
          break;

        case 'anaphylaxis':
          // Anaphylaxis - immediately prompt for IM epinephrine
          setCaseStartTime(new Date());
          setCurrentPhase('signs_of_life');
          setCurrentQuestionId('breathing');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'anaphylaxis-epi',
            severity: 'critical',
            title: 'GIVE IM EPINEPHRINE NOW',
            instruction: `Epinephrine 1:1000 (1 mg/mL)\nDose: ${Math.min(effectiveWeight * 0.01, 0.5).toFixed(2)} mg IM\nSite: Anterolateral thigh\nRepeat every 5-15 minutes if no improvement`,
            rationale: 'Anaphylaxis requires immediate IM epinephrine. Do not delay for IV access.',
            timer: 300,
            reassessAfter: 'Reassess airway, breathing, circulation after 5 minutes'
          });
          setShowActionCard(true);
          initAudioContext();
          triggerAlert('critical_action');
          break;

        case 'status_epilepticus':
          // Seizure - start timer and prompt for benzodiazepine
          setCaseStartTime(new Date());
          setCurrentPhase('disability');
          setCurrentQuestionId('seizure');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'seizure-benzo',
            severity: 'critical',
            title: 'GIVE BENZODIAZEPINE NOW',
            instruction: `First-line: Midazolam ${Math.min(effectiveWeight * 0.2, 10).toFixed(1)} mg IM/IN\nOR Lorazepam ${Math.min(effectiveWeight * 0.1, 4).toFixed(1)} mg IV\nOR Diazepam ${Math.min(effectiveWeight * 0.3, 10).toFixed(1)} mg IV`,
            rationale: 'Status epilepticus >5 minutes requires immediate benzodiazepine. Brain damage occurs with prolonged seizures.',
            timer: 300,
            reassessAfter: 'If seizure continues after 5 min, give second dose'
          });
          setShowActionCard(true);
          initAudioContext();
          triggerAlert('critical_action');
          break;

        case 'septic_shock':
          // Sepsis - start sepsis clock, prompt for fluid and antibiotics
          setCaseStartTime(new Date());
          setCurrentPhase('circulation');
          setCurrentQuestionId('jvp');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'sepsis-bundle',
            severity: 'critical',
            title: 'SEPSIS BUNDLE - START NOW',
            instruction: `1. Fluid bolus: ${Math.round(effectiveWeight * 20)} mL NS/LR IV push\n2. Blood cultures x2 (before antibiotics if possible)\n3. Ceftriaxone ${Math.min(effectiveWeight * 50, 2000)} mg IV\n4. Check lactate and glucose`,
            rationale: 'Septic shock requires aggressive fluid resuscitation and early antibiotics. Every hour delay increases mortality.',
            timer: 3600,
            reassessAfter: 'Reassess perfusion after each 20 mL/kg bolus'
          });
          setShowActionCard(true);
          // Add fluid bolus intervention
          const fluidIntervention = interventionTemplates.fluidBolus(effectiveWeight);
          if (fluidIntervention) {
            setActiveInterventions(prev => [...prev, fluidIntervention]);
          }
          initAudioContext();
          triggerAlert('critical_action');
          break;

        case 'respiratory_failure':
          // Respiratory failure - start at breathing assessment
          setCaseStartTime(new Date());
          setCurrentPhase('breathing');
          setCurrentQuestionId('breathing_effort');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'resp-support',
            severity: 'critical',
            title: 'RESPIRATORY SUPPORT NEEDED',
            instruction: `1. Position of comfort / airway positioning\n2. High-flow oxygen (target SpO2 > 94%)\n3. If wheezing: Salbutamol 2.5-5 mg nebulized\n4. Prepare for assisted ventilation if deteriorating`,
            rationale: 'Respiratory failure can rapidly progress to arrest. Optimize oxygenation and ventilation.',
            timer: 60,
            reassessAfter: 'Reassess work of breathing and SpO2 every minute'
          });
          setShowActionCard(true);
          initAudioContext();
          triggerAlert('critical_action');
          break;

        default:
          // Unknown scenario - just start normal assessment
          handleStartAssessment();
      }
      
      // Clear the URL parameter to prevent re-triggering
      setLocation('/clinical-assessment', { replace: true });
    }
  }, [scenarioParam, currentPhase, weight]);

  // Get phase color
  const getPhaseColor = (phase: AssessmentPhase): string => {
    switch (phase) {
      case 'signs_of_life': return 'bg-red-600';
      case 'airway': return 'bg-orange-600';
      case 'breathing': return 'bg-yellow-600';
      case 'circulation': return 'bg-pink-600';
      case 'disability': return 'bg-purple-600';
      case 'exposure': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  // Get phase icon
  const getPhaseIcon = (phase: AssessmentPhase) => {
    switch (phase) {
      case 'signs_of_life': return <Heart className="h-5 w-5" />;
      case 'airway': return <Wind className="h-5 w-5" />;
      case 'breathing': return <Wind className="h-5 w-5" />;
      case 'circulation': return <Droplets className="h-5 w-5" />;
      case 'disability': return <Brain className="h-5 w-5" />;
      case 'exposure': return <Thermometer className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  // Calculate progress
  const allQuestions = getAllQuestionsInOrder();
  const currentIndex = allQuestions.indexOf(currentQuestionId);
  const progress = currentPhase === 'complete' ? 100 : Math.round((currentIndex / allQuestions.length) * 100);

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Offline Indicator & PWA Install */}
      <OfflineIndicator
        showInstallButton={isInstallable}
        onInstallClick={handleInstallClick}
      />

      {/* CPR Clock Overlay */}
      {cprActive && (
        <CPRClockStreamlined
          patientWeight={weight}
          patientAgeMonths={totalAgeMonths}
          onClose={() => setCprActive(false)}
        />
      )}

      {/* Clinical Header */}
      {currentPhase !== 'setup' && (
        <ClinicalHeader
          patient={{ ...patientData, weight }}
          caseStartTime={caseStartTime}
          emergencyActivated={emergencyActivated}
          cprActive={cprActive}
          onCallForHelp={handleCallForHelp}
          onGenerateHandover={handleGenerateHandover}
          onNewCase={handleNewCase}
          onBackToHome={() => setLocation('/clinical-assessment')}
          onToggleAlerts={() => setAlertsEnabled(!alertsEnabled)}
          alertsEnabled={alertsEnabled}
          activeInterventionCount={activeInterventions.filter(i => i.status !== 'completed').length}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}

      {/* Active Interventions Sidebar */}
      {currentPhase !== 'setup' && (
        <ActiveInterventionsSidebar
          interventions={activeInterventions}
          onInterventionComplete={handleInterventionComplete}
          onInterventionEscalate={handleInterventionEscalate}
          onReassessmentTrigger={handleReassessmentTrigger}
          onInterventionCancel={handleInterventionCancel}
          onModuleTrigger={handleModuleTrigger}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          weightKg={weight}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        currentPhase !== 'setup' && !sidebarCollapsed ? 'mr-80' : ''
      } ${currentPhase !== 'setup' ? 'pt-20' : ''}`}>
        <div className="mx-auto p-3 md:p-6 md:max-w-2xl">
          
          {/* PATIENT SETUP */}
          {currentPhase === 'setup' && (
            <Card className="bg-slate-800/90 border-slate-700 p-4 md:p-8">
              {/* Header - Minimal */}
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">ResusGPS</h1>
                <p className="text-slate-400 text-xs md:text-sm mt-1">Pediatric Emergency GPS</p>
              </div>

              {/* Patien              {/* Patient Inputs - Minimal */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 max-[374px]:grid-cols-1 max-[374px]:gap-3 patient-inputs-mobile">
                  <div className="col-span-2 max-[374px]:col-span-1">
                    <Label className="text-gray-400 text-xs uppercase tracking-wide">Age</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={patientData.ageYears || ''}
                        onChange={(e) => setPatientData({ ...patientData, ageYears: parseInt(e.target.value) || 0, ageMonths: 0 })}
                        className="bg-slate-700 border-slate-600 text-white text-lg h-14 flex-1"
                        placeholder="Years"
                        min={0}
                        max={18}
                      />
                      <Input
                        type="number"
                        value={patientData.ageMonths || ''}
                        onChange={(e) => setPatientData({ ...patientData, ageMonths: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600 text-white text-lg h-14 w-20"
                        placeholder="Mo"
                        min={0}
                        max={11}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs uppercase tracking-wide">Weight</Label>
                    <Input
                      type="number"
                      value={patientData.weight || ''}
                      onChange={(e) => setPatientData({ ...patientData, weight: parseFloat(e.target.value) || 0 })}
                      placeholder="kg"
                      className="bg-slate-700 border-slate-600 text-white text-lg h-14 mt-1"
                      min={0.5}
                      max={150}
                      step={0.1}
                    />
                  </div>
                </div>
                {(patientData.ageYears > 0 || patientData.ageMonths > 0) && !patientData.weight && (
                  <p className="text-sm text-orange-400 text-center">Weight: {weight.toFixed(1)} kg (auto)</p>
                )}
              </div>

              {/* Emergency Protocol Quick Launcher */}
              <div className="mb-4">
                <button
                  onClick={() => setShowEmergencyLauncher(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-98 text-white py-4 px-4 rounded-lg flex items-center justify-center gap-2 text-base font-bold shadow-lg transition-all min-h-[56px]"
                >
                  <Zap className="h-5 w-5" />
                  QUICK LAUNCH PROTOCOL
                </button>
                <p className="text-xs text-gray-400 text-center mt-1">Skip assessment when diagnosis is known</p>
              </div>

              {/* Emergency Quick Access - Reordered for mobile */}
              <div className="space-y-3 mb-4 btn-stack">
                {/* SHOUT FOR HELP - Before any assessment */}
                <ShoutForHelp variant="homepage" className="mb-4" />

                {/* CARDIAC ARREST - Red, most prominent */}
                <button
                  onClick={() => setLocation('/clinical-assessment?scenario=cardiac_arrest')}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-base md:text-sm font-bold shadow-lg shadow-red-900/50 transition-all min-h-[56px] clinical-action-button"
                >
                  <Heart className="h-4 w-4" />
                  CARDIAC ARREST
                </button>

                {/* MEDICAL - Orange, below cardiac arrest */}
                <button
                  onClick={handleStartAssessment}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-98 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-base md:text-sm font-bold shadow-lg shadow-orange-900/50 transition-all min-h-[56px] clinical-action-button"
                >
                  <Stethoscope className="h-4 w-4" />
                  MEDICAL
                </button>

                {/* NEONATAL - Pink */}
                <button
                  onClick={() => setLocation('/nrp')}
                  className="w-full bg-pink-600 hover:bg-pink-700 active:scale-98 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-base md:text-sm font-bold shadow-lg shadow-pink-900/50 transition-all min-h-[56px] clinical-action-button"
                >
                  <Baby className="h-4 w-4" />
                  NEONATAL
                </button>

                {/* TRAUMA - Cyan */}
                <button
                  onClick={() => setLocation('/trauma')}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 active:scale-98 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-base md:text-sm font-bold shadow-lg shadow-cyan-900/50 transition-all min-h-[56px] clinical-action-button"
                >
                  <Shield className="h-4 w-4" />
                  TRAUMA
                </button>
              </div>

              {/* Training Mode */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <Button
                  onClick={() => setShowSimulation(true)}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10 py-4"
                >
                  🎓 Training Mode (CPR Simulation)
                </Button>
              </div>
            </Card>
          )}

          {/* ASSESSMENT FLOW */}
          {currentPhase !== 'setup' && currentPhase !== 'complete' && currentQuestion && (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white ${getPhaseColor(currentPhase)}`}>
                    {getPhaseIcon(currentPhase)}
                    {currentPhase.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">Q{findings.length + 1}</span>
                    <span className="text-slate-400 text-sm font-medium">{progress}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Triggered Action Card (Non-blocking overlay) */}
              {showActionCard && pendingAction && (
                <Card className={`mb-4 border-2 p-4 ${
                  pendingAction.severity === 'critical'
                    ? 'bg-red-900/90 border-red-500'
                    : 'bg-yellow-900/90 border-yellow-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-bold mb-2 ${
                        pendingAction.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'
                      }`}>
                        <AlertCircle className="h-3 w-3" />
                        {pendingAction.severity.toUpperCase()}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{pendingAction.title}</h3>
                      <p className="text-sm text-slate-200">{pendingAction.instruction}</p>
                      
                      {(pendingAction.dose || pendingAction.route) && (
                        <div className="flex gap-2 mt-2">
                          {pendingAction.dose && (
                            <span className="bg-black/30 px-2 py-1 rounded text-xs text-white">{pendingAction.dose}</span>
                          )}
                          {pendingAction.route && (
                            <span className="bg-black/30 px-2 py-1 rounded text-xs text-slate-300">{pendingAction.route}</span>
                          )}
                        </div>
                      )}

                      {/* Rationale toggle */}
                      <button
                        onClick={() => setShowRationale(!showRationale)}
                        className="flex items-center gap-1 mt-2 text-xs text-slate-300 hover:text-white"
                      >
                        <Info className="h-3 w-3" />
                        Why this?
                        {showRationale ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {showRationale && (
                        <p className="mt-1 text-xs text-slate-400 pl-4">{pendingAction.rationale}</p>
                      )}
                    </div>
                  </div>

                  {/* Acknowledgment buttons - require explicit action */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/20">
                    <Button
                      size="sm"
                      onClick={() => {
                        // Log acknowledgment
                        setFindings(prev => [...prev, {
                          id: `ack-${pendingAction.id}-${Date.now()}`,
                          question: `Action: ${pendingAction.title}`,
                          answer: 'DONE',
                          timestamp: new Date(),
                          phase: currentPhase,
                          severity: 'normal'
                        }]);
                        
                        // Add completed intervention to sidebar for tracking
                        const completedIntervention: ActiveIntervention = {
                          id: `intervention-${pendingAction.id}-${Date.now()}`,
                          type: 'monitoring' as const,
                          title: pendingAction.title,
                          instruction: pendingAction.instruction.substring(0, 100),
                          startTime: new Date(),
                          status: 'completed',
                          priority: pendingAction.severity as 'critical' | 'urgent' | 'routine',
                          relatedModule: pendingAction.relatedModule
                        };
                        setActiveInterventions(prev => [...prev, completedIntervention]);
                        
                        dismissActionCard();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Log deferral
                        setFindings(prev => [...prev, {
                          id: `defer-${pendingAction.id}-${Date.now()}`,
                          question: `Action: ${pendingAction.title}`,
                          answer: 'DEFERRED',
                          timestamp: new Date(),
                          phase: currentPhase,
                          severity: 'abnormal'
                        }]);
                        dismissActionCard();
                      }}
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
                    >
                      Deferred
                    </Button>
                    {pendingAction.relatedModule && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveModule(pendingAction.relatedModule as ActiveModule);
                          setModuleContext({ weight });
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white"
                      >
                        Open Module →
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Current Question Card */}
              <Card className="bg-slate-800/90 border-slate-700 p-6">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.subtext && (
                  <p className="text-slate-400 text-sm mb-6">{currentQuestion.subtext}</p>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.type === 'boolean' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleAnswer(true)}
                        disabled={isTransitioning}
                        className={`py-8 text-lg bg-green-600 hover:bg-green-700 text-white transition-all ${
                          selectedAnswer === true ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800 scale-105' : ''
                        }`}
                      >
                        {selectedAnswer === true ? '✓ Yes' : 'Yes'}
                      </Button>
                      <Button
                        onClick={() => handleAnswer(false)}
                        disabled={isTransitioning}
                        className={`py-8 text-lg bg-red-600 hover:bg-red-700 text-white transition-all ${
                          selectedAnswer === false ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800 scale-105' : ''
                        }`}
                      >
                        {selectedAnswer === false ? '✓ No' : 'No'}
                      </Button>
                    </div>
                  )}

                  {currentQuestion.type === 'select' && currentQuestion.options && (
                    <div className="space-y-2">
                      {currentQuestion.options.map(option => (
                        <Button
                          key={option.value}
                          onClick={() => handleAnswer(option.value)}
                          disabled={isTransitioning}
                          className={`w-full py-4 text-left justify-start transition-all ${
                            option.severity === 'critical'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : option.severity === 'abnormal'
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-black'
                              : 'bg-slate-700 hover:bg-slate-600 text-white'
                          } ${
                            selectedAnswer === option.value ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800 scale-[1.02]' : ''
                          }`}
                        >
                          {selectedAnswer === option.value ? `✓ ${option.label}` : option.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'multi-select' && currentQuestion.options && (
                    <MultiSelectQuestion
                      options={currentQuestion.options}
                      onSubmit={handleAnswer}
                    />
                  )}

                  {currentQuestion.type === 'number' && (
                    <NumberInputQuestion
                      key={currentQuestion.id}
                      unit={currentQuestion.unit}
                      min={currentQuestion.min}
                      max={currentQuestion.max}
                      placeholder={currentQuestion.placeholder}
                      onSubmit={handleAnswer}
                    />
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={!getPreviousQuestionId(currentQuestionId)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  {/* Skip button disabled for critical questions in Signs of Life phase */}
                  {currentPhase !== 'signs_of_life' && (
                    <Button
                      variant="ghost"
                      onClick={() => handleAnswer(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      Skip
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* ASSESSMENT COMPLETE */}
          {currentPhase === 'complete' && (
            <Card className="bg-slate-800/90 border-slate-700 p-4 md:p-8">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white">Assessment Complete</h2>
                <p className="text-slate-400">Primary survey finished. Continue monitoring and reassessing.</p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleGenerateHandover}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
                >
                  Generate SBAR Handover
                </Button>
                <Button
                  onClick={handleNewCase}
                  variant="outline"
                  className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 py-4"
                >
                  Start New Case
                </Button>
              </div>

              {/* Summary of findings */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-white font-semibold mb-3">Assessment Summary</h3>
                <div className="space-y-2">
                  {findings.filter(f => f.severity === 'critical' || f.severity === 'abnormal').map(f => (
                    <div
                      key={f.id}
                      className={`p-2 rounded text-sm ${
                        f.severity === 'critical' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                      }`}
                    >
                      <span className="font-medium">{f.question}:</span> {String(f.answer)}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Module Overlays */}
      {activeModule === 'shock' && (
        <ModuleOverlay title="Shock Assessment" onClose={closeModule}>
          <ShockAssessment 
            weightKg={weight} 
            onShockTypeIdentified={(type, scores) => {
              console.log('Shock type identified:', type, scores);
              closeModule();
            }}
            onAccessTimerStart={() => setActiveModule('ivio')}
            onReferralRequested={(reason) => {
              handleCallForHelp();
              closeModule();
            }}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'asthma' && (
        <ModuleOverlay title="Asthma Escalation" onClose={closeModule}>
          <AsthmaEscalation 
            weightKg={weight} 
            severity="severe"
            onReferralRequested={(reason) => {
              handleCallForHelp();
              closeModule();
            }}
            onImproved={closeModule}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'ivio' && (
        <ModuleOverlay title="IV/IO Access" onClose={closeModule}>
          <IVIOAccessTimer 
            weightKg={weight} 
            onAccessObtained={(type, site) => {
              console.log('Access obtained:', type, site);
              closeModule();
            }}
            onReferralRequested={(reason) => {
              handleCallForHelp();
              closeModule();
            }}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'fluid' && (
        <ModuleOverlay title="Fluid Bolus Tracker" onClose={() => {
          // When closing FluidBolusTracker, mark the intervention as complete
          if (moduleContext?.interventionId) {
            setActiveInterventions(prev => 
              prev.map(i => i.id === moduleContext.interventionId ? { ...i, status: 'completed' } : i)
            );
          }
          closeModule();
        }}>
          <FluidBolusTracker 
            weightKg={weight} 
            shockType="undifferentiated"
            onEscalateToInotropes={() => {
              // Mark current bolus complete and escalate to inotropes
              if (moduleContext?.interventionId) {
                setActiveInterventions(prev => 
                  prev.map(i => i.id === moduleContext.interventionId ? { ...i, status: 'completed' } : i)
                );
              }
              setActiveModule('inotrope');
            }}
            onFluidOverload={() => {
              // Mark current bolus complete and show overload management
              if (moduleContext?.interventionId) {
                setActiveInterventions(prev => 
                  prev.map(i => i.id === moduleContext.interventionId ? { ...i, status: 'completed' } : i)
                );
              }
              setActiveModule('inotrope');
            }}
            onReferralRequested={(reason) => {
              if (moduleContext?.interventionId) {
                setActiveInterventions(prev => 
                  prev.map(i => i.id === moduleContext.interventionId ? { ...i, status: 'completed' } : i)
                );
              }
              handleCallForHelp();
              closeModule();
            }}
            onShockResolved={() => {
              // Mark intervention complete and close
              if (moduleContext?.interventionId) {
                setActiveInterventions(prev => 
                  prev.map(i => i.id === moduleContext.interventionId ? { ...i, status: 'completed' } : i)
                );
              }
              closeModule();
            }}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'inotrope' && (
        <ModuleOverlay title="Inotrope Escalation" onClose={closeModule}>
          <InotropeEscalation 
            weightKg={weight} 
            shockType="undifferentiated"
            onReferralRequested={(reason) => {
              handleCallForHelp();
              closeModule();
            }}
            onStabilized={closeModule}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'lab' && (
        <ModuleOverlay title="Lab Sample Collection" onClose={closeModule}>
          <LabSampleCollection 
            clinicalContext="shock" 
            patientAge={patientData.ageYears}
            patientWeight={weight} 
            onSamplesCollected={(samples: string[]) => {
              console.log('Samples collected:', samples);
              closeModule();
            }}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'arrhythmia' && (
        <ModuleOverlay title="Arrhythmia Recognition" onClose={closeModule}>
          <ArrhythmiaRecognition 
            patientWeight={weight} 
            patientAge={patientData.ageYears}
            onTreatmentSelected={(treatment: any[], arrhythmiaId: string) => {
              console.log('Treatment selected:', treatment, arrhythmiaId);
              closeModule();
            }}
          />
        </ModuleOverlay>
      )}
      {activeModule === 'airway' && (
        <ModuleOverlay title="Airway Management" onClose={closeModule}>
          <AirwayManagement 
            weightKg={weight}
            onTreatmentComplete={() => {
              closeModule();
            }}
            onReferralRequested={(reason) => {
              handleCallForHelp();
              closeModule();
            }}
          />
        </ModuleOverlay>
      )}

      {/* Handover Modal */}
      {showHandover && currentHandover && (
        <HandoverModal
          isOpen={showHandover}
          handover={currentHandover}
          onClose={() => setShowHandover(false)}
        />
      )}

      {/* CPR Simulation Mode */}
      {showSimulation && (
        <CPRSimulation
          onClose={() => setShowSimulation(false)}
        />
      )}

      {/* Emergency Launcher */}
      {showEmergencyLauncher && (
        <EmergencyLauncher
          onLaunchProtocol={handleProtocolLaunch}
          onClose={() => setShowEmergencyLauncher(false)}
        />
      )}

      {/* Launched Protocols */}
      {launchedProtocol && launchedProtocol.type === 'cardiac_arrest' && (
        launchedProtocol.age >= 18 ? (
          <AdultACLS
            patientAge={launchedProtocol.age}
            patientWeight={launchedProtocol.weight}
            onClose={() => setLaunchedProtocol(null)}
          />
        ) : (
          <CPRClockStreamlined
            patientAgeMonths={launchedProtocol.age * 12}
            patientWeight={launchedProtocol.weight}
            onClose={() => setLaunchedProtocol(null)}
          />
        )
      )}

      {launchedProtocol && launchedProtocol.type === 'asthma' && (
        <AsthmaEmergency
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}

      {launchedProtocol && launchedProtocol.type === 'dka' && (
        <DKAProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}

      {launchedProtocol && launchedProtocol.type === 'septic_shock' && (
        <SepticShockProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}

      {launchedProtocol && launchedProtocol.type === 'anaphylaxis' && (
        <AnaphylaxisProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}

      {launchedProtocol && launchedProtocol.type === 'status_epilepticus' && (
        <StatusEpilepticusProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
      {launchedProtocol && launchedProtocol.type === 'bronchiolitis' && (
        <BronchiolitisProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
      {launchedProtocol && launchedProtocol.type === 'croup' && (
        <CroupProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
      {launchedProtocol && launchedProtocol.type === 'pneumonia' && (
        <SeverePneumoniaProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
    </div>
  );
};

// Helper Components

interface MultiSelectQuestionProps {
  options: { value: string; label: string; severity?: string }[];
  onSubmit: (selected: string[]) => void;
}

const MultiSelectQuestion: React.FC<MultiSelectQuestionProps> = ({ options, onSubmit }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (value: string) => {
    if (value === 'none' || value === 'clear') {
      setSelected([value]);
    } else {
      setSelected(prev => {
        const filtered = prev.filter(v => v !== 'none' && v !== 'clear');
        if (filtered.includes(value)) {
          return filtered.filter(v => v !== value);
        }
        return [...filtered, value];
      });
    }
  };

  return (
    <div className="space-y-2">
      {options.map(option => (
        <Button
          key={option.value}
          onClick={() => toggleOption(option.value)}
          className={`w-full py-3 text-left justify-start ${
            selected.includes(option.value)
              ? option.severity === 'critical'
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : option.severity === 'abnormal'
                ? 'bg-yellow-600 text-black ring-2 ring-yellow-400'
                : 'bg-orange-600 text-white ring-2 ring-orange-400'
              : option.severity === 'critical'
              ? 'bg-red-900/50 hover:bg-red-800 text-red-200'
              : option.severity === 'abnormal'
              ? 'bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          <span className={`mr-2 w-4 h-4 rounded border inline-flex items-center justify-center ${
            selected.includes(option.value) ? 'bg-white' : 'border-slate-500'
          }`}>
            {selected.includes(option.value) && <CheckCircle2 className="h-3 w-3 text-slate-900" />}
          </span>
          {option.label}
        </Button>
      ))}
      <Button
        onClick={() => onSubmit(selected)}
        disabled={selected.length === 0}
        className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-4"
      >
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

interface NumberInputQuestionProps {
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  onSubmit: (value: number) => void;
}

const NumberInputQuestion: React.FC<NumberInputQuestionProps> = ({ unit, min, max, placeholder, onSubmit }) => {
  const [value, setValue] = useState<string>('');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={min}
          max={max}
          className="bg-slate-700 border-slate-600 text-white text-2xl h-14 flex-1"
          placeholder={placeholder || "Enter value"}
        />
        {unit && <span className="text-slate-400 text-lg">{unit}</span>}
      </div>
      <Button
        onClick={() => onSubmit(parseFloat(value) || 0)}
        disabled={!value}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4"
      >
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

interface ModuleOverlayProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModuleOverlay: React.FC<ModuleOverlayProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ClinicalAssessmentGPS;
