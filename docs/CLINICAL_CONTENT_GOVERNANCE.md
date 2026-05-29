# Clinical content governance

**Status:** Active — CEO/clinical sign-off (Pass 1)  
**Version:** 1.0 · **Date:** 2026-05-29  
**Audience:** Clinical faculty, content authors, engineering, all agents shipping micro-courses or ResusGPS clinical strings.

**Purpose:** Canonical rules for **what we teach**, **how we teach it**, and **how we handle guideline conflict** across **micro-courses**, **ResusGPS**, and related training surfaces. This document does **not** replace [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) (bedside engine change control) or [legal/CLINICAL_INTENDED_USE_STATEMENT.md](./legal/CLINICAL_INTENDED_USE_STATEMENT.md) (ResusGPS intended use / regulatory framing).

**Related:** [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §3 (offerings), §13 (developer guardrails), §21 (document registry); [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md); [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md); [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md).

---

## 1. Mission frame (non-negotiable)

**Mission:** **Eliminating Preventable Childhood Deaths.**

- Teach to **international survival standards** — not a “poor people mentality.”
- **Acknowledge resource constraints** honestly (e.g. insulin without a syringe pump — document safer approaches).
- **Improvised CPAP** / **peritoneal dialysis** studies may be mentioned as **not first-line** but as **evidence-based options when relevant** — never as default care.
- **Example (MOH Kenya shock / GE misconception):** Cool extremities are often taught as shock — we teach **evidence-based shock recognition** beyond MOH limitations **where evidence supports**, without dismissing local context.

---

## 2. Authority — which source wins when

| Content lane | Authoritative source | Notes |
|--------------|---------------------|--------|
| **AHA courses** (BLS, ACLS, PALS, Instructor, NRP) | **AHA 2025 Guidelines** | **OUT OF SCOPE for Pass 1** — do **not** audit AHA course content in this governance pass. Dedicated pass later. |
| **Micro-courses** + **ResusGPS** clinical spine | Latest **internationally accepted** guidelines | Evidence cutoff **2018+** unless no newer guideline exists. |
| **When guidelines differ** | Present **international consensus (HIC)** + **WHO** for LMIC where relevant + **Kenya MOH** where relevant | **Mention both** — do **not** hide conflict. **We do not make decisions for users** — give **recommendations + rationale + choices**, simplified. |

### 2.1 Conflict presentation template (copy pattern)

Use this structure when international, WHO/LMIC, and/or Kenya MOH guidance diverge:

1. **What international evidence supports** (first-line / preferred where applicable).
2. **What is often available or taught locally** (with cautions).
3. **What we recommend** (plain language) — **user chooses with understanding**.
4. **Neonatal / age-specific exceptions** — **explicit** (never buried in footnotes).

**Example — fluids (DKA / shock):** Normal saline (NS) may be taught as common first-line; **note** low pH / **hyperchloremic acidosis** risk. **ISPAD** balanced crystalloids as alternative. User chooses with understanding.

**Example — status epilepticus:** International first-line (**lorazepam**, **buccal midazolam**) with **why**. Kenya reality (**diazepam** available) with cautions (**respiratory depression**). **Neonates: skip benzos** — must be **explicit** in module copy and assessments.

### 2.2 Units

- **Prefer mmol/L** for glucose and related labs in **micro-courses** (Kenya / East Africa practice).
- **mg/dL** optional where needed for cross-audience clarity — label both when shown.

---

## 3. Pedagogy and structure (micro-courses)

### 3.1 Tone and format

- **Simplified evidence-based medicine** — short, not long articles; **simple and fun**.
- **Gamification** is acceptable when it reinforces learning (see [§8 Open questions](#8-open-questions-for-ceo--pending-decisions) for depth).

### 3.2 Course levels

| Level | Scope | Title rule |
|-------|--------|------------|
| **Level 1** | Known / foundations + **1st and 2nd line** management | Title must match content (e.g. **Asthma 1** = 1st + 2nd line only). |
| **Level 2** | **Advanced continuation** of the same condition | e.g. **Asthma 2** = advanced management only. |

**Sequencing principle:** **Known → unknown** within and across modules.

### 3.3 Assessments

- Questions **only** on material **taught in that module** — **no unfair surprises**.

### 3.4 Summative exam model (diagnostic → summative)

| Phase | Behaviour |
|-------|-----------|
| **Start** | **Diagnostic exam** — **no pass mark**; establishes baseline; **cannot redo**. |
| **End** | **Same exam** (question bank **shuffled**) — measures learning benefit. |

Blueprint vs identical bank: **CEO decision pending** — see [§8](#8-open-questions-for-ceo--pending-decisions).

### 3.5 Known content gaps (remediation backlog — do not fix silently in Pass 1)

Track in [§7 Remediation backlog skeleton](#7-remediation-backlog-skeleton-pass-2) unless CEO approves hotfixes in Pass 1.

**Status asthmaticus (example gaps called out by CEO):**

- Hydrocortisone-only steroid teaching → must include **dexamethasone**, **prednisolone** where appropriate.
- **Salbutamol IV** as option where appropriate.
- Organize fixes per **Level 1 / Level 2** structure above.

**DKA (example gaps called out by CEO):**

- **mg/dL** overuse vs mmol/L preference.
- **Insulin stop criteria** — ketones vs glucose/pH (clarify evidence-aligned teaching).
- **NS vs balanced crystalloids** / **hyperchloremic acidosis** — use conflict template (§2.1).

---

## 4. ResusGPS alignment

- **Clinical spine** content that feeds ResusGPS must follow **the same governance rules** as micro-courses (authority, conflict presentation, units, neonatal exceptions).
- **No orphan clinical strings** — pathway copy, dose rationale, and training cross-links should trace to this governance model and [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) where bedside-critical.
- ResusGPS **regulatory / intended-use** framing remains in [legal/CLINICAL_INTENDED_USE_STATEMENT.md](./legal/CLINICAL_INTENDED_USE_STATEMENT.md).

---

## 5. Scope by program pass

| Pass | Scope | Sign-off |
|------|--------|----------|
| **Pass 1 (this document)** | Governance doc + backlog skeleton + PSOT §21 link | CEO clinical content direction captured here |
| **Pass 2+** | Systematic **micro-course audit** + **ResusGPS alignment** | CEO signs off per module / batch |
| **Later** | **AHA courses** full guideline audit | Separate pass — **not** Pass 1 |

**Pass 1 explicitly does NOT:** rewrite all micro-course content unless **trivial** (typo, broken link). Use [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md) for urgent clinical hotfixes.

---

## 6. Contributor workflow

1. Read this document before authoring or editing micro-course or ResusGPS clinical copy.
2. For bedside engine / dosing table changes, update [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) and run clinical tests per PSOT §13.
3. Material pathway or teaching changes require **CEO clinical sign-off** before merge (see AGENTS.md).
4. Log execution in [WORK_STATUS.md](./WORK_STATUS.md) — **not** canonical rule changes here.
5. Add remediation items to §7; do not close backlog rows without sign-off.

---

## 7. Remediation backlog skeleton (Pass 2+)

**Status:** Planning — CEO priority order **pending** (see §8).  
**Owner column:** Fill on first audit pass.

| ID | Domain | Gap (CEO-flagged) | Level / module hint | Owner | Status |
|----|--------|-------------------|---------------------|-------|--------|
| CLIN-DKA-01 | Metabolic / DKA | mg/dL overuse; prefer mmol/L | DKA micro-course(s) | TBD | Open |
| CLIN-DKA-02 | Metabolic / DKA | Insulin stop criteria (ketones vs glucose/pH) | DKA micro-course(s) | TBD | Open |
| CLIN-DKA-03 | Metabolic / DKA | NS vs balanced crystalloids; hyperchloremic acidosis | DKA + ResusGPS fluids | TBD | Open |
| CLIN-SE-01 | Neurological | Status epilepticus — intl first-line vs Kenya diazepam; neonatal benzo skip | Status epilepticus module | TBD | Open |
| CLIN-ASTH-01 | Airway | Status asthmaticus — steroids beyond hydrocortisone only | Asthma Level 1/2 | TBD | Open |
| CLIN-ASTH-02 | Airway | Salbutamol IV where appropriate | Asthma Level 2 | TBD | Open |
| CLIN-GOV-01 | Cross-cutting | Summative exam implementation vs §3.4 (diagnostic no-redo, end shuffle) | Platform / player | TBD | Open |
| CLIN-RESUS-01 | ResusGPS | Spine audit — orphan strings, unit consistency | ResusGPS pathways | TBD | Open |

**Changelog**

| Date | Change |
|------|--------|
| 2026-05-29 | Initial governance + backlog skeleton (CEO Pass 1). |

---

## 8. Open questions for CEO — pending decisions

Draft for CEO reply; update this section when decided (then note in WORK_STATUS).

1. **Diagnostic vs summative:** Identical question bank shuffled at end, or **same blueprint** with **different items**?
2. **Default locale:** Kenya-first narrative with intl/WHO columns, or **single blended narrative**?
3. **Micro-course audit priority order:** DKA, status epilepticus, asthma first — or another sequence?
4. **Citation granularity:** Per module bibliography vs **per claim** footnotes?
5. **Neonatal content:** Separate neonatal modules vs **embedded warnings** in paediatric modules?
6. **Gamification depth:** Badges only vs **points / leaderboards**?
7. **Content fix Pass 1:** Governance doc only, or also ship **DKA / SE hotfixes** in same release train?
8. **Clinical sign-off SLA** and **name/role** to record in WORK_STATUS for content merges?

---

## 9. Document control

| Field | Value |
|-------|--------|
| **Canonical owner** | Job Karue (CEO) — clinical sign-off |
| **Maintainers** | Clinical faculty + engineering (implementation) |
| **Next review** | After Pass 2 audit batch 1 or CEO reprioritisation |

**PSOT registry:** Listed in [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §21.1.
