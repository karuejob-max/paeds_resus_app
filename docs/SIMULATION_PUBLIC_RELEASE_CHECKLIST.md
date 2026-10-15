# Simulation Hub public-release checklist

**Scope:** BLS, ACLS, PALS, NRP, and Heartsaver Simulation Hub
**Status:** Engineering release candidate; public clinical launch is not yet approved.
**Updated:** 2026-10-15

## What is now technically complete

- Unified course selector and course-scoped mission workspace.
- URL-authoritative scenario handoff, including stale-state protection for ACLS and NRP.
- Server-authoritative event-log attempt persistence and scoring.
- Explicit formative-versus-qualifying wording for cardiac-arrest practice.
- CPR-GPS completion boundary: save-and-review remains available above the ROSC overlay and evidence must persist before exit.
- Automated Phase 2 readiness for **ACLS, PALS, NRP, and Heartsaver** only.
- BLS simulations remain available as formative practice; BLS has no Phase 2 gate in the canonical pathway.
- Credential boundary preserved: simulation completion does not issue an AHA credential or approve Phase 3.
- Production compile and prerender pass locally with `pnpm run build`.

## Mandatory gates before public learner launch

These gates cannot be honestly replaced by unit tests or a sandbox build.

### 1. Clinical owner review — blocking

A named clinical owner must review the scenario catalog, transitions, scoring thresholds, medication/action labels, age distinctions, and all learner debriefs for each course. Record the reviewer, date, version, findings, and disposition in `docs/CLINICAL_CONTENT_GOVERNANCE.md` and `docs/WORK_STATUS.md`.

### 2. Labelled synthetic/manikin validation — blocking

Run the governed protocol on **two physical mobile devices** representing the expected facility environment. Use synthetic/manikin cases only. At minimum cover fresh start, retry, wrong action, rapid action, stale resume, poor connectivity, muted audio, small viewport, touch/drag controls, and save-before-exit. Record device/browser, viewport, observations, failures, and remediation. The existing protocol is `docs/RESUSGPS_LABELLED_SYNTHETIC_USABILITY_PROTOCOL_V1.md`; the Simulation Hub strategy also requires this validation.

### 3. Authenticated production matrix — blocking for declaring the matrix complete

For a disposable or explicitly approved learner account, run one qualifying rehearsal for each required family and record the server result:

| Course | Required qualifying evidence | Expected gate |
|---|---|---|
| ACLS | rhythm-action: 2, arrest-sequence: 2, post-ROSC: 1; each >=70% | Ready only after all 3 requirements |
| PALS | assessment: 1, rhythm-action: 1, arrest-sequence: 1; each >=70% | Ready only after all 3 requirements |
| NRP | initial-steps: 2, bradycardia: 1; each >=70% | Ready only after both requirements |
| Heartsaver | first-minutes: 1, arrest-sequence: 1; each >=70% | Ready only after both requirements |
| BLS | formative simulations only | No Phase 2 card; final pathway remains governed elsewhere |

For every course, include a negative check: one failed/below-threshold attempt must not make the card Ready. Record route, account role, selected scenario, score, attempt count, and card state in `docs/WORK_STATUS.md`.

### 4. Production deployment and data verification — blocking when applicable

- Confirm the merged commit is on `origin/main`.
- Confirm Render production has deployed the same commit and the cache-busted bundle is live.
- If the release includes schema/content changes, run the exact production migration/seed and verifier commands from a trusted Render Shell. Sandbox success is not production verification.
- Confirm no credential, payment, or Phase 3 record is created by a simulation attempt.

### 5. Accessibility and reliability — blocking for public launch

- Keyboard navigation and visible focus for every mission, scenario, action, retry, save, and exit control.
- Screen-reader names for progress bars, status badges, timers, and clinical action buttons.
- Mobile touch targets and no clipped primary action at 320–480 px widths.
- Safe recovery after refresh, browser restart, double-click, slow network, and expired session.
- Audio/visual cues remain optional and never carry the only clinical meaning.

### 6. Operations — blocking for an open public release

- Incident owner and escalation channel are documented.
- Support response exists for a stuck rehearsal, incorrect score, lost evidence, and access/enrollment mismatch.
- Monitoring covers API errors, failed evidence saves, abandoned sessions, and unusually high score anomalies.
- Privacy/terms copy explains that this is training, not live-patient guidance, and describes event-log retention.
- Rollback and feature-disable procedure is tested.

## Definition of done for this release

The Simulation Hub is **public-launch ready** only when all blocking gates above are marked passed with evidence. Until then, it may be used for controlled engineering and supervised clinical-owner testing, but we must not market it as independently validated or as a replacement for instructors, manikins, local protocols, or AHA credentialing.

## Current honest status

- **Engineering:** release candidate; automated checks and local build pass.
- **Clinical-owner review:** pending evidence in this task.
- **Two-device labelled validation:** pending physical-device evidence.
- **Complete authenticated PALS → NRP → Heartsaver production matrix:** passed on 2026-10-15 in the authenticated `karuejob@gmail.com` session. Fresh production reloads reported PALS `3/3 Ready`, NRP `2/2 Ready`, and Heartsaver `2/2 Ready`; the fresh Heartsaver first-minutes rehearsal was server-saved at `94%`. Earlier NRP `26%` below-threshold evidence did not make the card Ready.
- **CEO/public launch sign-off:** pending, together with the clinical-owner, two-device labelled validation, accessibility/reliability, and operations gates above.
