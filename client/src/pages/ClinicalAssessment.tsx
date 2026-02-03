'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Brain,
  Stethoscope,
  Wind,
  Droplets,
  Info,
  ArrowRight,
  RotateCcw,
  Phone,
  FileText
} from 'lucide-react';
import { CPRClock } from '@/components/CPRClock';
import { HandoverModal } from '@/components/HandoverModal';
import QuickStartPanel from '@/components/QuickStartPanel';
import AlertSettings from '@/components/AlertSettings';
import { initAudioContext, triggerAlert, playCountdownBeep } from '@/lib/alertSystem';
import { generateSBARHandover } from '@/lib/sbarHandover';
import { extractHandoverData } from '@/lib/assessmentToHandover';

// ============================================================================
// GPS-LIKE CLINICAL DECISION SUPPORT
// One question → Immediate action if critical → Reassess → Next question
// ============================================================================

interface PatientData {
  ageYears: number;
  ageMonths: number;
  weight: number;
  glucoseUnit: 'mmol/L' | 'mg/dL';
}

interface CriticalAction {
  id: string;
  severity: 'critical' | 'urgent' | 'routine';
  title: string;
  instruction: string;
  dose?: string;
  route?: string;
  rationale: string;
  reassessAfter: string;
  timer?: number; // seconds until reassessment
}

interface AssessmentFinding {
  question: string;
  answer: string | number | boolean | null;
  timestamp: Date;
  triggeredAction?: CriticalAction;
}

type ReassessmentResponse = 'better' | 'same' | 'worse';

// Clinical question definitions with immediate action triggers
interface ClinicalQuestion {
  id: string;
  phase: 'setup' | 'signs_of_life' | 'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure';
  question: string;
  description?: string;
  type: 'binary' | 'select' | 'number' | 'multi-select';
  options?: { value: string; label: string; critical?: boolean }[];
  criticalTrigger?: (answer: any, patientData: PatientData) => CriticalAction | null;
  nextQuestion?: (answer: any) => string | null; // Dynamic routing
}

