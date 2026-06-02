# Fellowship — what is still missing (CEO honest status)

**Date:** 2026-05-31  
**Context:** Production fellowship seed re-run after Pass 3 merge (`afc9b5f`); verify + spot-check on live Aiven DB.  
**Authority:** Synthesised from [FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md](./FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md), [MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md), [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md), [WORK_STATUS.md](./WORK_STATUS.md).

**Production seed:** After MECE v2 merge, run `seed:fellowship-content:metabolic` (includes `aki-ii`, `anaemia-ii`) + full verify — target **29 courses, 0 failure(s)**. Prior 2026-05-31 run: 27/0 before v2 catalog expansion.

---

## 1. Safe to use today

After the 2026-05-31 production seed, engineering asserts the following are **live in the production DB** and pass automated verify:

| Area | What CEO can trust |
|------|-------------------|
| **29 fellowship micro-courses** (after v2 seed) | Catalog rows + module HTML + exam triad + governance footer — excluding sample `intubation-essentials`. Includes **AKI 2** and **Anaemia 2** once metabolic batch seeded on prod. |
| **P0 harm fixes (code + DB)** | No paediatric insulin bolus in DKA teaching; K⁺ gate before insulin; artesunate (not artemether IV) for severe malaria; IM adrenaline first in anaphylaxis; early ABX in meningitis; no aggressive bolus teaching in cardiogenic shock; neonate benzo warning in SE. |
| **P1 platform fixes** | Step-through player; no “Level 1/2” in catalog titles; FEAST-aware shock fluids; mmol/L glucose framing on P0 metabolic/infectious courses. |
| **Pass 3 depth (seeded)** | meningitis-i/ii, trauma-i/ii, burns-ii, cardiogenic-ii expanded to 3 modules each; module-native formatives on expanded courses; SpO₂ harmonisation via `shared/clinical-spo2-targets.ts`. |
| **ResusGPS P0 alignment** | DKA, SE, ABCDE hyperglycaemia/seizure branches aligned to CST for bedside paths (not a substitute for local protocol). |
| **Spot-check (prod DB)** | meningitis-i: 3 modules; trauma-ii: 3 modules + MTP/damage-control content; burns-ii: 3 modules + eschar/infection depth; dka-i: mmol/L throughout + “never IV push” KCl safety box. |

**Important nuance:** “Safe to use” here means **engineering verify passed and known P0/P1 audit items are remediated in prod DB**. It does **not** mean CEO clinical sign-off, counsel review, or “Fellow title ready.”

**Pillar A scope (2026-06-02):** Progress math and learner copy use **29 fellowship pillar micro-courses** (`isFellowshipPillarMicroCourse` / catalog `isSample` on `intubation-essentials`). **`fellowTitleEnabled` remains `false`** — CEO §11 gate unchanged.

---

## 2. Not safe / not ready

| Item | Why it matters |
|------|----------------|
| **CEO post-deploy sign-off — still pending** | No recorded live click-test by clinical authority. Engineering cannot self-certify paediatric emergency teaching. Lives depend on CEO (or delegated clinical lead) walking [MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md) on **paedsresus.com**, not just DB verify. |
| **Fellow title / graduation UI — blocked** | `fellowTitleEnabled: false` in `shared/fellowship-launch-gate.ts`. Learners must not be told they are “Fellows” until §11 checklist + CEO flip. |
| **No staging clinical environment** | Content ships to production DB via manual seed. There is no CEO-safe staging mirror for pre-prod clinical review ([STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md) remains CEO-led). |
| **AHA course content — not audited** | BLS/ACLS/PALS/NRP use separate content paths (`courseContent.ts` legacy surfaces still exist). Out of fellowship CST scope but **not** guideline-audited to 2025 AHA standard in this program. Misalignment with fellowship teaching is possible if learners mix tracks. |
| **`intubation-essentials` sample row** | Published in catalog (order 29) but **excluded** from fellowship pillar and verify. If marketed as required fellowship content, that would be wrong — today it is a sample only. |

**P0 open findings:** None remaining in [FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md](./FELLOWSHIP_CLINICAL_SAFETY_AUDIT.md) after Pass 3 — **provided prod DB matches code** (re-seed completed 2026-05-31).

---

## 3. Incomplete but usable

