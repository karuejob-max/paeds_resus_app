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
| **Phase guidance** | ABCDE letter progress on primary survey | No cross-phase “what to do now” | `getResusPhaseGuidance()` single headline from phase + pending interventions |
| **Mobile / bottom nav** | Fixed bottom nav for hub switching | Medication timer strip + bottom nav + safety footer compete for thumb space | Keep timer strip above nav; next-step banner sticky below top bar |

## Fellowship micro-course alignment (CST)

| Pattern | Micro-course teaching | ResusGPS before | Shipped fix |
|---------|----------------------|-----------------|-------------|
| Reassessment after bolus | Septic shock I — reassess after every 10–20 mL/kg | Reassess optional in side panel | Banner + `findInterventionNeedingReassessment` after bolus complete |
| SE benzos | Re-check GCS / ongoing seizure before repeat | Generic reassess button | Prompt: “Re-check GCS and seizure activity” |
| DKA insulin | Glucose + K+ before continuing | Not surfaced at completion | Prompt: “Re-check glucose and K+” |
| ABCDE primary | Complete letter before advancing | Letter chips only | Phase banner: “Complete {letter} — objective vitals” |
| Primary diagnosis → Pillar B | ≥3 cases per taught condition | Auto-save on primary (recent fix) | Consolidated banner + top-bar Save unchanged |

## Implementation notes

- Helpers: `client/src/lib/resus/resusGpsUxHelpers.ts` (unit tested)
- UI: `client/src/components/ResusGpsNextStepBanner.tsx`
- `fellowTitleEnabled` not changed (CEO-only)

## CEO verification on `/resus`

1. Start case → sick → complete C with shock → complete fluid bolus → **Re-check patient** banner appears (non-blocking).
2. Finish to secondary survey without primary → banner: **Set primary diagnosis for fellowship credit**.
3. Set primary (e.g. septic shock) → auto-save toast once; Save button shows saved state.
4. During intervention phase → top bar shows timer, threats, Save; MCI/protocols/docs icons collapsed.
5. Intervention sheet → threats grouped under **Circulation**, completed rows show green checkmark.
