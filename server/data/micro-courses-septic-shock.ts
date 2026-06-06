/**
 * Septic Shock I & II — Pass 2 clinical content (CST §4, Surviving Sepsis paediatric, FEAST-aware).
 */

import { SHOCK_FLUIDS_FEAST, SHOCK_VASOPRESSORS } from "./clinical-content-helpers";

export const microCoursesSepticShock = [
  {
    id: "septic-shock-i",
    title: "Paediatric Septic Shock I: Recognition and Fluid Resuscitation",
    level: "foundational",
    duration: 45,
    price: 800,
    description:
      "Recognize paediatric septic shock at the bedside and implement first-hour fluids and antibiotics with FEAST-aware reassessment.",
    modules: [
      {
        title: "Module 1: Recognition at the Bedside",
        duration: 15,
        content: `
          <h2>Septic Shock Recognition</h2>
          <p>Septic shock = infection + <strong>perfusion failure</strong> (not fever alone).</p>
          <h3>Bedside signs (any combination):</h3>
          <ul>
            <li>Altered mental status — irritable, lethargic, or unresponsive</li>
            <li>Weak or thready pulse, hypotension for age (or absent in compensated shock)</li>
            <li>Prolonged capillary refill (&gt;3 s) — cool or mottled extremities</li>
            <li>Tachypnoea, poor feeding, reduced urine output</li>
          </ul>
          <p><strong>Cool extremities ≠ shock alone</strong> — always assess CRT, pulse, and mental status together.</p>
        `,
        questions: [
          {
            question: "Septic shock requires both infection and:",
            options: ["Fever above 38°C only", "Perfusion failure (not fever alone)", "Positive blood culture", "Rash"],
            correct: 1,
            explanation: "Septic shock = infection plus perfusion failure — fever alone is insufficient.",
          },
          {
            question: "Capillary refill time greater than 3 seconds in a febrile child indicates:",
            options: ["Normal perfusion", "Possible perfusion impairment — assess with pulse and mental status", "Only dehydration", "No further action needed"],
            correct: 1,
            explanation: "Prolonged CRT is a perfusion sign — combine with pulse and mental status.",
          },
          {
            question: "Compensated septic shock in children may present with:",
            options: ["Normal blood pressure despite poor perfusion", "Always obvious hypotension", "No tachycardia", "Normal mental status always"],
            correct: 0,
            explanation: "Children may maintain BP while perfusion fails — do not wait for hypotension.",
          },
        ],
      },
      {
        title: "Module 2: First-Hour Fluids and Antibiotics",
        duration: 20,
        content: `
          <h2>First-Hour Safe Actions</h2>
          <ol>
            <li><strong>Airway &amp; oxygen</strong> — target SpO₂ &gt;94% if respiratory distress</li>
            <li><strong>IV/IO access</strong> — do not delay fluids for perfect access</li>
            <li><strong>Isotonic bolus</strong> — 10–20 mL/kg over 10–20 min; reassess after each bolus</li>
            <li><strong>Antibiotics within 1 hour</strong> — ceftriaxone 50–80 mg/kg/day IV (max 2 g/dose) or per local MOH chart</li>
            <li><strong>Bedside glucose</strong> — treat hypoglycaemia (mmol/L) if present</li>
          </ol>
          ${SHOCK_FLUIDS_FEAST}
          <p>After <strong>40 mL/kg</strong> without improvement → escalate; consider inotropes and ICU (Septic Shock 2 course).</p>
        `,
        questions: [
          {
            question: "SpO₂ target for a septic child with respiratory distress is:",
            options: [">80%", ">94%", "100% always", "No oxygen needed"],
            correct: 1,
            explanation: "Target SpO₂ >94% when respiratory distress is present during sepsis resuscitation.",
          },
          {
            question: "IV/IO access in septic shock should:",
            options: ["Delay fluid bolus until central line placed", "Not delay fluid resuscitation — obtain access promptly", "Use oral fluids only", "Wait for senior review before any access"],
            correct: 1,
            explanation: "Do not delay fluids for perfect access — IV or IO promptly.",
          },
          {
            question: "Isotonic bolus administration should be:",
            options: ["Given over 10–20 minutes with reassessment after each bolus", "Given as fast push without monitoring", "Oral rehydration only", "Colloid first-line always"],
            correct: 0,
            explanation: "10–20 mL/kg isotonic boluses over 10–20 min with reassessment — FEAST-aware.",
          },
        ],
      },
      {
        title: "Module 3: Escalation and Referral",
        duration: 10,
        content: `
          <h2>When to Escalate</h2>
          <ul>
            <li>Persistent shock after 40 mL/kg isotonic fluid</li>
            <li>Need for vasopressors or mechanical ventilation</li>
            <li>Suspected source requiring surgery (peritonitis, necrotising infection)</li>
          </ul>
          <p>Use SBAR handover: age, weight, fluids given, antibiotics, perfusion status, and suspected source.</p>
        `,
        questions: [
          {
            question: "SBAR handover for septic shock should include:",
            options: ["Age, weight, fluids given, antibiotics, perfusion status, suspected source", "Only the child's name", "Family history only", "Discharge plan only"],
            correct: 0,
            explanation: "Structured handover includes resuscitation details and suspected infection source.",
          },
          {
            question: "Need for mechanical ventilation in septic shock indicates:",
            options: ["Mild illness", "Escalation — persistent shock or respiratory failure", "Discharge readiness", "Antibiotics can be stopped"],
            correct: 1,
            explanation: "Ventilation need signals escalation alongside fluid-refractory shock.",
          },
          {
            question: "Suspected necrotising infection or peritonitis requires:",
            options: ["Antibiotics alone without surgical review", "Surgical source control alongside resuscitation", "Discharge home", "Oral fluids only"],
            correct: 1,
            explanation: "Some septic sources need urgent surgical review for source control.",
          },
        ],
      },
    ],
    quiz: {
      title: "Septic Shock I Quiz",
      passingScore: 80,
      questions: [
        {
          question: "A febrile child with cold extremities, CRT 4 s, and lethargy — first action after ABC:",
          options: [
            "Antibiotics only",
            "10–20 mL/kg isotonic bolus with reassessment",
            "Refer without treatment",
            "Oral paracetamol only",
          ],
          correct: 1,
          explanation: "Restore perfusion with isotonic bolus(es) and reassess; give antibiotics within 1 hour.",
        },
        {
          question: "Maximum fluid bolus volume before escalating to inotropes (typical teaching):",
          options: ["10 mL/kg", "20 mL/kg", "40 mL/kg total", "100 mL/kg"],
          correct: 2,
          explanation: "Up to 40 mL/kg (typically 2×20 mL/kg) with reassessment; then escalate if shock persists.",
        },
        {
          question: "FEAST trial context teaches us to:",
          options: [
            "Never give fluids",
            "Reassess after each bolus — fluid caution in some non-hypovolaemic presentations",
            "Use colloid first",
            "Give 60 mL/kg immediately",
          ],
          correct: 1,
          explanation: "Reassess perfusion after each bolus; avoid unmonitored large volumes in unclear shock types.",
        },
        {
          question: "Antibiotics in septic shock should ideally start within:",
          options: ["6 hours", "1 hour", "24 hours", "After culture results"],
          correct: 1,
          explanation: "Early broad-spectrum antibiotics within 1 hour of recognition improves outcomes.",
        },
        {
          question: "Isotonic fluid bolus volume per reassessment cycle (typical teaching):",
          options: ["5 mL/kg", "10–20 mL/kg", "50 mL/kg without reassessment", "Oral fluids only"],
          correct: 1,
          explanation: "10–20 mL/kg isotonic boluses with reassessment after each — FEAST-aware.",
        },
        {
          question: "Bedside glucose in a lethargic febrile child is important because:",
          options: [
            "Hypoglycaemia is a reversible cause of altered mental status",
            "Hyperglycaemia rules out sepsis",
            "Glucose is never checked in shock",
            "Only adults need glucose checks",
          ],
          correct: 0,
          explanation: "Treat hypoglycaemia promptly while resuscitating for shock.",
        },
        {
          question: "Cool extremities with fever suggest:",
          options: [
            "Perfusion failure until proven otherwise — assess CRT and mental status",
            "Normal finding requiring no action",
            "Only dehydration",
            "Immediate discharge",
          ],
          correct: 0,
          explanation: "Combine perfusion signs; cool skin alone is not sufficient to diagnose shock.",
        },
        {
          question: "Ceftriaxone dosing in paediatric sepsis (typical teaching) is:",
          options: [
            "50–80 mg/kg/day IV divided",
            "5 mg/kg once only",
            "Oral amoxicillin only",
            "Withhold until LP results",
          ],
          correct: 0,
          explanation: "Empiric IV antibiotics per local MOH chart — do not delay in critical illness.",
        },
      ],
    },
  },
  {
    id: "septic-shock-ii",
    title: "Paediatric Septic Shock II: Vasopressors and Multi-Organ Failure",
    level: "advanced",
    duration: 60,
    price: 1200,
    description:
      "Manage refractory septic shock with vasopressors, ventilation readiness, and multi-organ support.",
    modules: [
      {
        title: "Module 1: Refractory Shock and Vasopressor Selection",
        duration: 20,
        content: `
          <h2>When Fluids Are Not Enough</h2>
          <p>Refractory shock = persistent hypotension / poor perfusion despite adequate fluid resuscitation and antibiotics.</p>
          ${SHOCK_VASOPRESSORS}
          <p>Start vasopressor when shock persists after 40 mL/kg isotonic fluid — do not delay if fluid-refractory.</p>
        `,
        questions: [
          {
            question: "Refractory septic shock is defined as:",
            options: ["Shock resolving with first bolus", "Persistent hypotension or poor perfusion despite adequate fluids and antibiotics", "Fever without tachycardia", "Normal perfusion after 10 mL/kg"],
            correct: 1,
            explanation: "Refractory shock persists despite fluid resuscitation and appropriate antibiotics.",
          },
          {
            question: "Warm vasodilatory septic shock typically responds first to:",
            options: ["Atropine", "Noradrenaline (norepinephrine)", "Oral fluids", "Antihistamine"],
            correct: 1,
            explanation: "Noradrenaline is first-line for vasodilatory septic shock when fluids are inadequate.",
          },
          {
            question: "Cold shock with poor cardiac output may prefer:",
            options: ["Adrenaline (epinephrine) over noradrenaline in some protocols", "No vasopressors ever", "Large fluid bolus without reassessment", "Discharge"],
            correct: 0,
            explanation: "Cold shock with low cardiac output may respond to adrenaline per local protocol.",
          },
        ],
      },
      {
        title: "Module 2: Ventilation and Sedation Readiness",
        duration: 20,
        content: `
          <h2>Airway and Ventilation in Septic Shock</h2>
          <ul>
            <li>Intubate for airway protection, rising work of breathing, or GCS &lt;8</li>
            <li>After vasopressors: use sedated, lung-protective ventilation if ARDS develops</li>
            <li>Maintain MAP targets per local ICU protocol; avoid hypotension during induction</li>
          </ul>
          <p>In low-resource settings: prepare intubation equipment early; call senior help before decompensation.</p>
        `,
        questions: [
          {
            question: "Intubation is indicated in septic shock when:",
            options: ["GCS <8, airway not protected, or rising work of breathing", "Mild fever only", "Normal oxygen saturation always", "After discharge planning"],
            correct: 0,
            explanation: "Protect airway when GCS is low, work of breathing is failing, or oxygenation inadequate.",
          },
          {
            question: "After starting vasopressors, ventilation strategy if ARDS develops should be:",
            options: ["Large tidal volumes", "Sedated lung-protective ventilation", "No sedation", "Hyperventilate to alkalosis"],
            correct: 1,
            explanation: "Lung-protective ventilation with adequate sedation when ARDS complicates sepsis.",
          },
          {
            question: "In low-resource settings, intubation preparation should:",
            options: ["Wait until cardiac arrest", "Begin early — call senior help before decompensation", "Never intubate septic children", "Delay until 48 hours of antibiotics"],
            correct: 1,
            explanation: "Prepare equipment and senior support early before the child decompensates.",
          },
        ],
      },
      {
        title: "Module 3: Multi-Organ Failure and Coagulopathy",
        duration: 20,
        content: `
          <h2>MODS in Paediatric Sepsis</h2>
          <ul>
            <li><strong>Respiratory:</strong> ARDS — low tidal volume, adequate PEEP where available</li>
            <li><strong>Renal:</strong> oliguria — fluid balance, consider RRT if available</li>
            <li><strong>Haematological:</strong> DIC — treat underlying sepsis; transfuse per triggers</li>
            <li><strong>Metabolic:</strong> hypoglycaemia and acidosis — monitor glucose in mmol/L</li>
          </ul>
          <p>Source control (drain abscess, remove infected lines) remains essential alongside supportive care.</p>
        `,
        questions: [
          {
            question: "Paediatric ARDS in sepsis is managed with:",
            options: ["Low tidal volume and adequate PEEP where available", "Very high tidal volumes", "No PEEP ever", "Only antibiotics"],
            correct: 0,
            explanation: "Lung-protective ventilation reduces barotrauma in paediatric ARDS.",
          },
          {
            question: "Oliguria in septic multi-organ failure requires:",
            options: ["Fluid balance tracking and renal support planning", "Unlimited fluid boluses", "No monitoring", "Immediate discharge"],
            correct: 0,
            explanation: "Track urine output and plan renal support including RRT when available.",
          },
          {
            question: "Hypoglycaemia monitoring in septic MODS uses glucose units of:",
            options: ["mg/dL only without conversion", "mmol/L at bedside", "Never checked", "Urine dipstick only"],
            correct: 1,
            explanation: "Monitor bedside glucose in mmol/L — treat hypoglycaemia promptly in critical illness.",
          },
        ],
      },
    ],
    quiz: {
      title: "Septic Shock II Quiz",
      passingScore: 80,
      questions: [
        {
          question: "First-line vasopressor for fluid-refractory septic shock (international):",
          options: ["Dopamine only", "Noradrenaline (norepinephrine)", "Hydralazine", "Atropine"],
          correct: 1,
          explanation: "Noradrenaline is first-line for vasodilatory septic shock when fluids are inadequate.",
        },
        {
          question: "Adrenaline (epinephrine) in paediatric septic shock is often used when:",
          options: [
            "Always first-line",
            "Cold shock with poor cardiac output or noradrenaline unavailable",
            "Only for anaphylaxis",
            "Never in children",
          ],
          correct: 1,
          explanation: "Adrenaline may be preferred in cold shock / low cardiac output; noradrenaline in warm vasodilatory shock.",
        },
        {
          question: "When to start vasopressors:",
          options: [
            "Before any fluids",
            "After fluid resuscitation if shock persists",
            "Only after 24 hours",
            "Never in LMIC settings",
          ],
          correct: 1,
          explanation: "Start when shock persists despite adequate fluid resuscitation — do not delay in fluid-refractory shock.",
        },
        {
          question: "ARDS lung-protective ventilation targets:",
          options: [
            "Large tidal volumes",
            "Low tidal volume (6–8 mL/kg) with adequate PEEP",
            "No PEEP",
            "Hyperventilate to pH 7.6",
          ],
          correct: 1,
          explanation: "Lung-protective strategy reduces barotrauma in paediatric ARDS.",
        },
        {
          question: "Source control in septic shock means:",
          options: [
            "Drain abscess / remove infected lines / surgical review when indicated",
            "Antibiotics alone always sufficient",
            "No role in paediatrics",
            "Delay until ICU discharge",
          ],
          correct: 0,
          explanation: "Control the infectious source alongside antibiotics and supportive care.",
        },
        {
          question: "DIC in paediatric sepsis is managed primarily by:",
          options: [
            "Treating underlying sepsis; transfuse per local triggers",
            "Heparin for all children",
            "Withhold all blood products",
            "Platelets to arbitrary high targets always",
          ],
          correct: 0,
          explanation: "Address sepsis; transfuse guided by bleeding and lab triggers.",
        },
        {
          question: "Oliguria in septic shock prompts:",
          options: [
            "Fluid balance assessment and renal support planning",
            "Unlimited fluids without reassessment",
            "Immediate dialysis in all cases",
            "Ignore if blood pressure is normal",
          ],
          correct: 0,
          explanation: "Track urine output; consider RRT when available and indicated.",
        },
        {
          question: "Induction for intubation in septic shock requires:",
          options: [
            "Hemodynamic preparation — avoid hypotension during induction",
            "No vasopressor planning",
            "Routine deep sedation without monitoring",
            "Delay until cardiac arrest",
          ],
          correct: 0,
          explanation: "Stabilise perfusion and have vasopressor readiness before airway intervention.",
        },
      ],
    },
  },
];
