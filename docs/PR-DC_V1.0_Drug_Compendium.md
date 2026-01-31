# Paeds Resus Drug Compendium (PR-DC) Version 1.0

**Document Type:** Clinical Reference — Single Source of Truth  
**Version:** PR-DC-V1.0  
**Effective Date:** January 31, 2026  
**Evidence Base:** AHA PALS 2025, WHO ETAT+, WHO Essential Medicines List 2023  
**Review Cycle:** Annual or upon major guideline update

---

## Document Purpose

This compendium provides executable drug objects for pediatric emergency care in low- and middle-income country (LMIC) settings. Each drug entry follows the 12-point PR-DC standard established in the System DNA V6.0, ensuring that providers have complete, immediately actionable information at the bedside.

**Critical Principle:** No calculation should be performed by the provider. All doses are pre-calculated based on weight. The system displays the exact volume to draw up and administer.

---

## Weight Estimation Protocol

When actual weight is unknown, use the following hierarchy:

| Method | Formula/Tool | Age Range | Accuracy |
|--------|--------------|-----------|----------|
| **Primary** | Broselow Tape | All ages | ±10% |
| **Secondary** | (Age in years + 4) × 2 | 1-10 years | ±15% |
| **Tertiary** | Weight (kg) = 3 × Age (months) + 4 | 0-12 months | ±20% |

**Safety Rule:** When estimated weight exceeds 40kg, cap all weight-based calculations at 40kg unless specifically indicated otherwise. Adult max doses apply.

---

## Section 1: Cardiac Arrest & Shock Drugs

### 1.1 EPINEPHRINE — Cardiac Arrest (IV/IO)

**PR-DC ID:** PR-DC-EPI-CA-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Epinephrine |
| **Common Name** | Adrenaline |
| **WHO Essential** | Yes |
| **Clinical Persona** | Cardiac Arrest — IV/IO Push |

**Indication & Rationale:** First-line vasopressor for pediatric cardiac arrest (asystole, PEA, refractory VF/pVT). Increases coronary perfusion pressure during CPR through alpha-adrenergic vasoconstriction.

**Dosing:**

| Weight (kg) | Dose (mg) | Volume of 0.1 mg/mL (1:10,000) | Max Dose |
|-------------|-----------|--------------------------------|----------|
| 3 | 0.03 | 0.3 mL | — |
| 5 | 0.05 | 0.5 mL | — |
| 10 | 0.1 | 1 mL | — |
| 15 | 0.15 | 1.5 mL | — |
| 20 | 0.2 | 2 mL | — |
| 25 | 0.25 | 2.5 mL | — |
| 30 | 0.3 | 3 mL | — |
| 40+ | 0.4 | 4 mL | 1 mg |

**Formula:** 0.01 mg/kg IV/IO every 3-5 minutes

**Stock Vial Concentration:** 1 mg/mL (1:1000) — MUST BE DILUTED

**Reconstitution Steps:**
1. Draw 1 mL of 1:1000 epinephrine (1 mg)
2. Add to 9 mL normal saline
3. Final concentration: 0.1 mg/mL (1:10,000)
4. Label syringe: "EPINEPHRINE 0.1 mg/mL — IV/IO ONLY"

**Route Guidance:** IV or IO only. Flush with 5 mL normal saline after each dose.

**Monitoring Requirements:**
- Continuous cardiac rhythm monitoring
- Pulse check every 2 minutes
- ETCO2 if available (target >10 mmHg during CPR)

**Contraindications & Cautions:**
- No absolute contraindications in cardiac arrest
- Caution: Ensure correct concentration (1:10,000, not 1:1000)

**Failure Escalation Logic:**
- If no ROSC after 3 doses: Consider reversible causes (Hs and Ts)
- If VF/pVT: Add amiodarone after 2nd defibrillation
- Call for expert help if not already done

**Reassessment Timer:** Every 3-5 minutes (with rhythm check)

**LMIC Availability:** Tier 1 — Available in most facilities. Alternative: None for cardiac arrest.

---

### 1.2 EPINEPHRINE — Anaphylaxis (IM)

**PR-DC ID:** PR-DC-EPI-ANA-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Epinephrine |
| **Common Name** | Adrenaline |
| **WHO Essential** | Yes |
| **Clinical Persona** | Anaphylaxis — IM |

**Indication & Rationale:** First-line treatment for anaphylaxis. Reverses bronchospasm, reduces mucosal edema, increases blood pressure through alpha and beta effects.

**Dosing:**

| Weight (kg) | Dose (mg) | Volume of 1 mg/mL (1:1000) | Max Dose |
|-------------|-----------|----------------------------|----------|
| 5 | 0.05 | 0.05 mL | — |
| 10 | 0.1 | 0.1 mL | — |
| 15 | 0.15 | 0.15 mL | — |
| 20 | 0.2 | 0.2 mL | — |
| 25 | 0.25 | 0.25 mL | — |
| 30 | 0.3 | 0.3 mL | — |
| 40+ | 0.4 | 0.4 mL | 0.5 mg |

**Formula:** 0.01 mg/kg IM (use 1:1000 concentration)

**Stock Vial Concentration:** 1 mg/mL (1:1000) — USE UNDILUTED

**Route Guidance:** 
- **Site:** Anterolateral thigh (vastus lateralis)
- **Technique:** 90-degree angle, deep IM injection
- **NEVER IV** at this concentration

