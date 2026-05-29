# Clinical content governance

**Status:** Active — CEO locked decisions (§8, 2026-05-29); post-deploy module sign-off per batch  
**Version:** 1.1 · **Date:** 2026-05-29  
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

### 2.2 Units and locale narrative

- **Default locale:** **Kenya-first narrative** (mmol/L, drugs commonly available locally) with international/WHO/MOH guidance as concise **“also consider”** notes — **not** separate columns unless needed for clarity ([§8](#8-locked-decisions-ceo-approved-2026-05-29) item 2).
- **Prefer mmol/L** for glucose and related labs in **micro-courses** (Kenya / East Africa practice).
- **mg/dL** optional where needed for cross-audience clarity — label both when shown.

---

## 3. Pedagogy and structure (micro-courses)

### 3.1 Tone and format

- **Simplified evidence-based medicine** — short, not long articles; **simple and fun**.
- **Gamification** is **light only** — progress, module complete, optional streak, diagnostic→summative improvement message; **no** leaderboards or points shops ([§8](#8-locked-decisions-ceo-approved-2026-05-29) item 6).

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
| **Start** | **Diagnostic exam** — **no pass mark**; establishes baseline; **no retakes**. |
| **End** | **Same fixed question bank** — **item and option order shuffled**; **80%** pass required for course completion/certificate; up to **2 retries** after **24 h** between attempts. |
| **Bank size** | Expand bank if **&lt;15** items so shuffle remains meaningful. |

Implementation: `shared/microcourse-exam-policy.ts`, `server/lib/microcourse-exam-gate.ts`, player `MicroCoursePlayerDB.tsx`. Canonical clinical spine: [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md) §6.

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
| **Pass 1** | Governance doc (§8 locked) + backlog skeleton + PSOT §21 link + platform exam policy | CEO direction captured in §8 (2026-05-29) |
| **Pass 2+** | **Substantive** micro-course remediation + **ResusGPS alignment** per [§7](#7-remediation-backlog-skeleton-pass-2) | CEO Clinical Lead — **batch per module**; **post-deploy** review on live site — **not** a pre-merge gate |
| **Later** | **AHA courses** full guideline audit | Separate pass — **not** Pass 1 |

**Pass scope (CEO):** Governance **plus** substantive micro-course/ResusGPS remediation — **not** governance-only. Urgent fixes: [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md).

---

## 6. Contributor workflow

1. Read this document before authoring or editing micro-course or ResusGPS clinical copy.
2. For bedside engine / dosing table changes, update [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) and run clinical tests per PSOT §13.
3. Material pathway or teaching changes: **CEO Clinical Lead** sign-off **per module batch** after deploy; log **Pending CEO post-deploy review** in [WORK_STATUS.md](./WORK_STATUS.md) — **no interim approval gate** blocking engineering merge ([§8](#8-locked-decisions-ceo-approved-2026-05-29) items 7–8).
4. Log execution in [WORK_STATUS.md](./WORK_STATUS.md) — **not** canonical rule changes here.
5. Add remediation items to §7; do not close backlog rows without sign-off.

---

## 7. Remediation backlog skeleton (Pass 2+)

**Status:** Active — audit in **CEO priority order** (§8 item 3). **ResusGPS** spine syncs **after each module** CST entry.  
**Owner column:** Fill on first audit pass.

**Audit priority (harm × enrollment):** (1) DKA → (2) Status epilepticus → (3) Status asthmaticus → (4) Shock / sepsis / fluids → (5) Remaining fellowship conditions by harm × enrollment.

| ID | Domain | Gap (CEO-flagged) | Level / module hint | Owner | Status |
|----|--------|-------------------|---------------------|-------|--------|
| CLIN-DKA-01 | Metabolic / DKA | mg/dL overuse; prefer mmol/L | DKA micro-course(s) | Cursor | Done (seed + CST) |
| CLIN-DKA-02 | Metabolic / DKA | Insulin stop criteria (ketones vs glucose/pH) | DKA micro-course(s) | Cursor | Done (seed + CST) |
| CLIN-DKA-03 | Metabolic / DKA | NS vs balanced crystalloids; hyperchloremic acidosis | DKA + ResusGPS fluids | Cursor | Done (seed + ResusGPS) |
| CLIN-SE-01 | Neurological | Status epilepticus — intl first-line vs Kenya diazepam; neonatal benzo skip | Status epilepticus module | Cursor | Done (seed + ResusGPS) |
| CLIN-ASTH-01 | Airway | Status asthmaticus — steroids beyond hydrocortisone only | Asthma Level 1/2 | Cursor | Done (Level 1/2 seed) |
| CLIN-ASTH-02 | Airway | Salbutamol IV where appropriate | Asthma Level 2 | Cursor | Done (Asthma II seed) |
| CLIN-GOV-01 | Cross-cutting | Summative exam implementation vs §3.4 (diagnostic no-redo, end shuffle) | Platform / player | Cursor | Done (exam policy + player) |
| CLIN-RESUS-01 | ResusGPS | Spine audit — orphan strings, unit consistency | ResusGPS pathways | Cursor | Partial (P0 conditions; full audit backlog in handoff) |

**Changelog**

| Date | Change |
|------|--------|
| 2026-05-29 | Initial governance + backlog skeleton (CEO Pass 1). |
| 2026-05-29 | §8 locked decisions (CEO approved); audit priority + exam model finalized. |

---

## 8. Locked decisions (CEO approved 2026-05-29)

Canonical answers — agents implement against these; update [WORK_STATUS.md](./WORK_STATUS.md) for execution, not rule changes here.

1. **Diagnostic vs summative:** **Same fixed question bank**; at end, **shuffle item and option order** (not a different blueprint). Expand bank if **&lt;15** items.

2. **Default locale:** **Kenya-first narrative** (mmol/L, available drugs) with intl/WHO/MOH as concise **“also consider”** — not separate columns unless clarity requires it.

3. **Audit priority:** **DKA** → **Status epilepticus** → **Status asthmaticus** → **shock/sepsis/fluids** → remaining by **harm × enrollment**. **ResusGPS** syncs after each module CST entry.

4. **Citations:** **CST per condition**; module bibliography **3–8 refs**; **in-body cites** for high-stakes claims only.

5. **Neonates:** **Embedded callouts** in relevant modules; **status epilepticus** must state **neonates skip benzos** + alternatives. Separate neonatal micro-course later if needed.

6. **Gamification:** **Light only** — progress, module complete, optional streak, diagnostic→summative improvement message. **No** leaderboards or points shops.

7. **Pass scope:** Governance **+ substantive** micro-course/ResusGPS remediation (not governance-only). **CEO post-deploy sign-off** on live site — **not** a pre-merge block.

8. **Sign-off:** **CEO Clinical Lead** (Job Karue); **batch per module**; after merge log **Pending CEO post-deploy review** in WORK_STATUS. **No interim approval gate.**

9. **Summative vs diagnostic rules:** **Summative** required for course **completed** / certificate; **80%** pass; up to **2 retries** after **24 h**. **Diagnostic:** no pass mark, **no retakes**.

10. **Spirit:** International consensus + user choice + LMIC reality; **eliminate preventable childhood deaths**; **simple not perfect**.

---

## 9. Document control

| Field | Value |
|-------|--------|
| **Canonical owner** | Job Karue (CEO) — clinical sign-off |
| **Maintainers** | Clinical faculty + engineering (implementation) |
| **Next review** | After Pass 2 audit batch 1 or CEO reprioritisation |

**PSOT registry:** Listed in [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §21.1.