const ClinicalAssessment: React.FC = () => {
  // Patient data
  const [patientData, setPatientData] = useState<PatientData>({
    ageYears: 0,
    ageMonths: 0,
    weight: 0,
    glucoseUnit: 'mmol/L',
  });
  
  // Current state
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('age');
  const [patientSetupComplete, setPatientSetupComplete] = useState(false);
  
  // Action state
  const [currentAction, setCurrentAction] = useState<CriticalAction | null>(null);
  const [actionAcknowledged, setActionAcknowledged] = useState(false);
  const [showReassessment, setShowReassessment] = useState(false);
  const [reassessmentTimer, setReassessmentTimer] = useState<number>(0);
  
  // Tracking
  const [findings, setFindings] = useState<AssessmentFinding[]>([]);
  const [completedActions, setCompletedActions] = useState<CriticalAction[]>([]);
  const [startTime] = useState(new Date());
  
  // Emergency states
  const [cprActive, setCprActive] = useState(false);
  const [emergencyActivated, setEmergencyActivated] = useState(false);
  
  // Handover
  const [showHandover, setShowHandover] = useState(false);
  const [currentHandover, setCurrentHandover] = useState<any>(null);
  
  // Case complete
  const [caseComplete, setCaseComplete] = useState(false);

  // Calculate weight from age
  const calculateWeight = useCallback((years: number, months: number): number => {
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) {
      return (totalMonths + 9) / 2;
    } else if (totalMonths < 60) {
      return (years + 4) * 2;
    } else {
      return years * 4;
    }
  }, []);

  const weight = patientData.weight || calculateWeight(patientData.ageYears, patientData.ageMonths);

  // ============================================================================
  // CLINICAL QUESTIONS WITH IMMEDIATE ACTION TRIGGERS
  // ============================================================================
  
  const clinicalQuestions: ClinicalQuestion[] = [
    // SIGNS OF LIFE - Most critical first
    {
      id: 'breathing',
      phase: 'signs_of_life',
      question: 'Is the child BREATHING?',
      description: 'Look for chest rise, listen for breath sounds, feel for air movement',
      type: 'binary',
      options: [
        { value: 'yes', label: 'YES - Breathing' },
        { value: 'no', label: 'NO - Not breathing', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'no') {
          return {
            id: 'bvm-ventilation',
            severity: 'critical',
            title: 'START BAG-VALVE-MASK VENTILATION NOW',
            instruction: 'Position head (neutral in infants, sniffing in children). Seal mask. Squeeze bag to see chest rise.',
            dose: `${pd.ageYears < 1 ? '30' : pd.ageYears < 8 ? '20' : '12-15'} breaths/minute`,
            route: 'Bag-valve-mask',
            rationale: 'Apnea is immediately life-threatening. Ventilation must begin within seconds.',
            reassessAfter: 'After 5 breaths, check for chest rise and improvement',
            timer: 30,
          };
        }
        return null;
      },
    },
    {
      id: 'pulse',
      phase: 'signs_of_life',
      question: 'Does the child have a PULSE?',
      description: 'Check brachial (infant) or carotid (child) pulse for 10 seconds max',
      type: 'binary',
      options: [
        { value: 'yes', label: 'YES - Pulse present' },
        { value: 'no', label: 'NO - Pulseless', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'no') {
          return {
            id: 'start-cpr',
            severity: 'critical',
            title: 'START CPR IMMEDIATELY',
            instruction: `Begin chest compressions: ${pd.ageYears < 1 ? 'Two fingers or two thumbs encircling' : pd.ageYears < 8 ? 'One hand, heel of hand' : 'Two hands, interlocked'}. Compress 1/3 chest depth at 100-120/min.`,
            dose: '30:2 compression:ventilation ratio (single rescuer) or 15:2 (two rescuers)',
            route: 'Chest compressions + ventilation',
            rationale: 'Cardiac arrest. Every second without CPR reduces survival.',
            reassessAfter: 'Check rhythm/pulse every 2 minutes',
            timer: 120,
          };
        }
        return null;
      },
    },
    {
      id: 'responsiveness',
      phase: 'signs_of_life',
      question: 'What is the child\'s RESPONSIVENESS?',
      description: 'AVPU scale: Alert, responds to Voice, responds to Pain, Unresponsive',
      type: 'select',
      options: [
        { value: 'alert', label: 'ALERT - Eyes open, interacting' },
        { value: 'voice', label: 'VOICE - Responds to verbal stimuli' },
        { value: 'pain', label: 'PAIN - Only responds to painful stimuli', critical: true },
        { value: 'unresponsive', label: 'UNRESPONSIVE - No response', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'unresponsive') {
          return {
            id: 'call-for-help',
            severity: 'critical',
            title: 'CALL FOR HELP - ACTIVATE EMERGENCY RESPONSE',
            instruction: 'Shout for help. Activate crash cart/emergency team. Do not leave the child alone.',
            rationale: 'Unresponsive child needs immediate team response. Single provider cannot manage alone.',
            reassessAfter: 'Continue assessment while waiting for help',
            timer: 60,
          };
        }
        return null;
      },
    },
    
    // AIRWAY
    {
      id: 'airway_patency',
      phase: 'airway',
      question: 'Is the AIRWAY patent?',
      description: 'Look for obstruction, listen for stridor/gurgling, assess positioning',
      type: 'select',
      options: [
        { value: 'patent', label: 'PATENT - Clear airway' },
        { value: 'at_risk', label: 'AT RISK - Needs positioning/suctioning' },
        { value: 'obstructed', label: 'OBSTRUCTED - Cannot ventilate', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'obstructed') {
          return {
            id: 'clear-airway',
            severity: 'critical',
            title: 'CLEAR AIRWAY OBSTRUCTION NOW',
            instruction: 'Head tilt-chin lift (or jaw thrust if trauma). Suction visible secretions. If foreign body: back blows (infant) or abdominal thrusts (child >1yr).',
            dose: `Suction catheter: ${Math.round(pd.ageYears / 2 + 8)} Fr`,
            route: 'Manual maneuvers + suction',
            rationale: 'Obstructed airway prevents oxygenation. Must clear before any other intervention.',
            reassessAfter: 'After maneuver, reassess air entry',
            timer: 30,
          };
        }
        if (answer === 'at_risk') {
          return {
            id: 'position-airway',
            severity: 'urgent',
            title: 'OPTIMIZE AIRWAY POSITION',
            instruction: 'Position head neutral (infant) or sniffing position (child). Place shoulder roll if needed. Suction secretions.',
            rationale: 'At-risk airway can deteriorate rapidly. Optimize now to prevent obstruction.',
            reassessAfter: 'Reassess air entry after positioning',
            timer: 60,
          };
        }
        return null;
      },
    },
    {
      id: 'airway_sounds',
      phase: 'airway',
      question: 'Any abnormal AIRWAY SOUNDS?',
      description: 'Listen without stethoscope for stridor, snoring, gurgling',
      type: 'multi-select',
      options: [
        { value: 'none', label: 'None - Clear' },
        { value: 'stridor', label: 'Stridor (inspiratory)', critical: true },
        { value: 'snoring', label: 'Snoring' },
        { value: 'gurgling', label: 'Gurgling (secretions)', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (Array.isArray(answer) && answer.includes('stridor')) {
          return {
            id: 'stridor-management',
            severity: 'critical',
            title: 'STRIDOR DETECTED - UPPER AIRWAY OBSTRUCTION',
            instruction: 'Keep child calm. Give nebulized epinephrine 0.5 mL/kg (max 5 mL) of 1:1000. Prepare for possible intubation.',
            dose: `Nebulized epinephrine: ${Math.min(weight * 0.5, 5).toFixed(1)} mL of 1:1000`,
            route: 'Nebulizer',
            rationale: 'Stridor indicates significant upper airway narrowing. Epinephrine reduces edema.',
            reassessAfter: 'Reassess stridor severity after nebulizer',
            timer: 300,
          };
        }
        if (Array.isArray(answer) && answer.includes('gurgling')) {
          return {
            id: 'suction-secretions',
            severity: 'urgent',
            title: 'SUCTION AIRWAY SECRETIONS',
            instruction: 'Suction oropharynx with Yankauer. If deep secretions, use soft suction catheter.',
            dose: `Suction catheter: ${Math.round(pd.ageYears / 2 + 8)} Fr`,
            route: 'Oral/nasal suction',
            rationale: 'Secretions can cause aspiration and obstruction.',
            reassessAfter: 'Reassess for clear airway sounds',
            timer: 60,
          };
        }
        return null;
      },
    },

    // BREATHING
    {
      id: 'breathing_effort',
      phase: 'breathing',
      question: 'What is the WORK OF BREATHING?',
      description: 'Look for retractions, nasal flaring, head bobbing, grunting',
      type: 'select',
      options: [
        { value: 'normal', label: 'NORMAL - No distress' },
        { value: 'increased', label: 'INCREASED - Mild retractions' },
        { value: 'severe', label: 'SEVERE - Marked retractions, grunting', critical: true },
        { value: 'exhausted', label: 'EXHAUSTED - Minimal effort, tiring', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'severe') {
          return {
            id: 'high-flow-oxygen',
            severity: 'critical',
            title: 'GIVE HIGH-FLOW OXYGEN NOW',
            instruction: 'Apply non-rebreather mask at 10-15 L/min or high-flow nasal cannula. Target SpO2 94-98%.',
            dose: 'FiO2 0.6-1.0 (60-100% oxygen)',
            route: 'Non-rebreather mask or HFNC',
            rationale: 'Severe respiratory distress indicates impending failure. Maximize oxygen delivery.',
            reassessAfter: 'Reassess work of breathing and SpO2 in 5 minutes',
            timer: 300,
          };
        }
        if (answer === 'exhausted') {
          return {
            id: 'prepare-ventilation',
            severity: 'critical',
            title: 'RESPIRATORY FAILURE IMMINENT - PREPARE FOR VENTILATION',
            instruction: 'Apply BVM with 100% O2. Prepare intubation equipment. Call for senior help.',
            dose: `ETT size: ${(pd.ageYears / 4 + 4).toFixed(1)} mm uncuffed or ${(pd.ageYears / 4 + 3.5).toFixed(1)} mm cuffed`,
            route: 'BVM → Intubation',
            rationale: 'Exhaustion precedes respiratory arrest. Proactive intervention saves lives.',
            reassessAfter: 'Continuous monitoring - prepare for intubation',
            timer: 120,
          };
        }
        return null;
      },
    },
    {
      id: 'spo2',
      phase: 'breathing',
      question: 'What is the SpO2?',
      description: 'Pulse oximetry reading (if available)',
      type: 'number',
      criticalTrigger: (answer, pd) => {
        const spo2 = Number(answer);
        if (spo2 > 0 && spo2 < 90) {
          return {
            id: 'severe-hypoxia',
            severity: 'critical',
            title: 'SEVERE HYPOXIA - IMMEDIATE OXYGEN',
            instruction: 'Apply 100% oxygen via non-rebreather. If no improvement, start BVM ventilation.',
            dose: '100% FiO2 via non-rebreather at 15 L/min',
            route: 'Non-rebreather mask',
            rationale: `SpO2 ${spo2}% indicates severe hypoxemia. Brain damage occurs within minutes.`,
            reassessAfter: 'Recheck SpO2 every 1-2 minutes',
            timer: 120,
          };
        }
        if (spo2 >= 90 && spo2 < 94) {
          return {
            id: 'moderate-hypoxia',
            severity: 'urgent',
            title: 'HYPOXIA - SUPPLEMENTAL OXYGEN',
            instruction: 'Apply oxygen via nasal cannula or simple face mask. Titrate to SpO2 94-98%.',
            dose: 'Start at 2-4 L/min nasal cannula, increase as needed',
            route: 'Nasal cannula or face mask',
            rationale: `SpO2 ${spo2}% is below target. Supplemental oxygen needed.`,
            reassessAfter: 'Recheck SpO2 in 5 minutes',
            timer: 300,
          };
        }
        return null;
      },
    },
    {
      id: 'respiratory_rate',
      phase: 'breathing',
      question: 'What is the RESPIRATORY RATE?',
      description: 'Count for 30 seconds and multiply by 2',
      type: 'number',
      criticalTrigger: (answer, pd) => {
        const rr = Number(answer);
        const age = pd.ageYears;
        
        // Age-specific thresholds
        let criticalHigh = 60;
        let criticalLow = 10;
        
        if (age < 1) {
          criticalHigh = 70;
          criticalLow = 20;
        } else if (age < 5) {
          criticalHigh = 50;
          criticalLow = 15;
        } else {
          criticalHigh = 40;
          criticalLow = 10;
        }
        
        if (rr > 0 && rr < criticalLow) {
          return {
            id: 'bradypnea',
            severity: 'critical',
            title: 'BRADYPNEA - RESPIRATORY DEPRESSION',
            instruction: 'Assist ventilation with BVM. Consider naloxone if opioid exposure suspected.',
            dose: `Naloxone: ${(weight * 0.1).toFixed(2)} mg (0.1 mg/kg) IV/IM if opioid suspected`,
            route: 'BVM ventilation ± Naloxone IV/IM',
            rationale: `RR ${rr} is dangerously low. Indicates respiratory failure or CNS depression.`,
            reassessAfter: 'Continuous monitoring during assisted ventilation',
            timer: 60,
          };
        }
        if (rr > criticalHigh) {
          return {
            id: 'severe-tachypnea',
            severity: 'urgent',
            title: 'SEVERE TACHYPNEA - ASSESS CAUSE',
            instruction: 'Give oxygen. Assess for: fever, metabolic acidosis, pneumonia, asthma, anxiety.',
            dose: 'Oxygen to maintain SpO2 94-98%',
            route: 'Supplemental oxygen',
            rationale: `RR ${rr} is significantly elevated. Indicates respiratory distress or compensation for metabolic issue.`,
            reassessAfter: 'Identify and treat underlying cause',
            timer: 300,
          };
        }
        return null;
      },
    },
    {
      id: 'breath_sounds',
      phase: 'breathing',
      question: 'What do you hear on AUSCULTATION?',
      description: 'Listen to both lung fields anteriorly and posteriorly',
      type: 'multi-select',
      options: [
        { value: 'clear', label: 'Clear bilateral air entry' },
        { value: 'wheeze', label: 'Wheeze (expiratory)', critical: true },
        { value: 'crackles', label: 'Crackles/rales' },
        { value: 'decreased', label: 'Decreased air entry', critical: true },
        { value: 'silent', label: 'Silent chest', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (Array.isArray(answer)) {
          if (answer.includes('silent')) {
            return {
              id: 'silent-chest',
              severity: 'critical',
              title: 'SILENT CHEST - CRITICAL ASTHMA/OBSTRUCTION',
              instruction: 'Give nebulized salbutamol + ipratropium immediately. Prepare for intubation. Give IV magnesium.',
              dose: `Salbutamol: 2.5mg (<5yr) or 5mg (>5yr) nebulized. MgSO4: ${(weight * 50).toFixed(0)} mg (50 mg/kg) IV over 20 min`,
              route: 'Nebulizer + IV',
              rationale: 'Silent chest indicates severe bronchospasm with minimal air movement. Life-threatening.',
              reassessAfter: 'Reassess air entry after nebulizer',
              timer: 300,
            };
          }
          if (answer.includes('wheeze')) {
            return {
              id: 'bronchospasm',
              severity: 'urgent',
              title: 'WHEEZE - BRONCHOSPASM',
              instruction: 'Give nebulized salbutamol. Add ipratropium if moderate-severe. Consider steroids.',
              dose: `Salbutamol: ${pd.ageYears < 5 ? '2.5' : '5'} mg nebulized. Prednisolone: ${Math.min(weight * 2, 60).toFixed(0)} mg PO`,
              route: 'Nebulizer + oral steroids',
              rationale: 'Wheeze indicates bronchospasm. Beta-agonists are first-line treatment.',
              reassessAfter: 'Reassess wheeze and work of breathing after nebulizer',
              timer: 600,
            };
          }
          if (answer.includes('decreased')) {
            return {
              id: 'decreased-air-entry',
              severity: 'urgent',
              title: 'DECREASED AIR ENTRY - ASSESS CAUSE',
              instruction: 'Consider: pneumothorax, pleural effusion, consolidation, atelectasis. Get CXR if stable.',
              rationale: 'Unilateral decreased air entry may indicate pneumothorax or effusion requiring urgent intervention.',
              reassessAfter: 'Identify cause and treat accordingly',
              timer: 300,
            };
          }
        }
        return null;
      },
    },

    // CIRCULATION
    {
      id: 'heart_rate',
      phase: 'circulation',
      question: 'What is the HEART RATE?',
      description: 'Count for 15 seconds and multiply by 4, or use monitor',
      type: 'number',
      criticalTrigger: (answer, pd) => {
        const hr = Number(answer);
        const age = pd.ageYears;
        
        // Age-specific critical thresholds
        let bradycardia = 60;
        let severeTachy = 180;
        
        if (age < 1) {
          bradycardia = 100;
          severeTachy = 220;
        } else if (age < 5) {
          bradycardia = 80;
          severeTachy = 200;
        }
        
        if (hr > 0 && hr < bradycardia) {
          return {
            id: 'bradycardia',
            severity: 'critical',
            title: 'BRADYCARDIA - CHECK OXYGENATION FIRST',
            instruction: 'Ensure adequate oxygenation and ventilation. If HR <60 with poor perfusion despite oxygenation, start CPR.',
            dose: `If needed: Epinephrine ${(weight * 0.01).toFixed(3)} mg (0.01 mg/kg) IV/IO`,
            route: 'Optimize ventilation first, then IV/IO if needed',
            rationale: `HR ${hr} is bradycardic. In children, bradycardia is usually hypoxic - fix breathing first.`,
            reassessAfter: 'Recheck HR after optimizing oxygenation',
            timer: 60,
          };
        }
        if (hr > severeTachy) {
          return {
            id: 'severe-tachycardia',
            severity: 'urgent',
            title: 'SEVERE TACHYCARDIA - ASSESS RHYTHM',
            instruction: 'Get 12-lead ECG. Assess for SVT vs sinus tachycardia. Check for shock, fever, pain.',
            rationale: `HR ${hr} is severely elevated. Need to differentiate SVT (narrow complex, sudden onset) from sinus tachycardia (gradual, cause identifiable).`,
            reassessAfter: 'Identify rhythm and treat cause',
            timer: 300,
          };
        }
        return null;
      },
    },
    {
      id: 'perfusion',
      phase: 'circulation',
      question: 'What is the PERFUSION status?',
      description: 'Assess capillary refill, skin color, temperature, pulses',
      type: 'select',
      options: [
        { value: 'normal', label: 'NORMAL - Warm, pink, CRT <2s' },
        { value: 'poor', label: 'POOR - Cool, pale, CRT 2-4s', critical: true },
        { value: 'shock', label: 'SHOCK - Cold, mottled, CRT >4s', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'shock') {
          return {
            id: 'fluid-bolus-shock',
            severity: 'critical',
            title: 'SHOCK - GIVE FLUID BOLUS NOW',
            instruction: `Give crystalloid (Ringer's Lactate preferred, Normal Saline if unavailable) 10 mL/kg over 5-10 minutes. Reassess after EVERY bolus.`,
            dose: `${(weight * 10).toFixed(0)} mL Ringer's Lactate IV/IO over 5-10 min`,
            route: 'IV/IO push',
            rationale: 'Shock requires immediate volume resuscitation. 10 mL/kg boluses with reassessment prevents over-resuscitation.',
            reassessAfter: 'Reassess perfusion after EVERY 10 mL/kg bolus',
            timer: 600,
          };
        }
        if (answer === 'poor') {
          return {
            id: 'fluid-bolus-poor-perfusion',
            severity: 'urgent',
            title: 'POOR PERFUSION - CONSIDER FLUID BOLUS',
            instruction: `Establish IV/IO access. Give 10 mL/kg crystalloid bolus if no signs of fluid overload.`,
            dose: `${(weight * 10).toFixed(0)} mL Ringer's Lactate IV/IO`,
            route: 'IV/IO',
            rationale: 'Poor perfusion may indicate early shock. Early intervention improves outcomes.',
            reassessAfter: 'Reassess perfusion after bolus',
            timer: 600,
          };
        }
        return null;
      },
    },
    {
      id: 'blood_pressure',
      phase: 'circulation',
      question: 'What is the SYSTOLIC BLOOD PRESSURE?',
      description: 'Use appropriate cuff size (2/3 of upper arm)',
      type: 'number',
      criticalTrigger: (answer, pd) => {
        const sbp = Number(answer);
        const age = pd.ageYears;
        
        // Hypotension threshold: 70 + (2 × age) for children 1-10 years
        const hypotensionThreshold = age < 1 ? 60 : Math.min(70 + (2 * age), 90);
        
        if (sbp > 0 && sbp < hypotensionThreshold) {
          return {
            id: 'hypotension',
            severity: 'critical',
            title: 'HYPOTENSION - DECOMPENSATED SHOCK',
            instruction: `Give rapid fluid bolus 10 mL/kg. If no response after 40-60 mL/kg total, start vasopressor.`,
            dose: `Fluid: ${(weight * 10).toFixed(0)} mL RL. Vasopressor: Epinephrine 0.1-1 mcg/kg/min`,
            route: 'IV/IO bolus, then infusion if needed',
            rationale: `SBP ${sbp} is hypotensive for age. This is decompensated shock - late and dangerous sign.`,
            reassessAfter: 'Reassess BP after each bolus',
            timer: 300,
          };
        }
        return null;
      },
    },

    // DISABILITY
    {
      id: 'glucose',
      phase: 'disability',
      question: 'What is the BLOOD GLUCOSE?',
      description: 'Point-of-care glucose (mmol/L or mg/dL)',
      type: 'number',
      criticalTrigger: (answer, pd) => {
        let glucose = Number(answer);
        // Convert to mmol/L if using mg/dL (assuming >30 means mg/dL)
        if (glucose > 30) {
          glucose = glucose / 18;
        }
        
        if (glucose > 0 && glucose < 2.6) {
          return {
            id: 'severe-hypoglycemia',
            severity: 'critical',
            title: 'SEVERE HYPOGLYCEMIA - GIVE DEXTROSE NOW',
            instruction: 'Give IV dextrose immediately. Recheck glucose in 15 minutes.',
            dose: `D10W: ${(weight * 2).toFixed(0)} mL (2 mL/kg) IV push, or D50W: ${(weight * 0.4).toFixed(1)} mL diluted`,
            route: 'IV push',
            rationale: `Glucose ${glucose.toFixed(1)} mmol/L is critically low. Brain damage occurs rapidly without treatment.`,
            reassessAfter: 'Recheck glucose in 15 minutes',
            timer: 900,
          };
        }
        if (glucose >= 2.6 && glucose < 4.0) {
          return {
            id: 'hypoglycemia',
            severity: 'urgent',
            title: 'HYPOGLYCEMIA - TREAT NOW',
            instruction: 'Give oral glucose if conscious and able to swallow, otherwise IV dextrose.',
            dose: `Oral: glucose gel or juice. IV: D10W ${(weight * 2).toFixed(0)} mL`,
            route: 'Oral if conscious, IV if not',
            rationale: `Glucose ${glucose.toFixed(1)} mmol/L is low. Treat before it drops further.`,
            reassessAfter: 'Recheck glucose in 15-30 minutes',
            timer: 900,
          };
        }
        return null;
      },
    },
    {
      id: 'pupils',
      phase: 'disability',
      question: 'What are the PUPILS like?',
      description: 'Check size, equality, and reactivity to light',
      type: 'select',
      options: [
        { value: 'normal', label: 'NORMAL - Equal, reactive' },
        { value: 'dilated', label: 'DILATED - Both enlarged' },
        { value: 'constricted', label: 'CONSTRICTED - Both pinpoint' },
        { value: 'unequal', label: 'UNEQUAL - Anisocoria', critical: true },
        { value: 'fixed', label: 'FIXED - Non-reactive', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'unequal') {
          return {
            id: 'raised-icp',
            severity: 'critical',
            title: 'UNEQUAL PUPILS - POSSIBLE RAISED ICP',
            instruction: 'Elevate head 30°. Avoid hypoxia, hypotension, hyperthermia. Consider mannitol or hypertonic saline.',
            dose: `Mannitol: ${(weight * 0.5).toFixed(1)} g (0.5 g/kg) IV over 20 min, OR 3% NaCl: ${(weight * 3).toFixed(0)} mL`,
            route: 'IV',
            rationale: 'Unequal pupils suggest uncal herniation from raised ICP. Neurosurgical emergency.',
            reassessAfter: 'Urgent CT head and neurosurgery consult',
            timer: 300,
          };
        }
        if (answer === 'fixed') {
          return {
            id: 'fixed-pupils',
            severity: 'critical',
            title: 'FIXED PUPILS - CRITICAL NEUROLOGICAL EMERGENCY',
            instruction: 'Ensure adequate oxygenation and perfusion. Consider toxicological causes. Urgent neurology/neurosurgery.',
            rationale: 'Fixed dilated pupils indicate severe brain injury or herniation. May also be drug-related.',
            reassessAfter: 'Continuous neurological monitoring',
            timer: 300,
          };
        }
        return null;
      },
    },
    {
      id: 'seizure',
      phase: 'disability',
      question: 'Is there SEIZURE activity?',
      description: 'Tonic-clonic movements, subtle seizures, or post-ictal state',
      type: 'select',
      options: [
        { value: 'no', label: 'NO - No seizure activity' },
        { value: 'active', label: 'YES - Active seizure NOW', critical: true },
        { value: 'postictal', label: 'POST-ICTAL - Recent seizure' },
        { value: 'prolonged', label: 'STATUS - Seizure >5 min', critical: true },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'active' || answer === 'prolonged') {
          return {
            id: 'seizure-treatment',
            severity: 'critical',
            title: 'ACTIVE SEIZURE - GIVE BENZODIAZEPINE NOW',
            instruction: 'Position safely. Give benzodiazepine. Time the seizure. Check glucose.',
            dose: `Diazepam: ${(weight * 0.3).toFixed(1)} mg (0.3 mg/kg) IV/IO, OR ${(weight * 0.5).toFixed(1)} mg (0.5 mg/kg) rectal. Max 10 mg.`,
            route: 'IV/IO preferred, rectal if no access',
            rationale: 'Prolonged seizures cause brain injury. Benzodiazepines are first-line. Always check glucose.',
            reassessAfter: 'If seizure continues >5 min after first dose, give second dose',
            timer: 300,
          };
        }
        return null;
      },
    },

    // EXPOSURE
    {
      id: 'temperature',
      phase: 'exposure',
      question: 'What is the TEMPERATURE?',
      description: 'Core temperature (rectal/tympanic preferred)',
      type: 'number',
      criticalTrigger: (answer, pd) => {
        const temp = Number(answer);
        
        if (temp > 0 && temp < 35) {
          return {
            id: 'hypothermia',
            severity: 'critical',
            title: 'HYPOTHERMIA - ACTIVE REWARMING',
            instruction: 'Remove wet clothing. Apply warm blankets. Warm IV fluids. Avoid rapid rewarming if severe.',
            rationale: `Temperature ${temp}°C is hypothermic. Hypothermia worsens coagulopathy and cardiac function.`,
            reassessAfter: 'Monitor temperature every 15-30 minutes during rewarming',
            timer: 1800,
          };
        }
        if (temp > 40) {
          return {
            id: 'hyperthermia',
            severity: 'urgent',
            title: 'HYPERTHERMIA - ACTIVE COOLING',
            instruction: 'Remove clothing. Apply cool compresses. Give antipyretics. Consider cooling blanket if >41°C.',
            dose: `Paracetamol: ${(weight * 15).toFixed(0)} mg (15 mg/kg) PO/PR, OR Ibuprofen: ${(weight * 10).toFixed(0)} mg (10 mg/kg) PO`,
            route: 'Oral or rectal',
            rationale: `Temperature ${temp}°C is dangerously high. Risk of febrile seizures and organ damage.`,
            reassessAfter: 'Recheck temperature in 30-60 minutes',
            timer: 1800,
          };
        }
        return null;
      },
    },
    {
      id: 'rash',
      phase: 'exposure',
      question: 'Is there a RASH?',
      description: 'Look for petechiae, purpura, urticaria, or other skin findings',
      type: 'select',
      options: [
        { value: 'none', label: 'NO - No rash' },
        { value: 'petechiae', label: 'PETECHIAE/PURPURA - Non-blanching', critical: true },
        { value: 'urticaria', label: 'URTICARIA - Hives, blanching' },
        { value: 'other', label: 'OTHER - Maculopapular, vesicular, etc.' },
      ],
      criticalTrigger: (answer, pd) => {
        if (answer === 'petechiae') {
          return {
            id: 'meningococcemia',
            severity: 'critical',
            title: 'PETECHIAL RASH - SUSPECT MENINGOCOCCEMIA',
            instruction: 'Give IV antibiotics IMMEDIATELY. Do not wait for lumbar puncture.',
            dose: `Ceftriaxone: ${(weight * 100).toFixed(0)} mg (100 mg/kg, max 4g) IV, OR Cefotaxime: ${(weight * 50).toFixed(0)} mg (50 mg/kg) IV`,
            route: 'IV push/infusion',
            rationale: 'Petechial/purpuric rash with fever = meningococcemia until proven otherwise. Antibiotics save lives.',
            reassessAfter: 'Monitor for progression of rash and hemodynamic stability',
            timer: 300,
          };
        }
        if (answer === 'urticaria') {
          return {
            id: 'allergic-reaction',
            severity: 'urgent',
            title: 'URTICARIA - ASSESS FOR ANAPHYLAXIS',
            instruction: 'Check for airway swelling, breathing difficulty, hypotension. If any present, give IM epinephrine.',
            dose: `If anaphylaxis: Epinephrine ${(weight * 0.01).toFixed(2)} mg (0.01 mg/kg, max 0.5 mg) IM`,
            route: 'IM (anterolateral thigh)',
            rationale: 'Urticaria alone is not anaphylaxis, but monitor closely for progression.',
            reassessAfter: 'Monitor for 4-6 hours for biphasic reaction',
            timer: 600,
          };
        }
        return null;
      },
    },
  ];

  // Get current question
  const getCurrentQuestion = (): ClinicalQuestion | null => {
    return clinicalQuestions.find(q => q.id === currentQuestionId) || null;
  };

  // Get question flow order
  const questionFlow = [
    'breathing', 'pulse', 'responsiveness', // Signs of life
    'airway_patency', 'airway_sounds', // Airway
    'breathing_effort', 'spo2', 'respiratory_rate', 'breath_sounds', // Breathing
    'heart_rate', 'perfusion', 'blood_pressure', // Circulation
    'glucose', 'pupils', 'seizure', // Disability
    'temperature', 'rash', // Exposure
  ];

  // Get next question in flow
  const getNextQuestionId = (currentId: string): string | null => {
    const currentIndex = questionFlow.indexOf(currentId);
    if (currentIndex === -1 || currentIndex === questionFlow.length - 1) {
      return null;
    }
    return questionFlow[currentIndex + 1];
  };

  // Handle answer submission
  const handleAnswer = (answer: any) => {
    const question = getCurrentQuestion();
    if (!question) return;

    // Check for critical trigger
    const action = question.criticalTrigger?.(answer, patientData);
    
    // Record finding
    const finding: AssessmentFinding = {
      question: question.question,
      answer,
      timestamp: new Date(),
      triggeredAction: action || undefined,
    };
    setFindings([...findings, finding]);

    if (action) {
      // Critical finding - show immediate action with audio alert
      initAudioContext();
      triggerAlert(action.severity === 'critical' ? 'critical_action' : 'timer_warning');
      setCurrentAction(action);
      setActionAcknowledged(false);
      
      // Start CPR clock if cardiac arrest
      if (action.id === 'start-cpr') {
        setCprActive(true);
      }
      
      // Activate emergency if critical
      if (action.severity === 'critical') {
        setEmergencyActivated(true);
      }
    } else {
      // No critical finding - move to next question
      const nextId = getNextQuestionId(currentQuestionId);
      if (nextId) {
        setCurrentQuestionId(nextId);
      } else {
        // Assessment complete
        setCaseComplete(true);
      }
    }
  };

  // Handle action acknowledgment
  const handleActionAcknowledge = () => {
    setActionAcknowledged(true);
    if (currentAction?.timer) {
      setReassessmentTimer(currentAction.timer);
    }
  };

  // Handle action completion and reassessment
  const handleActionComplete = () => {
    if (currentAction) {
      setCompletedActions([...completedActions, currentAction]);
    }
    setShowReassessment(true);
  };

  // Handle reassessment response
  const handleReassessment = (response: ReassessmentResponse) => {
    setShowReassessment(false);
    
    if (response === 'better') {
      // Move to next question
      setCurrentAction(null);
      const nextId = getNextQuestionId(currentQuestionId);
      if (nextId) {
        setCurrentQuestionId(nextId);
      } else {
        setCaseComplete(true);
      }
    } else if (response === 'same') {
      // Repeat or escalate
      setActionAcknowledged(false);
      // Could modify the action to escalate here
    } else if (response === 'worse') {
      // Emergency escalation
      setEmergencyActivated(true);
      setCurrentAction({
        id: 'emergency-escalation',
        severity: 'critical',
        title: 'PATIENT DETERIORATING - ESCALATE NOW',
        instruction: 'Call for senior help. Prepare for advanced interventions. Consider ICU transfer.',
        rationale: 'Patient worsening despite intervention. Need higher level of care.',
        reassessAfter: 'Continuous monitoring',
      });
      setActionAcknowledged(false);
    }
  };

  // Timer countdown effect with audio alerts
  useEffect(() => {
    if (reassessmentTimer > 0 && actionAcknowledged) {
      const interval = setInterval(() => {
        setReassessmentTimer(prev => {
          if (prev <= 1) {
            // Timer expired - prompt reassessment with alert
            triggerAlert('timer_expired');
            setShowReassessment(true);
            return 0;
          }
          // Play countdown beeps for last 10 seconds
          if (prev <= 11) {
            playCountdownBeep(prev - 1);
          }
          // Warning at 30 seconds
          if (prev === 31) {
            triggerAlert('timer_warning');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [reassessmentTimer, actionAcknowledged]);

  // Generate handover
  const handleGenerateHandover = () => {
    const assessmentData = extractHandoverData({
      patientName: 'Patient',
      age: patientData.ageYears,
      ageMonths: patientData.ageMonths,
      weight: weight,
      chiefComplaint: 'Emergency presentation',
    });
    const handover = generateSBARHandover(assessmentData);
    setCurrentHandover(handover);
    setShowHandover(true);
  };

  // Reset case
  const handleNewCase = () => {
    setPatientData({ ageYears: 0, ageMonths: 0, weight: 0, glucoseUnit: 'mmol/L' });
    setCurrentQuestionId('age');
    setPatientSetupComplete(false);
    setCurrentAction(null);
    setActionAcknowledged(false);
    setShowReassessment(false);
    setReassessmentTimer(0);
    setFindings([]);
    setCompletedActions([]);
    setCprActive(false);
    setEmergencyActivated(false);
    setCaseComplete(false);
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase color
  const getPhaseColor = (phase: string): string => {
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

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      {/* CPR Clock */}
      {cprActive && (
        <CPRClock
          patientWeight={weight}
          onClose={() => setCprActive(false)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Paeds Resus</h1>
          <p className="text-slate-400 text-sm">Real-time Clinical Decision Support</p>
          
          {/* Emergency Banner */}
          {emergencyActivated && (
            <div className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg animate-pulse">
              <Phone className="inline mr-2 h-5 w-5" />
              EMERGENCY ACTIVATED - Call for help
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {patientSetupComplete && !caseComplete && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Assessment Progress</span>
              <span className="text-slate-400 text-sm">
                {Math.round((questionFlow.indexOf(currentQuestionId) / questionFlow.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${(questionFlow.indexOf(currentQuestionId) / questionFlow.length) * 100}%` }}
              />
            </div>
            {currentQuestion && (
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs text-white ${getPhaseColor(currentQuestion.phase)}`}>
                {currentQuestion.phase.replace('_', ' ').toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* PATIENT SETUP */}
        {!patientSetupComplete && (
          <Card className="bg-slate-800/90 border-slate-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-8 w-8 text-orange-500" />
              <div>
                <h2 className="text-2xl font-bold text-white">Patient Setup</h2>
                <p className="text-slate-400 text-sm">Enter age to begin assessment</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 text-sm">Age (Years)</Label>
                  <Input
                    type="number"
                    value={patientData.ageYears || ''}
                    onChange={(e) => setPatientData({ ...patientData, ageYears: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white text-lg h-12"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Age (Months)</Label>
                  <Input
                    type="number"
                    value={patientData.ageMonths || ''}
                    onChange={(e) => setPatientData({ ...patientData, ageMonths: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white text-lg h-12"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Weight (kg) - Optional</Label>
                <Input
                  type="number"
                  value={patientData.weight || ''}
                  onChange={(e) => setPatientData({ ...patientData, weight: parseFloat(e.target.value) || 0 })}
                  placeholder={`Auto-calculated: ${weight.toFixed(1)} kg`}
                  className="bg-slate-700 border-slate-600 text-white text-lg h-12"
                />
              </div>

              {/* Quick Start Scenarios */}
              <div className="border-t border-slate-600 pt-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Quick Start - Known Emergency
                </h3>
                <QuickStartPanel weightKg={weight} />
              </div>

              {/* Alert Settings */}
              <div className="flex items-center justify-between border-t border-slate-600 pt-4">
                <span className="text-slate-400 text-sm">Audio/Haptic Alerts</span>
                <AlertSettings compact />
              </div>

              <Button 
                onClick={() => {
                  setPatientSetupComplete(true);
                  setCurrentQuestionId('breathing');
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold"
              >
                Start Assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* CRITICAL ACTION CARD */}
        {currentAction && !showReassessment && (
          <Card className={`border-2 p-6 md:p-8 ${
            currentAction.severity === 'critical' 
              ? 'bg-red-900/90 border-red-500' 
              : 'bg-yellow-900/90 border-yellow-500'
          }`}>
            {/* Severity Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-4 ${
              currentAction.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'
            }`}>
              <AlertCircle className="h-4 w-4" />
              {currentAction.severity.toUpperCase()}
            </div>

            {/* Action Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {currentAction.title}
            </h2>

            {/* Instruction */}
            <div className="bg-black/30 p-4 rounded-lg mb-4">
              <p className="text-white text-lg leading-relaxed">
                {currentAction.instruction}
              </p>
            </div>

            {/* Dose & Route */}
            {(currentAction.dose || currentAction.route) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {currentAction.dose && (
                  <div className="bg-black/20 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Dose</p>
                    <p className="text-white font-semibold">{currentAction.dose}</p>
                  </div>
                )}
                {currentAction.route && (
                  <div className="bg-black/20 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Route</p>
                    <p className="text-white font-semibold">{currentAction.route}</p>
                  </div>
                )}
              </div>
            )}

            {/* Rationale (collapsible) */}
            <details className="mb-6">
              <summary className="text-slate-300 cursor-pointer hover:text-white flex items-center gap-2">
                <Info className="h-4 w-4" />
                Why this action?
              </summary>
              <p className="mt-2 text-slate-300 text-sm pl-6">
                {currentAction.rationale}
              </p>
            </details>

            {/* Timer */}
            {actionAcknowledged && reassessmentTimer > 0 && (
              <div className="bg-black/30 p-4 rounded-lg mb-4 text-center">
                <p className="text-slate-400 text-sm">Reassess in</p>
                <p className="text-4xl font-mono font-bold text-white">
                  {formatTime(reassessmentTimer)}
                </p>
                <p className="text-slate-400 text-sm mt-1">{currentAction.reassessAfter}</p>
              </div>
            )}

            {/* Action Buttons */}
            {!actionAcknowledged ? (
              <Button 
                onClick={handleActionAcknowledge}
                className="w-full bg-white text-black hover:bg-slate-200 py-6 text-lg font-bold"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                I UNDERSTAND - START ACTION
              </Button>
            ) : (
              <div className="space-y-3">
                <Button 
                  onClick={handleActionComplete}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  ACTION COMPLETE - REASSESS
                </Button>
                <Button 
                  onClick={() => setShowReassessment(true)}
                  variant="outline"
                  className="w-full border-slate-500 text-slate-300 hover:bg-slate-700 py-4"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reassess Now
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* REASSESSMENT PROMPT */}
        {showReassessment && (
          <Card className="bg-slate-800/90 border-slate-700 p-6 md:p-8">
            <div className="text-center mb-6">
              <RotateCcw className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">Reassessment</h2>
              <p className="text-slate-400">How is the patient responding?</p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => handleReassessment('better')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                BETTER - Improving
              </Button>
              <Button 
                onClick={() => handleReassessment('same')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-6 text-lg"
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                SAME - No change
              </Button>
              <Button 
                onClick={() => handleReassessment('worse')}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                WORSE - Deteriorating
              </Button>
            </div>
          </Card>
        )}

        {/* CLINICAL QUESTION */}
        {patientSetupComplete && !currentAction && !showReassessment && !caseComplete && currentQuestion && (
          <Card className="bg-slate-800/90 border-slate-700 p-6 md:p-8">
            {/* Phase Icon */}
            <div className="flex items-center gap-3 mb-6">
              {currentQuestion.phase === 'signs_of_life' && <Heart className="h-8 w-8 text-red-500" />}
              {currentQuestion.phase === 'airway' && <Wind className="h-8 w-8 text-orange-500" />}
              {currentQuestion.phase === 'breathing' && <Stethoscope className="h-8 w-8 text-yellow-500" />}
              {currentQuestion.phase === 'circulation' && <Droplets className="h-8 w-8 text-pink-500" />}
              {currentQuestion.phase === 'disability' && <Brain className="h-8 w-8 text-purple-500" />}
              {currentQuestion.phase === 'exposure' && <Thermometer className="h-8 w-8 text-blue-500" />}
              <div>
                <h2 className="text-2xl font-bold text-white">{currentQuestion.question}</h2>
                {currentQuestion.description && (
                  <p className="text-slate-400 text-sm mt-1">{currentQuestion.description}</p>
                )}
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'binary' && currentQuestion.options?.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full py-6 text-lg font-semibold ${
                    option.critical 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {option.label}
                </Button>
              ))}

              {currentQuestion.type === 'select' && currentQuestion.options?.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full py-5 text-left justify-start ${
                    option.critical 
                      ? 'bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {option.label}
                </Button>
              ))}

              {currentQuestion.type === 'multi-select' && (
                <MultiSelectQuestion 
                  options={currentQuestion.options || []} 
                  onSubmit={handleAnswer}
                />
              )}

              {currentQuestion.type === 'number' && (
                <NumberInputQuestion 
                  onSubmit={handleAnswer}
                  placeholder={currentQuestion.id === 'spo2' ? 'e.g., 95' : 
                              currentQuestion.id === 'respiratory_rate' ? 'e.g., 24' :
                              currentQuestion.id === 'heart_rate' ? 'e.g., 120' :
                              currentQuestion.id === 'blood_pressure' ? 'e.g., 90' :
                              currentQuestion.id === 'glucose' ? 'e.g., 5.5 mmol/L or 100 mg/dL' :
                              currentQuestion.id === 'temperature' ? 'e.g., 37.5' :
                              'Enter value'}
                />
              )}
            </div>

            {/* Skip Option */}
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => handleAnswer(null)}
                className="text-slate-400 hover:text-white"
              >
                Unable to assess / Skip
              </Button>
            </div>
          </Card>
        )}

        {/* CASE COMPLETE */}
        {caseComplete && (
          <Card className="bg-slate-800/90 border-slate-700 p-6 md:p-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">Assessment Complete</h2>
              <p className="text-slate-400">
                Duration: {Math.round((new Date().getTime() - startTime.getTime()) / 1000)} seconds
              </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
              <h3 className="text-white font-semibold mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">
                  <span className="text-slate-400">Patient:</span> {patientData.ageYears}y {patientData.ageMonths}m, {weight.toFixed(1)} kg
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Findings:</span> {findings.length} assessed
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Actions taken:</span> {completedActions.length}
                </p>
                {emergencyActivated && (
                  <p className="text-red-400 font-semibold">Emergency was activated</p>
                )}
              </div>
            </div>

            {/* Completed Actions */}
            {completedActions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Actions Completed</h3>
                <div className="space-y-2">
                  {completedActions.map((action, idx) => (
                    <div key={idx} className="bg-slate-700/30 p-3 rounded border-l-4 border-green-500">
                      <p className="text-white text-sm">{action.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleGenerateHandover}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 text-lg"
              >
                <FileText className="mr-2 h-5 w-5" />
                Generate Handover (SBAR)
              </Button>
              <Button 
                onClick={handleNewCase}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 text-lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Start New Case
              </Button>
            </div>
          </Card>
        )}

        {/* Handover Modal */}
        <HandoverModal 
          isOpen={showHandover} 
          handover={currentHandover} 
          onClose={() => setShowHandover(false)}
        />
      </div>
    </div>
  );
};

// Multi-select question component
const MultiSelectQuestion: React.FC<{
  options: { value: string; label: string; critical?: boolean }[];
  onSubmit: (selected: string[]) => void;
}> = ({ options, onSubmit }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (value: string) => {
    if (value === 'none') {
      setSelected(['none']);
    } else {
      setSelected(prev => {
        const filtered = prev.filter(v => v !== 'none');
        if (filtered.includes(value)) {
          return filtered.filter(v => v !== value);
        }
        return [...filtered, value];
      });
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => toggleOption(option.value)}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            selected.includes(option.value)
              ? option.critical 
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-orange-500 border-orange-400 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {option.label}
        </button>
      ))}
      <Button
        onClick={() => onSubmit(selected.length > 0 ? selected : ['none'])}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 mt-4"
        disabled={selected.length === 0}
      >
        Continue <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

// Number input question component
const NumberInputQuestion: React.FC<{
  onSubmit: (value: number | null) => void;
  placeholder: string;
}> = ({ onSubmit, placeholder }) => {
  const [value, setValue] = useState<string>('');

  return (
    <div className="space-y-4">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-700 border-slate-600 text-white text-xl h-14 text-center"
        autoFocus
      />
      <Button
        onClick={() => onSubmit(value ? parseFloat(value) : null)}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4"
      >
        Continue <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default ClinicalAssessment;