**Monitoring Requirements:**
- Vital signs every 5 minutes
- Respiratory status
- Skin/mucosal changes
- Watch for biphasic reaction (4-12 hours)

**Contraindications & Cautions:**
- No absolute contraindications in anaphylaxis
- Relative: Elderly, cardiovascular disease (still give if anaphylaxis)

**Failure Escalation Logic:**
- If no improvement in 5-15 minutes: Repeat IM dose
- If still no improvement after 2 doses: Consider IV epinephrine infusion
- Maximum 3 IM doses before escalating to infusion
- Call for expert help

**Reassessment Timer:** 5 minutes after each dose

**LMIC Availability:** Tier 1 — Available in most facilities.

---

### 1.3 EPINEPHRINE — Continuous Infusion (Shock)

**PR-DC ID:** PR-DC-EPI-INF-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Epinephrine |
| **Common Name** | Adrenaline |
| **WHO Essential** | Yes |
| **Clinical Persona** | Shock — Continuous Infusion |

**Indication & Rationale:** Second-line vasopressor for fluid-refractory septic shock, cardiogenic shock, or post-cardiac arrest hypotension. Provides sustained alpha and beta effects.

**Dosing:**

| Starting Rate | Titration Range | Max Rate |
|---------------|-----------------|----------|
| 0.1 mcg/kg/min | 0.1-1 mcg/kg/min | 1 mcg/kg/min |

**Standard Infusion Preparation:**

| Patient Weight | Epinephrine (mg) | Diluent (mL) | Final Volume | Concentration | Rate for 0.1 mcg/kg/min |
|----------------|------------------|--------------|--------------|---------------|-------------------------|
| 5 kg | 0.3 mg | 50 mL | 50 mL | 6 mcg/mL | 5 mL/hr |
| 10 kg | 0.6 mg | 50 mL | 50 mL | 12 mcg/mL | 5 mL/hr |
| 20 kg | 1.2 mg | 50 mL | 50 mL | 24 mcg/mL | 5 mL/hr |
| 30 kg | 1.8 mg | 50 mL | 50 mL | 36 mcg/mL | 5 mL/hr |

**Reconstitution Steps:**
1. Calculate mg needed: (Weight in kg × 0.6) ÷ 10 = mg to add
2. Draw calculated amount from 1 mg/mL vial
3. Add to 50 mL D5W or NS
4. Label: "EPINEPHRINE [concentration] mcg/mL"

**Route Guidance:** 
- Central line preferred
- Peripheral IV acceptable in emergency (monitor for extravasation)
- Dedicated line (no other infusions)

**Monitoring Requirements:**
- Continuous cardiac monitoring
- Arterial BP if available
- Urine output hourly
- Lactate every 2-4 hours
- Extremity perfusion (watch for ischemia)

**Contraindications & Cautions:**
- Caution in tachyarrhythmias
- Monitor for tissue ischemia at high doses
- Avoid abrupt discontinuation (wean gradually)

**Failure Escalation Logic:**
- If max dose reached without adequate response: Add norepinephrine
- Consider hydrocortisone for refractory shock
- Reassess volume status

**Reassessment Timer:** Every 15 minutes during titration, hourly once stable

**LMIC Availability:** Tier 1 — Available. Requires infusion pump or careful manual titration.

---

### 1.4 NOREPINEPHRINE — Septic Shock Infusion

**PR-DC ID:** PR-DC-NOR-INF-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Norepinephrine |
| **Common Name** | Noradrenaline, Levophed |
| **WHO Essential** | Yes |
| **Clinical Persona** | Septic Shock — Continuous Infusion |

**Indication & Rationale:** First-line vasopressor for fluid-refractory warm septic shock (vasodilatory). Potent alpha-1 effect increases SVR; minimal beta effect preserves cardiac output.

**Dosing:**

| Starting Rate | Titration Range | Max Rate |
|---------------|-----------------|----------|
| 0.1 mcg/kg/min | 0.1-2 mcg/kg/min | 2 mcg/kg/min |

**Standard Infusion Preparation:**

| Patient Weight | Norepinephrine (mg) | Diluent (mL) | Final Volume | Concentration | Rate for 0.1 mcg/kg/min |
|----------------|---------------------|--------------|--------------|---------------|-------------------------|
| 5 kg | 0.6 mg | 50 mL | 50 mL | 12 mcg/mL | 2.5 mL/hr |
| 10 kg | 1.2 mg | 50 mL | 50 mL | 24 mcg/mL | 2.5 mL/hr |
| 20 kg | 2.4 mg | 50 mL | 50 mL | 48 mcg/mL | 2.5 mL/hr |
| 30 kg | 3.6 mg | 50 mL | 50 mL | 72 mcg/mL | 2.5 mL/hr |

**Stock Vial Concentration:** 1 mg/mL or 4 mg/4mL

**Route Guidance:** 
- **Central line STRONGLY preferred**
- Peripheral extravasation causes severe tissue necrosis
- If peripheral: Use large vein, monitor continuously

**Monitoring Requirements:**
- Continuous cardiac monitoring
- Arterial line recommended
- Urine output hourly
- Extremity perfusion (digital ischemia risk)

