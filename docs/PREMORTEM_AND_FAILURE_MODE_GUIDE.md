# Agent Governance Guide: Premortem & Failure Mode Analysis

> **Purpose:** Mandates the Premortem Methodology, Diverse Self/User Critique, and Failure-Mode Analysis for all AI agents and engineers operating within the Paeds Resus codebase.

---

## 1. The Premortem Mandate

Before writing code or finalizing an architectural plan, every agent **MUST** perform an explicit **Premortem Analysis**.

### The Core Question
> *"Assume this feature has been deployed for 6 months and has completely failed to achieve its goals, caused data corruption, or created unmanageable operational friction. **Why did it fail?**"*

### Mandatory Premortem Steps
1. **Hypothesize Failure Modes:** List at least 3 distinct technical, clinical, operational, or UX failure scenarios.
2. **Identify Unstated Assumptions:** Uncover implicit assumptions (e.g. "users will type exact names", "network is always online", "departments never change").
3. **Design Proactive Defenses:** Implement safeguards in schema, API validation, and UI components before shipping.

---

## 2. 360-Degree Diverse Critique Protocol

Agents must actively critique inputs, plans, and implementations from four distinct vectors:

| Critique Vector | What to Challenge & Analyze |
|---|---|
| **Critique User Directives** | Identify edge cases, missing constraints, or UX pitfalls the user hasn't mentioned (e.g., spelling discrepancies in text inputs, multi-institution staff mobility). |
| **Critique Self Proposals** | Question your own initial assumptions: Is the solution over-engineered? Are there race conditions? Does it break mobile screens (<480px)? |
| **Critique Data Integrity** | Audit free-text fields vs. canonical enums/FKs; verify legacy record compatibility; ensure non-null guarantees where appropriate. |
| **Critique Clinical & Regulatory Reality** | Ensure compliance with NCK, KMPDC, and COC council requirements, clinical safety registers, and auditability. |

---

## 3. Canonical Data & System Integrity Rules

To eliminate silent failure modes:

1. **FK Auto-Linking Over String Matching:**
   - Always link records to canonical entity IDs (e.g., `presenterUserId` → `users.id`) via autocomplete, while retaining fallback text fields for external/guest records.
2. **Canonical Dropdowns for Categorical Attributes:**
   - Free-text entry for structured attributes (departments, cadres, event categories) causes database fragmentation and breaks reporting.
   - Use standard dropdowns (`CANONICAL_CLINICAL_DEPARTMENTS`, explicit enums) paired with an optional `"Other (Please specify)"` field.
3. **Immutable Historical Metadata:**
   - When a clinician presents or attends an event, snapshot their cadre and department *for that specific event* on the transaction row (`cpdEvents`, `cpdAttendees`), rather than relying solely on their current dynamic user profile.
4. **Mobile-First & Touch-Friendly UX:**
   - Dropdowns, autocomplete popovers, and navigation elements must render cleanly without clipping or horizontal overflow on small viewports (<480px).

---

## 4. Case Study: CPD Intelligence Engine Premortem

Below is the reference premortem conducted for the CPD Intelligence Engine (`PR #382` & Presenter Autocomplete):

| Hypothesized Failure Mode | Root Cause | System Safeguard Implemented |
|---|---|---|
| **Duplicate Presenter Analytics** | Admins manually type presenter names differently ("Dr. Sarah Hassan" vs "S. Hassan"), splitting internal faculty leaderboard totals. | Real-time `searchPresenters` autocomplete linking to `presenterUserId` (`users.id`). |
| **Historical Department Distortion** | Reading presenter department dynamically from `users.userDepartment` distorts historical records when a clinician transfers departments. | Presenter department is stored per-event on `cpdEvents`. Autocomplete pre-fills current department, but permits override. |
| **Council Accredited Category Loss** | General CPD tags prevent filtering CNEs (nursing) vs CMEs (medical) for annual license renewal audits. | Explicit category dropdown (`cne`, `cme`, `cpd_general`, `grand_rounds`, etc.) enforced on both creation and edit forms. |
| **Mobile Keyboard Clipping** | Standard browser select or uncontrolled popups cover autocomplete suggestions on mobile screens. | Touch-friendly relative popover container with max-height overflow bounds and badge tags. |

---

## 5. Integration into Agent Workflow

All AI agents must reference this guide when:
- Reading `PAEDS_RESUS_COHERENT_PICTURE.md` & `AGENT_AUTONOMY.md`.
- Formulating `implementation_plan.md` in Planning Mode.
- Reviewing pull requests and code modifications.
