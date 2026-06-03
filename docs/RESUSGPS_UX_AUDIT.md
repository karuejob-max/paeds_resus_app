# ResusGPS Clinical UX Audit (June 2026)

CEO mandate: reduce cognitive load for clinicians under pressure; align with fellowship micro-course patterns (DKA, status epilepticus, shock, ABCDE); keep **Save for Fellowship credit** visible.

Scope: `client/src/pages/ResusGPS.tsx`, intervention tracker sheet, top bar, notifications, reassessment flow, post-primary diagnosis / fellowship auto-credit, mobile bottom nav overlap.

## Audit table

| Area | Works well | Confusing / risky | Recommended change |
|------|------------|-------------------|-------------------|
| **Intervention tracker (sheet)** | Live status icons (pending / in progress / done); dose + rationale; fluid tracker summary; medication timers | Threats listed flat — no ABCDE grouping; collapsed by default; reassess buried inside expanded card | Group by Airway / Breathing / Circulation / Drugs; auto-expand first critical threat; done checkmarks on completed rows |
| **Intervention logging** | `intervention_started` / `intervention_completed` via `abcdeEngine`; duplicate-med guard; undo stack | Completing bolus does not surface reassessment — easy to stack boluses without micro-course “reassess after every bolus” | Prominent non-blocking “Re-check patient” nudge after key interventions; log `reassessment` event; optional “Later” |
| **Main intervention screen** | Critical actions first with Start / Done one-tap | Duplicates sheet content; no single “what now” line | Slim phase banner tied to pending critical action |
| **Sidebar / top bar** | Timer, weight, threat badge, Save always reachable | 10+ icon buttons during active resus (MCI, protocols, docs, copy) — clutter under pressure | Compact top bar during PRIMARY / INTERVENTION / arrest; secondary tools hidden until post-primary |
| **Notifications** | Fellowship save success with condition count; duplicate-med dialog | Undo/redo toasts on every tap; recording pulse banner + fellowship banner + safety alerts can stack | One consolidated next-step banner; silence undo/redo toasts; keep safety alerts separate (clinical) |
| **Reassessment flow** | Structured checks with escalation options; logs `reassessment` for Pillar B | Only visible after expanding threat + tapping small “Reassess”; no vitals prompt for metabolic/shock paths | Banner nudge with fellowship-aligned prompts (vitals, GCS, glucose); one-tap “Re-check” opens flow |
| **Post-primary / fellowship** | Auto-credit on primary + activity (`isEligibleForFellowshipAutoCredit`); co-diagnosis saved badges | Primary vs co-diagnosis role easy to miss amid differential cards | One-line “Primary drives fellowship credit”; prominent Save button retained |
| **Quick Assessment (first screen)** | Sick / not sick buttons advance phase | Labels only (Appearance • WOB • Circulation) — no actionable cues | Shipped: three cue cards + tap findings → recommendation; same `answerQuickAssessment` phase machine |
| **Phase guidance** | ABCDE letter progress on primary survey | No cross-phase “what to do now” | `getResusPhaseGuidance()` single headline from phase + pending interventions |
| **Mobile / bottom nav** | Fixed bottom nav for hub switching | Medication timer strip + bottom nav + safety footer compete for thumb space | Keep timer strip above nav; next-step banner sticky below top bar |

## Fellowship micro-course alignment (CST)

