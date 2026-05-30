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
      ],
    },
  },
];
