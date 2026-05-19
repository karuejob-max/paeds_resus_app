# Paeds Resus Fellowship micro-course catalog backlog (24-slot cycle)

**Status:** Planning backlog — implements the **~one micro-course per month × ~24 months** renewal rhythm described in [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md).  
**Version:** 1.0 · **Date:** 2026-03-31  
**Audience:** Product, clinical faculty, marketing.

---

## Purpose

- Provide **24 named placeholders** for **SKU / catalog / certificate** work so engineering and content teams share one list.
- Preserve **MECE intent** at the **course-title** level: each row has a **single primary outcome**; together they approximate **collective exhaustiveness** for the Paeds Resus Fellowship slice of paediatric peri-arrest care (with BLS/ACLS/PALS as parallel credential layers — see portfolio doc).
- **Order is a suggested rollout**, not a learner lock: learners may start anywhere; slot numbers support **“month 1–24”** messaging and ops planning.

**Indicative price:** KSh **200** per micro-course (per portfolio table). **Governance:** rename, split, or merge rows only with clinical sign-off and an update to this file.

---

## Slot map (24 courses)

| Slot | Suggested month | Domain | Course title (working) | Primary learning outcome (one line) |
|------|-----------------|--------|------------------------|-------------------------------------|
| 1 | M1 | **Cross-cutting** | Systematic approach to the seriously ill child | Structured assessment, prioritisation, escalation, and safety across ABCDE in practice. |
| 2 | M2 | A · Airway | Acute upper airway obstruction and croup | Recognise severity, give evidence-based medical care, and know when to escalate. |
| 3 | M3 | A · Airway | Acute severe asthma in children | Bronchodilator strategy, escalation, and referral triggers for respiratory failure. |
| 4 | M4 | A · Airway | Paediatric advanced airway principles (SGA, intubation mindset, surgical airway recognition) | Team preparation, device choice overview, and safe referral when above scope. |
| 5 | M5 | B · Respiratory | Bronchiolitis — recognition and escalation | Fluid, oxygen, and escalation aligned with local guidelines; PICU criteria. |
| 6 | M6 | B · Respiratory | Severe pneumonia and respiratory support basics | Oxygen escalation, antibiotics context, and invasive ventilation referral triggers. |
| 7 | M7 | B · Respiratory | Non-invasive respiratory support in children (HFNC / CPAP principles) | When to step up, monitoring, and failure patterns. |
| 8 | M8 | C · Circulatory | Paediatric hypovolaemic shock due to diarrhoeal illness | Fluid strategy, reassessment, and danger signs. |
| 9 | M9 | C · Circulatory | Paediatric hypovolaemic shock due to severe bleeding | Haemorrhage control mindset, fluid/blood principles, and escalation. |
| 10 | M10 | C · Circulatory | Paediatric septic shock | Early recognition, antibiotics and fluids, escalation bundles. |
| 11 | M11 | C · Circulatory | Paediatric anaphylactic shock | Adrenaline, airway, fluid, and observation thresholds. |
| 12 | M12 | C · Circulatory | Paediatric neurogenic shock | Spinal injury awareness, perfusion goals, and referral. |
| 13 | M13 | C · Circulatory | Paediatric cardiogenic shock due to cardiac arrhythmias | Unstable tachy/brady recognition and time-critical actions within scope. |
| 14 | M14 | C · Circulatory | Paediatric cardiogenic shock due to LV systolic dysfunction (e.g. DCM) | Inotropes overview, fluid caution, and escalation. |
| 15 | M15 | C · Circulatory | Management of hypercyanotic (Tet) spells | Recognition, positioning, oxygen, fluids, and definitive care pathway. |
| 16 | M16 | C · Circulatory | Pulmonary embolism in children (recognition and initial stabilisation) | Risk context, recognition, anticoagulation principles, referral. |
| 17 | M17 | C · Circulatory | Cardiac tamponade in children | Clinical suspicion, bedside findings, pericardiocentesis referral, stabilisation. |
| 18 | M18 | D · Neurological | Status epilepticus in children | Time-based benzodiazepine ladder, second-line awareness, referral. |
| 19 | M19 | D · Neurological | Acute altered consciousness — coma, meningitis, and encephalitis suspicion | CSF referral mindset, stabilisation, antimicrobial timing context. |
| 20 | M20 | E · Metabolic | Hypoglycaemia in the seriously ill child | Identify cause, treat, monitor, and prevent rebound harm. |
| 21 | M21 | E · Metabolic | Diabetic ketoacidosis — first hours in children | Fluids, insulin principles, monitoring for cerebral oedema risk, escalation. |
| 22 | M22 | F · Trauma | Paediatric trauma — primary survey (ABCDE) and cervical spine mindset | Structured approach, bleeding control, and packaged transfer. |
| 23 | M23 | F · Trauma | Paediatric traumatic brain injury and massive haemorrhage principles | ICP safety basics, TXA awareness per protocol, team coordination. |
| 24 | M24 | **Cross-cutting** | Paediatric cardiac arrest | Prevention context, high-quality CPR, rhythm approach, post-ARREST care overview, debrief. |

**Domain key:** A = Airway · B = Respiratory · C = Circulatory · D = Neurological · E = Metabolic · F = Trauma.

---

## MECE and overlap

- **BLS / ACLS / PALS** remain separate **credential courses** (hours, blended) — they are **not** duplicated as fellowship micro-courses; Fellowship modules **deepen** condition-specific care and **point to ResusGPS** (see portfolio doc §13).
- If two rows feel overlapping after content design, **merge** into one SKU and add a new row elsewhere (e.g. split a trauma topic) — update this table and the changelog below.

---

## Product hooks (when implementing rows)

- **`pricingSku` / catalog:** one row per course in `courses` when launched; default **KSh 200** unless leadership overrides.
- **ResusGPS:** each module should **mirror or link** relevant pathways (portfolio §13).
- **Renewal:** learner-level **~2-year** refresh per micro-course or bundle — policy TBD; note in [WORK_STATUS.md](./WORK_STATUS.md) when product rules are fixed.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-31 | Initial 24-slot backlog aligned to portfolio MECE domains and circulatory taxonomy. |