| Pattern | Micro-course teaching | ResusGPS before | Shipped fix |
|---------|----------------------|-----------------|-------------|
| Reassessment after bolus | Septic shock I — reassess after every 10–20 mL/kg | Reassess optional in side panel | Banner + `findInterventionNeedingReassessment` after bolus complete |
| SE benzos | Re-check GCS / ongoing seizure before repeat | Generic reassess button | Prompt: “Re-check GCS and seizure activity” |
| DKA insulin | Glucose + K+ before continuing | Not surfaced at completion | Prompt: “Re-check glucose and K+” |
| ABCDE primary | Complete letter before advancing | Letter chips only | Phase banner: “Complete {letter} — objective vitals” |
| Quick look (PAT) | Seriously Ill Child — appearance, WOB, circulation cues | Static bullet labels | Three tappable cue cards; dynamic sick / reassess nudge; unchanged sick/well → PRIMARY_SURVEY |
| Primary diagnosis → Pillar B | ≥3 cases per taught condition | Auto-save on primary (recent fix) | Consolidated banner + top-bar Save unchanged |
| **10 mL/kg fluid aliquots** | Septic shock I / DKA — 10 mL/kg only; not single 20 mL/kg in hyperglycaemia | Pathway copy said 20 mL/kg while engine used mixed messaging | `shock.ts`, `septic-shock-engine.ts`, `abcdeEngine` hyperglycaemia safety rule |
| **Age-adjusted vitals** | HR/RR/BP flagged vs age band | Vitals displayed without age context | `formatVitalWithAgeContext()` on post-primary vitals summary |
| **Medication duplicate guard** | Prevents double epi | False positive when fever + sepsis both list ceftriaxone pending | Exclude self; ignore pending-on-other-card; sync same-drug on complete |
| **Ceftriaxone 80–100 mg/kg** | Meningitis/sepsis CST | 80 mg/kg only in some paths | 100 mg/kg dosePerKg + meningitis copy in shock pathway + engines |
| **Bolus timer early reassess** | Reassess after bolus | 15 min timer blocked mental model | `MedicationTimerStrip`: “Bolus complete — re-check now” + Re-check button |
| **Insulin / K+ warnings** | K+ before insulin | “INSULIN RUNNING WITHOUT K+” on “DO NOT GIVE INSULIN YET” | `isInsulinAdministration()`; prospective `dka_potassium_before_insulin` guidance |
| **Definitive Care phase** | Condition therapy after primary survey | Only diagnosis save + export | `DefinitiveCarePanel` + `startDefinitiveCare()` CTA; steps from `conditionProtocols` |

## Three-part ResusGPS architecture (June 2026 CEO mandate)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│  1. CPR Clock   │     │  2. Primary Survey   │     │  3. Definitive Care     │
│  (arrest only)  │ ──► │  Quick look → ABCDE  │ ──► │  Condition protocol     │
│  CPRClockUnified│     │  INTERVENTION sheet  │     │  DefinitiveCarePanel    │
└─────────────────┘     └──────────────────────┘     └─────────────────────────┘
        │                          │                              │
        │                          ▼                              ▼
        │                   SECONDARY_SURVEY              DEFINITIVE_CARE
        │                   Set primary + co              Start definitive care CTA
        │                   Fellowship Save               Steps from CST engines
        └────────────────── ONGOING / export ────────────────────────────────
```

Entry: finish initial resus → **SECONDARY_SURVEY** → set primary (+ co) → **Start definitive care** → **DEFINITIVE_CARE** panel.

## Implementation notes

- Helpers: `client/src/lib/resus/resusGpsUxHelpers.ts` (age vitals, quick assessment, next-step banner)
- Engines: `definitive-care-engine.ts`, `septic-shock-engine.ts`, `pathways/shock.ts`, `abcdeEngine.ts`
- UI: `DefinitiveCarePanel.tsx`, `MedicationTimerStrip.tsx`, `ResusGPS.tsx`
- Docs cross-ref: `docs/CLINICAL_SOURCE_OF_TRUTH.md` § shock fluids, DKA K+, sepsis antibiotics
- `fellowTitleEnabled` not changed (CEO-only)

## CEO verification on `/resus`

1. Start case → tap concerning cue(s) → **Looks sick** nudge → **Patient looks sick** → ABCDE primary survey.
2. Undifferentiated shock → fluid step shows **10 mL/kg aliquot** (not 20 mL/kg); hyperglycaemia safety mentions cerebral oedema.
3. Fever + sepsis → Start/Done **Ceftriaxone** or **Paracetamol** without false duplicate dialog.
4. Post-primary vitals → HR 125 at age 8y shows **(high for age — expected 70–120 bpm)**.
5. Complete fluid bolus → timer shows **Bolus complete — re-check now** (not blocked until 15 min).
6. DKA case before insulin → prospective **Before starting insulin: add KCl…** (not “INSULIN RUNNING WITHOUT K+”).
7. Set primary (e.g. septic shock) → **Start definitive care** → **Definitive Care** panel with 10 mL/kg / antibiotic steps.
8. Fellowship **Save** button still visible; auto-credit unchanged.
