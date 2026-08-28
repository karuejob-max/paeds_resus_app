## Summary

This follow-up fixes two blockers found during the live NERP campaign review.

First, `/programs/nerp-acls/start` no longer sits behind the workspace-sensitive institution redirect. A provider account that is currently viewing an institutional workspace can now reach the learner-facing NERP entry page. The page remains own-account protected and does not expose institutional data.

Second, IERP intern evidence and nursing credentials are now explicitly independent. A regulatory licence submission accepts an authoritative active institutional nurse record or an existing registered-nurse identity in addition to the existing licensed provider type. The server still requires licence number, expiry date, and private evidence. The intern profile remains intact and is never replaced. The UI explains that users should submit Nursing Council credentials in Professional credentials rather than overwrite their IERP intern profile.

## Safety boundaries

- NERP progression remains BLS cognitive first, then ACLS cognitive.
- IERP records and credentials remain separate; no IERP data is deleted or changed.
- The change does not alter IERS permissions, institutional roster visibility, or campaign audience boundaries.
- No campaign draft, recipient snapshot, or email is created by this change.
- Production migration 0146 is already applied and verified; no new schema migration is required.

## Validation

- Focused NERP, pathway, and registered-nurse classification tests: **24 passed**.
- Targeted project-configured TypeScript check: **passed**.
- Vite client build: **passed**.
- Server esbuild bundle: **passed**.
- `git diff --check`: **passed**.

## Operational gate

Do not send the NERP campaign until this correction is deployed and the live admin preview is reloaded. Review the corrected `/programs/nerp-acls/start` destination in the rendered message, confirm the final opt-out-filtered recipient count, and request a separate final send confirmation only after those checks pass.
