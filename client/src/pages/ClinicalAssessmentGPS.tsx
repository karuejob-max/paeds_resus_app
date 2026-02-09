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
import { usePatientDemographics } from '@/contexts/PatientDemographicsContext';
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
import { voiceCommandService } from '@/lib/voiceCommandService';
import { VoiceCommandTutorial } from '@/components/VoiceCommandTutorial';
import { InlineDoseCard } from '@/components/InlineDoseCard';
import { calculateDextroseDose, calculateFluidBolus, getAgeGroup, formatDose } from '@/lib/clinicalCalculations';

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
import PostpartumHemorrhageProtocol from '@/pages/PostpartumHemorrhageProtocol';
import EclampsiaProtocol from '@/pages/EclampsiaProtocol';
import MaternalCardiacArrestProtocol from '@/pages/MaternalCardiacArrestProtocol';
import TraumaProtocol from '@/pages/TraumaProtocol';
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
  doseCard?: {
    medication: string;
    dose: string;
    route: string;
    indication: string;
    timing?: string;
    notes?: string;
  };
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

  // Voice command state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceSupported] = useState(voiceCommandService.isSupported());
  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);

  // Check if first-time user (show tutorial)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('voice_tutorial_seen');
    if (!hasSeenTutorial && voiceSupported) {
      // Show tutorial after 3 seconds (let user orient first)
      const timer = setTimeout(() => {
        setShowVoiceTutorial(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [voiceSupported]);

  const handleCloseTutorial = () => {
    setShowVoiceTutorial(false);
    localStorage.setItem('voice_tutorial_seen', 'true');
  };

  const handleStartVoiceFromTutorial = () => {
    handleToggleVoice();
  };

  // Handle voice command toggle
  const handleToggleVoice = () => {
    if (isVoiceActive) {
      voiceCommandService.stopListening();
      setIsVoiceActive(false);
    } else {
      const started = voiceCommandService.startListening(currentQuestionId, (transcript, data) => {
        console.log('Voice command received:', transcript, data);
        // Handle voice command data
        if (data && data.value !== undefined) {
          handleAnswer(data.value);
        }
      });
      setIsVoiceActive(started);
    }
  };

  // Update voice service with current question when it changes
  useEffect(() => {
    if (isVoiceActive) {
      voiceCommandService.setCurrentQuestion(currentQuestionId);
    }
  }, [currentQuestionId, isVoiceActive]);

  // Handle protocol launch from emergency launcher
  const handleProtocolLaunch = (protocol: string, age: number, weight: number) => {
    // Cardiac arrest always routes to Quick Launch protocol (scenario=cardiac_arrest)
    if (protocol === 'cardiac_arrest') {
      // Set patient weight if provided
      if (weight > 0) {
        setPatientData(prev => ({ ...prev, weight }));
      }
      // Route to Quick Launch cardiac arrest protocol
      setLocation('/clinical-assessment?scenario=cardiac_arrest');
      setShowEmergencyLauncher(false);
      return;
    }
    
    // Other protocols use the launched protocol rendering
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
  // ========================================
  // PHASE 1: CRITICAL TRIAGE (Questions 1-3)
  // ========================================
  
  {
    id: 'breathing',
    phase: 'triage',
    question: 'Is the patient breathing?',
    subtext: 'Look for chest movement, listen for breath sounds',
    type: 'boolean',
    criticalTrigger: (answer) => {
      if (answer === false) {
        return {
          id: 'start-bvm',
          severity: 'critical',
          title: 'START BAG-VALVE-MASK VENTILATION NOW',
          instruction: 'Open airway (head tilt-chin lift). Apply mask with good seal. Squeeze bag to see chest rise. Give 1 breath every 3 seconds.',
          rationale: 'Not breathing = immediate ventilation needed to prevent cardiac arrest.',
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
    phase: 'triage',
    question: 'Can you feel a pulse?',
    subtext: 'Check brachial (infant) or carotid (child/adult) for 10 seconds max',
    type: 'boolean',
    criticalTrigger: (answer) => {
      if (answer === false) {
        return {
          id: 'start-cpr',
          severity: 'critical',
          title: 'START CPR IMMEDIATELY',
          instruction: 'Begin chest compressions: 100-120/min, depth 1/3 chest (peds) or 2 inches (adult). 15:2 ratio with BVM (peds) or 30:2 (adult). Minimize interruptions.',
          rationale: 'No pulse = cardiac arrest. Every minute without CPR decreases survival by 10%.',
          timer: 120,
          reassessAfter: 'Rhythm check at 2 minutes',
          interventionTemplate: 'cpr'
        };
      }
      return null;
    }
  },
  
  {
    id: 'responsiveness',
    phase: 'triage',
    question: 'Are they responsive?',
    subtext: 'Do they respond to voice or pain?',
    type: 'select',
    options: [
      { value: 'alert', label: 'Alert - eyes open, responds normally', severity: 'normal' },
      { value: 'responds', label: 'Responds to voice or pain', severity: 'abnormal' },
      { value: 'unresponsive', label: 'Unresponsive - no response at all', severity: 'critical' }
    ],
    criticalTrigger: (answer) => {
      if (answer === 'unresponsive') {
        return {
          id: 'protect-airway',
          severity: 'critical',
          title: 'PROTECT AIRWAY - UNRESPONSIVE PATIENT',
          instruction: 'Position in recovery position if breathing. Prepare for intubation if not protecting airway. Call for help.',
          rationale: 'Unresponsive patient cannot protect airway. Risk of aspiration and respiratory failure.',
          relatedModule: 'airway'
        };
      }
      return null;
    }
  },

  // ========================================
  // PHASE 2: MAIN PROBLEM IDENTIFICATION (Question 4)
  // ========================================
  
  {
    id: 'main_problem',
    phase: 'problem_identification',
    question: 'What is the MAIN problem?',
    subtext: 'Choose the most urgent issue',
    type: 'select',
    options: [
      { value: 'breathing', label: 'Breathing difficulty', severity: 'urgent' },
      { value: 'shock', label: 'Shock / Poor perfusion', severity: 'urgent' },
      { value: 'seizure', label: 'Seizure / Altered mental status', severity: 'urgent' },
      { value: 'trauma', label: 'Severe bleeding / Trauma', severity: 'urgent' },
      { value: 'poisoning', label: 'Poisoning / Overdose', severity: 'urgent' },
      { value: 'allergic', label: 'Allergic reaction', severity: 'urgent' }
    ]
  },

  // ========================================
  // BREATHING PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'breathing_signs',
    phase: 'breathing_pathway',
    question: 'What breathing signs do you see?',
    subtext: 'Select all that apply',
    type: 'multi-select',
    options: [
      { value: 'wheezing', label: 'Wheezing', severity: 'abnormal' },
      { value: 'stridor', label: 'Stridor (high-pitched sound)', severity: 'critical' },
      { value: 'grunting', label: 'Grunting / Severe retractions', severity: 'critical' },
      { value: 'cyanosis', label: 'Cyanosis (blue lips/skin)', severity: 'critical' }
    ],
    criticalTrigger: (answer: string[]) => {
      if (answer.includes('stridor')) {
        return {
          id: 'stridor-management',
          severity: 'critical',
          title: 'STRIDOR - AIRWAY EMERGENCY',
          instruction: 'Keep child calm. Give oxygen. Consider: croup (dexamethasone + nebulized epinephrine), foreign body (do NOT examine throat), anaphylaxis (IM epinephrine). Call for airway help.',
          rationale: 'Stridor = upper airway obstruction. Can progress to complete obstruction rapidly.',
          relatedModule: 'airway'
        };
      }
      if (answer.includes('wheezing')) {
        return {
          id: 'bronchospasm',
          severity: 'urgent',
          title: 'BRONCHOSPASM - START BRONCHODILATORS',
          instruction: 'Give salbutamol nebulizer. Assess severity. Consider asthma, bronchiolitis, anaphylaxis.',
          rationale: 'Wheezing = bronchospasm. Early bronchodilator improves outcomes.',
          interventionTemplate: 'salbutamolNeb',
          relatedModule: 'AsthmaEscalation'
        };
      }
      return null;
    }
  },
  
  {
    id: 'spo2',
    phase: 'breathing_pathway',
    question: 'What is the SpO2?',
    subtext: 'Oxygen saturation level',
    type: 'number',
    unit: '%',
    min: 50,
    max: 100,
    criticalTrigger: (answer: number) => {
      if (answer < 90) {
        return {
          id: 'severe-hypoxia',
          severity: 'critical',
          title: 'SEVERE HYPOXIA - HIGH-FLOW OXYGEN NOW',
          instruction: 'Give 100% oxygen via non-rebreather mask or bag-valve-mask. Target SpO2 >94%. Prepare for intubation if not improving.',
          rationale: 'SpO2 <90% = severe hypoxia. Immediate oxygen required.',
          timer: 60,
          reassessAfter: 'Recheck SpO2 after 1 minute'
        };
      }
      return null;
    }
  },

  // ========================================
  // SHOCK PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'perfusion_signs',
    phase: 'shock_pathway',
    question: 'What perfusion signs do you see?',
    subtext: 'Select all that apply',
    type: 'multi-select',
    options: [
      { value: 'weak_pulse', label: 'Weak or absent pulses', severity: 'critical' },
      { value: 'delayed_crt', label: 'CRT >3 seconds', severity: 'critical' },
      { value: 'cold_extremities', label: 'Cold hands/feet', severity: 'abnormal' },
      { value: 'mottled_skin', label: 'Mottled or pale skin', severity: 'abnormal' }
    ],
    criticalTrigger: (answer: string[]) => {
      if (answer.length >= 2) {
        return {
          id: 'shock-resuscitation',
          severity: 'critical',
          title: 'SHOCK - START FLUID RESUSCITATION',
          instruction: 'Get IV/IO access NOW. Give 20 mL/kg fluid bolus over 5-10 minutes. Reassess after each bolus.',
          rationale: 'Multiple perfusion signs = shock. Immediate fluid resuscitation needed.',
          interventionTemplate: 'fluidBolus',
          relatedModule: 'FluidBolusTracker'
        };
      }
      return null;
    }
  },
  
  {
    id: 'bleeding_visible',
    phase: 'shock_pathway',
    question: 'Is there visible bleeding?',
    type: 'boolean',
    criticalTrigger: (answer) => {
      if (answer === true) {
        return {
          id: 'hemorrhagic-shock',
          severity: 'critical',
          title: 'HEMORRHAGIC SHOCK - STOP BLEEDING',
          instruction: 'Apply direct pressure. Elevate if possible. Get IV access. Give blood products if massive bleeding. Consider tourniquet for limb hemorrhage.',
          rationale: 'Visible bleeding + shock = hemorrhagic shock. Stop bleeding AND restore volume.',
          timer: 120
        };
      }
      return null;
    }
  },

  // ========================================
  // SEIZURE/NEURO PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'seizure_activity',
    phase: 'neuro_pathway',
    question: 'Is there seizure activity?',
    type: 'select',
    options: [
      { value: 'active_now', label: 'Seizing RIGHT NOW', severity: 'critical' },
      { value: 'recent', label: 'Seizure stopped recently', severity: 'abnormal' },
      { value: 'no_seizure', label: 'No seizure', severity: 'normal' }
    ],
    criticalTrigger: (answer) => {
      if (answer === 'active_now') {
        return {
          id: 'status-epilepticus',
          severity: 'critical',
          title: 'ACTIVE SEIZURE - GIVE BENZODIAZEPINE',
          instruction: 'Protect airway. Give lorazepam 0.1 mg/kg IV or midazolam 0.2 mg/kg IM. If still seizing at 5 min, repeat dose.',
          rationale: 'Ongoing seizure requires immediate benzodiazepine. Status epilepticus if >5 minutes.',
          interventionTemplate: 'statusEpilepticus',
          timer: 300
        };
      }
      return null;
    }
  },
  
  {
    id: 'glucose_level',
    phase: 'neuro_pathway',
    question: 'What is the blood glucose?',
    subtext: 'If available - skip if unknown',
    type: 'number',
    unit: 'mg/dL',
    min: 20,
    max: 600,
    criticalTrigger: (answer: number) => {
      if (answer < 60) {
        return {
          id: 'hypoglycemia',
          severity: 'critical',
          title: 'HYPOGLYCEMIA - GIVE GLUCOSE NOW',
          instruction: 'Give dextrose 0.5-1 g/kg IV (2-4 mL/kg of D25 or 5-10 mL/kg of D10). Recheck glucose in 15 minutes.',
          rationale: 'Glucose <60 mg/dL can cause seizures, altered mental status, brain damage.',
          timer: 60,
          doseCard: {
            medication: 'Dextrose',
            indication: 'Hypoglycemia (glucose <60 mg/dL)',
            route: 'IV push',
            timing: 'Immediate',
            notes: 'Recheck glucose in 15 minutes. May need repeat dose or dextrose infusion.'
          }
        };
      }
      if (answer > 250) {
        return {
          id: 'hyperglycemia-dka',
          severity: 'urgent',
          title: 'HYPERGLYCEMIA - ASSESS FOR DKA',
          instruction: 'Check for DKA signs: vomiting, abdominal pain, Kussmaul breathing. Get VBG, ketones, electrolytes. Start fluid resuscitation.',
          rationale: 'High glucose + altered mental status may be DKA.',
          interventionTemplate: 'dkaManagement',
          relatedModule: 'DKAManagement'
        };
      }
      return null;
    }
  },

  // ========================================
  // TRAUMA PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'trauma_mechanism',
    phase: 'trauma_pathway',
    question: 'What type of trauma?',
    type: 'select',
    options: [
      { value: 'fall', label: 'Fall / Blunt trauma', severity: 'abnormal' },
      { value: 'penetrating', label: 'Penetrating injury (stab/gunshot)', severity: 'critical' },
      { value: 'burns', label: 'Burns', severity: 'abnormal' },
      { value: 'multiple', label: 'Multiple injuries', severity: 'critical' }
    ],
    criticalTrigger: (answer) => {
      if (answer === 'penetrating' || answer === 'multiple') {
        return {
          id: 'major-trauma',
          severity: 'critical',
          title: 'MAJOR TRAUMA - ACTIVATE TRAUMA PROTOCOL',
          instruction: 'C-spine immobilization. Control bleeding. Two large-bore IVs. Trauma series imaging. Call trauma team.',
          rationale: 'Penetrating or multi-system trauma requires full trauma activation.',
          relatedModule: 'TraumaProtocol'
        };
      }
      return null;
    }
  },
  
  {
    id: 'trauma_location',
    phase: 'trauma_pathway',
    question: 'Where is the injury?',
    type: 'multi-select',
    options: [
      { value: 'head', label: 'Head / Neck', severity: 'critical' },
      { value: 'chest', label: 'Chest', severity: 'critical' },
      { value: 'abdomen', label: 'Abdomen', severity: 'critical' },
      { value: 'extremity', label: 'Arms / Legs', severity: 'abnormal' }
    ],
    criticalTrigger: (answer: string[]) => {
      if (answer.includes('head')) {
        return {
          id: 'head-trauma',
          severity: 'critical',
          title: 'HEAD TRAUMA - PROTECT C-SPINE',
          instruction: 'Immobilize C-spine. Assess GCS. Prevent secondary injury: maintain BP, avoid hypoxia. CT head if GCS <15.',
          rationale: 'Head trauma can cause intracranial bleeding, increased ICP.',
          timer: 300
        };
      }
      if (answer.includes('chest')) {
        return {
          id: 'chest-trauma',
          severity: 'critical',
          title: 'CHEST TRAUMA - ASSESS FOR PNEUMOTHORAX',
          instruction: 'Listen for breath sounds. Check for tracheal deviation. Prepare for needle decompression if tension pneumothorax.',
          rationale: 'Chest trauma can cause pneumothorax, hemothorax, cardiac injury.',
          timer: 180
        };
      }
      return null;
    }
  },

  // ========================================
  // POISONING PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'substance_type',
    phase: 'poisoning_pathway',
    question: 'What was ingested/exposed?',
    type: 'select',
    options: [
      { value: 'medication', label: 'Medication overdose', severity: 'urgent' },
      { value: 'household', label: 'Household chemical', severity: 'urgent' },
      { value: 'unknown', label: 'Unknown substance', severity: 'abnormal' }
    ]
  },
  
  {
    id: 'ingestion_time',
    phase: 'poisoning_pathway',
    question: 'When did this happen?',
    type: 'select',
    options: [
      { value: 'recent', label: 'Less than 1 hour ago', severity: 'urgent' },
      { value: 'delayed', label: 'More than 1 hour ago', severity: 'abnormal' }
    ],
    criticalTrigger: (answer, patientData, weight) => {
      if (answer === 'recent') {
        return {
          id: 'recent-ingestion',
          severity: 'urgent',
          title: 'RECENT INGESTION - CONSIDER DECONTAMINATION',
          instruction: 'Call poison control. Consider activated charcoal if <1 hour and appropriate substance. Monitor for deterioration.',
          rationale: 'Recent ingestion may benefit from decontamination. Time-sensitive.',
          timer: 600
        };
      }
      return null;
    }
  },

  // ========================================
  // ALLERGIC REACTION PATHWAY (Question 5)
  // ========================================
  
  {
    id: 'anaphylaxis_signs',
    phase: 'allergic_pathway',
    question: 'What allergic signs do you see?',
    subtext: 'Select all that apply',
    type: 'multi-select',
    options: [
      { value: 'airway_swelling', label: 'Airway swelling / Stridor', severity: 'critical' },
      { value: 'breathing_difficulty', label: 'Wheezing / Breathing difficulty', severity: 'critical' },
      { value: 'hypotension', label: 'Low blood pressure / Weak pulse', severity: 'critical' },
      { value: 'rash', label: 'Rash / Hives only', severity: 'abnormal' }
    ],
    criticalTrigger: (answer: string[]) => {
      const criticalSigns = ['airway_swelling', 'breathing_difficulty', 'hypotension'];
      const hasCriticalSign = answer.some(sign => criticalSigns.includes(sign));
      
      if (hasCriticalSign) {
        return {
          id: 'anaphylaxis',
          severity: 'critical',
          title: 'ANAPHYLAXIS - GIVE IM EPINEPHRINE NOW',
          instruction: 'IM epinephrine 0.01 mg/kg (max 0.5 mg) in anterolateral thigh. Can repeat every 5-15 minutes. Give oxygen, fluids, antihistamines.',
          rationale: 'Anaphylaxis is life-threatening. IM epinephrine is first-line treatment.',
          interventionTemplate: 'anaphylaxisProtocol',
          timer: 300
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

  // Question flow by phase (GPS-style)
  const questionFlowByPhase: Record<AssessmentPhase, string[]> = {
    setup: [],
    triage: ['breathing', 'pulse', 'responsiveness'],
    problem_identification: ['main_problem'],
    breathing_pathway: ['breathing_signs', 'spo2'],
    shock_pathway: ['perfusion_signs', 'bleeding_visible'],
    neuro_pathway: ['seizure_activity', 'glucose_level'],
    trauma_pathway: ['trauma_mechanism', 'trauma_location'],
    poisoning_pathway: ['substance_type', 'ingestion_time'],
    allergic_pathway: ['anaphylaxis_signs'],
    complete: []
  };

  // Get all questions in order (GPS-style)
  const getAllQuestionsInOrder = (): string[] => {
    return [
      ...questionFlowByPhase.triage,
      ...questionFlowByPhase.problem_identification,
      ...questionFlowByPhase.breathing_pathway,
      ...questionFlowByPhase.shock_pathway,
      ...questionFlowByPhase.neuro_pathway,
      ...questionFlowByPhase.trauma_pathway,
      ...questionFlowByPhase.poisoning_pathway,
      ...questionFlowByPhase.allergic_pathway
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

        case 'dka':
          // DKA - start DKA management protocol
          setCaseStartTime(new Date());
          setCurrentPhase('circulation');
          setCurrentQuestionId('perfusion');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'dka-management',
            severity: 'urgent',
            title: 'DKA PROTOCOL - START NOW',
            instruction: `1. Fluid bolus: ${Math.round(effectiveWeight * 10)} mL NS over 1-2 hours\n2. Check glucose, ketones, blood gas, electrolytes\n3. Cardiac monitoring (K+ changes)\n4. Start insulin 0.05-0.1 units/kg/hr AFTER initial fluids\n5. Neuro checks every hour (cerebral edema watch)`,
            rationale: 'DKA requires careful fluid resuscitation and insulin therapy. Avoid rapid glucose correction to prevent cerebral edema.',
            timer: 3600,
            reassessAfter: 'Reassess glucose, K+, pH every hour. Target glucose decrease 50-100 mg/dL/hr'
          });
          setShowActionCard(true);
          // Add DKA management intervention
          const dkaIntervention = interventionTemplates.dkaManagement?.(effectiveWeight);
          if (dkaIntervention) {
            setActiveInterventions(prev => [...prev, dkaIntervention]);
          }
          initAudioContext();
          triggerAlert('urgent_action');
          break;

        case 'trauma':
          // Trauma - start trauma assessment with C-spine protection
          setCaseStartTime(new Date());
          setCurrentPhase('airway');
          setCurrentQuestionId('airway_patency');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'trauma-primary',
            severity: 'critical',
            title: 'TRAUMA PRIMARY SURVEY',
            instruction: `1. C-spine immobilization\n2. Airway with jaw thrust (NOT head tilt)\n3. Control external hemorrhage\n4. High-flow oxygen\n5. Establish 2x IV access\n6. Warm fluids: ${Math.round(effectiveWeight * 20)} mL NS/LR\n7. TXA ${Math.min(effectiveWeight * 15, 1000)} mg IV (within 3 hrs)`,
            rationale: 'Major trauma requires systematic ABCDE assessment with C-spine protection. Control hemorrhage and prevent hypothermia.',
            timer: 180,
            reassessAfter: 'Complete primary survey, then secondary survey'
          });
          setShowActionCard(true);
          initAudioContext();
          triggerAlert('critical_action');
          break;

        case 'neonatal':
          // Neonatal resuscitation - start NRP protocol
          setCaseStartTime(new Date());
          setCurrentPhase('airway');
          setCurrentQuestionId('breathing');
          setEmergencyActivated(true);
          setPendingAction({
            id: 'nrp-protocol',
            severity: 'critical',
            title: 'NEONATAL RESUSCITATION',
            instruction: `Golden Minute:\n1. Warm, dry, stimulate\n2. Position airway (neutral sniffing)\n3. Clear airway if needed\n4. Assess breathing and heart rate\n5. PPV if HR < 100 or apneic\n6. Target SpO2: 60-65% at 1 min, 85-95% by 10 min`,
            rationale: 'Neonatal resuscitation focuses on establishing effective ventilation. Most newborns respond to PPV alone.',
            timer: 60,
            reassessAfter: 'Reassess heart rate every 30 seconds'
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
      {/* Voice Command Tutorial (First-time users) */}
      {showVoiceTutorial && (
        <VoiceCommandTutorial
          onClose={handleCloseTutorial}
          onStartTutorial={handleStartVoiceFromTutorial}
        />
      )}

      {/* Offline Indicator & PWA Install */}
      <OfflineIndicator
        showInstallButton={isInstallable}
        onInstallClick={handleInstallClick}
      />

      {/* Patient Demographics Banner */}
      <PatientInfoBanner />

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
          onToggleVoice={handleToggleVoice}
          voiceActive={isVoiceActive}
          voiceSupported={voiceSupported}
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

              {/* Patien              {/* Primary CTA: Clinical Reasoning Engine */}
              <div className="mb-6">
                <button
                  onClick={() => setLocation('/primary-survey')}
                  className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 active:scale-98 text-white py-6 px-6 rounded-xl flex items-center justify-center gap-3 text-lg font-bold shadow-2xl shadow-cyan-900/50 transition-all min-h-[72px] border-2 border-cyan-400/30"
                >
                  <Activity className="h-7 w-7" />
                  START CLINICAL ASSESSMENT
                </button>
                <p className="text-sm text-cyan-300 text-center mt-2 font-medium">Intelligent triage • Zero diagnostic burden • Immediate interventions</p>
              </div>

              {/* Expert Mode: Quick Launch (Collapsible) */}
              <div className="mb-4">
                <button
                  onClick={() => setShowEmergencyLauncher(true)}
                  className="w-full bg-slate-700/50 hover:bg-slate-700 active:scale-98 text-slate-300 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium border border-slate-600 transition-all"
                >
                  <Zap className="h-4 w-4" />
                  Expert Mode: Quick Launch Protocol
                </button>
                <p className="text-xs text-gray-500 text-center mt-1">For experienced providers when diagnosis is known</p>
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
                      
                      {/* Inline Dose Card for medication triggers */}
                      {pendingAction.doseCard && (
                        <div className="mt-3">
                          <InlineDoseCard
                            medication={pendingAction.doseCard.medication}
                            dose={pendingAction.doseCard.dose}
                            route={pendingAction.doseCard.route}
                            indication={pendingAction.doseCard.indication}
                            timing={pendingAction.doseCard.timing}
                            notes={pendingAction.doseCard.notes}
                          />
                        </div>
                      )}
                      
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
      {launchedProtocol && launchedProtocol.type === 'postpartum_hemorrhage' && (
        <PostpartumHemorrhageProtocol
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
      {launchedProtocol && launchedProtocol.type === 'eclampsia' && (
        <EclampsiaProtocol
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
      {launchedProtocol && launchedProtocol.type === 'maternal_cardiac_arrest' && (
        <MaternalCardiacArrestProtocol
          patientAge={launchedProtocol.age}
          patientWeight={launchedProtocol.weight}
          onClose={() => setLaunchedProtocol(null)}
        />
      )}
      {launchedProtocol && launchedProtocol.type === 'trauma' && (
        <TraumaProtocol
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

// Patient Info Banner Component
const PatientInfoBanner: React.FC = () => {
  const { demographics, getWeightInKg, getAgeInYears } = usePatientDemographics();
  
  if (!demographics.age && !demographics.weight) return null;
  
  const weightKg = getWeightInKg();
  const ageYears = getAgeInYears();
  
  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600/90 backdrop-blur-sm border border-blue-400 rounded-lg px-4 py-2 shadow-lg">
      <div className="flex items-center gap-4 text-white text-sm font-medium">
        {demographics.age && (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Age: {demographics.age}</span>
            {ageYears !== null && (
              <span className="text-blue-200 text-xs">({ageYears.toFixed(1)} years)</span>
            )}
          </div>
        )}
        {demographics.weight && (
          <div className="flex items-center gap-1">
            <Weight className="h-4 w-4" />
            <span>Weight: {demographics.weight} kg</span>
          </div>
        )}
      </div>
    </div>
  );
};

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