**Contraindications & Cautions:**
- Avoid in hypovolemia (correct volume first)
- Caution in mesenteric ischemia
- Extravasation antidote: Phentolamine 5-10 mg in 10 mL NS, infiltrate locally

**Failure Escalation Logic:**
- If max dose reached: Add vasopressin 0.0003-0.002 units/kg/min
- Consider hydrocortisone 2 mg/kg if refractory
- Reassess for uncontrolled infection source

**LMIC Availability:** Tier 2 — Available in referral hospitals. Alternative: Dopamine or epinephrine.

---

### 1.5 DOPAMINE — Shock Infusion

**PR-DC ID:** PR-DC-DOP-INF-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Dopamine |
| **WHO Essential** | Yes |
| **Clinical Persona** | Shock — Continuous Infusion |

**Indication & Rationale:** Alternative vasopressor when norepinephrine unavailable. Dose-dependent effects: low dose (renal), medium (inotropic), high (vasopressor).

**Dosing:**

| Effect | Dose Range | Target |
|--------|------------|--------|
| Inotropic | 5-10 mcg/kg/min | Cardiac output |
| Vasopressor | 10-20 mcg/kg/min | Blood pressure |

**Standard Infusion Preparation (Rule of 6):**

| Patient Weight | Dopamine (mg) | Diluent (mL) | Final Volume | Rate for 5 mcg/kg/min |
|----------------|---------------|--------------|--------------|----------------------|
| 5 kg | 30 mg | 50 mL | 50 mL | 2.5 mL/hr |
| 10 kg | 60 mg | 50 mL | 50 mL | 2.5 mL/hr |
| 20 kg | 120 mg | 50 mL | 50 mL | 2.5 mL/hr |
| 30 kg | 180 mg | 50 mL | 50 mL | 2.5 mL/hr |

**Formula (Rule of 6):** Weight (kg) × 6 = mg to add to 100 mL. Then 1 mL/hr = 1 mcg/kg/min.

**Stock Vial Concentration:** 40 mg/mL (200 mg/5 mL) or 80 mg/mL

**Route Guidance:** 
- Central line preferred
- Peripheral acceptable short-term
- Extravasation treatment: Phentolamine

**Monitoring Requirements:**
- Continuous cardiac monitoring (arrhythmia risk)
- Blood pressure every 5 minutes during titration
- Urine output

**Contraindications & Cautions:**
- Avoid in pheochromocytoma
- Caution in tachyarrhythmias
- More arrhythmogenic than norepinephrine

**Failure Escalation Logic:**
- If inadequate response at 20 mcg/kg/min: Switch to norepinephrine or epinephrine
- Do not exceed 20 mcg/kg/min

**LMIC Availability:** Tier 1 — Widely available. Often first-line due to availability.

---

## Section 2: Arrhythmia Drugs

### 2.1 ADENOSINE — SVT

**PR-DC ID:** PR-DC-ADN-SVT-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Adenosine |
| **WHO Essential** | Yes |
| **Clinical Persona** | SVT — Rapid IV Push |

**Indication & Rationale:** First-line pharmacologic treatment for stable SVT after vagal maneuvers fail. Causes transient AV nodal block, terminating re-entrant tachycardias.

**Dosing:**

| Dose | Weight-Based | Max Dose | Timing |
|------|--------------|----------|--------|
| 1st | 0.1 mg/kg | 6 mg | Rapid push |
| 2nd | 0.2 mg/kg | 12 mg | If no response |
| 3rd | 0.2 mg/kg | 12 mg | If no response |

**Weight-Based Dosing Table:**

| Weight (kg) | 1st Dose (mg) | 1st Dose Volume (3 mg/mL) | 2nd/3rd Dose (mg) | 2nd/3rd Volume |
|-------------|---------------|---------------------------|-------------------|----------------|
| 5 | 0.5 | 0.17 mL | 1 | 0.33 mL |
| 10 | 1 | 0.33 mL | 2 | 0.67 mL |
| 15 | 1.5 | 0.5 mL | 3 | 1 mL |
| 20 | 2 | 0.67 mL | 4 | 1.33 mL |
| 30 | 3 | 1 mL | 6 | 2 mL |
| 40+ | 4 | 1.33 mL | 8 | 2.67 mL |
| Adult | 6 | 2 mL | 12 | 4 mL |

**Stock Vial Concentration:** 3 mg/mL (6 mg/2 mL)

**Route Guidance:** 
- **Rapid IV push** (1-2 seconds) via large proximal vein
- Immediately follow with 5-10 mL rapid NS flush
- Use stopcock technique for simultaneous push
- **Half-life: 10 seconds** — must be given fast

**Monitoring Requirements:**
- Continuous ECG during administration
- Record rhythm strip
- Have defibrillator ready
- Warn patient: "You may feel chest tightness and flushing — this is normal and brief"

**Contraindications & Cautions:**
- **Contraindicated:** Wide-complex tachycardia of unknown origin, WPW with AF
- **Caution:** Asthma (may trigger bronchospasm), heart transplant (use lower dose)
- **Drug interaction:** Theophylline antagonizes effect; dipyridamole potentiates

**Failure Escalation Logic:**
- If 3 doses fail: Consider synchronized cardioversion
- If unstable at any point: Immediate cardioversion
- Consult cardiology if available

**Reassessment Timer:** Immediate (effect within 10-20 seconds)

