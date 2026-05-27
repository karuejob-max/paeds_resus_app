# Clinical safety register (living document)

**Purpose:** Codex audit — single place to map **bedside-critical logic** to ownership, evidence, and limits.  
**Audience:** Clinical lead, engineering, QA.

## How to use

- For each **pathway** or **engine**, fill or verify: owner, guideline/source, version, last review, tests, known limits.
- **Implementation truth:** `client/src/lib/resus/abcdeEngine.ts`, `client/src/lib/resus/dose-rationale.ts`, CPR components, `client/src/__tests__/abcde-engine.test.ts`, `client/src/lib/resus/*.test.ts`.

## Core engines (initial rows — extend in PRs)

| ID | Scope | Code / tests | Owner / source (fill) | Last reviewed |
|----|--------|----------------|------------------------|---------------|
| RESUS-ABCDE | Primary survey, threats, interventions | `abcdeEngine.ts`, `abcde-engine.test.ts` | Engineering + clinical lead / PALS-style paediatric emergency refs | 2026-05-17 |
| RESUS-DOSE | Weight-based dosing display | `abcdeEngine.ts` `calcDose`, `dose-rationale.ts`, `InterventionDoseRationale` | Engineering + clinical lead / weight-band tables in repo | 2026-05-17 |
| RESUS-UNDO | Session undo/redo | `undo-manager.ts`, `undo-manager.test.ts` | Engineering | 2026-05-17 |
| RESUS-DEDUP | Duplicate medication warning | `medication-deduplication.ts`, `medication-deduplication.test.ts` | Engineering | 2026-05-17 |
| CPR-CLOCK | CPR timing / unified solo+team UI | `CPRClockUnified.tsx`, `CPRClockStreamlined.tsx`, `cpr-engine.ts`, `cpr-pack-resolver.ts`, `cpr-engine.test.ts`, `cpr-pack-resolver.test.ts` | Engineering + clinical lead / AHA PALS 2025 timing & post-ROSC norms | 2026-05-27 |

## Non–bedside training surfaces

| ID | Notes |
|----|--------|
| PROBLEM-ID | `/problem-identification` — **demo / training only**; `TrainingSimulationGate` + in-page banner; mock findings only; **not** live clinical decision support. Linked training chain: targeted solutions, reassessment, circulation (same gate). |

## Change control

- Any change to dosing tables, age bands, or default interventions should update this table **and** add/adjust automated tests where possible.
