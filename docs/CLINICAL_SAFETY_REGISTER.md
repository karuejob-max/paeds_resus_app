# Clinical safety register (living document)

**Purpose:** Codex audit — single place to map **bedside-critical logic** to ownership, evidence, and limits.  
**Audience:** Clinical lead, engineering, QA.

## How to use

- For each **pathway** or **engine**, fill or verify: owner, guideline/source, version, last review, tests, known limits.
- **Implementation truth:** `client/src/lib/resus/abcdeEngine.ts`, `client/src/lib/resus/dose-rationale.ts`, CPR components, `client/src/__tests__/abcde-engine.test.ts`, `client/src/lib/resus/*.test.ts`.

## Core engines (initial rows — extend in PRs)

| ID | Scope | Code / tests | Owner / source (fill) | Last reviewed |
|----|--------|----------------|------------------------|---------------|
| RESUS-ABCDE | Primary survey, threats, interventions | `abcdeEngine.ts`, `abcde-engine.test.ts` | TBD / local protocol + PALS-style refs | TBD |
| RESUS-DOSE | Weight-based dosing display | `abcdeEngine.ts` `calcDose`, `dose-rationale.ts` | TBD | TBD |
| RESUS-UNDO | Session undo/redo | `undo-manager.ts`, `undo-manager.test.ts` | TBD | TBD |
| RESUS-DEDUP | Duplicate medication warning | `medication-deduplication.ts` | TBD | TBD |
| CPR-CLOCK | CPR timing / team UI | `CPRClockTeam.tsx`, `cpr-engine.ts` | TBD / AHA PALS | TBD |

## Non–bedside training surfaces

| ID | Notes |
|----|--------|
| PROBLEM-ID | `ProblemIdentification.tsx` — **demo / training only**; banner in UI; not wired to live vitals. |

## Change control

- Any change to dosing tables, age bands, or default interventions should update this table **and** add/adjust automated tests where possible.