**LMIC Availability:** Tier 2 — Available in referral hospitals. Requires cold chain. Alternative: Verapamil (with extreme caution in children).

---

### 2.2 AMIODARONE — VF/pVT

**PR-DC ID:** PR-DC-AMI-ARR-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Amiodarone |
| **WHO Essential** | Yes |
| **Clinical Persona** | Refractory VF/pVT — IV Push |

**Indication & Rationale:** Antiarrhythmic for shock-refractory VF or pulseless VT. Class III agent that prolongs action potential and refractory period.

**Dosing:**

| Dose | Amount | Max Single Dose | Max Total |
|------|--------|-----------------|-----------|
| 1st | 5 mg/kg | 300 mg | — |
| 2nd | 5 mg/kg | 300 mg | — |
| 3rd | 5 mg/kg | 300 mg | 15 mg/kg |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose (mg) | Volume of 50 mg/mL |
|-------------|-----------|-------------------|
| 5 | 25 | 0.5 mL |
| 10 | 50 | 1 mL |
| 15 | 75 | 1.5 mL |
| 20 | 100 | 2 mL |
| 30 | 150 | 3 mL |
| 40 | 200 | 4 mL |
| 60+ | 300 | 6 mL |

**Stock Vial Concentration:** 50 mg/mL (150 mg/3 mL)

**Reconstitution:** May be given undiluted for cardiac arrest. For non-arrest, dilute in D5W.

**Route Guidance:** 
- IV/IO push during cardiac arrest
- For stable arrhythmias: Infuse over 20-60 minutes

**Monitoring Requirements:**
- Continuous ECG
- Blood pressure (hypotension common)
- QTc prolongation

**Contraindications & Cautions:**
- Caution: Pre-existing QT prolongation
- Hypotension during infusion (slow rate)
- Thyroid dysfunction with chronic use

**Failure Escalation Logic:**
- If 3 doses given without ROSC: Continue CPR, address reversible causes
- Consider ECMO if available
- Lidocaine as alternative if amiodarone unavailable

**LMIC Availability:** Tier 2 — Available in referral hospitals. Alternative: Lidocaine 1 mg/kg.

---

## Section 3: Seizure Drugs

### 3.1 MIDAZOLAM — Status Epilepticus (IM/IN/Buccal)

**PR-DC ID:** PR-DC-MDZ-SEI-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Midazolam |
| **WHO Essential** | Yes |
| **Clinical Persona** | Status Epilepticus — IM/IN/Buccal |

**Indication & Rationale:** First-line benzodiazepine for seizures when IV access unavailable. Rapid absorption via IM, intranasal, or buccal routes.

**Dosing:**

| Route | Dose | Max Dose |
|-------|------|----------|
| IM | 0.2 mg/kg | 10 mg |
| Intranasal | 0.2 mg/kg | 10 mg |
| Buccal | 0.5 mg/kg | 10 mg |
| IV | 0.1 mg/kg | 5 mg |

**Weight-Based Dosing Table (IM/IN):**

| Weight (kg) | Dose (mg) | Volume of 5 mg/mL |
|-------------|-----------|-------------------|
| 5 | 1 | 0.2 mL |
| 10 | 2 | 0.4 mL |
| 15 | 3 | 0.6 mL |
| 20 | 4 | 0.8 mL |
| 25 | 5 | 1 mL |
| 30 | 6 | 1.2 mL |
| 40 | 8 | 1.6 mL |
| 50+ | 10 | 2 mL |

**Stock Vial Concentration:** 5 mg/mL (most common) or 1 mg/mL

**Route Guidance:**
- **IM:** Anterolateral thigh or deltoid
- **Intranasal:** Use atomizer device, split dose between nostrils
- **Buccal:** Apply between cheek and gum
- **IV:** Slow push over 2-3 minutes

**Monitoring Requirements:**
- Respiratory status (apnea risk)
- Oxygen saturation
- Seizure cessation
- Level of consciousness

**Contraindications & Cautions:**
- Have bag-valve-mask ready (respiratory depression)
- Caution in respiratory compromise
- Flumazenil available for reversal if needed

**Failure Escalation Logic:**
- If seizure continues after 5 minutes: Give second dose
- If seizure continues after 2 doses: Proceed to levetiracetam or phenytoin
- Maximum 2 doses of benzodiazepine before second-line agent

**Reassessment Timer:** 5 minutes after each dose

**LMIC Availability:** Tier 1 — Widely available. Preferred over diazepam for non-IV routes.

---

### 3.2 LORAZEPAM — Status Epilepticus (IV)

**PR-DC ID:** PR-DC-LOR-SEI-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Lorazepam |
| **WHO Essential** | Yes |
| **Clinical Persona** | Status Epilepticus — IV |

**Indication & Rationale:** First-line IV benzodiazepine for status epilepticus. Longer duration of action than diazepam, less redistribution.

**Dosing:**

| Route | Dose | Max Single Dose | May Repeat |
|-------|------|-----------------|------------|
| IV | 0.1 mg/kg | 4 mg | Once after 5 min |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose (mg) | Volume of 2 mg/mL |
|-------------|-----------|-------------------|
| 5 | 0.5 | 0.25 mL |
| 10 | 1 | 0.5 mL |
| 20 | 2 | 1 mL |
| 30 | 3 | 1.5 mL |
| 40+ | 4 | 2 mL |

