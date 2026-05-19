# AGENTS.md — Mandatory Pre-Read for All AI Agents

> **Read this entire file before taking any action in this repository.**
> This file is the agent-facing distillation of the Platform's Source of Truth (PSOT).
> The canonical PSOT lives at `docs/PLATFORM_SOURCE_OF_TRUTH.md`. If this file and the PSOT ever conflict, **the PSOT wins**. Update this file to match.

**Last updated:** May 1, 2026 | **Owner:** Job Karue (CEO, Paeds Resus)

---

**CRITICAL INSTRUCTION FOR ALL AI AGENTS (Manus, Cursor, Codex, etc.)**

If you are an AI agent operating in this repository, you **MUST** read this file and follow its instructions before executing any task.

---

## 1. The Platform Source of Truth (PSOT)

The file `docs/PLATFORM_SOURCE_OF_TRUTH.md` is the canonical reference for the entire Paeds Resus platform. It defines who we are, what we build, our data models, and our global strategic vision.

**Before starting any work, you MUST:**
1. Read `docs/PLATFORM_SOURCE_OF_TRUTH.md` (specifically §19–22 for the holistic product ecosystem and all-agents mandate).
2. Identify which product(s) your task touches.
3. Read the canonical strategy docs linked in PSOT §21 for those specific products.

---

## 2. The Global Ambition

Paeds Resus is building toward recognition as the **global benchmark for paediatric resuscitation science in LMICs** — by WHO, Harvard, CDC, and Ministries of Health. Every technical decision you make must support this level of clinical rigour, data integrity, and institutional trust.

---

## 3. Mandatory PSOT Updates

If your work involves any of the following, you **MUST update `docs/PLATFORM_SOURCE_OF_TRUTH.md`** before completing your task:
- Adding a new product, feature, or integration point (update §19)
- Modifying the database schema or shared data spine (update §19.2)
- Changing KPI definitions or admin reports (update §8)
- Creating a new strategic document (add it to the registry in §21)

---

## 4. Non-Negotiable Data Rules

- **Never** combine Care Signal (provider QI) KPIs with Safe-Truth (parent/guardian) KPIs.
- **Never** combine Fellowship pillar data across pillars in a single metric.
- **Never** add patient identifiers to any Care Signal schema.
- **Never** treat AHA courses (BLS/ACLS/PALS) as part of the Fellowship pathway.

---

## 5. Execution Updates

Do not put execution updates, sprint plans, or weekly progress in the PSOT. Use `docs/WORK_STATUS.md` for all execution logging.

---

## 6. Brand Architecture — The Most Common Agent Error

This is the single most frequent source of mistakes. Read it once. Apply it always.

| Term | Meaning | When to use it |
| :--- | :--- | :--- |
| **Paeds Resus** | The **organisation** and the **software platform** (one brand, multiple products). | All user-facing copy, logos, copyright, social media, institutional references. |
| **Paeds Resus Limited** | The **legal entity / AHA-Aligned Training Provider**. | Invoices, certificates, training sign-up forms, WhatsApp messages about BLS/ACLS/PALS training. |
| **ResusGPS** | **One product** on the platform: real-time paediatric emergency **clinical guidance** (ABCDE flows, protocols, CPR Clock, drug calculators). It is **not** the name of the company or the whole platform. | The `/resus` route and all bedside clinical decision support references only. |
| **Care Signal** | **One product**: provider-facing incident and near-miss reporting (QI culture). | The `/care-signal` route. |
| **Parent Safe-Truth** | **One product**: parent and guardian resources. Distinct audience and tone from ResusGPS. | The `/parent-safe-truth` route. |
| **Institutional / Hospital Admin** | The hospital-facing management surface (staff, schedules, metrics, ERT). | `/hospital-admin-dashboard` and all institutional portal references. |

### The Non-Negotiable Rule (verbatim from PSOT §1):

> **Do not treat "Paeds Resus" and "ResusGPS" as the same thing.** In code, docs, and UI: say **Paeds Resus** when you mean the organisation or the whole platform; say **ResusGPS** only when you mean that specific product.

### Correct vs. Incorrect Usage:

- ✅ "Sign up for training delivered by **Paeds Resus Limited**."
- ✅ "During a Code Blue, open **ResusGPS** on your phone for bedside guidance."
- ✅ "The **Paeds Resus** Institutional Portal manages your hospital's ERT."
- ✅ "**Paeds Resus** sponsors your BLS for free."
- ✅ "Earn the title of **Paeds Resus Fellow** by completing the **Paeds Resus Fellowship**."
- ❌ "Sign up for training on **ResusGPS**." ← ResusGPS is the bedside tool, not the training system.
- ❌ "The **ResusGPS** Institutional Portal..." ← The portal belongs to Paeds Resus, not ResusGPS.
- ❌ "**ResusGPS** will sponsor your BLS..." ← Paeds Resus Limited sponsors training.
- ❌ "ADF Fellow" or "ResusGPS Fellowship" ← Use **Paeds Resus Fellow/Fellowship**.
- ❌ Using "Paeds Resus" and "ResusGPS" interchangeably in any context.

---

## 7. Platform Products (All First-Class — None Are Add-Ons)

