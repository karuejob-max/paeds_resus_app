# Global Search System Audit

**Date:** 2026-09-28  
**Scope:** Global navigation search, CPD presenter search, facility/KMHFL autocomplete, recommendation search, and native mobile search surfaces.  
**Method:** Read-only source audit, call-site tracing, route comparison, focused test execution, and review of authorization, reliability, mobile, accessibility, and operational contracts. No application code or production data was changed.

## Executive conclusion

The platform does not have one search tool. It has at least four distinct search families:

1. **Global navigation search** — fast, local, curated route index.
2. **CPD presenter search** — remote, institution-scoped directory lookup.
3. **Facility/KMHFL autocomplete** — remote onboarding/facility registry lookup.
4. **Recommendation/content search** — currently process-local and effectively inert in the repository.
5. **Native mobile search** — protocol and drug/indication filtering with separate implementation and limited test coverage.

There is no confirmed P0 issue. However, the following are release-blocking or near-release-blocking concerns:

- **P1:** CPD presenter search authorization is weaker than its registered capability contract and can expose platform-account name/email data to read-only CPD roles.
- **P1:** Recommendation search has no durable content/index feed and stores state only in process memory.
- **P1:** Recommendation endpoints accept a caller-selected `userId`, creating a horizontal-access risk.
- **P1:** KMHFL selection is not a canonical persisted facility identity and is currently not an authoritative registry workflow.
- **P1:** GlobalSearch performs a second, inconsistent filtering pass that can hide results the platform index correctly matched.
- **P1:** GlobalSearch remains available during active ResusGPS care and can navigate a clinician away from active guidance without a leave/resume transition.

The recommended approach is **not a rewrite**. It is an incremental hardening programme: fix authorization first, make remote lookups low-resource safe, consolidate route/search metadata, then add release-enforced tests and smoke checks.

---

## What is already working

### Global navigation search

- Local curated index with no remote dependency for ordinary navigation.
- Fast in-memory filtering suitable for low-bandwidth hospitals.
- Authenticated, role-restricted, and admin-restricted entries are filtered before rendering.
- Curated hrefs currently resolve to declared application routes in the static audit.
- Results are grouped and keyboard-selectable.
- Route-level gates remain the actual authorization boundary; the client index is not the sole security control.

### CPD presenter search

- Requires authentication, institutional access, and product capability checks.
- Member/staff results are scoped to the requested institution.
- Department-scoped coordinator searches preserve department restrictions, including empty department assignments.
- Results are deduplicated by user ID.
- Session creation resolves the presenter server-side before persisting the record.
- Canonical department resolution exists in the institution-learning directory path.

### Facility/KMHFL search

- Uses parameterized database queries, so the current LIKE construction is not SQL injection.
- Query length and result count are bounded.
- Fails closed when no database connection is available.
- Manual entry remains possible as a fallback.

### Test foundation

Focused tests currently pass for the main existing search building blocks:

- Platform index tests.
- SearchableDropdown behavior tests.
- CPD presenter scope tests.
- Facility autocomplete basic behavior.

The focused audit run recorded **3 files and 16 tests passed**. The standard repository unit suite was previously passing at **196 files and 984 tests** after the notification release work.

---

# Findings by priority

## P1 — Fix before relying on search operationally

### 1. CPD presenter-search authorization is too broad

**Evidence:**

- The capability registry maps presenter search to `cpd.sessions.operate`, whose required role is CPD Coordinator.
- The endpoint itself checks the broader `cpd.workspace.read` capability and uses a default role set that includes coordinator, education coordinator, reviewer, reporter, and viewer.
- Non-department-scoped callers can reach the platform-user query, which returns names, email addresses, cadres, and other profile fields for non-member accounts.

**Clinical/operational impact:**

A read-only CPD reviewer, reporter, or viewer may enumerate workforce identity data that is not needed for their role. This is a strict tenant/privacy boundary failure and creates a worse exposure once search data becomes more persistent or observable.

**Required fix:**

