# Critical fix playbook — all production and learner-facing bugs

**Audience:** Cursor, Manus, Codex, any agent on this repo.  
**Governance:** [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) (Definition of Done, Kolb cycle).  
**Not done until:** merged on `origin/main` + verification recorded + WORK_STATUS updated.

---

## Universal triage order

For **any** critical fix (not quiz-only):

```
1. Concrete experience  — reproduce (prod, DB, API, UI)
2. Runtime source       — what actually serves learners/users today?
3. Hotfix runtime       — DB row, env on Render, webhook, copy on main branch
4. Long-term code       — seed, source file, shared contract, test
5. PR → CI → merge main
6. Post-merge verify    — same repro path shows fix; log in WORK_STATUS
```

Use Kolb reflection (see AGENT_AUTONOMY §5): document root cause in WORK_STATUS **Critique / review** when the bug class is new.

---

## Category matrix

Each row: **verify runtime source → hotfix path → long-term code → verify on main**.

### Content / quiz (DB vs seed)

| Step | Action |
|------|--------|
| **Runtime source** | `MicroCoursePlayerDB` → tRPC `learning` → `quizQuestions` rows (not TS files at request time) |
| **Hotfix** | Idempotent `scripts/*.mjs` (e.g. `pnpm run quiz:fix-dka-fluid-bolus`) |
| **Long-term** | `server/data/micro-courses-batch-*.ts`, `scripts/seed-fellowship-content.ts`, [quiz-answer-contract](../shared/quiz-answer-contract.ts) |
| **Verify on main** | `pnpm run quiz:verify-answer --questionText "..."` → `evaluatorMatch: true` |

**Detailed appendix:** [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md) (quiz-specific steps, PR checklist, cache note).

---

### Config / env (Render vs `.env.example`)

| Step | Action |
|------|--------|
| **Runtime source** | Render dashboard env vars, `server/_core/env.ts`, production logs |
| **Hotfix** | Set var on Render (CEO/ops if secret); redeploy from `main` |
| **Long-term** | `.env.example` + docs; never commit secrets |
| **Verify on main** | `pnpm run check`; staging/prod health endpoint; document var name in WORK_STATUS |

Refs: [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md), [MPESA_CONFIG_REFERENCE.md](./MPESA_CONFIG_REFERENCE.md).

---

### Legal copy (`docs/legal` vs `client/src/legal`)

| Step | Action |
|------|--------|
| **Runtime source** | Production `/terms`, `/privacy`, `/legal/*` — UI reads `client/src/legal/` and linked routes |
| **Hotfix** | Fix client components + route text on branch; CEO review if clinical/legal substance changes |
| **Long-term** | Sync [docs/legal/](./legal/) counsel-ready docs with UI; PSOT §21 |
| **Verify on main** | Browser smoke on legal routes; `pnpm run test:unit` for consent helpers |

Refs: [legal/LEGAL_IMPLEMENTATION_INDEX.md](./legal/LEGAL_IMPLEMENTATION_INDEX.md), [LEGAL_COMPLIANCE_BASELINE.md](./LEGAL_COMPLIANCE_BASELINE.md).

---

### Payments (M-Pesa webhook vs enrollment)

| Step | Action |
|------|--------|
| **Runtime source** | `mpesaWebhookLog`, `payments`, `microCourseEnrollments.paymentStatus`, Daraja callbacks |
| **Hotfix** | Reconcile stuck enrollment via admin tools or idempotent script; fix webhook handler on `main` |
| **Long-term** | `server/routers/mpesa.ts`, enrollment routers, integration tests |
| **Verify on main** | `pnpm run test:api:enrollment`; admin M-Pesa webhook log; optional STK smoke on staging |

Refs: [MPESA_DIAGNOSTIC_REPORT.md](./MPESA_DIAGNOSTIC_REPORT.md), [MPESA_CONFIG_REFERENCE.md](./MPESA_CONFIG_REFERENCE.md).

---

### SEO (static vs SPA meta)

| Step | Action |
|------|--------|
| **Runtime source** | View source / curl for `/`, `/training/*` — `client/index.html`, `usePageMeta`, sitemap |
| **Hotfix** | Meta tags, `robots.txt`, `sitemap.xml`, JSON-LD on branch |
| **Long-term** | [PUBLIC_VISIBILITY_AND_SEO.md](./PUBLIC_VISIBILITY_AND_SEO.md), PSOT §23 |
| **Verify on main** | `pnpm run build`; fetch prod HTML for `og:title`, canonical, sitemap 200 |

---

### Clinical pathways (ResusGPS vs catalog)

| Step | Action |
|------|--------|
| **Runtime source** | ResusGPS engine + protocol JSON/TS served to `/resus`; not fellowship catalog alone |
| **Hotfix** | Engine fix + `pnpm run test:clinical` before merge; CEO approval for clinical substance |
| **Long-term** | `client/src/lib/resus/`, safety gates, [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) |
| **Verify on main** | `pnpm run test:clinical`; targeted engine test file cited in PR |

Refs: [RESUSGPS_DNA_DEPRECATION_NOTE.md](./RESUSGPS_DNA_DEPRECATION_NOTE.md), [PROBLEM_SOLVING_FRAMEWORK.md](./PROBLEM_SOLVING_FRAMEWORK.md) (diagnostic hierarchy).

---

## PR checklist (all critical fixes)

- [ ] Runtime source identified (table, file, env var, route)
- [ ] Hotfix applied or confirmed already correct (with command output)
- [ ] Long-term code/seed/docs updated on branch
- [ ] `pnpm run check` + `pnpm run test:unit` + `pnpm run build` ( + `test:clinical` if clinical)
- [ ] PR merged to `main`; merge commit hash recorded
- [ ] Post-merge verification on production or prod DB (as applicable)
- [ ] WORK_STATUS **Done** with PR link + verify summary
- [ ] Kolb reflection added to Critique if new bug class

---

## Appendix A — Quiz / content hotfix (detail)

See **[CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md)** for:

- Step-by-step DB vs seed verification
- `quiz:verify-answer` / `quiz:fix-dka-fluid-bolus` scripts
- Quiz PR checklist and cache-after-hotfix notes
- [shared/quiz-answer-contract.ts](../shared/quiz-answer-contract.ts) — value-based `correctAnswer`

---

## Related

- [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md)
- [MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md)
- [AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md)