**Stock Vial Concentration:** 2 mg/mL or 4 mg/mL

**Route Guidance:** 
- IV slow push over 2-5 minutes
- May dilute with equal volume NS
- Refrigerate — unstable at room temperature

**Monitoring Requirements:**
- Respiratory status
- Blood pressure
- Seizure cessation
- Time of administration

**Contraindications & Cautions:**
- Respiratory depression risk
- Hypotension with rapid administration
- Requires refrigeration (LMIC limitation)

**Failure Escalation Logic:**
- If seizure continues 5 minutes after first dose: Give second dose
- If seizure continues after 2 doses: Levetiracetam 40-60 mg/kg IV
- If still seizing: Phenytoin/fosphenytoin or phenobarbital

**LMIC Availability:** Tier 2 — Requires cold chain. Alternative: Diazepam IV.

---

### 3.3 LEVETIRACETAM — Refractory Seizures

**PR-DC ID:** PR-DC-LEV-SEI-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Levetiracetam |
| **Common Name** | Keppra |
| **WHO Essential** | Yes |
| **Clinical Persona** | Refractory Status Epilepticus — IV |

**Indication & Rationale:** Second-line agent for benzodiazepine-refractory status epilepticus. Favorable safety profile, no cardiac monitoring required.

**Dosing:**

| Indication | Dose | Max Dose | Infusion Time |
|------------|------|----------|---------------|
| Status epilepticus | 40-60 mg/kg | 3000 mg | Over 15 minutes |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose at 60 mg/kg | Volume of 100 mg/mL |
|-------------|------------------|---------------------|
| 5 | 300 mg | 3 mL |
| 10 | 600 mg | 6 mL |
| 20 | 1200 mg | 12 mL |
| 30 | 1800 mg | 18 mL |
| 40 | 2400 mg | 24 mL |
| 50+ | 3000 mg | 30 mL |

**Stock Vial Concentration:** 100 mg/mL (500 mg/5 mL)

**Reconstitution:** Dilute dose in 100 mL NS or D5W

**Route Guidance:** IV infusion over 15 minutes

**Monitoring Requirements:**
- Seizure activity
- No cardiac monitoring required (advantage over phenytoin)
- Renal function for maintenance dosing

**Contraindications & Cautions:**
- Adjust dose in renal impairment
- Behavioral side effects possible
- Generally well-tolerated

**Failure Escalation Logic:**
- If seizure continues: Proceed to phenytoin or phenobarbital
- Consider RSI and propofol/midazolam infusion for refractory status

**LMIC Availability:** Tier 2 — Increasingly available. Preferred over phenytoin due to safety profile.

---

## Section 4: Respiratory Drugs

### 4.1 SALBUTAMOL — Acute Asthma (Nebulized)

**PR-DC ID:** PR-DC-SAL-AST-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Salbutamol |
| **Common Name** | Albuterol |
| **WHO Essential** | Yes |
| **Clinical Persona** | Acute Asthma — Nebulized |

**Indication & Rationale:** First-line bronchodilator for acute asthma and bronchospasm. Beta-2 agonist causing bronchial smooth muscle relaxation.

**Dosing:**

| Severity | Dose | Frequency |
|----------|------|-----------|
| Mild-Moderate | 2.5 mg | Every 20 min × 3, then hourly |
| Severe | 5 mg | Continuous or every 20 min |
| Life-threatening | 5 mg | Continuous nebulization |

**Age-Based Dosing:**

| Age | Dose | Nebulizer Solution |
|-----|------|-------------------|
| < 5 years | 2.5 mg | 2.5 mg/2.5 mL unit dose |
| ≥ 5 years | 5 mg | 5 mg/2.5 mL or 2 × 2.5 mg |

**Stock Concentration:** 2.5 mg/2.5 mL or 5 mg/2.5 mL unit doses; 5 mg/mL solution

**Route Guidance:**
- Nebulizer with oxygen 6-8 L/min
- MDI with spacer: 4-8 puffs (100 mcg/puff) equivalent to 2.5 mg nebulized

**Monitoring Requirements:**
- Respiratory rate and effort
- Oxygen saturation
- Heart rate (tachycardia expected)
- Peak flow if cooperative

**Contraindications & Cautions:**
- Tachycardia and tremor are expected
- Hypokalemia with repeated doses
- Paradoxical bronchospasm (rare)

**Failure Escalation Logic:**
- If no improvement after 3 doses: Add ipratropium
- If still severe: IV magnesium sulfate
- If life-threatening: Consider IV salbutamol, aminophylline, or intubation

**Reassessment Timer:** 20 minutes after each dose

**LMIC Availability:** Tier 1 — Universally available.

---

### 4.2 MAGNESIUM SULFATE — Severe Asthma (IV)

**PR-DC ID:** PR-DC-MGS-AST-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Magnesium Sulfate |
| **WHO Essential** | Yes |
| **Clinical Persona** | Severe/Life-Threatening Asthma — IV |

**Indication & Rationale:** Adjunct bronchodilator for severe asthma unresponsive to beta-agonists. Causes bronchial smooth muscle relaxation via calcium channel antagonism.

**Dosing:**