- Enforce the same policy as the capability registry.
- Restrict platform-wide presenter lookup to the exact presenter-management roles.
- Consider denying read-only roles entirely, or limiting them to the active institution directory with minimal display fields.
- Add direct endpoint tests for:
  - Anonymous caller.
  - Cross-institution caller.
  - Viewer/reporter/reviewer.
  - Inactive coordinator.
  - Full institutional CPD coordinator.
  - Departmental coordinator with assigned departments.
  - Departmental coordinator with an empty assignment.

### 2. Recommendation/content search is effectively inert and process-local

**Evidence:**

- `server/search-recommendations.ts` stores the search index, preferences, interactions, and course database in JavaScript `Map` instances.
- `indexContent` has no production call site in the repository.
- State disappears on process restart and is not shared across instances.
- The service can return successful-looking empty responses and placeholder statistics.

**Impact:**

Learning search and recommendations cannot be treated as a reliable platform capability. Empty results may look like a genuine absence of content rather than a missing index or degraded service.

**Required fix:** Choose one deliberately:

1. **Short-term safe option:** disable or feature-flag the endpoint until it has a supported catalogue and durable index; return an explicit “search unavailable” state rather than a misleading empty success.
2. **Durable option:** connect it to published course/content records, build an idempotent index, persist preferences/interactions with retention rules, add visibility/tenant predicates, and expose index health/coverage metrics.

Do not keep the current in-memory implementation as if it were production search.

### 3. Recommendation endpoints accept a caller-selected user ID

**Evidence:**

`getRecommendations` and `getUserPreferences` accept an optional `userId` and resolve `input.userId || ctx.user.id` without an explicit equality, admin, support-role, or tenant check.

**Impact:**

Any authenticated user who can guess another numeric user ID may request another user’s preference-derived data. The current in-memory storage limits present impact, but the API contract is unsafe and becomes a clear privacy incident when storage is made durable.

**Required fix:**

- Remove `userId` from self-service procedures.
- Always use `ctx.user.id`.
- If staff access is genuinely needed, create separate named procedures with explicit role, tenant, minimum-field, and audit requirements.

### 4. KMHFL facility selection is not a canonical identity

**Evidence:**

- The facility table has a surrogate ID, mutable name, nullable code, and no source-owned unique identity constraint.
- Seed data is described as representative and is inserted without an idempotent source upsert.
- Onboarding persists institution name and registration number rather than a canonical selected KMHFL facility reference.
- Operational status is not used to prevent retired/inactive facilities from appearing.
- Project documentation identifies official KMHFL layering as future work.

**Impact:**

The platform cannot reliably distinguish a verified facility from copied display text. Re-seeding can create duplicates, renamed or closed facilities can remain selectable, and facility-level reporting/authorization can drift.

**Required fix:**

- Add an immutable source-owned KMHFL identifier/code.
- Add uniqueness after cleaning existing collisions.
- Persist the selected canonical facility reference separately from editable display name and registration number.
- Add provenance, source version, last verified/synced time, and active/retired lifecycle.
- Implement idempotent official ingest/upsert.
- Until then, label the list as a non-authoritative sample and require manual confirmation rather than implying registry verification.

### 5. GlobalSearch has inconsistent double filtering

**Evidence:**

The platform index matches label, description, href, keywords, and category. The subsequent cmdk filter receives a value containing only label, href, and keywords. A description-only match such as `bedside` → ResusGPS can therefore be found by the index and then hidden by cmdk.

**Impact:**

A clinician can receive a false “No results found” outcome for a valid clinical navigation concept, reducing trust in the tool.

**Required fix:**

- Make the platform index the single filtering authority by setting cmdk filtering off, or pass the complete normalized search text—including description and category—to cmdk.
- Add regression tests for description-only, category-only, keyword, case-insensitive, Enter, Escape, and no-result behavior.

### 6. GlobalSearch can interrupt active ResusGPS care

**Evidence:**

- Header mounts GlobalSearch for all routed pages.
- GlobalSearch registers document-wide Ctrl/Cmd+K.
- Selecting a result immediately navigates away.
- There is no active-care route exception, confirmation, return-to-session link, or resume context.

**Impact:**

