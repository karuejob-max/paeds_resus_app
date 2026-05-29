# Micro-course clinical delivery — CEO handoff

**Date:** 2026-05-29  
**Sign-off:** **Pending CEO post-deploy review** at https://www.paedsresus.com  
**CST:** [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md)  
**Governance:** [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md)

---

## What shipped (engineering)

1. **Clinical Source of Truth** — condition spines (DKA, SE, asthma, shock family + summary table).
2. **Exam model** — diagnostic baseline (no retake) → modules → summative (80%, 2× retry after 24 h) → certificate gate.
3. **P0 content** — DKA (mmol/L, fluids, insulin/ketones), SE (intl/Kenya/neonate), Asthma Level 1/2 titles and steroids.
4. **ResusGPS alignment** — `dka-engine.ts`, `status-epilepticus-engine.ts`, `abcdeEngine.ts` seizure/DKA strings.
5. **Seed pipeline** — `scripts/seed-fellowship-content.ts` writes diagnostic + summative quizzes and governance footer on modules.

**Production DB:** Run `pnpm exec tsx scripts/seed-fellowship-content.ts` against production after deploy to refresh module HTML and exam rows.

---

## Micro-courses touched (content / catalog / exams)

| Course ID | Changes |
|-----------|---------|
| `dka-i`, `dka-ii` | mmol/L, fluids conflict, insulin until ketosis resolving; Level titles |
| `status-epilepticus-i`, `status-epilepticus-ii` | Benzo intl/Kenya/neonate; Level titles |
| `asthma-i`, `asthma-ii` | Level 1/2 titles; dex/pred/hydrocortisone; status asthmaticus steroids + IV salbutamol note |
| `septic-shock-i`, `septic-shock-ii` | Governance footer via seed (prior clinical review doc) |
| All fellowship seeds | Diagnostic + summative quiz pair; disclaimer footer |
| **Catalog** | `server/lib/micro-course-catalog.ts` titles for DKA/SE/Asthma levels |

**Remaining conditions** (pneumonia, shock II, anaphylaxis, meningitis, malaria, burns, trauma, AKI, anaemia): governance footer + exam structure via seed; full clinical rewrite tracked in CST §5 — not blocking deploy.

---

## ResusGPS files changed

- `client/src/lib/resus/dka-engine.ts`
- `client/src/lib/resus/status-epilepticus-engine.ts`
- `client/src/lib/resus/abcdeEngine.ts` (active seizure / DKA branches)

---

## CEO click-test checklist (paedsresus.com)

1. **Fellowship → DKA Level 1** — diagnostic appears first; complete modules; summative requires ≥80%; certificate only after pass.
2. **Diagnostic** — submit once; confirm no retake button on second visit.
3. **Summative fail** — score &lt;80%; retry blocked &lt;24 h (message shows retry time).
4. **ResusGPS** — hyperglycaemia + active seizure paths show mmol/L / midazolam–lorazepam–diazepam framing and neonate benzo warning.
5. **Asthma Level 1** — module text lists dexamethasone, prednisolone, hydrocortisone.
6. **Status Epilepticus Level 1** — intl vs Kenya table; neonate callout visible.

---

## Known limitations / backlog

| ID | Item |
|----|------|
| DB seed | CEO ops: run fellowship seed on production after merge |
| Content | Deep rewrite of pneumonia, malaria, trauma, etc. (CST §5) |
| Gamification | Badge auto-award on micro-course complete — optional follow-up (`gamification` router exists) |
| Interactive seed | `seed-interactive-content.ts` still splits quizzes per module — fellowship seed is canonical for exam pair |

---

## Verify commands (engineering)

```text
pnpm run check
pnpm run test:unit
```

Targeted: `shared/microcourse-exam-policy.test.ts`, `server/lib/microcourse-exam-gate.test.ts`