| Item | Limitation CEO must know |
|------|--------------------------|
| **`anaemia-ii`, `aki-ii` prod DB** | Authored in code (MECE v2). **Learners do not see content until metabolic batch seed + verify on production DB.** CEO click-test should include new slugs after seed. |
| **`seriously-ill-child-i`** | Seeded via separate script (not fellowship `--batch=`). Has 7 modules + full exam triad. Audit notes **depth** vs specialty courses; cross-cutting ABCDE, not condition-specific mastery. **Not** in `FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS` — Pillar B ResusGPS credit does not map to this foundation course. |
| **Formative fairness** | Verify counts formative quizzes per module; it does **not** prove every question is module-native vs rotated summative bank. Pass 3 fixed expanded courses; smaller/older courses may still rely on bank fallback where native banks are thin. |
| **ResusGPS ↔ micro-course parity** | Pass 3 improved pneumonia, shock, trauma, burns, malaria, meningitis bedside strings. Full bedside spine for every CST row is **not** guaranteed — e.g. SE 2 RSE midazolam “IV bolus” left as ICU-context teaching (audit: acceptable in ICU, not pushed KCl). |
| **Duplicate summative rows** | Verify OK for meningitis-i/ii, trauma-i/ii with `summ=2` (idempotent re-seed artifact). Learner impact likely low but worth DB cleanup. |
| **Legal / counsel** | Privacy, terms, reconsent shipped; **counsel sign-off** and ODPC registration remain CEO/external (see WORK_STATUS Phase 1 ~95%). |
| **Care Signal / Pillar C** | Fellowship pillar C reporting loop exists; 24-month qualifying path not something learners should assume is “easy” without facility buy-in. |
| **Gamification** | Badge auto-award on micro-course complete — optional, not verified for clinical messaging. |

---

## 4. Operational gaps

| Gap | Status (2026-05-31) |
|-----|------------------------|
| **Prod seed after v2 merge** | **Pending** for `aki-ii` / `anaemia-ii` — run `pnpm run seed:fellowship-content:metabolic` then verify 29/0. Prior full re-seed: 27/0 (2026-05-31). |
| **Deploy ≠ content** | Still true: future merges touching `server/data/micro-courses-*.ts` require **manual chunked seed** — no CI/deploy hook. |
| **Seed runbook** | [AGENT_OPERATIONS_PLAYBOOK.md](./AGENT_OPERATIONS_PLAYBOOK.md) — Render Shell fallback if desktop ETIMEDOUT. |
| **CEO sign-off record** | WORK_STATUS + handoff still say **pending** — update only after CEO click-test. |
| **Production vs code drift** | **Mitigated** by today’s full re-seed. Drift returns if code merges without seed. |
| **WORK_STATUS evidence** | Pass 3 row claimed verify after re-seed on 2026-05-31 (code merge); **this** run is the post-Pass-3 prod seed with spot-check evidence logged below. |

### Verify output (2026-05-31 prod)

```text
Fellowship verify: 27 courses, 0 failure(s)
[OK] seriously-ill-child-i | mods=7 | diag=1 summ=1 formativeMods=7/7 | footer=true | levelTitle=false
… (all 27 slugs [OK]) …
[OK] meningitis-i | mods=3 | diag=1 summ=2 formativeMods=3/3 | footer=true | levelTitle=false
[OK] trauma-ii | mods=3 | diag=1 summ=2 formativeMods=3/3 | footer=true | levelTitle=false
[OK] burns-ii | mods=3 | diag=1 summ=1 formativeMods=3/3 | footer=true | levelTitle=false
[OK] dka-i | mods=3 | diag=1 summ=1 formativeMods=3/3 | footer=true | levelTitle=false
```

### Spot-check (2026-05-31 prod DB)

| Slug | modules | Formative modules (verify) | Content markers |
|------|--------:|----------------------------|-----------------|
| meningitis-i | 3 | 3/3 | Empiric ABX / early treatment spine seeded |
| trauma-ii | 3 | 3/3 | MTP / damage control present |
| burns-ii | 3 | 3/3 | eschar / infection / graft depth present |
| dka-i | 3 | 3/3 | mmol/L (13 hits); “never IV push” KCl safety present |

---

## 5. Recommended next 5 actions (prioritised by harm)

1. **CEO live clinical click-test (13 items)** — [MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md) on production URLs. **Blocks honest “clinically signed” claim.** Record pass/fail per item; file hotfixes via [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md) if anything fails in browser (DB verify is necessary but not sufficient).

2. **Do not enable Fellow title** until §11 checklist passes and CEO sets `fellowTitleEnabled`. Prevents false “qualified expert” signalling.

3. **Document learner track separation** — Fellowship pillar (**29** courses including `seriously-ill-child-i`) vs AHA (BLS/ACLS/PALS/NRP) vs sample `intubation-essentials`. Reduces wrong-protocol-at-bedside risk when users conflate products.

4. **Seed-on-release** — **Done:** production deploy auto-seeds + verify (`scripts/run-fellowship-auto-seed.mjs`). WORK_STATUS still records deploy log evidence when touching micro-course data.

5. **CEO click-test `aki-ii` / `anaemia-ii`** — After prod metabolic seed, verify RRT/AEIOU, K⁺ never-push, PD-not-first-line, transfusion thresholds, sickle/malaria co-morbidity in browser.

---

## Document control

| Field | Value |
|-------|--------|
| Author | Cursor (engineering ops) |
| CEO sign-off | **Pending** — unchanged until live review |
| Related PRs | #118 Pass 3; this doc PR TBD |
| Next update | After CEO click-test or next prod seed |
