/**
 * Fellowship metabolic Level 2: AKI 2 and Anaemia 2 (MECE v2 catalog expansion).
 * Aligned with CLINICAL_CONTENT_GOVERNANCE + CLINICAL_SOURCE_OF_TRUTH §5.
 */

import {
  AKI_ELECTROLYTES_MMOL,
  AKI_NEPHROTOXIN_AVOID,
  AKI_PD_LMIC_NOTE,
  AKI_RRT_INDICATIONS,
  ANAEMIA_IRON_VS_TRANSFUSION,
  ANAEMIA_SICKLE_MALARIA,
  ANAEMIA_TRANSFUSION_THRESHOLDS,
  DKA_POTASSIUM_SAFETY,
} from "./clinical-content-helpers";

export const microCoursesMetabolicIi = [
  {
    id: "acute-kidney-injury-ii",
    title: "AKI 2: RRT, Fluid Balance & Electrolytes",
    level: "advanced",
    duration: 60,
    price: 1200,
    prerequisite: "aki-i",
    description:
      "Advanced AKI: RRT indications, fluid and electrolyte emergencies (K⁺, phosphate), LMIC dialysis options, nephrotoxin avoidance.",
    modules: [
      {
        title: "Module 1: Fluid Balance & Daily Prescription",
        duration: 20,
        content: `
          <h2>Fluid balance in established AKI</h2>
          <h3>Assess volume status every shift</h3>
          <ul>
            <li><strong>Hypovolemic:</strong> Small cautious bolus (10 mL/kg) if perfusion poor — reassess; do not repeat if no urine response.</li>
            <li><strong>Euvolemic / hypervolemic:</strong> <strong>Restrict fluids</strong> to insensible losses (~400–600 mL/m²/day) + previous hour urine output (mL-for-mL).</li>
            <li>Weigh daily — weight gain &gt;5–10% suggests fluid overload.</li>
          </ul>
          <h3>Input / output chart</h3>
          <ul>
            <li>All IV fluids, enteral feeds, drugs in fluid, blood products = input.</li>
            <li>Urine, NG losses, drains = output.</li>
            <li>Target neutral balance once euvolemic unless actively dehydrating prerenal AKI.</li>
          </ul>
          ${AKI_NEPHROTOXIN_AVOID}
        `,
        questions: [
          {
            question: "A child with oliguric AKI and pulmonary crackles should receive:",
            options: [
              "20 mL/kg bolus",
              "Fluid restriction to insensible + urine output",
              "Free water only",
              "High-dose NSAIDs",
            ],
            correct: 1,
            explanation: "Hypervolemic AKI with overload signs needs restriction — not further boluses.",
          },
          {
            question: "Which drug should be held or dose-adjusted first in AKI?",
            options: ["Paracetamol", "NSAIDs", "Vitamin C", "Oxygen"],
            correct: 1,
            explanation: "NSAIDs reduce renal perfusion and worsen AKI — avoid unless essential.",
          },
          {
            question: "Daily fluid prescription in euvolemic oliguric AKI is best based on:",
            options: [
              "Maintenance × 2",
              "Insensible losses + measured urine output",
              "Ad lib fluids",
              "Only oral intake",
            ],
            correct: 1,
            explanation: "Match insensible losses plus replace urine mL-for-mL; avoid overload.",
          },
        ],
      },
      {
        title: "Module 2: Potassium, Phosphate & Acid–Base",
        duration: 20,
        content: `
          <h2>Electrolyte emergencies</h2>
          ${AKI_ELECTROLYTES_MMOL}
          ${DKA_POTASSIUM_SAFETY}
          <h3>Hyperkalaemia sequence (ECG changes)</h3>
          <ol>
            <li>Stop K⁺ intake; review fluids and drugs.</li>
            <li><strong>Calcium gluconate</strong> 0.5–1 mL/kg (10%) IV — cardiac membrane stabilisation (does not lower K⁺).</li>
            <li><strong>Insulin + glucose</strong> (0.5–1 unit/kg insulin + 2 mL/kg 25% dextrose) — shifts K⁺ intracellularly.</li>
            <li>Salbutamol nebuliser (adjunct); consider RRT if refractory.</li>
          </ol>
          <h3>Hyperphosphataemia</h3>
          <ul>
            <li>Common in rhabdomyolysis, tumour lysis, HUS — binds calcium → risk of arrhythmias.</li>
            <li>Dietary restriction; phosphate binders per local protocol when persistent.</li>
          </ul>
        `,
        questions: [
          {
            question: "First intervention for K⁺ 7.2 mmol/L with widened QRS in AKI:",
            options: [
              "KCl IV push",
              "Calcium gluconate IV",
              "Oral potassium",
              "Large fluid bolus",
            ],
            correct: 1,
            explanation: "Calcium stabilises myocardium; then insulin/glucose and RRT if needed — never KCl push.",
          },
          {
            question: "Hyperphosphataemia in AKI is especially concerning because it:",
            options: [
              "Lowers potassium",
              "Binds calcium and worsens arrhythmia risk",
              "Causes hypernatraemia",
              "Improves urine output",
            ],
            correct: 1,
            explanation: "High phosphate binds calcium — hypocalcaemia and cardiac irritability.",
          },
          {
            question: "Hyponatraemia in oliguric AKI is usually managed by:",
            options: [
              "3% saline bolus",
              "Hypertonic fluids freely",
              "Fluid restriction — avoid hypotonic fluids",
              "High sodium diet only",
            ],
            correct: 2,
            explanation: "Dilutional hyponatraemia — restrict fluids; hypertonic saline only for severe symptomatic cases per specialist protocol.",
          },
        ],
      },
      {
        title: "Module 3: RRT Indications & LMIC Pathways",
        duration: 20,
        content: `
          <h2>Renal replacement therapy</h2>
          ${AKI_RRT_INDICATIONS}
          ${AKI_PD_LMIC_NOTE}
          <h3>Modality overview</h3>
          <ul>
            <li><strong>Intermittent haemodialysis:</strong> Rapid solute/fluid removal — needs vascular access and machine.</li>
            <li><strong>CRRT:</strong> ICU — haemodynamically unstable children.</li>
            <li><strong>Peritoneal dialysis:</strong> Slower; useful when HD unavailable — monitor for peritonitis, catheter blockage.</li>
          </ul>
          <h3>Referral triggers</h3>
          <ul>
            <li>Persistent oliguria &gt;48 h, rising creatinine, refractory electrolytes or acidosis.</li>
            <li>Fluid overload with respiratory failure despite diuretics.</li>
            <li>HUS with anuria — early nephrology / ICU discussion.</li>
          </ul>
        `,
        questions: [
          {
            question: "AEIOU for dialysis includes all EXCEPT:",
            options: [
              "Acidosis refractory",
              "Electrolyte emergency (K⁺)",
              "Overload unresponsive",
              "Normal urine output",
            ],
            correct: 3,
            explanation: "RRT is for life-threatening metabolic/volume problems — not normal urine output.",
          },
          {
            question: "Peritoneal dialysis in paediatric AKI is best described as:",
            options: [
              "Always first-line over HD",
              "LMIC option when HD unavailable — not default where HD exists",
              "Contraindicated in children",
              "Replaces fluid resuscitation",
            ],
            correct: 1,
            explanation: "PD saves lives when HD/ICU absent; where HD exists it is not the default first-line.",
          },
          {
            question: "A child with 12% weight gain, oliguria, and crackles needs:",
            options: [
              "More crystalloid boluses",
              "RRT or urgent diuresis discussion — fluid removal",
              "High potassium fluids",
              "NSAIDs",
            ],
            correct: 1,
            explanation: "Fluid overload with respiratory compromise is an RRT/diuresis indication after medical therapy fails.",
          },
        ],
      },
    ],
    quiz: {
      title: "AKI 2 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "KDIGO Stage 3 AKI includes:",
          options: [
            "Creatinine 1.5× baseline only",
            "Creatinine ≥3× baseline OR urine <0.3 mL/kg/hr × 24 h",
            "Any fever",
            "Normal creatinine",
          ],
          correct: 1,
          explanation: "Stage 3: creatinine ≥3× or severe oliguria/anuria criteria.",
        },
        {
          question: "In hypervolemic AKI the priority is:",
          options: ["Aggressive boluses", "Fluid restriction and overload treatment", "High K⁺ fluids", "NSAIDs"],
          correct: 1,
          explanation: "Restrict fluids; treat overload — diuretics or RRT if needed.",
        },
        {
          question: "K⁺ 6.8 mmol/L with peaked T waves — after calcium, next step:",
          options: ["KCl push", "Insulin + glucose", "Stop all treatment", "Oral kayexalate only"],
          correct: 1,
          explanation: "Insulin + glucose shifts K⁺; RRT if refractory.",
        },
        {
          question: "Nephrotoxic drugs to avoid in AKI include:",
          options: ["NSAIDs and aminoglycosides", "Oxygen", "Antibiotics always", "IV fluids always"],
          correct: 0,
          explanation: "NSAIDs and aminoglycosides worsen renal injury — review all meds.",
        },
        {
          question: "Peritoneal dialysis is taught as:",
          options: [
            "Default over HD everywhere",
            "Evidence-based LMIC option when HD unavailable",
            "Never used in children",
            "Replacement for antibiotics",
          ],
          correct: 1,
          explanation: "PD is valuable when HD unavailable — not default where HD/ICU exists.",
        },
        {
          question: "Hyperphosphataemia management includes:",
          options: ["Unlimited phosphate intake", "Restriction and binders if persistent", "KCl IV push", "Ignore until dialysis"],
          correct: 1,
          explanation: "Restrict intake; binders per protocol — especially with rhabdomyolysis/HUS.",
        },
        {
          question: "Prerenal AKI usually improves with:",
          options: ["Nephrotoxins", "Targeted fluid resuscitation then reassessment", "Fluid overload", "Withholding all fluids always"],
          correct: 1,
          explanation: "Prerenal AKI: treat hypovolaemia; stop boluses if no response.",
        },
        {
          question: "RRT indication — refractory metabolic acidosis means pH:",
          options: [">7.4", "<7.1 despite treatment", "7.35 always", "Any value"],
          correct: 1,
          explanation: "Severe acidosis (often pH <7.1) refractory to medical therapy warrants RRT discussion.",
        },
        {
          question: "Daily monitoring in AKI must include:",
          options: ["Urine output and weight", "Only temperature", "No labs", "Discharge planning only"],
          correct: 0,
          explanation: "Urine output, weight, creatinine, electrolytes — daily at minimum.",
        },
        {
          question: "HUS with anuria and rising creatinine requires:",
          options: ["Antibiotics for STEC", "Early specialist/RRT discussion — supportive care", "High-volume boluses only", "NSAIDs"],
          correct: 1,
          explanation: "HUS: no antibiotics for STEC; supportive care including RRT when indicated.",
        },
      ],
    },
  },
  {
    id: "severe-anaemia-ii",
    title: "Anaemia 2: Transfusion Decisions & Crisis Management",
    level: "advanced",
    duration: 60,
    price: 1200,
    prerequisite: "anaemia-i",
    description:
      "Advanced severe anaemia: WHO transfusion thresholds, sickle crisis basics, malaria co-morbidity, Kenya blood bank reality, iron vs transfusion.",
    modules: [
      {
        title: "Module 1: Transfusion Thresholds & Cardiac Risk",
        duration: 20,
        content: `
          <h2>When to transfuse — and when to wait</h2>
          ${ANAEMIA_TRANSFUSION_THRESHOLDS}
          <h3>Compensated vs decompensated</h3>
          <ul>
            <li><strong>Compensated:</strong> Tachycardia but clear lungs, no shock — may transfuse slowly if Hb &lt;4 g/dL or symptomatic 4–6 g/dL.</li>
            <li><strong>Decompensated (heart failure):</strong> Hepatomegaly, gallop, crackles — <strong>10 mL/kg</strong> over 3–4 h; furosemide 1 mg/kg if overload mid-transfusion.</li>
          </ul>
          <h3>Calculate volume</h3>
          <p>Desired Hb rise ≈ 10 mL/kg packed red cells raises Hb ~2–3 g/dL in many children — reassess Hb and clinical status before second unit.</p>
        `,
        questions: [
          {
            question: "WHO absolute transfusion threshold for severe anaemia is Hb:",
            options: ["<10 g/dL", "<4 g/dL", ">12 g/dL", "<7 g/dL always regardless of symptoms"],
            correct: 1,
            explanation: "Transfuse if Hb <4 g/dL; 4–6 g/dL with shock, heart failure, or altered consciousness.",
          },
          {
            question: "Severe anaemia with pulmonary oedema should receive:",
            options: ["20 mL/kg rapid transfusion", "10 mL/kg slower with monitoring ± diuretic", "No fluids ever", "Iron IV push"],
            correct: 1,
            explanation: "Smaller volume slower — avoid worsening cardiac failure / pulmonary oedema.",
          },
          {
            question: "Before transfusion when blood is scarce, document:",
            options: [
              "Nothing",
              "Indication, consent, cross-match status, reaction plan",
              "Only patient name",
              "Discharge summary",
            ],
            correct: 1,
            explanation: "Kenya reality: stock-outs — clear indication and safety plan protect patients and teams.",
          },
        ],
      },
      {
        title: "Module 2: Sickle Cell, Malaria & Co-Morbidity",
        duration: 20,
        content: `
          <h2>Crisis patterns in endemic settings</h2>
          ${ANAEMIA_SICKLE_MALARIA}
          <h3>Sickle cell — basics</h3>
          <ul>
            <li><strong>Vaso-occlusive crisis:</strong> Pain, fever work-up, hydration, oxygen — simple transfusion if Hb falls below patient baseline significantly.</li>
            <li><strong>Acute chest syndrome:</strong> Fever + respiratory symptoms + new infiltrate — antibiotics, oxygen, exchange transfusion discussion.</li>
            <li><strong>Sequestration:</strong> Sudden Hb drop, massive spleen — urgent transfusion.</li>
          </ul>
          <h3>Malaria + anaemia</h3>
          <ul>
            <li>Treat severe malaria with <strong>artesunate</strong> — do not defer for transfusion planning alone.</li>
            <li>Transfuse per threshold; watch for transfusion-associated circulatory overload (TACO).</li>
          </ul>
        `,
        questions: [
          {
            question: "Acute splenic sequestration in sickle cell presents with:",
            options: [
              "Normal spleen size",
              "Sudden pallor, hypotension, massively enlarged spleen",
              "Hypertension only",
              "Isolated rash",
            ],
            correct: 1,
            explanation: "Sequestration: trapping of RBCs in spleen — shock + splenomegaly — urgent transfusion.",
          },
          {
            question: "Severe malaria with Hb 3.5 g/dL — priority order:",
            options: [
              "Defer artesunate until transfusion finished",
              "Artesunate + transfusion per threshold with overload caution",
              "Iron only",
              "Antibiotics only",
            ],
            correct: 1,
            explanation: "Artesunate is life-saving; transfuse per WHO thresholds and monitor for fluid overload.",
          },
          {
            question: "Vaso-occlusive sickle crisis first-line includes:",
            options: ["Immediate exchange transfusion always", "Hydration, analgesia, treat infection", "High-dose steroids always", "No oxygen ever"],
            correct: 1,
            explanation: "Supportive care + analgesia; transfusion/exchange for specific indications (stroke, severe ACS, sequestration).",
          },
        ],
      },
      {
        title: "Module 3: Iron, Blood Bank Reality & Safety",
        duration: 20,
        content: `
          <h2>Iron vs transfusion & safe practice</h2>
          ${ANAEMIA_IRON_VS_TRANSFUSION}
          <h3>Kenya blood bank reality</h3>
          <ul>
            <li>National blood transfusion service gaps — verify unit number, expiry, haemovigilance reporting.</li>
            <li>Group O-negative for emergencies when cross-match delayed — document override reason.</li>
            <li>Warm blood, filtered set, observe first 15 min closely for reactions.</li>
          </ul>
          <h3>Transfusion reactions</h3>
          <ul>
            <li><strong>Stop transfusion</strong> if fever, urticaria, haemoglobinuria, hypotension, respiratory distress.</li>
            <li>Treat anaphylaxis with IM adrenaline 0.01 mg/kg — not antihistamine alone.</li>
            <li>Return blood to lab; send labs per local protocol.</li>
          </ul>
        `,
        questions: [
          {
            question: "After acute severe anaemia stabilisation, iron repletion is typically:",
            options: [
              "Never needed",
              "Oral ferrous sulfate 3–6 mg/kg/day elemental iron + vitamin C",
              "IV iron push",
              "Only transfusion",
            ],
            correct: 1,
            explanation: "Oral iron rebuilds stores; transfusion is acute rescue not long-term fix.",
          },
          {
            question: "If blood units are unavailable and Hb is 3.8 g/dL with shock:",
            options: [
              "Discharge",
              "Escalate for blood, treat cause (e.g. malaria), ICU monitoring",
              "Iron alone",
              "Delay all treatment",
            ],
            correct: 1,
            explanation: "Life-threatening anaemia needs escalation, source control, and urgent blood sourcing.",
          },
          {
            question: "Suspected acute haemolytic transfusion reaction — first action:",
            options: ["Speed up transfusion", "Stop transfusion; ABC support", "Give second unit", "Oral fluids only"],
            correct: 1,
            explanation: "Stop transfusion immediately; resuscitate and investigate.",
          },
        ],
      },
    ],
    quiz: {
      title: "Anaemia 2 Quiz",
      passingScore: 80,
      questions: [
        {
          question: "Transfuse packed red cells when Hb is:",
          options: ["<4 g/dL or 4–6 with shock/heart failure", ">12 g/dL", "<10 g/dL always", "Any pallor"],
          correct: 0,
          explanation: "WHO thresholds: <4 absolute; 4–6 with danger signs.",
        },
        {
          question: "Decompensated severe anaemia transfusion volume:",
          options: ["20 mL/kg rapid", "10 mL/kg over 3–4 h with monitoring", "50 mL/kg", "5 mL total only"],
          correct: 1,
          explanation: "Smaller slower volume reduces pulmonary oedema risk in cardiac failure.",
        },
        {
          question: "Sickle acute chest syndrome requires:",
          options: ["Ignore oxygen", "Antibiotics, oxygen, senior review — possible exchange transfusion", "Iron only", "Defer all treatment"],
          correct: 1,
          explanation: "ACS is emergency — antibiotics, oxygen, transfusion/exchange per protocol.",
        },
        {
          question: "Malaria-associated severe anaemia — antimalarial of choice:",
          options: ["Oral chloroquine only", "IV/IM artesunate for severe malaria", "IV artemether first-line", "No antimalarial"],
          correct: 1,
          explanation: "Artesunate is WHO first-line for severe malaria — not IV artemether push.",
        },
        {
          question: "Iron supplementation after transfusion for iron deficiency:",
          options: ["Ferrous sulfate 3–6 mg/kg/day elemental iron", "Never", "IV iron push", "Blood transfusion weekly"],
          correct: 0,
          explanation: "Oral iron + vitamin C after acute phase when tolerated.",
        },
        {
          question: "Universal emergency donor blood type:",
          options: ["AB positive", "O negative", "Any type", "Rh positive only"],
          correct: 1,
          explanation: "O-negative for emergencies when cross-match unavailable — document indication.",
        },
        {
          question: "Transfusion reaction with hypotension — treat with:",
          options: ["IM adrenaline 0.01 mg/kg if anaphylaxis", "Continue transfusion", "Antihistamine only", "No action"],
          correct: 0,
          explanation: "Anaphylaxis: stop transfusion; IM adrenaline first-line.",
        },
        {
          question: "TACO (transfusion overload) risk is reduced by:",
          options: ["Rapid large volumes", "Slow transfusion and 10 mL/kg in heart failure risk", "No monitoring", "Second unit immediately"],
          correct: 1,
          explanation: "Slow cautious volumes with monitoring — especially malaria and cardiac failure.",
        },
        {
          question: "G6PD haemolysis trigger example:",
          options: ["Certain drugs (e.g. primaquine) and fava beans", "Vitamin C", "Oxygen", "Salbutamol"],
          correct: 0,
          explanation: "G6PD: avoid oxidant drugs/foods — causes haemolysis.",
        },
        {
          question: "When blood bank stock-out and child has Hb 3.2 g/dL with altered consciousness:",
          options: [
            "Send home",
            "Urgent escalation, treat cause, source blood — ICU if needed",
            "Iron tablet only",
            "Wait 2 weeks",
          ],
          correct: 1,
          explanation: "Life-threatening anaemia requires escalation and cause treatment — not delay.",
        },
      ],
    },
  },
];

export default microCoursesMetabolicIi;
