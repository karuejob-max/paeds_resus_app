# Fellowship qualification, provider profile, and internal operational intelligence

**Status:** Canonical strategy — complements [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md), [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md), and [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md).  
**Version:** 2.0 · **Date:** 2026-03-31  
**Audience:** Leadership, clinical governance, product, legal, security, research.

---

## 1. Purpose

This document locks:

1. **What “ADF Fellow” (or equivalent fellow title in UI)** means — **fully automatable** criteria only (no manual conferral).
2. **Profile and contact data** required for fellowship-path participation and **optional** future programmes (e.g. small-group learning).
3. **Staff** vs **parent** reporting — **separate names and products** (see §3).
4. **How** courses, ResusGPS use, **Staff Safety Signal** reporting, and **course feedback** combine into **one cumulative “distance to Fellow”** experience.
5. **Grace rules** for monthly staff reporting — strict, automated, with **streak reset** when discipline fails.
6. **Public** vs **internal** use of facility data — including **future** “Paeds Resus accredited facilities” (not rankings).
7. **Pre-launch gates** — nothing ships as “Fellowship” until §11 is satisfied.

---

## 2. Naming: parent Safe-Truth vs staff safety reporting

| Channel | Audience | PSoT name | Notes |
|---------|-----------|-----------|--------|
| **Safe-Truth** | **Parents / guardians** | **Safe-Truth** (unchanged) | Guardian experience, timelines, community voice — [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md). **Not** used for fellowship monthly reporting. |
| **Staff incident & near-miss reporting** | **Healthcare providers** (staff) | **Staff Safety Signal** (canonical **product label** until marketing replaces) | Fellowship **monthly discipline** and QI culture apply **only** to this channel. **Do not** label staff flows “Safe-Truth” in UI — avoids confusion with parent Safe-Truth. **Code** may keep legacy route names until refactored; **user-facing** copy must distinguish. |

**Marketing may rename** Staff Safety Signal (e.g. branded sub-product) if it remains **visually and verbally distinct** from Safe-Truth.

---

## 3. Commercial model (no fellowship surcharge)

- **No separate fellowship fee.** Revenue remains **per course / micro-course** (and other priced SKUs) as in [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md).
- **Fellowship progress** is earned through **use of platform services** — course completion, **ResusGPS**-attributable cases, **Staff Safety Signal** logs, and **course feedback** (where instrumented) — **not** through a bundled “fellowship purchase.”

---

## 4. Fellowship qualification (all automated)

**Fellow status may only be awarded when the system can prove every criterion from data.** No manual overrides in v1; if automation is incomplete, **do not** show “Fellow” or equivalent.

| Pillar | Rule | Automation requirement |
|--------|------|------------------------|
| **A — Courses** | Complete **BLS, ACLS, PALS**, and **every ADF micro-course** in the active MECE catalog ([MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md)). | `certificates` / `enrollments` / completion flags **per course row**; single source of truth in DB. |
| **B — ResusGPS** | For **each taught condition** in the portfolio, **≥3 attributable cases** where the learner **used ResusGPS** to guide care. | Pathway/session IDs, user ID, **minimum depth** thresholds (anti-gaming), timestamps; map **condition ↔ pathway** in config. |
| **C — Staff Safety Signal** | **24 consecutive qualifying months** of monthly reporting (see §6–7). | Dedicated **staff** submission table(s), EAT calendar month bucketing, immutable audit trail. |

**Near misses and non-sentinel events count** toward Staff Safety Signal; structure and minimum fields are product-defined and **validated server-side**.

---

## 5. Provider profile and optional contact (enrollment gate + future community)

### 5.1 Required for fellowship-path enrollment

**Cadre; facility; department; country; region; town** — as in v1.0; block enroll until valid.

### 5.2 Contact for future programmes (e.g. small groups)

- **Email** (usually already account identity) and **mobile number** may be **collected for optional** uses: facilitated discussions, peer learning, SMS reminders for reporting — **only** with **explicit consent** per purpose (checkboxes; not bundled as “accept all”).
- **Purpose-limited** storage; **unsubscribe** / withdraw from **non-essential** contact without losing core platform access where legally required.

---

## 6. Single cumulative “distance to Fellow” experience

**Product requirement:** One surfaced progress model (dashboard / hub) that **aggregates**:

- Course completion (% of required catalog).
- ResusGPS condition checklist (% conditions meeting **3 cases**).
- Staff Safety Signal **current streak** / **months completed** toward **24**, and **grace** state.

**Copy:** Discipline in logging is **leadership behaviour** training — aligned with safe fluid and escalation decisions (e.g. DCM/SAM vs sepsis). **Do not** shame; **do** show clear **automated** consequences of missed months (see §7).

---

## 7. Staff Safety Signal — monthly rule and grace (automated)

