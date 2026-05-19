# Prompt for Manus: Unearth Hidden Opportunities on the Paeds Resus Platform

**From:** Job Karue (CEO)  
**To:** Manus (AI co-developer)  
**Purpose:** Systematically find and prioritise hidden opportunities we can tap **as the platform currently is** — without reinventing the wheel. Focus on existing assets, underused features, and quick wins that maximise effectiveness.

---

## Context you need

1. **Source of truth:** Read `docs/CEO_Platform_Update_And_Reply_To_AI_Team.md` (Part 1 and Part 2). It defines our brand (Paeds Resus; ResusGPS, Safe-Truth, fellowship as offerings), user model (multi-role, single account, provider/parent/institution), core surfaces (ResusGPS, /home, parent-safe-truth, hospital-admin-dashboard with legacy institutional-portal redirect, admin/reports), and how we work (extend don’t replace, preserve auth and infra).

2. **Recent work:** We just integrated previously unlinked pages and fixed broken buttons. See `docs/UNLINKED_PAGES_INTEGRATION.md` for what was added (routes for referral, personal-impact, kaizen-dashboard, personalized-learning, predictive-intervention, targeted-solutions, problem-identification, reassessment, circulation-assessment, course/bls, institutional-onboarding) and what was redirected or relinked (dashboard, contact, resources, footer links, etc.). So **routes and nav are now in good shape**; your job is to find the *next* layer of opportunity.

3. **Stack:** React, Vite, wouter, tRPC; Express/Node backend; MySQL (Aiven); Render deployment; www.paedsresus.com. Auth is email/password, cookie JWT, no OAuth.

4. **Constraints:** Preserve multi-role and single-account model. Don’t remove or replace existing flows unless there’s a clear reason. Prefer reusing existing pages, tRPC procedures, and admin reports. No new pages unless they’re clearly necessary to surface something that’s currently invisible.

---

## What “hidden opportunities” means

We want you to find:

- **Existing but underused:** Code, UI, or data that already exists but is hard to find, not linked, or not exposed in the right place (e.g. a tRPC procedure that’s never called from the UI; a dashboard that’s not in any menu).
- **Dead or orphaned:** Components, pages, or server routes that are never rendered or never called — and whether we should wire them in, repurpose them, or deprecate them.
- **Gaps in flows:** User journeys that start but don’t end (e.g. “Enroll” that doesn’t lead to payment or certificate), or key actions that have no visible entry point.
- **Data we have but don’t use:** Analytics events, DB tables, or admin report data that could drive a new metric, filter, or CTA (e.g. “Parents who used Safe-Truth this week” already in admin — could we surface a CTA or email list?).
- **Copy, empty states, and trust:** Placeholder text, “Coming soon,” or empty lists that could be replaced with one sentence or a link to the next step so the platform feels alive and intentional.
- **Low-effort, high-impact:** Changes that require minimal new code (e.g. one new link, one new filter, one new column in admin) but make a feature or role (provider, parent, institution, admin) noticeably more useful.

Do **not** propose large new products or full rewrites. We want **actionable, scoped opportunities** that build on what’s already there.

---

## What we want from you

Perform a **structured audit** of the codebase and product surface, then produce a single deliverable:

### 1. Audit (you can do this by exploring the repo)

- **Routes and navigation:** List every route in `client/src/App.tsx` and the main nav sources (Header, BottomNav, DashboardSidebar, Footer, `client/src/const/navigation.ts`). Note any route that is never linked from the UI, or any prominent link that goes to a redirect-only path. Flag if a role (provider, parent, institution) has no clear path to a key surface (e.g. “How does a parent get to BLS enrollment?”).
- **tRPC and server:** List the main tRPC routers and procedures (e.g. under `server/routers/`). For each procedure, note whether it’s used from the client (search for `.useQuery`, `.useMutation`, or `trpc.` usage in `client/`). Flag procedures that are never called — they’re candidates to wire into the UI or to deprecate.
- **Pages and components:** Identify pages or large components that are never mounted (no route, and no dynamic import). Similarly, note any component that looks like a “feature” (e.g. a calculator, a form, a list) that lives only inside a page with no link from anywhere else.
- **Admin reports:** Review what `/admin/reports` (and any related admin views) show. List any DB or backend data that admin could show but doesn’t (e.g. referral counts, course completion rates, protocol usage). Note any filter or export that would make the report more actionable for the platform owner.
- **Copy and empty states:** Scan for “Coming soon,” “TODO,” “0” with no explanation, or generic “No data” messages. List where a one-line explanation or a single CTA would improve trust or next-step clarity.
- **Analytics and events:** If the codebase tracks events (e.g. “pricing calculator used,” “protocol viewed”), list them and where they’re used (admin report, dashboard, or nowhere). Suggest one or two places where an existing event could drive a visible metric or CTA.

### 2. Opportunities report (prioritised list)

Produce a markdown report (e.g. `docs/MANUS_HIDDEN_OPPORTUNITIES_REPORT.md`) with:

- **Section A — Wire existing assets:** Opportunities to link, call, or surface something that already exists (e.g. “Add ‘Referrals’ to admin reports using existing `referrals` tRPC procedure”; “Link Header ‘Courses’ to `/course/bls`”; “Show Safe-Truth usage count on parent dashboard”).
- **Section B — Fix broken or incomplete flows:** Gaps where a user starts a journey but can’t complete it or doesn’t see the next step (e.g. “Enroll → Payment → Certificate” flow; “Institutional onboarding → first login to portal”).
- **Section C — Data and reporting:** Use of existing data (DB, events) to add one metric, filter, or export in admin or in a role-specific dashboard.
- **Section D — Copy and empty states:** Specific locations and suggested one-sentence replacements or CTAs so the platform feels intentional.
- **Section E — Clean-up or deprecate:** Orphaned or dead code that should be either wired in (with a suggested place) or removed to reduce confusion.

For each opportunity, include:

- **Title** (one line).
- **What’s there today** (current state).
- **What to do** (concrete, minimal change).
- **Where** (file(s) or route(s)).
- **Impact** (who benefits: provider, parent, institution, admin, or all).
- **Effort** (low / medium / high — one sentence why).

At the end, list **top 5 quick wins** (low effort, high impact) that you’d do first.

---

## How to run the audit

- Search the repo for: route definitions, `trpc.`, `useQuery`, `useMutation`, navigation configs, admin report components, and strings like “Coming soon,” “TODO,” “No data.”
- Cross-check: every route in `App.tsx` should be reachable from at least one link or redirect; every important user journey (provider hub, parent Safe-Truth, institution onboarding, enrollment, admin reports) should have a clear path from login/role switch.
- Assume the CEO doc and UNLINKED_PAGES_INTEGRATION doc are correct for “what we’ve already done”; your job is the *next* layer of opportunity.

---

## Deliverable

1. **A short summary** (2–3 paragraphs) of what you found: how many unused procedures, orphaned components, incomplete flows, and copy/empty-state issues; and the main themes (e.g. “admin could show more; enrollment flow is incomplete; several dashboards are not linked from role-specific home”).
2. **The full opportunities report** in markdown (sections A–E as above, plus top 5 quick wins).
3. **No code changes** unless we explicitly ask you to implement a subset; this task is **discovery and prioritisation** only.

Use this prompt as your full brief. If something is ambiguous, assume “extend the current platform without breaking multi-role or auth, and prefer linking existing pieces over building new ones.”