An accidental shortcut or selection can pull a clinician away from active bedside guidance. Actual loss of clinical state was not established, but interruption risk is confirmed.

**Required fix:**

On active `/resus` care screens, either:

1. Suppress the global palette and shortcut entirely; or
2. Replace it with a tightly scoped clinical find function; or
3. Require an explicit “Leave active guidance?” transition and preserve a one-tap return to the exact session and step.

The core emergency flow must remain stable: open app → enter findings → receive next actions → reassess.

---

## P2 — High-value hardening

### 7. Remote presenter search is not low-resource safe

Current behavior includes:

- Eager initial queries.
- Empty-query directory loading.
- Request on each typed change.
- No tested debounce or cancellation policy.
- Up to 250 final results.
- No explicit loading/error/retry state in the shared selector.

**Required fix:**

- Use a 2–3 character minimum for remote lookup, except for an explicitly authorized small recent/selected list.
- Debounce approximately 250–300 ms.
- Cancel or supersede stale requests.
- Lower and document the server result cap, likely 25–50 pending measured need.
- Preserve the selected record while a new query is loading.
- Distinguish loading, no results, unavailable, and retryable error.
- Add constrained-network and rapid-typing tests.

### 8. Presenter result ordering and department labels are unstable

The server performs independently capped member/staff queries, has no deterministic `orderBy`, and can truncate large institutions unpredictably. The returned department label can be stale free text even when a canonical department ID exists.

**Required fix:**

- Stable order: normalized display name, then user ID.
- Prefix/exact match ranking before substring match.
- Cursor or explicit pagination metadata.
- Canonical department display from `facilityDepartmentId`.
- Explicit legacy-fallback label when only old text exists.
- Revalidate eligibility at submission.

### 9. KMHFL autocomplete is unranked and likely inefficient at scale

The query uses leading-wildcard LIKE matching, has no escaped LIKE semantics, no prefix/code/county ranking, no deterministic ordering, and sends a request for every non-empty input change.

**Required fix:**

- Trim and normalize input.
- Escape `%` and `_` when wildcard matching is intended.
- Require 2–3 characters.
- Debounce and cancel requests.
- Search normalized name, official code, and county.
- Rank exact/prefix/code matches first.
- Add stable ordering and a clear capped-result message.
- Measure representative `EXPLAIN` plans before selecting a prefix/full-text strategy.

### 10. Facility autocomplete can show stale results after errors

The client does not consistently surface error state and can retain results associated with a previous query after a failed request.

**Required fix:**

Bind results to the normalized query key that produced them. Clear or hide stale results when the query changes or errors. Show an accessible retry state that distinguishes no matches from unavailable search. Keep manual entry as an explicit fallback requiring confirmation.

### 11. Global index and route metadata are fragmented

Header navigation, App route declarations, GlobalSearch, and `navigationFilter.ts` do not share one registry. Search omits or inconsistently represents live destinations including Code Signal, Learning Guide, My CPD/records, and Professional Profile. Instructor portal visibility also differs between the index and Header entitlement logic.

**Required fix:**

Create one typed navigation/search registry with:

- Unique ID.
- Label and description.
- Route/deep link.
- Category.
- Owner.
- Audience/workspace.
- Role/entitlement predicate.
- Synonyms/keywords.
- Active/inactive status.
- Clinical interruption policy.

Use it to generate or validate Header navigation and GlobalSearch. Retire `navigationFilter.ts` if it is no longer used, or reconcile it into the registry. Keep server and route guards authoritative.

### 12. SearchableDropdown semantics and labels need correction

The combobox role and expanded state are attached to a wrapper rather than the focusable input. The listbox relationship is incomplete. CPD labels do not reliably connect to the actual control because the selector has no input ID contract.

**Required fix:**

- Give the actual focusable control the correct combobox semantics.
- Provide stable `id`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, and listbox/option IDs as applicable.
- Accept `id`, `aria-describedby`, and label props.
- Add keyboard and screen-reader assertions.

### 13. Mobile and native search are under-tested

The web selector has no real-device or assistive-technology test. Expo protocol and drug search have separate implementations with no meaningful mobile test lane.

**Required fix:**

