# Clinical Source of Truth (CST) — Fellowship micro-courses & ResusGPS

**Status:** Active — **Pending CEO post-deploy review** (live site sign-off at paedsresus.com; per [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md) §8 item 8)  
**Version:** 1.0 · **Date:** 2026-05-29  
**Governance:** [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md) §8 locked (2026-05-29) · **Safety register:** [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md)

**Mission:** Eliminating Preventable Childhood Deaths — international survival standards with honest LMIC resource framing (Kenya/East Africa first; mmol/L for glucose).

**AHA courses (BLS/ACLS/PALS/NRP):** Out of scope for this CST.

---

## How to use

| Layer | Location |
|-------|----------|
| Authoring / seed | `server/data/micro-courses-*.ts`, `scripts/seed-fellowship-content.ts` |
| Bedside engine | `client/src/lib/resus/*-engine.ts`, `abcdeEngine.ts` |
| Exams | `shared/microcourse-exam-policy.ts`, player `MicroCoursePlayerDB.tsx` |

When international, WHO, and Kenya MOH differ: present **both**, recommend with rationale, user chooses.

---

## 1. Diabetic ketoacidosis (DKA)

**Refs:** ISPAD 2022/2024 consensus; WHO pocket book (severe dehydration); Kenya MOH diabetes guidance where applicable.

| Topic | International (HIC) | LMIC / Kenya reality | Teaching emphasis |
|-------|---------------------|----------------------|-------------------|
| Diagnosis | Glucose + ketones + acidosis (pH &lt;7.3) | Same; use **mmol/L** (e.g. &gt;11–14 mmol/L) | Confirm ketones + gas, not glucose alone |
| Fluids | Isotonic resuscitation; **balanced crystalloid** option (ISPAD) | 0.9% NaCl often default | Note **hyperchloraemic acidosis** with large NS volumes |
| Bolus | 10 mL/kg if perfusion poor; slow deficit replacement | Same; avoid rapid correction | Cerebral oedema vigilance |
| Insulin | 0.05–0.1 U/kg/h **no bolus** in children | SC insulin q2–4h only if no pump — document risk | Continue until **ketosis resolving**, not normoglycaemia alone |
| Potassium | Hold insulin if K⁺ &lt;3.5 mmol/L | Same | Replace per protocol |

**ResusGPS alignment:** `client/src/lib/resus/dka-engine.ts`, ABCDE hyperglycaemia branch in `abcdeEngine.ts`.

---

## 2. Status epilepticus (SE)

**Refs:** ILAE/AES paediatric SE; WHO emergency triage; Kenya standard treatment guidelines (diazepam availability).

| Topic | International | Kenya / LMIC | Neonates |
|-------|---------------|--------------|----------|
| Definition | ≥5 min continuous or recurrent without recovery | Same | Same |
| 1st line | Buccal/IM/IV **midazolam** or IV **lorazepam** | **Diazepam** IV/PR common — respiratory depression caution | **No benzos first-line** — phenobarbital / protocol |
| 2nd line | Levétiracetam, phenytoin per protocol | Use available agent | Senior review |

**ResusGPS alignment:** `status-epilepticus-engine.ts`, active seizure branch in `abcdeEngine.ts`.

---

## 3. Status asthmaticus / severe asthma

**Refs:** GINA paediatric; WHO severe pneumonia/asthma care; Kenya asthma care pathways.

| Level | Content |
|-------|---------|
| **Level 1** | Severity, salbutamol + ipratropium, **dexamethasone / prednisolone / hydrocortisone** |
| **Level 2** | Continuous salbutamol, magnesium, **IV salbutamol** where monitored, ICU, intubation readiness |

**ResusGPS alignment:** severe asthma threat in `abcdeEngine.ts`.

---

## 4. Septic / hypovolemic / cardiogenic shock

**Refs:** Surviving Sepsis paediatric; WHO fluid guidance; FEAST trial context for fluid caution in some presentations; Kenya MOH shock chapters.

| Topic | Teaching |
|-------|----------|
| Recognition | Perfusion, CRT, mental status — cool extremities ≠ shock alone |
| Fluids | 10–20 mL/kg isotonic boluses with reassessment; FEAST-aware caution in non-hypovolaemic shock |
| Antibiotics | Early broad-spectrum in septic shock |
| Inotropes | Level 2 / ICU courses |

**ResusGPS alignment:** shock pathways in `abcdeEngine.ts`; fellowship condition map in `shared/fellowship-microcourse-resus-conditions.ts`.

---

## 5. Remaining fellowship conditions (summary spine)

| Condition | Level 1 focus | Level 2 focus |
|-----------|---------------|---------------|
| Pneumonia | Recognition, antibiotics, oxygen | Severe/ARDS, sepsis overlap |
| Anaphylaxis | IM adrenaline 0.01 mg/kg | Refractory / IV adrenaline |
| Meningitis | Empiric ABX, LP cautions | ICP, complications |
| Severe malaria | Artesunate, glucose | MODS, exchange transfusion discussion |
| Burns | Parkland, airway | Wound / infection |
| Trauma | ABCDE primary survey | Massive haemorrhage |
| AKI / Anaemia | Recognition, transfusion triggers | RRT / complications |

Each module cites this CST in seed footers via `clinical-content-helpers.ts`.

---

## 6. Assessments (platform)

| Exam | Rules |
|------|--------|
| Diagnostic | Start of course; same bank; **no pass mark**; **no retake** |
| Formative | Per module; taught content only |
| Summative | End; same bank shuffled; **80%** pass; **2 retries** after **24 h**; required for certificate |

Implementation: `shared/microcourse-exam-policy.ts`, `server/lib/microcourse-exam-gate.ts`.

---

## Document control

| Field | Value |
|-------|--------|
| CEO sign-off | **Pending post-deploy review** |
| Next audit batch | DKA → SE → asthma → shock/sepsis/fluids → remainder (governance §7–§8) |