| Indication | Dose | Max Dose | Infusion Time |
|------------|------|----------|---------------|
| Severe asthma | 25-50 mg/kg | 2000 mg | Over 20 minutes |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose at 40 mg/kg | Volume of 500 mg/mL |
|-------------|------------------|---------------------|
| 10 | 400 mg | 0.8 mL |
| 15 | 600 mg | 1.2 mL |
| 20 | 800 mg | 1.6 mL |
| 30 | 1200 mg | 2.4 mL |
| 40 | 1600 mg | 3.2 mL |
| 50+ | 2000 mg | 4 mL |

**Stock Vial Concentration:** 500 mg/mL (50%) — MUST DILUTE

**Reconstitution:** Dilute calculated dose in 50-100 mL NS

**Route Guidance:** IV infusion over 20 minutes. Faster rates cause hypotension.

**Monitoring Requirements:**
- Blood pressure (hypotension risk)
- Respiratory status
- Deep tendon reflexes (loss = toxicity)
- Heart rate

**Contraindications & Cautions:**
- Avoid in renal failure
- Hypotension with rapid infusion
- Respiratory depression at toxic levels
- Antidote: Calcium gluconate 100 mg/kg IV

**Failure Escalation Logic:**
- If no improvement: Consider aminophylline or IV salbutamol
- If deteriorating: Prepare for intubation
- Single dose therapy — do not repeat routinely

**LMIC Availability:** Tier 1 — Widely available (also used for eclampsia).

---

## Section 5: Sepsis & Infection Drugs

### 5.1 CEFTRIAXONE — Empiric Sepsis

**PR-DC ID:** PR-DC-CTX-SEP-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Ceftriaxone |
| **WHO Essential** | Yes |
| **Clinical Persona** | Empiric Sepsis — IV |

**Indication & Rationale:** First-line empiric antibiotic for suspected bacterial sepsis. Third-generation cephalosporin with broad gram-positive and gram-negative coverage.

**Dosing:**

| Indication | Dose | Frequency | Max Daily Dose |
|------------|------|-----------|----------------|
| Sepsis | 50-100 mg/kg | Once daily | 4000 mg |
| Meningitis | 100 mg/kg | Once daily or divided BID | 4000 mg |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose at 80 mg/kg | Reconstituted Volume |
|-------------|------------------|---------------------|
| 5 | 400 mg | 4 mL |
| 10 | 800 mg | 8 mL |
| 15 | 1200 mg | 12 mL |
| 20 | 1600 mg | 16 mL |
| 30 | 2400 mg | 24 mL |
| 40+ | 3200 mg | 32 mL |

**Stock Vial:** 1 g or 2 g powder for reconstitution

**Reconstitution:**
1. Add 10 mL sterile water to 1 g vial → 100 mg/mL
2. May further dilute in 50-100 mL NS for infusion

**Route Guidance:** 
- IV over 30 minutes (infusion) or 2-4 minutes (slow push)
- IM acceptable if IV not available

**Monitoring Requirements:**
- Clinical response
- Temperature curve
- WBC trend
- Source control

**Contraindications & Cautions:**
- **NEVER mix with calcium-containing solutions** (fatal precipitation)
- Avoid in neonates receiving calcium
- Biliary sludging with prolonged use
- Adjust in severe renal impairment

**Failure Escalation Logic:**
- If no improvement in 48-72 hours: Broaden coverage
- Consider adding vancomycin if MRSA suspected
- Consider meropenem if ESBL suspected

**LMIC Availability:** Tier 1 — Widely available. First-line for empiric sepsis.

---

## Section 6: Metabolic Drugs

### 6.1 DEXTROSE 10% — Hypoglycemia

**PR-DC ID:** PR-DC-D10-HYP-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Dextrose 10% |
| **WHO Essential** | Yes |
| **Clinical Persona** | Hypoglycemia — IV Bolus |

**Indication & Rationale:** Treatment of symptomatic hypoglycemia (glucose <60 mg/dL or <3.3 mmol/L in children, <45 mg/dL or <2.5 mmol/L in neonates).

**Dosing:**

| Age Group | Dose | Concentration | Volume |
|-----------|------|---------------|--------|
| Neonate | 2 mL/kg | D10W | 2 mL/kg |
| Infant/Child | 2-5 mL/kg | D10W | 2-5 mL/kg |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose (mL of D10W) | Glucose Delivered |
|-------------|-------------------|-------------------|
| 3 | 6-15 mL | 0.6-1.5 g |
| 5 | 10-25 mL | 1-2.5 g |
| 10 | 20-50 mL | 2-5 g |
| 20 | 40-100 mL | 4-10 g |
| 30 | 60-150 mL | 6-15 g |

**Stock Concentration:** D10W (10% dextrose = 100 mg/mL)

**Preparation if D10W unavailable:**
- Mix 10 mL D50W + 40 mL sterile water = 50 mL D10W
- Or: 20 mL D25W + 30 mL sterile water = 50 mL D10W

**Route Guidance:**
- IV bolus over 5-10 minutes
- **NEVER give D25W or D50W undiluted to children** (osmotic injury, phlebitis)
- Follow with D10W maintenance infusion

**Monitoring Requirements:**
- Repeat glucose in 15-30 minutes
- Continuous glucose monitoring if available
- Identify and treat underlying cause

**Contraindications & Cautions:**
- Avoid hypertonic dextrose (D25W, D50W) in children
- Rebound hypoglycemia possible
- Hyperglycemia with excessive dosing