- Web mobile viewport/touch smoke test for GlobalSearch and presenter selection.
- Keyboard tests: arrows, Enter, Escape, focus restoration, Backspace/Delete.
- Axe or equivalent semantic checks where compatible.
- React Native tests for protocol/drug filtering, no results, accessible labels, and navigation.
- One TalkBack/VoiceOver validation per release train.

---

# Recommended implementation order

## Phase 0 — Contract and safety baseline

1. Restrict CPD presenter search to the exact presenter-management capability/roles.
2. Remove caller-selected `userId` from recommendation self-service procedures.
3. Add direct authorization tests for CPD search and recommendations.
4. Disable or clearly mark recommendation search as unavailable until its index is real and durable.
5. Add active-care protection to GlobalSearch.

## Phase 1 — Search correctness

1. Remove cmdk’s second filter or provide the complete searchable value.
2. Create the typed navigation/search registry.
3. Add route/duplicate/visibility table-driven tests for every indexed item.
4. Add missing high-value destinations with correct workspace predicates.
5. Reconcile or remove the dead `navigationFilter.ts` map.

## Phase 2 — Low-resource remote lookup

1. Debounce and cancel presenter and facility requests.
2. Add minimum query length and bounded result caps.
3. Add loading, no-result, error, retry, and stale-result handling.
4. Stabilize ordering and canonical department/facility display.
5. Add response-size and query-count integration tests.

## Phase 3 — Registry and facility identity

1. Introduce canonical KMHFL source identity and unique constraints.
2. Persist institution-to-facility reference.
3. Build idempotent official ingest and retired/stale handling.
4. Add provenance and verification timestamps.

## Phase 4 — Release readiness

1. Add required search unit/integration CI lane.
2. Add staged smoke with least-privilege accounts.
3. Add mobile viewport/touch smoke.
4. Define and measure constrained-network p95 latency.
5. Add privacy-safe telemetry for error rate, latency, zero-result rate, and result counts—not raw sensitive queries.

---

# Search Definition of Done

Any change affecting search, autocomplete, route catalogs, roles, staff directories, facility data, or mobile filtering is incomplete until all applicable criteria pass.

## Contract

- Every indexed item has a unique ID, valid route/deep link, owner, category, audience, and deterministic matching behavior.
- Duplicate IDs/hrefs and invalid routes fail CI.
- Search index and visible navigation do not silently diverge.

## Authorization

- Server enforcement—not UI hiding—covers role × institution × department × entitlement.
- Unauthorized requests return no sensitive result data.
- Empty-query behavior is explicitly authorized or rejected.
- Cross-workspace and cross-institution tests pass.

## UX and accessibility

- Search has a clear name and scope.
- Keyboard and touch selection work.
- Escape closes and restores focus.
- Selected, loading, no-result, error, retry, and stale-result states are distinct.
- Mobile viewport and accessibility semantics are tested.
- Active ResusGPS guidance cannot be interrupted without an explicit safe transition.

## Reliability and performance

- Remote lookup has minimum input, debounce, cancellation, bounded payload, and deterministic result ordering.
- Offline, timeout, and out-of-order response behavior is safe.
- A constrained-network p95 latency budget is defined and measured.
- Large directories use pagination or a documented capped result strategy.

## Operations

- Focused search tests run in required CI.
- A least-privilege staging smoke runs after deployment.
- Production telemetry tracks latency, error, and zero-result rates without storing sensitive raw queries.
- Migration/index changes are idempotent and have rollback/recovery instructions.
- A named owner is responsible for search catalog, authorization policy, and incident response.

---

# Audit limitations

- No authenticated staging or production browser session was used.
- No real-device TalkBack, VoiceOver, iOS, or Android validation was performed.
- No production row counts, query plans, latency, error rates, or network telemetry were available.
- Official KMHFL source credentials/export were not available, so source completeness and accuracy were not independently verified.
- One security/performance audit track was stopped by a tooling safety guard before completion; the authorization conclusions above are supported by the independent server/data and test-contract audits and should still be confirmed with direct endpoint tests.
- No repository files other than this audit document were modified.
