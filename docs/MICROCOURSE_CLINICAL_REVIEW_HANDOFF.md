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

**Production DB (required once after PR #107 deploy):** Code on `main` does **not** auto-seed production. Learners still see **old** module HTML and quiz rows until this runs.

| Where | Command |
|-------|---------|
| **Render Shell** (preferred — `DATABASE_URL` already set) | See chunked commands below |
| **Local** (CEO machine only — same Aiven URI as Render in `.env`, never commit) | Same commands with production `DATABASE_URL` |

**Chunked seed (avoids ETIMEDOUT on long runs):**

```bash
pnpm run seed:fellowship-content:p0          # dka, SE, asthma (6 courses)
pnpm run seed:fellowship-content:respiratory # pneumonia-i/ii
pnpm run seed:fellowship-content:shock       # septic/hypovolemic/cardiogenic/anaphylaxis
pnpm run seed:fellowship-content:infectious  # meningitis, malaria
pnpm run seed:fellowship-content:trauma      # trauma, burns
pnpm run seed:fellowship-content:metabolic   # aki-i, anaemia-i
# Or single slug: pnpm exec tsx --import dotenv/config scripts/seed-fellowship-content.ts --only=status-epilepticus-i
# Or full catalog: pnpm run seed:fellowship-content
```

**P0 seed verified 2026-05-30:** `dka-i`, `dka-ii`, `asthma-i`, `asthma-ii` succeeded from agent env. **SE slugs corrected:** use `status-epilepticus-i` / `status-epilepticus-ii` (not `se-i`).

Expect log lines `Processing: …` per catalog course and `Seeding complete!` at the end. Idempotent: safe to re-run. Does **not** replace `ensure-paediatric-septic-shock-catalog` runtime HTML for legacy PALS paths; fellowship player content comes from this seed + `server/data/micro-courses-*.ts`.

**Not in CI:** No GitHub Action or Render deploy hook runs this today (intentional — production DB writes need explicit ops approval). To automate later: optional manual workflow_dispatch with production secrets — do not add silent auto-prod writes without CEO sign-off.

**Connectivity:** If `ETIMEDOUT` from a desktop, use Render Shell (same region as API) or allowlist your IP on Aiven.

---

## Micro-courses touched (content / catalog / exams)

| Course ID | Changes |
|-----------|---------|
| `dka-i`, `dka-ii` | mmol/L, fluids conflict, insulin until ketosis resolving; Level titles |
| `status-epilepticus-i`, `status-epilepticus-ii` | Benzo intl/Kenya/neonate; Level titles |
| `asthma-i`, `asthma-ii` | Level 1/2 titles; dex/pred/hydrocortisone; status asthmaticus steroids + IV salbutamol note |
| `septic-shock-i`, `septic-shock-ii` | Pass 2 CST content + vasopressor module (II authored for seed) |
| `pneumonia-i/ii`, shock family, anaphylaxis, meningitis, malaria, trauma | Pass 2 CST snippets (WHO/Kenya, FEAST, artesunate, adrenaline/epinephrine) |
| All fellowship seeds | Diagnostic + summative quiz pair; disclaimer footer |

---

## ResusGPS files changed

- `client/src/lib/resus/dka-engine.ts`
- `client/src/lib/resus/status-epilepticus-engine.ts`
- `client/src/lib/resus/abcdeEngine.ts` (active seizure / DKA branches)

---

## CEO click-test checklist (paedsresus.com)

**Clinical safety record:** [FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md](./FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md) (2026-05-30)

1. **Fellowship → DKA 1** — diagnostic appears first; complete modules one-at-a-time; formative after each module; summative requires ≥80%; certificate only after pass.
2. **Diagnostic** — submit once; confirm no retake button on second visit.
3. **Summative fail** — score &lt;80%; retry blocked &lt;24 h (message shows retry time).
4. **ResusGPS** — hyperglycaemia + active seizure paths show mmol/L / midazolam–lorazepam–diazepam framing and neonate benzo warning.
5. **Asthma 1** — module text lists dexamethasone, prednisolone, hydrocortisone.
6. **Status Epilepticus 1** — intl vs Kenya table; neonate callout visible.
7. **Septic Shock 2** — vasopressor module loads; summative exam present.
8. **Pneumonia 1** — WHO/Kenya antibiotic conflict box visible.
9. **Malaria 1** — artesunate (not artemether) for severe disease; hypoglycaemia in mmol/L.
10. **Catalog titles** — no “Level 1/2”; use “DKA 1”, “Asthma 2”, etc.
11. **Meningitis 1 / Trauma 1** — three modules each; formative ≥3 questions tied to module teaching.
12. **Burns 2 / Cardiogenic Shock 2** — eschar/referral/infection and inotrope/Kenya depth visible.
13. **ResusGPS** — burns exposure path; malaria artesunate note on fever; SpO₂ ≥90% harmonised strings.

---

## Known limitations / backlog

| ID | Item |
|----|------|
| DB seed | Run chunked fellowship seed on production after Pass 3 merge (meningitis, trauma, burns-ii, cardiogenic-ii batches) |
| Catalog v2 | **Deferred (CEO):** `anaemia-ii`, `aki-ii` Level 2 courses — MECE v1 fellowship pillar complete at 27 courses |
| Content | Pass 3 P2 remediation merged — CEO live click-test pending |
| Gamification | Badge auto-award on micro-course complete — optional follow-up (`gamification` router exists) |
| Interactive seed | `seed-interactive-content.ts` still splits quizzes per module — fellowship seed is canonical for exam pair |

---

## Verify commands (engineering)

```text
pnpm run check
pnpm run test:unit
pnpm run seed:fellowship-content   # staging or production DATABASE_URL only
```

Targeted: `shared/microcourse-exam-policy.test.ts`, `server/lib/microcourse-exam-gate.test.ts`
