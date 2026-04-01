# Paeds Resus — Strategic foundation

**Document type:** Canonical strategy and onboarding narrative for the repository.  
**Version:** 1.1  
**Date:** 2026-04-01  
**Status:** Active — read alongside [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) (technical and product decisions).

**Audience:** Developers, designers, clinical advisors, partners, and anyone who needs to understand **who we are**, **what problem we exist to solve**, **why the platform is shaped as it is**, and **how to judge whether a feature or initiative deserves effort**—without relying on a live briefing from leadership.

**Relationship to other docs**

| Document | Role |
|----------|------|
| [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) | **Binding** product/technical decisions: auth, roles, report definitions, deployment, priority order. |
| This document | **Strategic intent**, theory of change, clinical and systems context, ethical framing. If there is ever a tension, **technical implementation** follows PLATFORM_SOURCE_OF_TRUTH; **strategic direction** is updated here and in leadership review. |
| [CEO_Platform_Update_And_Reply_To_AI_Team.md](./CEO_Platform_Update_And_Reply_To_AI_Team.md) | Historical operational detail and Q&A with the AI team. |
| [archive/STRATEGIC_VISION_2031.md](./archive/STRATEGIC_VISION_2031.md) | **Aspirational long-range** material (multi-year targets, not near-term execution truth). Read for **direction** only; **do not** treat figures as committed or validated. See [archive/README.md](./archive/README.md). |

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [The single problem we exist to solve](#2-the-single-problem-we-exist-to-solve)  
3. [Theory of change — why one intervention is not enough](#3-theory-of-change--why-one-intervention-is-not-enough)  
4. [Low- and middle-income context — what “realistic” means](#4-low--and-middle-income-context--what-realistic-means)  
5. [Origin of the work — condensed narrative](#5-origin-of-the-work--condensed-narrative)  
6. [ResusGPS and the “right questions first” principle](#6-resusgps-and-the-right-questions-first-principle)  
7. [How the platform pieces fit together](#7-how-the-platform-pieces-fit-together)  
8. [Institutions, measurement, and “placebo therapies”](#8-institutions-measurement-and-placebo-therapies)  
9. [Safe-Truth — community voice as a diagnostic](#9-safe-truth--community-voice-as-a-diagnostic)  
10. [Illustrative system pattern — front door and triage](#10-illustrative-system-pattern--front-door-and-triage)  
11. [The Book of the Unforgotten](#11-the-book-of-the-unforgotten)  
12. [Honest success criteria — what we can claim today](#12-honest-success-criteria--what-we-can-claim-today)  
13. [Alignment with global frameworks](#13-alignment-with-global-frameworks)  
14. [Decision filter for roadmap and features](#14-decision-filter-for-roadmap-and-features)

---

## 1. Executive summary

**Paeds Resus** exists to reduce **preventable death and harm** among **sick children** in **resource-limited settings**, as **efficiently and effectively** as the real world allows.

That problem is **not** solved by a single app, a single course, or a single purchase of equipment. It is a **systems problem**: recognition, **sequence of actions**, **decisions under stress**, **escalation**, **logistics**, **training**, **institutional process**, **community behaviour**, and **feedback loops** all interact. The platform is therefore **multi-product** by design: **bedside guidance** (ResusGPS), **professional training** (including BLS/ACLS/PALS-style pathways and advanced programmes), **institutional** tools, **analytics** for learning at scale, and **parent-facing** channels (Safe-Truth) that surface realities clinicians may not see from inside the ward.

This document states that intent **explicitly** so new contributors do not mistake ResusGPS for “the whole company,” or training for “the whole solution,” or technology for “care.”

---

## 2. The single problem we exist to solve

**North star (one sentence):**  
Reduce **preventable** childhood mortality and serious morbidity in **low-resource** clinical and health-system environments by improving **what happens before and during** emergencies—not only documentation after the fact.

**Unpacking (still one problem, multiple levers):**

| Layer | What goes wrong | What we contribute toward |
|-------|-----------------|----------------------------|
| **Recognition** | Danger signs missed or late; deterioration not acted on early. | Structured prompts, training tied to real decisions, institutional triage thinking. |
| **Sequence** | Wrong order of actions (e.g. airway vs access); no reassessment rhythm. | ResusGPS-style flows, timers, escalation prompts (product roadmap). |
| **Cognition** | Arithmetic and dosing under stress; protocol recall gaps. | Calculators, checklists, scenario-based learning after events. |
| **Authority & process** | Staff who could act wait for permission; **administrative** steps precede **clinical** urgency. | Institutional consulting patterns; advocating **triage-before-billing** and **primary-survey-driven** early care in partner facilities—not only software. |
| **Infrastructure** | Missing oxygen, access, monitoring—not “more gadgets” but **right minimum bundle** used correctly. | Guidance on **critical minimum** resuscitation resources; data on what fails in practice. |
| **Learning** | Courses completed but behaviour unchanged; mastery in class, paralysis on the floor. | Link **events** to **modules** (vision): learn **why** the tool behaved as it did after a real case. |
| **Community** | Late presentation; families bounced between facilities. | Safe-Truth and future community-facing work; listening to **guardian experience** to find system gaps. |

We do **not** claim that software alone fixes mortality. We claim that **omitting any major layer** leaves preventable deaths in place—that is the meaning of **holistic**.

---

## 3. Theory of change — why one intervention is not enough

**If everyone has PALS but children still die from predictable failure modes, certification has become a placebo** unless it changes **behaviour at the moment of care**.

**If a hospital buys monitors but waveforms and escalation practices are not used**, capital spend is a placebo.

**If staff have knowledge but organisational rules prevent decision-making** (e.g. only doctors may act, students at triage without backup), the **system** has failed.

Therefore Paeds Resus pursues a **bundle of mutually reinforcing interventions**:

1. **Point-of-care guidance** — reduce wrong sequence and missed steps (ResusGPS direction).  
2. **Training that connects to real cases** — close the gap between “knows the slide” and “does the right thing at 03:00.”  
3. **Data and feedback** — see patterns (sepsis loads, delays, device use) and improve protocols and procurement priorities.  
4. **Institutional partnership** — workflow, triage, accountability, stocking; **reimbursement vs outcomes** tension acknowledged as a real constraint to work on over time.  
5. **Community and guardian voice** — near-misses and harm stories that internal audits miss (Safe-Truth direction).

No single row replaces the others. Engineering choices should **prefer integration** (one identity, shared analytics, linked learning) over siloed tools.

---

## 4. Low- and middle-income context — what “realistic” means

Many “global” emergency and resuscitation standards assume **staffing depth, equipment, blood gas turnaround, and specialty backup** that are often absent in district and referral settings in **Sub-Saharan Africa** and similar contexts.

**LMIC realism** for this organisation includes:

- **Improvised** but lifesaving workarounds (e.g. oxygen delivery, access, feeding when commercial devices are unavailable) — documented in frontline experience.  
- **Diploma-level** nurses carrying loads that high-income systems assign to subspecialists — tools must be **usable under that reality**, not only in simulation centres.  
- **Late presentation** after multiple facility visits — improving **last-mile** care is necessary but not sufficient; **upstream** recognition and referral matter.  
- **Cost** of imported curricula and certifications — motivation for **locally tailored** training economics and content.

“Realistic” in code and UX means: **offline-aware design where possible**, **low cognitive burden**, **clear escalation language**, and **no pretence** that the app replaces **senior review**, **local policy**, or **parental consent pathways**.

---

## 5. Origin of the work — condensed narrative

The following is a **professional condensation** of leadership’s clinical path. It is included so contributors understand **why** Paeds Resus is impatient with **training-only** fixes and **technology-only** fixes.

- **Ward nursing and shared accountability:** Early experience included complex patients whose care crossed specialties. The lesson carried forward: **following orders is not the same as** abandoning **clinical judgment**—therapies must serve the patient, not the checklist blindly.

- **A sentinel case (teenager, respiratory distress, anticoagulation context):** A critically ill child’s course exposed **delay**, **fragmented follow-through**, **diagnostic closure**, and **poorly coordinated resuscitation** when arrest occurred. The case illustrated that **having drugs and imaging available** does not substitute for **timely decisions, leadership in crisis, and structured response**. Bilateral pulmonary embolism was confirmed **after** the worst outcomes—an enduring lesson in **how harm accrues across time**.

- **PICU and team building:** Return after formal PICU training included **building a stable ward team** (e.g. retention, delegated critical care on the floor when PICU capacity is adult-centric), **septic shock** as a major burden, and **progress through disciplined practice**—not through equipment alone.

- **From knowledge gaps to “knows but doesn’t act”:** Repeated observation: after teaching, **behaviour on the ward** often did not match **classroom mastery** (e.g. even basic help-seeking). That pushed the work toward **systems, prompts, and culture**—not only another slide deck.

- **Cost and fit of imported courses:** Standard international courses can be **financially and logistically** misaligned with LMIC cadres and hospitals. That motivates **training designed for local deployment** and **sustainable pricing**, integrated with the same platform that supports bedside work.

This history is **why** ResusGPS was conceived as **navigation for the clinician in the “new city”** of paediatric emergency care—assuming **basic** pharmacology and physiology, but supplying **structured questions and sequence** when stress narrows attention.

---

## 6. ResusGPS and the “right questions first” principle

**Metaphor:** Like a **GPS** for a driver who already knows how to drive, ResusGPS is meant to help a trained provider **navigate** a high-stakes pathway—not replace driving (clinical fundamentals).

**Observed failure modes in practice** (illustrative): a child **gasping** while staff hunt for a mask; a **not breathing** child while access is pursued first; **fluid overload** after boluses in evolving shock. Many such deaths are **classifiable as preventable** if **early recognition** and **correct sequence** are enforced.

**Design implication:** The first job is often **to surface the right questions and order of operations**—not to dump unstructured information. **Artificial intelligence** may eventually amplify strong clinicians, but **today** many users still need **guided questioning** and **explicit branching** so that prompts stay **safe and auditable**. AI features, when added, must remain **subordinate** to clinical governance and **traceability**.

**Intended relationship to learning:** After a real event (e.g. DKA resuscitation), the provider should be able to **return to learning** and understand **why** the tool recommended a sequence (e.g. insulin vs glucose dynamics)—so the next encounter is **better**, not only faster. The **current** product may not fully implement that loop; it remains **directional** for the roadmap.

---

## 7. How the platform pieces fit together

| Piece | Role in the holistic problem |
|-------|-------------------------------|
| **ResusGPS** | Bedside **sequence, prompts, dosing support**, and (over time) stronger **reassessment** and safety checks. |
| **Courses (BLS/ACLS/PALS, fellowship, etc.)** | **Credentialing and competence** pathways—valuable when they change behaviour; insufficient alone. |
| **Institutional** | **Deployment at scale**: schedules, cohorts, leadership visibility—partner for **workflow** change (triage, roles, stocking). |
| **Analytics / admin reporting** | **Truth** about usage and outcomes-oriented activity; must be **instrumented** honestly (see PLATFORM_SOURCE_OF_TRUTH priorities). |
| **Safe-Truth** | **Guardian-facing** channel; captures experiences that **clinical staff may not report**—essential for **system** diagnosis. |

**Naming (canonical):** **Paeds Resus** = organisation + platform. **ResusGPS** = one product. Do not merge the names in copy or architecture.

---

## 8. Institutions, measurement, and “placebo therapies”

**Institutions** are where **protocols become habit** or **die on the whiteboard**.

Paeds Resus may engage hospitals as **consulting and improvement partners**: triage design, **treat-first-stabilise** policies for emergencies, escalation roles, **minimum resuscitation bundles**, and **measurement** (time to triage, time to first intervention, etc.). **Software alone** does not close those gaps; **leadership and process** do.

A known tension: **reimbursement and billing mechanics** can dominate **outcome-focused** redesign. The organisation acknowledges that tension **openly**; solutions will be **incremental** (proof, pilots, aligned incentives where possible).

**“Placebo therapy”** in this strategy means: **any investment that looks like safety** (certificates on the wall, monitors flashing unused) **without** changing **what happens to the child in the first minutes**. Features and procurements should be judged against that standard.

---

## 9. Safe-Truth — community voice as a diagnostic

**Safe-Truth** exists because **parents and guardians** experience the **full journey**—registration queues, cash vs insurance, rudeness, delays—while **ward rounds** may only see the **final** presentation.

A **single well-documented guardian complaint** can reveal **systemic** failure: e.g. **administrative flow before clinical triage**, **casualty bypassed** for walk-in emergencies, **perceived two-tier** service by payment type. Those patterns recur across facilities; they are **not** unique to one hospital.

**Implication for builders:** Safe-Truth data and narratives are **signal** for **institutional product** and **advocacy**, not “soft stories” secondary to ResusGPS. Privacy, **consent**, and **non-exploitation** of families must govern design.

---

## 10. Illustrative system pattern — front door and triage

The following pattern is **composite** and **instructional** (drawn from real-world reports, including referral-hospital OPD flows in Kenya). It is **not** a substitute for a specific facility’s audit.

**Pattern:** A critically ill child enters a system **optimised for routine outpatient throughput**: **registration and billing** precede **clinical triage**; the **resuscitation area exists** but **walk-in emergencies** may remain in **general queues** until visibly catastrophic; **deterioration** occurs **without** continuous reassessment or **ownership** of the patient journey.

**Strategic implication:** Paeds Resus tools must **support** facilities that move toward:

- **Triage before registration** (or parallel paths for **red** emergencies).  
- **Treat first, stabilise, then bill** for life threats.  
- **Primary-survey-driven** early nursing actions where policy allows.  
- **Escalation triggers** any staff can pull.

Software can **train**, **document**, and **measure**; it cannot **replace** hospital governance. Partner-facing materials should **say so clearly**.

---

## 11. The Book of the Unforgotten

**The Book of the Unforgotten** is an **internal ethical and learning frame**: a disciplined way to remember **children who died in care** without normalising preventable loss.

**Purpose:**

1. **Moral accountability** — no death becomes invisible.  
2. **Clinical intelligence** — repeated **failure modes** (late recognition, shock trajectory, hypoglycaemia in sepsis, poor escalation) inform **curriculum and product**.  
3. **Strategy** — initiatives are tested against: *Would this plausibly have changed a trajectory documented here?*

**Ethical guardrails for the organisation and repo:**

- The Book is **not** a marketing instrument.  
- **Identifiable** patient or family details must **not** appear in public code or public docs.  
- **Blame** is directed at **systems and patterns**, not at **named individuals** in public artefacts.  
- Any **future** productisation of case memory requires **ethics review**, **consent**, and **data protection** alignment (Kenya and applicable law).

Developers may never see “the Book” as a database table—that is fine. They should still understand **why** **pattern-based** modules and **escalation** features matter.

---

## 12. Honest success criteria — what we can claim today

**Today’s platform reality** (see PLATFORM_SOURCE_OF_TRUTH): single production, **analytics instrumentation in progress**, **staging** not yet standard, **security baseline** evolving.

Therefore:

| Tier | Examples | Honest framing |
|------|----------|----------------|
| **Product and engineering** | Uptime, event instrumentation, STK/payment reliability, report correctness | **Verifiable** in logs and DB. |
| **Learning and adoption** | Course enrollments, ResusGPS session counts, institutional pilots | **Leading** indicators; tie to behaviour change with **study design**. |
| **Clinical outcomes** | Mortality, ROSC rate, time to first intervention | **Claim only** with **prospective protocols**, **baseline data**, **ethics approval**, and **transparent methods**. |

**Do not** ship marketing copy that implies **peer-reviewed mortality impact** until such evidence exists. **Do** ship **transparent** measurement plans and **humility** about causality.

---

## 13. Alignment with global frameworks

Paeds Resus aligns **directionally** with international emphasis on **emergency care systems**, **quality improvement**, and **child survival** (e.g. WHO-oriented emergency care strengthening, Essential Emergency and Critical Care approaches, and established resuscitation science such as ILCOR/AHA-family guidance—**adapted**, not copied blindly, for **local** protocols and resources).

**We are not** a substitute for **national policy**, **licensing bodies**, or **facility accreditation**. We are a **partner-level** implementer: **tools**, **training**, **data**, and **institutional facilitation** where invited.

---

## 14. Decision filter for roadmap and features

Before investing significantly in a feature or partnership, ask:

1. **Which failure mode** (recognition, sequence, escalation, process, community, resources) does this address?  
2. **Which product surface** carries it—and does it **integrate** with analytics and learning?  
3. **What would falsify** success—what metric or observation would show this **did not** work?  
4. **What is the burden** on a **diploma nurse at 03:00**—still acceptable?  
5. **Does it respect** **patient privacy**, **staff dignity**, and **local law**?

If the answer to (1) is vague, the idea is **not ready** for build.

---

## Closing

The organisation has **one** animating problem: **preventable harm to children** in settings where **resources and time** are scarce. The platform is **multi-headed on purpose**. **ResusGPS** is **not** the whole answer; **courses** are **not** the whole answer; **institutions** and **community voice** are part of the same moral equation.

Build **connected**, **measurable**, and **humble** systems—then **prove** impact with **honest** methods.

---

**Document history**

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-03-31 | Initial canonical strategic foundation for repo onboarding. |
| 1.1 | 2026-04-01 | Linked archived long-range vision doc; clarified execution vs aspirational material. |