**Failure Escalation Logic:**
- If glucose remains low: Repeat bolus
- If recurrent: Start D10W infusion at 5-8 mg/kg/min
- If refractory: Consider glucagon, hydrocortisone, or octreotide

**LMIC Availability:** Tier 1 — Universally available.

---

## Section 7: Anaphylaxis Adjuncts

### 7.1 HYDROCORTISONE — Anaphylaxis (IV)

**PR-DC ID:** PR-DC-HYD-ANA-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Hydrocortisone |
| **WHO Essential** | Yes |
| **Clinical Persona** | Anaphylaxis Adjunct — IV |

**Indication & Rationale:** Adjunct therapy for anaphylaxis to prevent biphasic reactions. NOT first-line — epinephrine is always first.

**Dosing:**

| Indication | Dose | Max Dose | Frequency |
|------------|------|----------|-----------|
| Anaphylaxis | 4 mg/kg | 200 mg | Single dose |

**Weight-Based Dosing Table:**

| Weight (kg) | Dose (mg) | Volume of 50 mg/mL |
|-------------|-----------|-------------------|
| 5 | 20 | 0.4 mL |
| 10 | 40 | 0.8 mL |
| 15 | 60 | 1.2 mL |
| 20 | 80 | 1.6 mL |
| 30 | 120 | 2.4 mL |
| 40 | 160 | 3.2 mL |
| 50+ | 200 | 4 mL |

**Stock Vial:** 100 mg powder — reconstitute with 2 mL sterile water = 50 mg/mL

**Route Guidance:** IV slow push or IM if no IV access

**Monitoring Requirements:**
- Observe for biphasic reaction (4-12 hours)
- Blood glucose (hyperglycemia)

**Contraindications & Cautions:**
- Do not delay epinephrine for steroids
- Single dose — no taper needed for anaphylaxis

**LMIC Availability:** Tier 1 — Widely available.

---

## Section 8: Toxicology Drugs

### 8.1 NALOXONE — Opioid Overdose

**PR-DC ID:** PR-DC-NAL-OPI-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Naloxone |
| **Common Name** | Narcan |
| **WHO Essential** | Yes |
| **Clinical Persona** | Opioid Overdose — IV/IM/IN |

**Indication & Rationale:** Opioid antagonist for reversal of respiratory depression from opioid overdose or iatrogenic opioid toxicity.

**Dosing:**

| Indication | Route | Dose | May Repeat |
|------------|-------|------|------------|
| Full reversal | IV/IM/IN | 0.1 mg/kg | Every 2-3 min |
| Partial reversal | IV | 0.01 mg/kg | Titrate to effect |

**Weight-Based Dosing Table (Full Reversal):**

| Weight (kg) | Dose (mg) | Volume of 0.4 mg/mL |
|-------------|-----------|---------------------|
| 5 | 0.5 | 1.25 mL |
| 10 | 1 | 2.5 mL |
| 20 | 2 | 5 mL |
| 40+ | 4 | 10 mL |

**Stock Vial Concentration:** 0.4 mg/mL or 1 mg/mL

**Route Guidance:**
- IV preferred (fastest onset)
- IM or IN if no IV access
- Intranasal: Use atomizer, 2 mg per nostril

**Monitoring Requirements:**
- Respiratory rate and effort
- Level of consciousness
- Withdrawal symptoms (if opioid-dependent)
- Re-sedation (naloxone duration < most opioids)

**Contraindications & Cautions:**
- May precipitate acute withdrawal
- Short duration — patient may re-sedate
- Consider infusion for long-acting opioids

**Failure Escalation Logic:**
- If no response after 10 mg total: Consider non-opioid cause
- If re-sedation: Start naloxone infusion 0.04-0.16 mg/kg/hr
- Intubate if unable to maintain airway

**LMIC Availability:** Tier 2 — Available in most hospitals. Critical for opioid emergencies.

---

### 8.2 ATROPINE — Organophosphate Poisoning

**PR-DC ID:** PR-DC-ATR-OPP-v1.0

| Field | Specification |
|-------|---------------|
| **Generic Name** | Atropine |
| **WHO Essential** | Yes |
| **Clinical Persona** | Organophosphate Poisoning — IV |

**Indication & Rationale:** Muscarinic antagonist for organophosphate/carbamate poisoning. Reverses cholinergic crisis (SLUDGE: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis).

**Dosing:**

| Initial Dose | Doubling | Endpoint | Max Single Dose |
|--------------|----------|----------|-----------------|
| 0.02-0.05 mg/kg | Double every 5 min | Dry secretions | No max in OPP |

**Weight-Based Initial Dosing:**

| Weight (kg) | Initial Dose (mg) | Volume of 0.4 mg/mL |
|-------------|-------------------|---------------------|
| 5 | 0.1-0.25 | 0.25-0.6 mL |
| 10 | 0.2-0.5 | 0.5-1.25 mL |
| 20 | 0.4-1 | 1-2.5 mL |
| 30 | 0.6-1.5 | 1.5-3.75 mL |

**Stock Vial Concentration:** 0.4 mg/mL or 1 mg/mL

**Route Guidance:** IV bolus. May give IM if no IV access.

