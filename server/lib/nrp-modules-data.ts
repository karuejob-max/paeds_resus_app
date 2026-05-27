/**
 * NRP (Neonatal Resuscitation Program) module catalog — aligned with
 * 2025 American Heart Association Guidelines for CPR and ECC (Part 5: Neonatal Resuscitation),
 * co-developed with the American Academy of Pediatrics.
 *
 * Shared by seed-nrp.ts and runtime ensure-nrp-catalog.ts.
 */
export const NRP_COURSE_TITLE =
  "Neonatal Resuscitation Program (NRP) — AHA/AAP 2025 Guidelines";

export const NRP_MODULES = [
  {
    order: 1,
    title: "Module 1: Newborn Chain of Care & Anticipation",
    description:
      "Understand the 2025 Newborn Chain of Care, antenatal risk factors, and team preparation before delivery.",
    content:
      "Successful neonatal resuscitation begins before birth with anticipation, equipment checks, and briefings.",
    duration: 35,
    sections: [
      {
        order: 1,
        title: "The Newborn Chain of Care (2025)",
        content: `<h2>Newborn Chain of Care</h2>
<p>The 2025 Guidelines introduce the <strong>Newborn Chain of Care</strong> — a seven-link continuum from prenatal and intrapartum care through postpartum follow-up. Parent and newborn outcomes are linked; resuscitation is one link in a broader system.</p>
<ol>
  <li><strong>Prevention:</strong> Prenatal and intrapartum care that reduces preventable morbidity</li>
  <li><strong>Anticipation &amp; preparation:</strong> Identify risk, assemble team, check equipment</li>
  <li><strong>Initial steps:</strong> Warm, dry, position, stimulate, assess</li>
  <li><strong>Respiratory support:</strong> Ventilation as the primary intervention</li>
  <li><strong>Chest compressions &amp; medications:</strong> When ventilation is insufficient</li>
  <li><strong>Post-resuscitation care:</strong> Stabilisation and monitoring</li>
  <li><strong>Follow-up:</strong> Ongoing care for parent and newborn</li>
</ol>
<div class="clinical-note">
  <strong>Key principle:</strong> Most newborns transition without intervention. For those who need help, <em>adequate ventilation</em> is the most effective action — neonatal arrest is almost always respiratory in origin.
</div>`,
      },
      {
        order: 2,
        title: "Antenatal Risk & Team Briefing",
        content: `<h2>Anticipate, Prepare, Communicate</h2>
<p>Identify pregnancies at increased risk for resuscitation: preterm birth, multiple gestation, oligohydramnios, maternal diabetes, fetal bradycardia, meconium-stained fluid (context-dependent), placenta previa, and others.</p>
<h3>Equipment checklist (minimum)</h3>
<ul>
  <li>Warm surface, hats, blankets, plastic wrap for preterm infants</li>
  <li>Suction (bulb or catheter), masks (preterm and term sizes)</li>
  <li>Self-inflating bag or T-piece resuscitator with pressure relief</li>
  <li>Pulse oximeter with neonatal probe; optional cardiac monitor</li>
  <li>Laryngoscope, endotracheal tubes, laryngeal mask if used locally</li>
  <li>Umbilical catheter supplies, emergency medications</li>
</ul>
<p>Conduct a <strong>time-out briefing</strong>: roles (leader, airway, medications, recorder), escalation plan, and expected gestational age.</p>`,
      },
      {
        order: 3,
        title: "Terminology & Communication (2025)",
        content: `<h2>2025 terminology updates</h2>
<ul>
  <li>Use <strong>breaths</strong> (not "rescue breaths") for assisted breathing during CPR or when pulse is present but breathing is absent.</li>
  <li>Use <strong>ventilations</strong> for health care professionals providing assisted breathing via bag-mask or advanced airway.</li>
  <li>Prefer <strong>lay rescuer</strong> over "bystander" in community education — language that encourages action.</li>
</ul>
<p>Closed-loop communication and shared mental models improve team performance during high-stakes neonatal events.</p>`,
      },
    ],
    quiz: {
      title: "Check: Newborn Chain of Care",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText:
            "According to the 2025 Guidelines, what is the most effective intervention for the majority of newborns who need help at birth?",
          options: JSON.stringify([
            "Immediate chest compressions",
            "Adequate ventilation",
            "Epinephrine within 60 seconds",
            "100% oxygen for all newborns",
          ]),
          correctAnswer: "Adequate ventilation",
          explanation:
            "Neonatal compromise is usually respiratory. High-quality positive-pressure ventilation resolves most cases before compressions or medications are needed.",
        },
        {
          order: 2,
          questionText: "The 2025 Newborn Chain of Care begins with which link?",
          options: JSON.stringify([
            "Chest compressions",
            "Prevention (prenatal/intrapartum care)",
            "Epinephrine administration",
            "Post-resuscitation hypothermia only",
          ]),
          correctAnswer: "Prevention (prenatal/intrapartum care)",
          explanation:
            "The chain starts with prevention and extends through preparation, resuscitation, post-resuscitation care, and follow-up.",
        },
      ],
    },
  },
  {
    order: 2,
    title: "Module 2: Initial Steps, Temperature & Cord Management",
    description:
      "Perform initial stabilisation, thermoregulation, and evidence-based umbilical cord management at birth.",
    content: "Initial steps within the first minute establish airway patency and normothermia.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "Initial Assessment at Birth",
        content: `<h2>Within the first minute</h2>
<p><strong>Decision:</strong> Term gestation? Good muscle tone? Breathing or crying?</p>
<ul>
  <li><strong>Vigorous term infant:</strong> Skin-to-skin with parent, routine care, maintain normal temperature, ongoing observation.</li>
  <li><strong>Not vigorous or preterm risk:</strong> Warm, dry, position airway, stimulate, clear airway if needed — then reassess breathing and heart rate.</li>
</ul>
<p>Assess <strong>breathing</strong> (apnea, gasping, laboured respirations) and <strong>heart rate</strong> (auscultation or umbilical pulse). If apnea/gasping or HR &lt;100/min, begin positive-pressure ventilation (PPV).</p>`,
      },
      {
        order: 2,
        title: "Thermoregulation",
        content: `<h2>Maintain normal temperature</h2>
<p>Hypothermia increases mortality in preterm infants. For babies requiring resuscitation:</p>
<ul>
  <li>Dry immediately; remove wet linens</li>
  <li>Preterm &lt;32 weeks: plastic wrap or bag, hat, warm mattress, room temperature ≥23–25°C where feasible</li>
  <li>Term infants: warm blankets and skin-to-skin when stable</li>
</ul>
<div class="warning-note">
  Hyperthermia is also harmful — target normothermia (36.5–37.5°C axillary).
</div>`,
      },
      {
        order: 3,
        title: "Umbilical Cord Management (2025)",
        content: `<h2>Delayed cord clamping</h2>
<p>For most vigorous term and preterm newborns not requiring immediate resuscitation, <strong>defer clamping at least 60 seconds</strong> after birth (COR 1 for preterm, COR 2a for term — 2025 Guidelines).</p>
<p>If immediate resuscitation is required, prioritise ventilation and circulation — cord management is secondary to effective PPV.</p>
<p>Umbilical cord milking is not routinely recommended when delayed clamping is feasible; follow local protocol for extremely preterm infants.</p>`,
      },
    ],
    quiz: {
      title: "Check: Initial steps & cord management",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText:
            "A term newborn is limp, apneic, and has a heart rate of 80/min after initial steps. What is the next action?",
          options: JSON.stringify([
            "Chest compressions immediately",
            "Positive-pressure ventilation",
            "Epinephrine 0.1 mg/kg IV",
            "Skin-to-skin and observation only",
          ]),
          correctAnswer: "Positive-pressure ventilation",
          explanation:
            "HR below 100/min with apnea or gasping indicates the need for PPV before compressions or drugs.",
        },
        {
          order: 2,
          questionText:
            "For a vigorous term newborn not requiring resuscitation, umbilical cord clamping should generally be deferred for at least:",
          options: JSON.stringify(["10 seconds", "30 seconds", "60 seconds", "5 minutes"]),
          correctAnswer: "60 seconds",
          explanation:
            "2025 Guidelines recommend deferring clamping at least 60 seconds when immediate resuscitation is not required.",
        },
      ],
    },
  },
  {
    order: 3,
    title: "Module 3: Positive-Pressure Ventilation & MR SOPA",
    description:
      "Deliver effective PPV, apply MR SOPA corrective steps, and titrate oxygen using pulse oximetry targets.",
    content: "Ventilation technique and troubleshooting determine outcomes in most resuscitations.",
    duration: 45,
    sections: [
      {
        order: 1,
        title: "Positive-Pressure Ventilation (PPV)",
        content: `<h2>Starting PPV</h2>
<ul>
  <li>Initial breaths: 4–5 ventilations to inflate lungs, then assess HR</li>
  <li>Rate ~40–60 breaths/min once chest movement confirmed</li>
  <li>Pressure: enough to see gentle chest rise; avoid excessive pressure (lung injury)</li>
  <li><strong>Initial FiO₂:</strong> 21% for term infants; 21–30% for preterm &lt;35 weeks (titrate to SpO₂ targets)</li>
</ul>
<p>If HR remains &lt;100/min or chest does not rise, troubleshoot with <strong>MR SOPA</strong> before escalating.</p>`,
      },
      {
        order: 2,
        title: "MR SOPA — Corrective Steps",
        content: `<h2>MR SOPA mnemonic</h2>
<ol>
  <li><strong>M</strong> — Mask adjustment (seal, size)</li>
  <li><strong>R</strong> — Reposition head (neutral "sniffing" position)</li>
  <li><strong>S</strong> — Suction mouth and nose</li>
  <li><strong>O</strong> — Open mouth slightly (jaw thrust)</li>
  <li><strong>P</strong> — Pressure increase (cautiously, observe chest rise)</li>
  <li><strong>A</strong> — Alternative airway (ETT or supraglottic device)</li>
</ol>
<p>Reassess heart rate after each cycle. If HR ≥100/min and spontaneous breathing, support transition; if HR &lt;60/min after 30 seconds of <em>effective</em> PPV, start chest compressions.</p>`,
      },
      {
        order: 3,
        title: "Target SpO₂ After Birth",
        content: `<h2>Intermittent preductal SpO₂ targets (approximate)</h2>
<table>
  <thead><tr><th>Minutes after birth</th><th>Target SpO₂</th></tr></thead>
  <tbody>
    <tr><td>1 min</td><td>60–65%</td></tr>
    <tr><td>2 min</td><td>65–70%</td></tr>
    <tr><td>3 min</td><td>70–75%</td></tr>
    <tr><td>4 min</td><td>75–80%</td></tr>
    <tr><td>5 min</td><td>80–85%</td></tr>
    <tr><td>10 min</td><td>85–95%</td></tr>
  </tbody>
</table>
<p>Titrate oxygen to avoid both hypoxemia and hyperoxemia, especially in preterm infants.</p>`,
      },
    ],
    quiz: {
      title: "Check: PPV and MR SOPA",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "In MR SOPA, what does the letter 'P' stand for?",
          options: JSON.stringify([
            "Pulse oximeter placement",
            "Pressure increase",
            "Parental consent",
            "Placental delivery",
          ]),
          correctAnswer: "Pressure increase",
          explanation: "After mask, reposition, suction, and open mouth, increase pressure cautiously while observing chest rise.",
        },
        {
          order: 2,
          questionText:
            "Chest compressions should be started when the heart rate remains below 60/min after:",
          options: JSON.stringify([
            "10 seconds of any ventilation attempt",
            "30 seconds of effective PPV",
            "3 minutes of skin-to-skin care",
            "First dose of epinephrine only",
          ]),
          correctAnswer: "30 seconds of effective PPV",
          explanation:
            "Compressions are indicated when HR is &lt;60/min despite 30 seconds of effective positive-pressure ventilation.",
        },
      ],
    },
  },
  {
    order: 4,
    title: "Module 4: Chest Compressions & Advanced Airway",
    description:
      "Integrate 3:1 compressions with ventilations and secure the airway when bag-mask ventilation is inadequate.",
    content: "Compressions are coordinated with ventilations at 120 events per minute.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "Chest Compressions in Neonates",
        content: `<h2>Technique</h2>
<ul>
  <li><strong>Indication:</strong> HR &lt;60/min after 30 s of effective PPV</li>
  <li><strong>Ratio:</strong> 3 compressions : 1 ventilation (3:1)</li>
  <li><strong>Rate:</strong> 120 events/min (90 compressions + 30 ventilations)</li>
  <li><strong>Depth:</strong> Approximately one-third anterior-posterior diameter of chest</li>
  <li><strong>Two-thumb technique</strong> preferred when encircling the chest is feasible</li>
</ul>
<p>Reassess HR every 60 seconds. If HR remains &lt;60/min, confirm airway and ventilation effectiveness before medications.</p>`,
      },
      {
        order: 2,
        title: "Endotracheal Intubation & LMA",
        content: `<h2>Advanced airway</h2>
<p>Consider ETT when:</p>
<ul>
  <li>Bag-mask ventilation is ineffective after MR SOPA</li>
  <li>Prolonged resuscitation anticipated</li>
  <li>Tracheal suction for suspected airway obstruction (e.g. thick meconium — per local protocol)</li>
  <li>Surfactant administration planned</li>
</ul>
<p><strong>ETT size (quick estimate):</strong> (weight in kg + 6) / 2 or gestational age/10; confirm bilateral breath sounds and chest rise.</p>
<p>Supraglottic airways (LMA) may be used where trained and available.</p>`,
      },
    ],
    quiz: {
      title: "Check: Compressions & airway",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText: "What is the correct compression-to-ventilation ratio for neonatal resuscitation?",
          options: JSON.stringify(["30:2", "15:2", "3:1", "5:1"]),
          correctAnswer: "3:1",
          explanation:
            "Neonatal resuscitation uses 3:1 (three compressions to one ventilation), totalling 120 events per minute.",
        },
        {
          order: 2,
          questionText: "How many compressions and ventilations occur per minute at the correct 3:1 ratio?",
          options: JSON.stringify([
            "90 compressions and 30 ventilations",
            "100 compressions and 20 ventilations",
            "30 compressions and 90 ventilations",
            "60 compressions and 60 ventilations",
          ]),
          correctAnswer: "90 compressions and 30 ventilations",
          explanation: "At 120 events/min with a 3:1 ratio, there are 90 compressions and 30 ventilations per minute.",
        },
      ],
    },
  },
  {
    order: 5,
    title: "Module 5: Medications, Volume & Vascular Access",
    description:
      "Administer epinephrine and volume expansion via UVC/IO with weight-based dosing.",
    content: "Medications are rarely needed when ventilation is effective.",
    duration: 40,
    sections: [
      {
        order: 1,
        title: "Epinephrine (2025 dosing)",
        content: `<h2>Epinephrine indications</h2>
<p>HR remains &lt;60/min despite effective ventilation and chest compressions.</p>
<ul>
  <li><strong>IV/UVC:</strong> 0.01–0.03 mg/kg (1:10,000 = 0.1 mg/mL) → 0.1–0.3 mL/kg</li>
  <li><strong>ETT (if no IV):</strong> 0.05–0.1 mg/kg — higher dose due to poor absorption</li>
  <li>Repeat every 3–5 minutes if HR &lt;60/min</li>
  <li>Follow IV dose with 0.5–1 mL normal saline flush</li>
</ul>`,
      },
      {
        order: 2,
        title: "Volume Expansion & UVC",
        content: `<h2>Volume</h2>
<p>Consider 10 mL/kg normal saline or O-negative blood over 5–10 minutes when:</p>
<ul>
  <li>Suspected blood loss (pale, poor perfusion, weak pulse)</li>
  <li>No improvement despite adequate ventilation and compressions</li>
</ul>
<h3>Umbilical venous catheter (UVC)</h3>
<p>Emergency vascular access: insert 2–4 cm until blood return; confirm position before giving medications.</p>`,
      },
      {
        order: 3,
        title: "Special Circumstances (overview)",
        content: `<h2>Selected topics</h2>
<ul>
  <li><strong>Meconium:</strong> Routine intrapartum suction is not recommended; focus on ventilation if non-vigorous.</li>
  <li><strong>Congenital diaphragmatic hernia:</strong> Avoid aggressive bag-mask ventilation; early intubation.</li>
  <li><strong>Preterm:</strong> Gentle ventilation, thermoregulation, consider surfactant per protocol.</li>
</ul>
<p>Always align with local NICU pathways and national neonatal guidelines.</p>`,
      },
    ],
    quiz: {
      title: "Check: Medications & access",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText:
            "What is the recommended IV epinephrine dose for neonatal resuscitation (1:10,000 concentration)?",
          options: JSON.stringify([
            "0.1 mg/kg",
            "0.01–0.03 mg/kg",
            "0.5 mg/kg",
            "1 mg fixed dose",
          ]),
          correctAnswer: "0.01–0.03 mg/kg",
          explanation:
            "IV/UVC epinephrine is 0.01–0.03 mg/kg of the 1:10,000 solution, repeated every 3–5 minutes if needed.",
        },
        {
          order: 2,
          questionText: "Volume expansion in suspected blood loss is typically given as:",
          options: JSON.stringify([
            "1 mL/kg bolus over 1 second",
            "10 mL/kg over 5–10 minutes",
            "50 mL/kg over 30 minutes",
            "200 mL fixed dose",
          ]),
          correctAnswer: "10 mL/kg over 5–10 minutes",
          explanation:
            "Normal saline or O-negative blood 10 mL/kg over 5–10 minutes is standard for suspected hypovolemia.",
        },
      ],
    },
  },
  {
    order: 6,
    title: "Module 6: Post-Resuscitation Care, Ethics & Discontinuation",
    description:
      "Stabilise the resuscitated newborn, communicate with parents, and apply ethical frameworks for withholding or discontinuing resuscitation.",
    content: "Post-resuscitation care and shared decision-making complete the chain.",
    duration: 35,
    sections: [
      {
        order: 1,
        title: "Post-Resuscitation Stabilisation",
        content: `<h2>After ROSC</h2>
<ul>
  <li>Confirm airway; provide respiratory support as needed (CPAP, ventilation)</li>
  <li>Maintain normothermia; treat hypoglycemia per protocol</li>
  <li>Monitor HR, SpO₂, blood pressure, and perfusion</li>
  <li>Consider therapeutic hypothermia for eligible term infants with HIE (per local criteria)</li>
  <li>Defer cord clamping only when clinically appropriate post-stabilisation</li>
</ul>
<p>Document events, Apgar scores, interventions, and response for handover to NICU or postnatal ward.</p>`,
      },
      {
        order: 2,
        title: "Withholding & Discontinuing Resuscitation",
        content: `<h2>Ethical considerations (2025 Ethics chapter)</h2>
<p>Decisions require shared decision-making with parents when possible, accounting for gestational age, comorbidities, and regional outcomes data.</p>
<ul>
  <li>Extremely preterm infants: discuss anticipated outcomes and parental values antenatally when feasible</li>
  <li>Discontinuation may be appropriate when no heart rate after 10 minutes of effective resuscitation (context-specific)</li>
  <li>Cultural, religious, and legal frameworks vary — follow institutional policy</li>
</ul>
<div class="clinical-note">
  Paeds Resus training supports clinical judgment; learners must follow local law, hospital policy, and licensing requirements.
</div>`,
      },
      {
        order: 3,
        title: "Integration with ResusGPS",
        content: `<h2>Bedside support</h2>
<p>The Paeds Resus <strong>ResusGPS</strong> newborn pathway mirrors NRP decision points for real-time guidance during delivery-room resuscitation. This course provides the cognitive foundation; hands-on simulation and instructor sign-off complete certification.</p>
<p>Complete all module knowledge checks, then attend your scheduled practical skills session with your gatepass certificate.</p>`,
      },
    ],
    quiz: {
      title: "Check: Post-resuscitation & ethics",
      passingScore: 80,
      questions: [
        {
          order: 1,
          questionText:
            "After successful neonatal resuscitation, which intervention is a priority?",
          options: JSON.stringify([
            "Immediate discharge home",
            "Ongoing monitoring and temperature maintenance",
            "Routine 100% oxygen for 24 hours",
            "Withholding all respiratory support",
          ]),
          correctAnswer: "Ongoing monitoring and temperature maintenance",
          explanation:
            "Post-resuscitation care includes airway support as needed, normothermia, glucose monitoring, and continuous cardiorespiratory assessment.",
        },
        {
          order: 2,
          questionText:
            "The 2025 Newborn Chain of Care emphasises that parent and newborn outcomes are:",
          options: JSON.stringify([
            "Unrelated clinical pathways",
            "Inextricably linked across prenatal to follow-up care",
            "Managed only by lay rescuers",
            "Excluded from quality improvement",
          ]),
          correctAnswer: "Inextricably linked across prenatal to follow-up care",
          explanation:
            "The chain spans prevention, preparation, resuscitation, post-resuscitation care, and follow-up for both parent and newborn.",
        },
      ],
    },
  },
] as const;

export type NrpModuleDef = (typeof NRP_MODULES)[number];
