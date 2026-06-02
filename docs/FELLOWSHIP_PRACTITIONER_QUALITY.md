# Fellowship practitioner quality — honest gap analysis (CEO)

**Date:** 2026-06-02  
**Audience:** Job Karue (CEO), clinical governance, product, legal.  
**Public counterpart:** `/fellowship/why` (learner Q&A).

This document states what the **current** Fellowship setup does and does not guarantee, and what would materially improve practitioner quality and child outcomes.

---

## Executive summary

The Paeds Resus Fellowship is a **structured digital pathway** (courses + ResusGPS logging + Care Signal discipline). It can improve knowledge and habits for motivated clinicians. In its **current** form it **cannot** claim to produce uniformly safe bedside practitioners, prevent deaths, or replace supervised training, skills verification, facility readiness, or national licensure.

---

## What prevents high-quality practitioners who transform child health (today)

### 1. Assessment = knowledge checks, not skills/OSCE

Summative and formative items are predominantly **online knowledge assessments**. There is no required observed skills station, simulation sign-off, or video-verified procedure competence in v1.

**Risk:** Learners pass exams while lacking psychomotor skill, team communication, or equipment familiarity.

### 2. No supervised practice requirement

Fellowship automation counts **course completion**, **ResusGPS case depth rules** (when enforced), and **Care Signal months**. It does not require mentor attestation, preceptor hours, or hospital-approved supervisions.

**Risk:** Self-reported progression without external clinical validation.

### 3. ResusGPS depth rules documented but may be unenforced

Pillar B expects ≥3 cases per taught condition with anti-gaming depth. Engineering intent exists; **operational enforcement** and audit of shallow sessions must be verified continuously. Gaming (open/close without real care) remains a threat if depth checks lag.

**Risk:** Pillar B becomes a checkbox, not practice quality.

### 4. Care Signal = engagement proxy, not outcomes

Pillar C measures **monthly reporting discipline** and structured incident capture — a culture proxy. It does **not** measure mortality, preventable harm reduction, or comparative facility safety.

**Risk:** Streak completion without learning from events or implementing systems fixes.

### 5. No facility readiness / team training layer

The pathway is **individual**. It does not bundle team drills, drug cupboard audits, defibrillator checks, or MOH facility preparedness assessments required for reliable resuscitation systems.

**Risk:** Skilled individuals in dysfunctional teams or resource-poor environments.

### 6. LMIC reality vs exam performance

Courses include LMIC callouts and “resource unavailable” flows, but **exams** may still reflect ideal-resource answers unless carefully authored. Learners in drug-scarce wards may pass summatives while unable to apply identical orders locally.

**Risk:** Cognitive pass ≠ actionable care in their hospital.

### 7. Fellow title off — no completion ritual

`fellowTitleEnabled` remains **false** by CEO gate (`shared/fellowship-launch-gate.ts`). Qualified learners complete pillars but cannot claim Fellow or diploma through UI until flip. This avoids premature credential signalling but also delays positive reinforcement and clear “pathway complete” messaging.

### 8. AHA vs Fellowship confusion

Despite copy fixes, learners and employers may still conflate **Paeds Resus Fellow** with **AHA PALS/ACLS**. Marketing, certificates, and HR interpretation need ongoing alignment.

### 9. Thin modules on some courses

Clinical audit (`FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md`, `FELLOWSHIP_WHAT_IS_MISSING.md`) notes uneven module depth across the 29-course pillar catalog. Thin content undermines transfer to bedside behaviour.

### 10. No outcome feedback loop (deaths prevented)

The platform does not close the loop from Fellowship completion → measured reduction in preventable paediatric deaths or serious harm at facility level. KPIs are activity- and completion-based.

**Risk:** Cannot honestly claim “lives saved” from Fellowship completion alone.

---

## What WOULD help (roadmap — not all implemented)

| Intervention | Role |
|--------------|------|
| **Skills checklists / video OSCE** (sampled or required for Fellow) | Bridge knowledge → psychomotor competence |
| **Facility readiness bundle** | Drug/defib/airway audit + team BLS drill log |
| **Mentorship / preceptor sign-off** | External validation of cases and reflection |
| **Refresher cadence** | Expire stale micro-course knowledge (2-year certs exist; pathway refresh policy TBD) |
| **Case debriefs** | Structured post-event learning tied to ResusGPS cases |
| **MOH / institutional partnership** | Accredited facilities list with governance, not league tables |
| **Outcome surveillance** | Aggregate Care Signal + MOH data with rigorous methodology (future) |
| **Enforced ResusGPS depth** | Automated reject of trivial sessions; admin audit dashboards |
| **Enable Fellow title only after §11 + counsel** | Credential honesty when `fellowTitleEnabled` flips |

---

## Answers aligned with learner Q&A (`/fellowship/why`)

| Question | Honest answer |
|----------|----------------|
| Does passing summative exams make me a safe clinician? | **No** — knowledge only. |
| What does Fellow mean for my patients? | Pathway completion attestation, not outcome guarantee. |
| How do I turn course work into lives saved? | Bedside practice, team systems, reporting, adaptation — not pass rate alone. |
| What is Care Signal measuring? | Reporting discipline / QI culture proxy. |
| What if my hospital lacks drugs/equipment? | Adapt with LMIC content; do not perform unavailable interventions. |

---

## Engineering gates (unchanged by this doc)

- **`fellowTitleEnabled`:** remains `false` until CEO enables after §11 checklist + counsel (`shared/fellowship-launch-gate.ts`).
- **Claim UI:** `claimGraduation` exists; learner UI on dashboard when qualified + flag on.
- **Copy source of truth:** `shared/fellowship-learner-content.ts`.

---

## Related documents

- [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md)
- [FELLOWSHIP_WHAT_IS_MISSING.md](./FELLOWSHIP_WHAT_IS_MISSING.md)
- [FELLOWSHIP_LEARNER_GUIDE.md](./FELLOWSHIP_LEARNER_GUIDE.md)
- [PLATFORM_SAFETY_GAPS.md](./PLATFORM_SAFETY_GAPS.md) (B2 certificate ≠ competence)