**Monitoring Requirements:**
- Secretions (target: dry)
- Heart rate (tachycardia expected)
- Pupil size (NOT an endpoint — pupils may remain small)
- Respiratory status

**Contraindications & Cautions:**
- NO maximum dose in OPP — titrate to dry secretions
- Tachycardia is expected and acceptable
- Do NOT use pupil size as atropinization endpoint

**Failure Escalation Logic:**
- If secretions persist: Double dose and repeat
- Add pralidoxime (2-PAM) for nicotinic symptoms
- May require massive doses (hundreds of mg in severe cases)

**LMIC Availability:** Tier 1 — Widely available. Critical for agricultural poisoning.

---

## Section 9: Equipment Sizing Reference

### 9.1 Airway Equipment by Weight

| Weight (kg) | Age Estimate | ETT Size (mm) | ETT Depth (cm) | LMA Size | Laryngoscope Blade |
|-------------|--------------|---------------|----------------|----------|-------------------|
| 3 | Newborn | 3.0-3.5 uncuffed | 9 | 1 | Miller 0 |
| 5 | 3-6 months | 3.5 uncuffed | 10 | 1-1.5 | Miller 1 |
| 10 | 1 year | 4.0 cuffed | 12 | 1.5-2 | Miller 1 or Mac 1 |
| 15 | 3 years | 4.5 cuffed | 14 | 2 | Miller 2 or Mac 2 |
| 20 | 5 years | 5.0 cuffed | 15 | 2-2.5 | Mac 2 |
| 25 | 7 years | 5.5 cuffed | 16 | 2.5 | Mac 2 |
| 30 | 9 years | 6.0 cuffed | 17 | 2.5-3 | Mac 2-3 |
| 40 | 11 years | 6.5 cuffed | 18 | 3 | Mac 3 |
| 50+ | Adolescent | 7.0-7.5 cuffed | 20-21 | 4 | Mac 3-4 |

**ETT Size Formula:** (Age/4) + 4 for uncuffed; (Age/4) + 3.5 for cuffed

**ETT Depth Formula:** (Age/2) + 12 (oral); (Age/2) + 15 (nasal)

---

### 9.2 Defibrillation Energy

| Weight (kg) | 1st Shock (2 J/kg) | Subsequent (4 J/kg) | Max |
|-------------|--------------------|--------------------|-----|
| 5 | 10 J | 20 J | — |
| 10 | 20 J | 40 J | — |
| 15 | 30 J | 60 J | — |
| 20 | 40 J | 80 J | — |
| 25 | 50 J | 100 J | — |
| 30 | 60 J | 120 J | — |
| 40 | 80 J | 160 J | — |
| 50+ | 100 J | 200 J | 200 J or adult dose |

---

## Section 10: Vital Sign Reference Ranges

### 10.1 Heart Rate by Age

| Age | Normal Range | Concerning | Critical |
|-----|--------------|------------|----------|
| Newborn | 100-180 | <100 or >180 | <60 or >220 |
| 1-12 months | 100-160 | <100 or >160 | <60 or >200 |
| 1-3 years | 90-150 | <90 or >150 | <60 or >180 |
| 4-6 years | 80-140 | <80 or >140 | <60 or >160 |
| 7-12 years | 70-120 | <70 or >120 | <50 or >150 |
| >12 years | 60-100 | <60 or >100 | <40 or >130 |

### 10.2 Respiratory Rate by Age

| Age | Normal Range | Concerning | Critical |
|-----|--------------|------------|----------|
| Newborn | 30-60 | <30 or >60 | <20 or >70 |
| 1-12 months | 25-50 | <25 or >50 | <20 or >60 |
| 1-3 years | 20-40 | <20 or >40 | <15 or >50 |
| 4-6 years | 20-30 | <20 or >30 | <15 or >40 |
| 7-12 years | 16-24 | <16 or >24 | <12 or >30 |
| >12 years | 12-20 | <12 or >20 | <10 or >25 |

### 10.3 Blood Pressure by Age (Systolic)

| Age | 5th Percentile | 50th Percentile | 95th Percentile | Hypotension |
|-----|----------------|-----------------|-----------------|-------------|
| Newborn | 60 | 70 | 90 | <60 |
| 1-12 months | 70 | 80 | 100 | <70 |
| 1-3 years | 75 | 90 | 105 | <70 + (age × 2) |
| 4-6 years | 80 | 95 | 110 | <70 + (age × 2) |
| 7-12 years | 85 | 100 | 120 | <70 + (age × 2) |
| >12 years | 90 | 110 | 130 | <90 |

**Hypotension Formula (1-10 years):** SBP < 70 + (age in years × 2)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-31 | Initial release — 20 priority drugs | Manus AI |

---

## References

[1] American Heart Association. (2025). Part 8: Pediatric Advanced Life Support. Circulation, 152(16_suppl_2).

[2] World Health Organization. (2016). Paediatric emergency triage, assessment and treatment (ETAT).

[3] World Health Organization. (2023). WHO Model List of Essential Medicines for Children, 9th Edition.

[4] Resuscitation Council UK. (2021). Paediatric Advanced Life Support Guidelines.

[5] Advanced Paediatric Life Support Group. (2023). APLS: The Practical Approach, 7th Edition.

---

*This compendium is a living document. All drug objects meet the Epinephrine gold standard as defined in System DNA V6.0. Updates will be version-controlled and communicated to all users.*