```
Paeds Resus (Organisation & Platform)
├── Paeds Resus Limited (Legal entity — AHA-Aligned Training Provider)
│   ├── BLS (6 hours)
│   ├── ACLS (16 hours)
│   ├── PALS (16 hours)
│   └── Instructor Course (train-the-trainer)
├── ResusGPS (Product — Bedside Clinical Decision Support)
│   ├── ABCDE Assessment Flow
│   ├── CPR Clock
│   ├── Weight-Based Drug Calculators
│   └── Emergency Protocols
├── Micro-Courses / ADF (Condition-focused learning modules)
├── Care Signal (Product — Provider Incident & Near-Miss Reporting)
│   ├── Provider QI reporting (post-event, near-miss)
│   ├── Fellowship Pillar C (24 qualifying months)
│   ├── Institutional review workflow
│   └── National Aggregate Signal (MOH/WHO surveillance dashboard)
├── Parent Safe-Truth (Product — Family Safety Information)
└── Institutional Portal (Surface — Hospital Management & ERT)
    ├── Hospital Admin Dashboard
    ├── ERT (Emergency Response Team) management
    └── Facility-level Care Signal review
```

---

## 8. The Paeds Resus Fellowship — One Fellowship, Three Pillars

**There is exactly one fellowship: the Paeds Resus Fellowship.**
A provider who completes all three pillars earns the title **Paeds Resus Fellow**.

| Pillar | Requirement | Source of Truth |
| :--- | :--- | :--- |
| **A — Micro-Courses** | Complete **every** active ADF micro-course in the MECE catalog. | `certificates` / `enrollments` DB rows per course. |
| **B — ResusGPS** | ≥3 attributable cases **per taught condition** (server-side, anti-gaming). | `analyticsEvents` |
| **C — Care Signal** | 24 consecutive qualifying months of monthly reporting (EAT), with grace/catch-up rules. | `careSignalEvents` |

**Critical rules (from PSOT §17 and FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md):**

- **Fellow status is 100% automated** — no manual conferral in v1. If automation is incomplete, do not ship Fellow UI.
- **No fellowship surcharge** — fellowship is earned through platform use, not a bundled purchase. Providers pay per course/micro-course SKU.
- **BLS, ACLS, PALS are NOT required** for fellowship qualification. They are optional, standalone AHA-certified offerings on a separate track.
- **Care Signal ≠ Safe-Truth.** Care Signal is the staff incident/near-miss reporting product (fellowship pillar C). Safe-Truth is the parent/guardian product. Never mix them.
- **Do not** show "Fellow" title or fellowship progress UI until the §11 launch checklist in FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md fully passes.

**Canonical detail:** `docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md` and PSOT §17.

---

## 9. Development Guardrails (from PSOT §13)

- **Extend, don't replace.** New features plug into existing routes, tRPC procedures, admin reports, and event tracking unless there is a deliberate architectural decision.
- **Preserve the user model.** No single-role lock; preserve multi-context switching in the UI.
- **Preserve report definitions.** "This month" = EAT calendar month; "last 7 days" = rolling 7×24 hours.
- **No hardcoded credentials.** Use env vars and document in `.env.example`.
- **Never break the core emergency flow:** open app → enter findings → get priority next actions → reassessment prompts.
- **Small, reviewable changes only.** No big rewrites unless absolutely necessary.
- **Clinical content changes** require explicit approval from Job Karue before merging.
- **All changes must be pushed to GitHub** for Cursor and other developers to access.
- **Brand naming:** Always use "Paeds Resus" in user-facing copy. "ResusGPS" is reserved for the bedside clinical tool only.

---

## 10. Key Files to Read Before Major Work

| File | Purpose |
| :--- | :--- |
| `docs/PLATFORM_SOURCE_OF_TRUTH.md` | **The canonical PSOT.** Read this for any architectural or product decision. §19–22 for global vision. |
| `docs/CARE_SIGNAL_STRATEGY_AND_ROADMAP.md` | Full Care Signal strategy, audit, and implementation roadmap. |
| `docs/CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md` | Strategic analysis of Care Signal's global impact potential. |
| `RESUSGPS_DNA.md` | Core platform DNA — 7 strands, mission, success metrics. |
| `docs/STRATEGIC_FOUNDATION.md` | Theory of change, clinical origin narrative, honest success criteria. |
| `docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md` | Fellowship qualification rules, Pillar C Care Signal policy. |
| `docs/BRAND_UPDATE_PAEDS_RESUS.md` | Full brand update history (ResusGPS → Paeds Resus naming). |
| `docs/INSTITUTIONAL_BACKLOG_BOARD.md` | Current institutional feature backlog (INST-0 to INST-15+). |
| `docs/BACKLOG_BOARD.md` | Platform-wide scrum backlog. |
| `docs/CEO_Platform_Update_And_Reply_To_AI_Team.md` | CEO operational narrative. If PSOT and CEO brief conflict on product/technical decisions, update PSOT to match CEO's stated decision. |
| `CHM_GOLD_STANDARD_TEMPLATE.md` | CHM configuration as reusable institutional template. |
| `INSTITUTIONAL_OS_BLUEPRINT.md` | 4-module Institutional OS architecture blueprint. |

---

## 11. Contact & Ownership

- **CEO / Owner:** Job Karue — PICU Nurse, Entrepreneur, ERT Chair
- **Email:** paedsresus254@gmail.com
- **Phone:** +254706781260
- **LinkedIn:** https://www.linkedin.com/company/paeds-resus/
- **Website:** https://www.paedsresus.com

---

*This file must be updated whenever a major strategic, brand, or architectural decision is made. Any change to canonical decisions belongs in `docs/PLATFORM_SOURCE_OF_TRUTH.md` first — then reflected here.*

*By reading this file, you acknowledge the all-agents mandate. Proceed with your task in full alignment with the PSOT.*
