# Payment reliability repair — 20 November 2026

## Summary

The engineering repair is merged and deployed. Code PR [#1277](https://github.com/karuejob-max/paeds_resus_app/pull/1277) merged to actual GitHub main as `f2702d16df1eabcab4372705402c68ef4324bbf6` on 19 November 2026 at 21:56:32 UTC. Render deployment `dep-dbvn14gae00c73bse02g` reported that exact commit **live** at 21:58:57 UTC, or 00:58:57 EAT on 20 November.

The live authenticated Asthma Foundational modal and non-chargeable payment boundary checks passed. A real handset prompt, PIN-authorized payment, receipt and paid course activation have **not** been verified. The browser identity is QA Duty Nurse, an ordinary individual learner, not Job's learner account; no paid enrollment was initiated for that identity using Job's phone.

## Scope and priority

Baseline: actual GitHub main `17757ce0068cdc9011980bbefb365664798ca84d`, feature branch `fix/fellowship-stk-reliability-20261120`. The restored April snapshot was preserved separately before synchronization. Actual GitHub uses the `github` remote; `origin` is the restoration remote. Subsequent annual reporting, scheduled reporting, delivery documentation and BLS capstone changes were integrated without dropping them. The merged repair tree exactly matches the final protected-tested feature head `055d9d7c8889d6b2d5b5bc5cfec92a4244f67633`.

1. Removed arbitrary diagnostic STK prompts and enforced admin-only finance statistics.
2. Removed cross-origin mutation replay and stabilized analytics callbacks without suppressing clinical audit delivery.
3. Bound payment status to the learner's stored checkout, checked previous payment before retry and kept previous attempts intact for late callbacks.
4. Persisted canonical micro-course callback results using authenticated Daraja verification, amount checks, SQL row locking and duplicate protection.
5. Bounded serial polling to the UI budget; handled re-renders, unmounts and consecutive transport failures accurately.
6. Normalized Kenyan 07/01/+254 numbers, aligned callback/config aliases with the actual integration and kept zero-price access distinct from discounted paid access.

No schema migration, clinical-content change, credential rotation, launch-flag change or artificial enrollment grant is part of this repair. Render remains the user's paid Starter service with automatic main deployment.

## Premortem and defenses

**Duplicate charge after a slow response:** A successful external request can time out before the browser sees it. Automatic replay was removed. Same learner/course submissions are serialized within the current server process, and an in-flight reservation is persisted before sending. An uncertain retry is explicit and has a two-minute cooldown. Provider processing remains pending. Prior checkout rows are not overwritten. This does not promise exactly-once payment across multiple application instances; a database-backed attempt lease is the future defense if horizontal scaling is enabled.

**False access grant:** Another successful checkout or a forged callback might be substituted. Polling binds learner, enrollment and stored checkout before querying. Successful callbacks require matching authenticated provider outcome and valid expected KES metadata. Partial discounts stay pending until payment; a zero-percent discount does not mean free.

**Paid learner stranded or downgraded:** Micro-course enrollments do not normally have a generic payments row. The canonical callback reconciles the correct persistence spine. Completed/free rows are never downgraded by duplicate or late failure callbacks. Verification/persistence failures return retryable errors rather than falsely acknowledging a grant. Polling can recover a missed callback, but provider callback redelivery is not guaranteed.

**Browser overwhelmed:** Unstable mutation result objects changed analytics callback identity, causing effects to send again after each response. A stable callback/ref removes the loop. Polling is serial rather than overlapping intervals, has a fixed budget and does not restart on parent callback changes. No blanket API-error suppression or rate-limit shortcut was introduced.

## Empirical baseline

Render initially reported GitHub `17757ce0` live on Starter with auto-deploy enabled. Production has `MPESA_ENVIRONMENT=production`, paybill `4034223`, canonical callback `https://www.paedsresus.com/api/payment/callback`, both Daraja consumer credentials and `MPESA_PASSKEY`. No credential values are recorded here.

The historical diagnostic checkout was previously accepted by Daraja. A read-only query during this repair returned HTTP 404 / `QUERY_TRANSPORT_ERROR`. That establishes neither success nor failure nor handset delivery. No new live STK prompt was issued during this repair.

The authenticated production Fellowship baseline loaded 29 micro-courses and the three-pillar overview. Four initial tRPC batches were observed on the same www origin, taking approximately 1.6–4.9 seconds. Unsafe fallback and self-triggering analytics risks remained in the old source; this baseline alone did not prove a current CORS flood or attribute slow loading to Render's plan.

The pending lookup had a five-minute filter: inside that window it reused the checkout without resending; beyond the window it ignored old payment uncertainty. The repair removes age-only inference and queries the stored provider checkout.

## Validation

The complete local `pnpm run ci:gate` passed: TypeScript/PWA checks, clinical lint and audits, unit **263 files / 1,632 tests**, clinical **25 files / 399 tests**, API/enrollment regressions and production build. The first full check attempted a read-only audit using stale inherited database configuration; the connection was denied, the seed-only audit passed, and the subsequent composite gate explicitly unset DATABASE_URL. No migration or direct production database write was executed.

The initial focused callback/phone/config/ownership/transport/polling suite passed **162 tests**. The direct provider-checked retry suite passed **13 tests**, including a genuine async persistence-failure defect caught and fixed by awaiting the payment helper. Latest-upstream full TypeScript and six focused payment/UI suites passed **60 tests**. Production STK request-shape tests mock axios and do not charge a phone.

Final protected [GitHub CI gate](https://github.com/karuejob-max/paeds_resus_app/actions/runs/44623073852/job/135909604024) passed for the exact final feature head. The optional holistic E2E job was skipped; no live paid E2E success is inferred from CI.

Pre-merge account exercise used the authenticated production baseline and actual React modal/tRPC mutation mocked regression tests as an explicit non-chargeable equivalent. Post-merge production evidence, recorded 20 November 2026 around 01:00–01:03 EAT:

- `/api/health`: HTTP 200, `ok: true`, `status: live`.
- Removed `mpesa.debugStkPush`: HTTP 404 / `NOT_FOUND` without a valid payment payload.
- Finance statistics: HTTP 403 / `FORBIDDEN` both unauthenticated and for the authenticated QA ordinary learner. The smoke initially expected 401; source inspection confirmed the deliberate admin guard returns 403, and the corrected smoke passed. No access was granted.
- Canonical callback with `{}`: HTTP 400 / `Invalid webhook payload`; no successful payment metadata was supplied.
- Authenticated `mpesa.getClientPaymentCapabilities`: HTTP 200, production, paybill `4034223`, `stkPushOffered: true`, `stkDisabledByConfig: false`.
- `/fellowship?release=f2702d16`: all 29 micro-courses loaded. Exact Paediatric Asthma: Foundational enrollment modal opened with KES 200, phone and promo fields, truthful confirmation copy, and payment availability settled.
- Empty-phone submission produced the local Kenyan mobile validation message with **zero enrollment/payment network requests**.
- Modal idle observation: **zero additional tRPC requests in 15 seconds**. One normal `events.trackEvent` request was observed when opening the modal; no event-dropping shortcut was used. All observed tRPC requests used `https://www.paedsresus.com`. Their only HTTP error was the deliberately tested 403 finance-stat denial.
- No checkout initiation, status polling with an empty checkout, handset prompt, receipt or paid enrollment grant occurred. Normal page/modal analytics are expected application activity; they are not a paid enrollment or a direct database command.

The initial managed checkpoint `5142ac09` preserves the implementation and pre-release recovery state. GitHub main and the exact Render deployment above are the production evidence, not the sandbox preview.

- [x] Full local gates pass and new tests included in CI.
- [x] Managed checkpoint saved without losing GitHub feature history.
- [x] Protected code PR merged with exact hash recorded.
- [x] Exact code merge commit live on Render and non-chargeable production smoke checks pass.
- [ ] Controlled normal course payment completed on handset; receipt/enrollment verified.

## Re-audit and Kolb reflection

**Concrete experience:** The user reported no handset prompt and an overwhelming browser console. Production course availability, real Render configuration and the historical provider query were checked rather than assuming a free-tier hosting issue.

**Reflective observation:** The source contained independent payment-integrity and browser-loop risks. Daraja acceptance could not establish handset delivery. A late or unknown payment must not be treated as failed, overwritten on retry or accepted as paid.

**Abstract conceptualization:** The critical-fix payment/config playbook and premortem require learner-bound checkout verification, conservative unknown states, durable attempt history and a single mutation send. Clinical audit delivery must remain intact.

**Active experimentation and final re-audit:** Regression tests exposed and fixed the async catch defect. Local gates and exact-head protected CI passed; all 38 repair files survived the merge. Render's exact code commit went live, and the actual Asthma modal passed capability, idle-loop and empty-phone checks. Core bedside emergency guidance and unrelated payment spines were not rewritten. The remaining handset/PIN boundary is explicitly open rather than marked complete.

## Risks and next best step

The highest-impact next step is one normal Asthma Foundational KES 200 checkout while Job is signed in to his own learner account, using `0710606854`. Confirm whether the handset prompt arrives; enter the PIN only on the handset, then verify the receipt and course activation. Do not share the PIN in chat.

If the new normal checkout is accepted but no handset prompt arrives, preserve that checkout ID and provider result and escalate the current paybill/app delivery path to Safaricom instead of repeatedly sending prompts. Existing unrelated AHA/institution payment policies remain outside this repair. Multi-instance exactly-once initiation and a durable callback retry queue remain future operational defenses, not current guarantees. CEO handset/payment sign-off: pending.

## References

Sources checked during diagnosis: [Render API](https://render.com/docs/api), [deploy API](https://api-docs.render.com/reference/list-deploys.md), [logs API](https://api-docs.render.com/reference/list-logs.md) and [Daraja STK request guide](https://dev.to/msnmongare/m-pesa-express-stk-push-api-guide-40a2). Safaricom's public dynamic documentation did not expose the full API definition through text extraction. Preserve provider `ResultDesc` and treat transport/configuration/processing uncertainty conservatively.
