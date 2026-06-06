/**
 * Micro-Courses Data: Paediatric Burns I & II
 * PSOT §16 Extension: Critical emergency management in low-resource settings
 */

import { BURNS_FLUID_ESCHAR, BURNS_INFECTION, SPO2_TARGET_NOTE } from './clinical-content-helpers';

export const microCoursesBurns = [
  {
    id: 'burns-i',
    title: 'Paediatric Burns I: Recognition and First-Hour Resuscitation',
    level: 'foundational',
    duration: 45,
    price: 800,
    description: 'Recognize burn severity, calculate TBSA, and implement aggressive fluid resuscitation in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Burn Classification and TBSA Calculation',
        duration: 15,
        content: `
          <h2>Burn Severity Classification</h2>
          <h3>Burn Depth (Tissue Layers):</h3>
          <ul>
            <li><strong>Superficial (1st degree):</strong> Epidermis only; erythema, no blistering; heals in 3-7 days</li>
            <li><strong>Partial-thickness (2nd degree):</strong> Epidermis + dermis; blistering, wet appearance, painful; heals in 2-3 weeks</li>
            <li><strong>Full-thickness (3rd degree):</strong> All layers destroyed; charred, leathery, painless; requires grafting</li>
          </ul>
          <h3>TBSA (Total Body Surface Area) Estimation:</h3>
          <ul>
            <li><strong>Rule of 9s (Modified for Children):</strong></li>
            <li>Head: 18% (vs 9% in adults)</li>
            <li>Each arm: 9%</li>
            <li>Chest: 18%</li>
            <li>Abdomen: 18%</li>
            <li>Each leg: 13.5%</li>
            <li>Perineum: 1%</li>
            <li><strong>Lund-Browder Chart:</strong> More accurate for children <10 years (head up to 20%)</li>
          </ul>
          <h3>Burn Severity Classification:</h3>
          <ul>
            <li><strong>Minor:</strong> <10% TBSA (partial-thickness) or <2% (full-thickness)</li>
            <li><strong>Moderate:</strong> 10-20% TBSA (partial-thickness)</li>
            <li><strong>Severe:</strong> >20% TBSA (partial-thickness) or >5% (full-thickness)</li>
            <li><strong>Critical:</strong> >40% TBSA or burns involving face, hands, perineum, joints</li>
          </ul>
          <h3>Burn Inhalation Injury Red Flags:</h3>
          <ul>
            <li>Enclosed space fire</li>
            <li>Singed nasal hairs, soot in mouth/nose</li>
            <li>Hoarseness, stridor, respiratory distress</li>
            <li>Carbonaceous sputum</li>
            <li>Altered mental status (CO poisoning)</li>
          </ul>
        `,
        questions: [
          {
            question: "Partial-thickness (2nd degree) burns characteristically:",
            options: ["Have blistering and are painful", "Are painless and leathery", "Involve epidermis only without blistering", "Never need fluid resuscitation"],
            correct: 0,
            explanation: "Partial-thickness burns blister and remain painful.",
          },
          {
            question: "In children, head TBSA by Rule of 9s is approximately:",
            options: ["18%", "9%", "27%", "4.5%"],
            correct: 0,
            explanation: "Paediatric Rule of 9s: head 18% — larger proportion than adults.",
          },
          {
            question: "Enclosed space fire with singed nasal hairs suggests:",
            options: ["Possible inhalation injury", "Superficial burn only", "No airway risk", "Discharge without observation"],
            correct: 0,
            explanation: "Inhalation injury red flags: soot, hoarseness, stridor, enclosed space fire.",
          },
        ],
      },
      {
        title: 'Module 2: First-Hour Fluid Resuscitation',
        duration: 20,
        content: `
          <h2>Burn Resuscitation Protocol</h2>
          <h3>Parkland Formula (Gold Standard):</h3>
          <ul>
            <li><strong>Total 24-hour fluid requirement:</strong> 4 mL × weight (kg) × %TBSA</li>
            <li><strong>First 8 hours:</strong> Give HALF of total (over 8 hours from time of burn)</li>
            <li><strong>Next 16 hours:</strong> Give remaining HALF (over 16 hours)</li>
            <li><strong>Fluid choice:</strong> Lactated Ringer's (LR) - isotonic, physiologic</li>
          </ul>
          <h3>Parkland Formula Example:</h3>
          <ul>
            <li>20 kg child with 30% TBSA burn</li>
            <li>Total 24-hour: 4 × 20 × 30 = 2,400 mL</li>
            <li>First 8 hours: 1,200 mL ÷ 8 = 150 mL/hour</li>
            <li>Next 16 hours: 1,200 mL ÷ 16 = 75 mL/hour</li>
          </ul>
          <h3>Titration to Urine Output (CRITICAL):</h3>
          <ul>
            <li><strong>Target urine output:</strong> 0.5 mL/kg/hr (children), 1 mL/kg/hr (infants <30 kg)</li>
            <li><strong>If oliguria (<0.5 mL/kg/hr):</strong> Increase IV rate by 25%</li>
            <li><strong>If polyuria (>1 mL/kg/hr):</strong> Decrease IV rate by 25%</li>
            <li><strong>Reassess every 1-2 hours</strong></li>
          </ul>
          <h3>Immediate Actions (First Hour):</h3>
          <ul>
            <li>Stop burning: Remove from heat source, remove clothing</li>
            <li>Cool burn: Cool water (not ice) for 10-20 minutes</li>
            <li>Establish 2 large-bore IVs (NOT through burned skin if possible)</li>
            <li>Insert Foley catheter (monitor urine output)</li>
            <li>Oxygen: If inhalation injury suspected (target SpO2 >94%)</li>
            <li>Tetanus prophylaxis: Td if >5 years since last dose</li>
            <li>Pain control: Morphine 0.1 mg/kg IV (titrate to effect)</li>
          </ul>
        `,
        questions: [
          {
            question: "Parkland formula total 24-hour fluids equals:",
            options: ["4 mL × weight (kg) × %TBSA", "10 mL/kg once only", "2 mL × weight only", "No formula needed"],
            correct: 0,
            explanation: "Parkland: 4 mL/kg/%TBSA over 24 h — half in first 8 h from time of burn.",
          },
          {
            question: "Burn resuscitation urine output target in children is:",
            options: ["0.5 mL/kg/hr", "5 mL/kg/hr", "No catheter needed always", "0.1 mL/kg/hr"],
            correct: 0,
            explanation: "Titrate fluids to 0.5 mL/kg/hr (1 mL/kg/hr in infants <30 kg).",
          },
          {
            question: "If urine output is low during burn resuscitation, IV rate should:",
            options: ["Increase by approximately 25%", "Stop all fluids", "Halve rate always", "Switch to oral only"],
            correct: 0,
            explanation: "Oliguria suggests under-resuscitation — increase rate and reassess.",
          },
        ],
      },
      {
        title: 'Module 3: Airway Management and Transfer',
        duration: 10,
        content: `
          <h2>Burn Airway & Transfer Decisions</h2>
          <h3>Inhalation Injury Assessment:</h3>
          <ul>
            <li><strong>Mild:</strong> Cough, hoarseness; monitor closely</li>
            <li><strong>Moderate:</strong> Stridor, respiratory distress; intubate if worsening</li>
            <li><strong>Severe:</strong> Airway obstruction, altered mental status; intubate immediately</li>
          </ul>
          <h3>Intubation Indications:</h3>
          <ul>
            <li>Stridor or respiratory distress</li>
            <li>Altered mental status (CO poisoning, shock)</li>
            <li>Burns to face/neck (risk of airway edema)</li>
            <li>Carbonaceous sputum</li>
            <li>Severe inhalation injury</li>
          </ul>
          <h3>Intubation Technique:</h3>
          <ul>
            <li>Use smaller tube (1 size smaller than normal) due to airway edema</li>
            <li>Avoid succinylcholine (hyperkalemia risk in burns)</li>
            <li>Use rocuronium or vecuronium for paralysis</li>
            <li>Prepare for difficult airway (edema, limited neck mobility)</li>
          </ul>
          <h3>Transfer Criteria to Burn Center:</h3>
          <ul>
            <li>Partial-thickness burns >10% TBSA</li>
            <li>Full-thickness burns >5% TBSA</li>
            <li>Burns involving face, hands, perineum, joints</li>
            <li>Inhalation injury</li>
            <li>Electrical or chemical burns</li>
            <li>Burns in children <2 years or >60 years</li>
            <li>Circumferential burns (risk of compartment syndrome)</li>
          </ul>
          <h3>Pre-Transfer Stabilization:</h3>
          <ul>
            <li>Secure airway if needed</li>
            <li>Establish fluid resuscitation (on Parkland formula)</li>
            <li>Cover burns with clean, dry dressing (NOT ice)</li>
            <li>Insert Foley catheter</li>
            <li>NPO status (risk of aspiration)</li>
            <li>Arrange urgent transport to burn center</li>
          </ul>
        `,
        questions: [
          {
            question: "Succinylcholine is avoided in burn airway management because:",
            options: ["Hyperkalaemia risk in burns", "It improves airway tone too much", "It is oral only", "It replaces morphine"],
            correct: 0,
            explanation: "Avoid succinylcholine — hyperkalaemia risk; use rocuronium/vecuronium.",
          },
          {
            question: "Circumferential burns pose risk of:",
            options: ["Compartment syndrome", "No special monitoring", "Only cosmetic issues", "Immediate discharge"],
            correct: 0,
            explanation: "Circumferential burns need escharotomy monitoring for compartment syndrome.",
          },
          {
            question: "Pre-transfer burn dressing should be:",
            options: ["Clean and dry — not ice", "Ice packed directly on wound", "Dirty wet wraps", "No dressing"],
            correct: 0,
            explanation: "Cover with clean dry dressing; continue Parkland resuscitation during transfer.",
          },
        ],
      },
    ],
    quiz: {
      title: 'Burns I Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Full-thickness burn involves:',
          options: ['Epidermis only', 'Epidermis + dermis', 'All layers (epidermis, dermis, subcutaneous)', 'Bone'],
          correct: 2,
          explanation: 'Full-thickness (3rd degree) = all layers destroyed; charred, leathery, painless; requires grafting.'
        },
        {
          question: 'Head TBSA in children (Rule of 9s):',
          options: ['9%', '18%', '13.5%', '27%'],
          correct: 1,
          explanation: 'Head = 18% in children (vs 9% in adults). Each arm = 9%, each leg = 13.5%.'
        },
        {
          question: 'Parkland formula for 25 kg child with 25% TBSA burn:',
          options: ['1,000 mL total', '2,500 mL total', '5,000 mL total', '10,000 mL total'],
          correct: 2,
          explanation: '4 × 25 × 25 = 2,500 mL total 24-hour requirement.'
        },
        {
          question: 'First 8 hours of Parkland formula:',
          options: ['All fluid', 'Half of total', 'One-quarter of total', 'No fluid'],
          correct: 1,
          explanation: 'First 8 hours = HALF of total (from time of burn). Next 16 hours = remaining HALF.'
        },
        {
          question: 'Target urine output for burn resuscitation:',
          options: ['0.1 mL/kg/hr', '0.5 mL/kg/hr', '2 mL/kg/hr', '5 mL/kg/hr'],
          correct: 1,
          explanation: 'Target 0.5 mL/kg/hr (children), 1 mL/kg/hr (infants <30 kg). Titrate IV rate to achieve this.'
        },
        {
          question: 'If urine output <0.5 mL/kg/hr during burn resuscitation:',
          options: ['Decrease IV rate', 'Increase IV rate by 25%', 'Give diuretics', 'Stop fluids'],
          correct: 1,
          explanation: 'Oliguria = inadequate resuscitation. Increase IV rate by 25%, reassess in 1-2 hours.'
        },
        {
          question: 'Severe burn severity is:',
          options: ['<10% TBSA', '10-20% TBSA', '>20% TBSA partial-thickness OR >5% full-thickness', '>50% TBSA'],
          correct: 2,
          explanation: 'Severe = >20% TBSA (partial-thickness) or >5% (full-thickness).'
        },
        {
          question: 'Red flag for inhalation injury:',
          options: ['Mild cough', 'Singed nasal hairs + soot in mouth/nose', 'Fever only', 'Mild dyspnea'],
          correct: 1,
          explanation: 'Inhalation injury signs: enclosed space fire, singed hairs, soot, hoarseness, stridor, carbonaceous sputum.'
        },
        {
          question: 'Fluid choice for burn resuscitation:',
          options: ['D5W', 'Hypotonic saline', 'Lactated Ringer\'s (LR)', 'Hypertonic saline'],
          correct: 2,
          explanation: 'Lactated Ringer\'s is isotonic, physiologic, and gold standard for burn resuscitation.'
        },
        {
          question: 'Transfer to burn center indicated for:',
          options: ['Minor burns only', 'Partial-thickness >10% TBSA OR full-thickness >5% TBSA', 'Never', 'Only with fever'],
          correct: 1,
          explanation: 'Transfer criteria: >10% partial-thickness, >5% full-thickness, face/hands/perineum burns, inhalation injury, circumferential burns.'
        }
      ]
    }
  },

  {
    id: 'burns-ii',
    title: 'Paediatric Burns II: Advanced Fluid Management and Complications',
    level: 'advanced',
    duration: 60,
    price: 1200,
    prerequisite: 'burns-i',
    description: 'Manage burn complications, optimize fluid resuscitation, and prevent organ failure in low-resource settings.',
    modules: [
      {
        title: 'Module 1: Fluid Resuscitation Optimization',
        duration: 20,
        content: `
          <h2>Advanced Burn Resuscitation</h2>
          ${BURNS_FLUID_ESCHAR}
          ${SPO2_TARGET_NOTE}
          <h3>Parkland Formula Limitations:</h3>
          <ul>
            <li>Overestimates fluid needs in 20-30% of cases</li>
            <li>Can lead to pulmonary edema, compartment syndrome</li>
            <li>Solution: Titrate to urine output (NOT just formula)</li>
          </ul>
          <h3>Modified Resuscitation Strategies:</h3>
          <ul>
            <li><strong>Hypertonic saline (3%):</strong> 250 mL bolus if severe hypernatremia or fluid overload risk</li>
            <li><strong>Colloids (after 24 hours):</strong> Fresh frozen plasma, albumin (NOT in first 24 hours)</li>
            <li><strong>Albumin:</strong> 0.5 g/kg in first 8 hours (if available); then 0.25 g/kg/8h</li>
            <li><strong>Monitor:</strong> Serum sodium, osmolality, fluid balance</li>
          </ul>
          <h3>Urine Output Monitoring:</h3>
          <ul>
            <li>Foley catheter mandatory (accurate output measurement)</li>
            <li>Monitor every 1-2 hours initially</li>
            <li>Adjust IV rate to maintain target output</li>
            <li>Watch for myoglobinuria (dark urine) - indicates rhabdomyolysis</li>
          </ul>
          <h3>Burn Shock Phases:</h3>
          <ul>
            <li><strong>Ebb phase (0-36 hours):</strong> Hypovolemic shock; aggressive fluid resuscitation</li>
            <li><strong>Flow phase (36 hours-weeks):</strong> Hypermetabolic state; high caloric needs, infection risk</li>
          </ul>
          <h3>Fluid Overload Complications:</h3>
          <ul>
            <li>Pulmonary edema (ARDS)</li>
            <li>Compartment syndrome (limbs, abdomen)</li>
            <li>Abdominal compartment syndrome (intra-abdominal hypertension)</li>
            <li>Acute kidney injury (from rhabdomyolysis)</li>
          </ul>
        `,
        questions: [
          {
            question: 'Parkland formula overestimates fluid needs in:',
            options: ['<5% of cases', '20-30% of cases', '>50% of cases', 'Never'],
            correct: 1,
            explanation: 'Parkland overestimates in 20-30% of cases — titrate to urine output.'
          },
          {
            question: 'Urine output target if myoglobinuria present:',
            options: ['0.5 mL/kg/hr', '1 mL/kg/hr', '>1 mL/kg/hr (aggressive)', '0.1 mL/kg/hr'],
            correct: 2,
            explanation: 'Myoglobinuria needs >1 mL/kg/hr to flush myoglobin and prevent AKI.'
          },
          {
            question: 'Burn centre referral is indicated for:',
            options: ['Minor sunburn', 'Partial-thickness >10% TBSA', 'No burns ever', 'Only adults'],
            correct: 1,
            explanation: 'Refer >10% partial-thickness, face/hands, inhalation injury, circumferential burns.'
          }
        ]
      },
      {
        title: 'Module 2: Burn Complications and Management',
        duration: 25,
        content: `
          <h2>Burn Complications</h2>
          ${BURNS_INFECTION}
          <h3>Compartment Syndrome (Limbs):</h3>
          <ul>
            <li>Increased pressure in fascial compartment → tissue ischemia</li>
            <li>Signs: Pain out of proportion, paresthesias, pallor, pulselessness (late)</li>
            <li>Risk: Circumferential burns, aggressive fluid resuscitation</li>
            <li>Treatment: Escharotomy (surgical incision through burned skin to relieve pressure)</li>
          </ul>
          <h3>Abdominal Compartment Syndrome:</h3>
          <ul>
            <li>Intra-abdominal pressure >20 mmHg</li>
            <li>Signs: Abdominal distension, oliguria, elevated peak airway pressures</li>
            <li>Risk: Large TBSA burns, aggressive fluid resuscitation</li>
            <li>Treatment: Reduce IV rate, diuretics; surgical decompression if needed</li>
          </ul>
          <h3>Acute Kidney Injury (AKI):</h3>
          <ul>
            <li>Mechanism: Hypovolemia, myoglobinuria (rhabdomyolysis), sepsis</li>
            <li>Prevention: Aggressive fluid resuscitation, maintain urine output >1 mL/kg/hr if myoglobinuria</li>
            <li>Treatment: Fluid management, alkalinize urine (sodium bicarbonate), dialysis if needed</li>
          </ul>
          <h3>Inhalation Injury Complications:</h3>
          <ul>
            <li>Airway edema (can develop over hours)</li>
            <li>Pulmonary edema (chemical injury to lungs)</li>
            <li>ARDS (acute respiratory distress syndrome)</li>
            <li>Management: Early intubation, lung-protective ventilation, aggressive airway clearance</li>
          </ul>
          <h3>Burn Wound Infection & Sepsis:</h3>
          <ul>
            <li>Leading cause of death in burn patients (>20% TBSA)</li>
            <li>Prevention: Early wound debridement, topical antibiotics (silver sulfadiazine, mafenide), sterile technique</li>
            <li>Signs of infection: Fever, tachycardia, thrombocytopenia, hyperglycemia, wound discoloration</li>
            <li>Treatment: Broad-spectrum antibiotics, aggressive wound care, possible early grafting</li>
          </ul>
        `,
        questions: [
          {
            question: 'Escharotomy is performed for:',
            options: ['Infection only', 'Compartment syndrome (circumferential burns)', 'Pain only', 'Fever'],
            correct: 1,
            explanation: 'Escharotomy relieves compartment pressure from circumferential full-thickness burns.'
          },
          {
            question: 'Compartment syndrome signs include:',
            options: ['Fever only', 'Pain out of proportion + paresthesias', 'Cough', 'Diarrhea'],
            correct: 1,
            explanation: 'Pain out of proportion, paresthesias, pallor — escharotomy if circumferential burn.'
          },
          {
            question: 'Leading cause of death in major burns (>20% TBSA):',
            options: ['Hypovolemia only', 'Infection/sepsis', 'Pain', 'Dehydration only'],
            correct: 1,
            explanation: 'Burn wound infection/sepsis is the leading cause of death in major burns.'
          }
        ]
      },
      {
        title: 'Module 3: Nutritional Support and Long-Term Management',
        duration: 15,
        content: `
          <h2>Burn Nutrition & Rehabilitation</h2>
          ${BURNS_INFECTION}
          <h3>Hypermetabolic State (Flow Phase):</h3>
          <ul>
            <li>Metabolic rate increases 1.5-2× normal</li>
            <li>Caloric requirement: 25 kcal/kg + 40 kcal/%TBSA</li>
            <li>Protein requirement: 1.5-2 g/kg/day (wound healing)</li>
            <li>Route: Enteral (preferred) > parenteral</li>
          </ul>
          <h3>Nutritional Support Strategy:</h3>
          <ul>
            <li>Start feeding within 24-48 hours (reduces infection, maintains gut barrier)</li>
            <li>Nasogastric tube if unable to eat PO</li>
            <li>High-protein, high-calorie diet (eggs, milk, meat, legumes)</li>
            <li>Vitamin supplementation: Vitamin C, zinc (wound healing)</li>
          </ul>
          <h3>Wound Management:</h3>
          <ul>
            <li><strong>Debridement:</strong> Remove dead tissue (eschar) to prevent infection</li>
            <li><strong>Topical antibiotics:</strong> Silver sulfadiazine (broad-spectrum), mafenide (penetrating)</li>
            <li><strong>Dressing changes:</strong> Daily or twice daily with pain control</li>
            <li><strong>Grafting:</strong> Skin grafting for full-thickness burns (after 5-7 days when infection risk lower)</li>
          </ul>
          <h3>Long-Term Complications & Rehabilitation:</h3>
          <ul>
            <li><strong>Hypertrophic scarring:</strong> Thick, raised scars; managed with pressure garments, silicone gel</li>
            <li><strong>Contractures:</strong> Shortened scars limiting movement; prevented with early range-of-motion exercises</li>
            <li><strong>Psychological trauma:</strong> PTSD, depression; counseling and support groups</li>
            <li><strong>Physical rehabilitation:</strong> Occupational therapy, splinting, gradual activity increase</li>
          </ul>
          <h3>Prognosis & Mortality:</h3>
          <ul>
            <li>Mortality increases with TBSA: <20% = low mortality, 20-40% = moderate, >40% = high mortality</li>
            <li>Age <5 or >60 years: higher mortality</li>
            <li>Inhalation injury: increases mortality 3-4×</li>
            <li>Survivors: Many have permanent scarring, functional limitations, psychological effects</li>
          </ul>
        `,
        questions: [
          {
            question: 'Caloric requirement in burn flow phase:',
            options: ['10 kcal/kg', '25 kcal/kg + 40 kcal/%TBSA', '50 kcal/kg', '100 kcal/kg'],
            correct: 1,
            explanation: 'Hypermetabolic state: 25 kcal/kg + 40 kcal/%TBSA.'
          },
          {
            question: 'When to start enteral feeding in burns:',
            options: ['After 1 week', 'Within 24-48 hours', 'Never', 'Only if eating PO'],
            correct: 1,
            explanation: 'Start feeding within 24-48 hours — reduces infection, maintains gut barrier.'
          },
          {
            question: 'Topical antibiotic for burn wounds (broad-spectrum):',
            options: ['Silver sulfadiazine', 'Oral amoxicillin only', 'Topical steroids only', 'No dressings'],
            correct: 0,
            explanation: 'Silver sulfadiazine is common topical prophylaxis for burn wounds.'
          }
        ]
      }
    ],
    quiz: {
      title: 'Burns II Quiz',
      passingScore: 80,
      questions: [
        {
          question: 'Abdominal compartment syndrome is diagnosed when IAP exceeds:',
          options: ['20 mmHg with organ dysfunction', '5 mmHg always', '50 mmHg only in adults', 'No measurement needed'],
          correct: 0,
          explanation: 'IAP >20 mmHg with distension and oliguria defines abdominal compartment syndrome in burns.'
        },
        {
          question: 'Burn shock ebb phase typically lasts:',
          options: ['0–36 hours', '1–2 weeks', '6 months', 'No ebb phase exists'],
          correct: 0,
          explanation: 'Ebb phase (0–36 h): hypovolaemic shock requiring aggressive resuscitation.'
        },
        {
          question: 'Protein requirement in major burn patients is:',
          options: ['1.5–2 g/kg/day', '0.5 g/kg/day', '5 g/kg/day', 'No protein needed'],
          correct: 0,
          explanation: '1.5–2 g/kg/day supports wound healing in hypermetabolic flow phase.'
        },
        {
          question: 'Topical mafenide is preferred over silver sulfadiazine when:',
          options: ['Deep/eschar penetration is needed', 'Superficial sunburn only', 'No wound care required', 'Oral antibiotics sufficient'],
          correct: 0,
          explanation: 'Mafenide penetrates eschar; silver sulfadiazine is broad-spectrum surface prophylaxis.'
        },
        {
          question: 'Inhalation injury increases burn mortality by approximately:',
          options: ['3–4×', 'No increase', '10% only', 'Only in adults'],
          correct: 0,
          explanation: 'Inhalation injury increases mortality 3–4× — early airway assessment and intubation if needed.'
        },
        {
          question: 'Compartment syndrome signs:',
          options: ['Fever only', 'Pain out of proportion + paresthesias + pallor', 'Cough only', 'Diarrhea'],
          correct: 1,
          explanation: 'Compartment syndrome: pain out of proportion, paresthesias, pallor, pulselessness (late).'
        },
        {
          question: 'Abdominal compartment syndrome diagnosis:',
          options: ['Fever only', 'Intra-abdominal pressure >20 mmHg + abdominal distension + oliguria', 'Cough', 'Diarrhea'],
          correct: 1,
          explanation: 'Abdominal compartment syndrome: IAP >20 mmHg, distension, oliguria, elevated airway pressures.'
        },
        {
          question: 'Burn wound sepsis may present with:',
          options: ['Fever, thrombocytopenia, hyperglycaemia, graft discolouration', 'Improved appetite only', 'Normal WBC always', 'No treatment change'],
          correct: 0,
          explanation: 'Sepsis is leading cause of death in major burns — surgical and antibiotic review.'
        },
        {
          question: 'Contracture prevention after burns includes:',
          options: ['Physiotherapy and splinting in functional positions', 'Immobilisation in flexion always', 'No rehab', 'Discharge without follow-up'],
          correct: 0,
          explanation: 'Rehabilitation prevents long-term contractures and functional limitation.'
        },
        {
          question: 'Colloid use in burn resuscitation after first 24 hours may include:',
          options: ['Albumin or FFP per burn centre protocol when indicated', 'Hypotonic dextrose only', 'No colloid ever in children', 'Oral fluids alone'],
          correct: 0,
          explanation: 'Colloids may be used after 24 h in selected major burns — titrate to endpoints.'
        },
        {
          question: 'Rhabdomyolysis complicating major burns requires urine output:',
          options: ['>1 mL/kg/hr to flush myoglobin', '0.1 mL/kg/hr acceptable', 'Anuria is normal', 'No Foley needed'],
          correct: 0,
          explanation: 'Aggressive urine output targets reduce myoglobinuric AKI risk.'
        },
        {
          question: 'Early enteral nutrition in major burns should start:',
          options: ['Within 24–48 hours when gut viable', 'After 2 weeks only', 'Never via NG tube', 'Only after grafting complete'],
          correct: 0,
          explanation: 'Early enteral feeding reduces infection and supports hypermetabolic recovery.'
        }
      ]
    }
  }
];

export default microCoursesBurns;