**Timezone:** Calendar months in **EAT** (consistent with [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §8).

**Normal month:** **≥1** eligible Staff Safety Signal submission **created** in that month (exact eligibility = **submitted + passes validation**, not draft).

### 7.1 Grace budget

- **Two (2) grace periods per calendar year** (EAT year: Jan–Dec).
- A **grace** is invoked when a month would otherwise have **0** eligible events but the learner **remains in the fellowship pursuit** under catch-up rules.

### 7.2 Catch-up after a grace month

- If month **M** has **0** eligible events and **counts as using one grace** (grace budget available), then month **M+1** must contain **≥3** eligible Staff Safety Signal events (**not** 2, **not** 1).
- If month **M+1** fails to reach **3** eligible events → **consecutive month streak for pillar C resets to zero** (see §7.4). Grace for month M is **not** successfully “closed.”

### 7.3 One more grace per year (strict reading)

- After a learner **uses one grace** and **successfully completes** the **3-event catch-up month**, they may use **at most one additional grace** in the **same calendar year** (total **≤2** graces/year). **Automation** enforces the count; **no** manual resets.

### 7.4 Third strike — streak reset

- If the learner **skips** a third month ( **0** eligible events in a month **without** a remaining grace that can apply **or** without completing catch-up from a prior grace **or** after exhausting **2** graces in the year with continued failure) — **pillar C consecutive month count resets to zero** and must **restart** the path to **24** qualifying months.
- **Courses (A)** and **ResusGPS case progress (B)** **do not** reset when pillar C resets — only the **staff reporting streak** and **calendar of qualifying months** for fellowship.

### 7.5 Anti-gaming

- **Minimum interaction depth** on ResusGPS sessions; **dedupe** same-day trivial opens.
- **Staff submissions** require **structured fields**; rate limits; **no** duplicate event IDs.
- **Server-side** validation only; client counts are **never** authoritative.

---

## 8. Internal operational intelligence (non-public by default)

- **Profile + activity** for **outbreak signals**, **facility stress**, **cadre gaps**, **policy** — **aggregated**; **no public** identifiable facility tables **except** where §9 applies later.
- **Course feedback** (e.g. pre-certificate) feeds **improvement**; may join **internal** analytics **without** public attribution.

---

## 9. Future public: Paeds Resus accredited facilities (not rankings)

- **Not** “top hospitals” league tables or **public performance rankings** until governance explicitly approves methodology.
- **Approved future model:** A **published list** of **Paeds Resus accredited** facilities — derived from **hospital preparedness** assessment and **contractual** accreditation — analogous to how travellers look for **accreditation marks** (e.g. JCI-style **binary** trust: on the list or not), **not** ordinal comparison.
- **Parents** choosing care in a new city: **directory** use case; **must** include **clear criteria** for accreditation and **disclaimers** (not emergency routing; not liability for outcomes).

---

## 10. Legal, privacy, and vulnerability controls (must implement)

| Area | Requirement |
|------|-------------|
| **Consent** | Layered consent for profile, **Staff Safety Signal**, contact for community programmes, and **analytics**; easy **withdraw** where required. |
| **Data minimisation** | No patient identifiers in free text where avoidable; **structured** incident categories. |
| **Retention** | Policy per table; **deletion** on account close vs **legal/regulatory hold** documented. |
| **Access control** | **Admin** and **research** roles; **audit log** for bulk export; **no** public API for identifiable staff–facility joins. |
| **Accuracy** | Fellow badge **only** if automated checks pass; **appeals** process **documented** (e.g. data bug) — **not** subjective “promotion.” |
| **Security** | [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §11; encrypt in transit; secrets in env. |
| **Terms** | ToS / privacy **updated** for Staff Safety Signal, grace rules, streak reset, and **accredited list** when launched. |
| **Institutional** | B2B contracts may **add** obligations; **not** weaker than individual protections. |

---

## 11. Fellowship launch readiness checklist (block launch until complete)

**Do not** launch **Fellow** title, **fellowship progress UI**, or **public accredited directory** until **all** relevant rows pass.

### 11.1 Data & automation

- [ ] **Staff Safety Signal** product live: create/list with **server validation**, **EAT month** bucketing, **immutable** timestamps.
- [ ] **No** dependency on manual admin toggles for Fellow.
- [ ] **ResusGPS** → user → pathway → **condition map**; **≥3** sessions per condition with **depth** rules.
- [ ] **Course completion** pipeline complete for **all** catalog courses in scope.
- [ ] **Grace / catch-up / annual grace count / streak reset** implemented and **integration-tested**.

### 11.2 UX & fairness

- [ ] **Single dashboard**: distance to Fellow (A/B/C pillars).
- [ ] **Clear** messaging: grace **remaining**, catch-up **3 in next month**, **reset** when triggered.
- [ ] **Staff** flows **never** titled Safe-Truth; parent Safe-Truth **unchanged**.

### 11.3 Legal & policy

- [ ] Privacy policy + ToS + **consent** flows reviewed (counsel).
- [ ] **Appeals** path for **system errors** only.

### 11.4 Accredited facilities (if launching list)

- [ ] **Accreditation criteria** documented; **not** a ranking; **disclaimers**; **governance** approval.

---

## 12. Relationship to other docs

- [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md)  
- [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md)  
- [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md)  
- [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §3, §8, §11, **§17**

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-31 | **v2.0:** Automation-only fellow; **Staff Safety Signal** vs parent Safe-Truth; no fellowship fee; cumulative progress; grace/catch-up/reset rules; accredited facilities (future); contact consent; launch checklist; legal controls. |
| 2026-03-31 | v1.0: Fellow criteria, profile gate, internal intelligence. |
