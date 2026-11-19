# Payment reliability repair — 20 November 2026

## Scope and priority

Baseline: actual GitHub main `17757ce0068cdc9011980bbefb365664798ca84d`, feature branch `fix/fellowship-stk-reliability-20261120`. The restored April snapshot was preserved separately and fast-forwarded before implementation. GitHub remains source of truth; ship only through a protected PR and green CI. Render Starter auto-deploys main. No schema migration, clinical-content change, credential rotation or artificial enrollment grant is included.

1. Remove arbitrary diagnostic STK prompts and enforce admin-only finance statistics.
2. Remove cross-origin mutation replay and stabilize analytics callbacks without suppressing clinical audit delivery.
3. Bind payment status to the learner's stored checkout; check previous payment before retry; keep previous attempts intact for late callbacks.
4. Persist canonical micro-course callback results using authenticated Daraja verification, amount checks, SQL row locking and duplicate protection.
5. Bound serial polling to the UI budget; handle re-renders, unmounts and consecutive transport failures accurately.
6. Normalize Kenyan 07/01/+254 numbers; use the same callback/config aliases in capabilities and the actual integration; keep zero-price access distinct from discounted paid access.

## Premortem and defenses

**Duplicate charge after a slow response:** A successful external request can time out before the browser sees it. Remove automatic replay; serialize same learner/course submissions within the current server process; persist an in-flight reservation before sending; require explicit uncertain retry after two minutes. A provider processing result remains pending. Prior checkout rows are not overwritten. This does not promise exactly-once payment across multiple application instances; a database-backed attempt lease is the future defense if horizontal scaling is enabled.

**False access grant:** Another successful checkout or a forged callback might be substituted. Polling binds learner, enrollment and stored checkout before querying. Successful callback requires matching authenticated provider outcome and valid expected KES metadata. Partial discounts stay pending until payment; a zero-percent discount does not mean free.

**Paid learner stranded or downgraded:** Micro-course enrollments do not normally have a generic payments row. The canonical callback reconciles the correct persistence spine. Completed/free rows are never downgraded by duplicate or late failure callbacks. Verification/persistence failures return retryable errors rather than falsely acknowledging a grant. Polling can recover a missed callback, but provider callback redelivery is not guaranteed.

**Browser overwhelmed:** Unstable mutation result objects changed analytics callback identity, causing effects to send again after each response. A stable callback/ref removes the loop. Polling is serial rather than overlapping intervals, has a fixed budget, and does not restart on parent callback changes. No blanket API-error suppression or rate-limit shortcut was introduced.

## Empirical baseline

Render reported GitHub `17757ce0` live on Starter with auto-deploy enabled. Production has `MPESA_ENVIRONMENT=production`, paybill `4034223`, canonical callback `https://www.paedsresus.com/api/payment/callback`, both Daraja consumer credentials and `MPESA_PASSKEY`. No credential values are recorded here.

The historical diagnostic checkout was accepted by Daraja previously. A read-only query during this repair returned HTTP 404 / `QUERY_TRANSPORT_ERROR`. That establishes neither success nor failure nor handset delivery. No new live STK prompt has been issued during the repair.

The actual authenticated production Fellowship page loaded 29 micro-courses and the current three-pillar overview. Four initial tRPC batches were observed on the same www origin, taking approximately 1.6–4.9 seconds. The earlier code still contained unsafe fallback and self-triggering analytics risks; this observation does not prove a current CORS flood or attribute slow course loading to Render's plan.

The pending lookup had a five-minute filter: inside that window it reused the checkout without resending; beyond the window it ignored old payment uncertainty. The repair removes age-only inference and queries the stored provider checkout.

## Validation and release gates

Focused callback/phone/config/ownership/transport/polling suite: **162 tests passed** before additional enrollment and HTTP regressions were added. Direct provider-checked retry suite: **13 tests passed**, including a genuine async persistence-failure defect caught and fixed by awaiting the payment helper. Production STK request-shape tests mock axios and do not charge any phone.

Full local `pnpm run ci:gate` **PASS**: check/PWA/clinical lint and audits, unit **263 files / 1,632 tests**, clinical **25 files / 399 tests**, API/enrollment regressions and production build all passed. Full check initially attempted a read-only audit using a stale inherited database configuration; connection was denied, the seed-only audit passed, and subsequent composite gate explicitly unset DATABASE_URL. No production database mutation occurred. Protected GitHub CI/merge/deployment remain pending.

Pre-merge account exercise uses the authenticated production baseline plus actual React modal/tRPC mutation mocked regression tests as an explicit non-chargeable equivalent. It must not be described as a live payment test. Post-merge production checks must confirm the exact Render commit, callback routing, removed debug endpoint and normal authenticated modal behavior.

- [x] Full local gates pass and new tests included in CI.
- [ ] Managed checkpoint saved without losing GitHub feature history.
- [ ] Protected PR merged with exact hash recorded.
- [ ] Exact merge commit is live on Render and production smoke checks pass.
- [ ] Controlled normal course payment completed on handset; receipt/enrollment verified.

## Remaining operational boundary

Only the user can supply handset/PIN confirmation. Daraja acceptance is not handset delivery or payment completion. Existing unrelated AHA/institution payment policies remain outside this focused repair; no institution launch flags or contractual gates are changed. If a new normal checkout is accepted but no handset prompt arrives, capture its checkout ID and provider result and escalate the current paybill/app delivery path to Safaricom rather than repeatedly sending prompts.

## References

Sources already checked during diagnosis: [Render API](https://render.com/docs/api), [deploy API](https://api-docs.render.com/reference/list-deploys.md), [logs API](https://api-docs.render.com/reference/list-logs.md), and [Daraja STK request guide](https://dev.to/msnmongare/m-pesa-express-stk-push-api-guide-40a2). Safaricom's public dynamic documentation did not expose the full API definition through text extraction. Preserve provider `ResultDesc` and treat transport/configuration/processing uncertainty conservatively.
