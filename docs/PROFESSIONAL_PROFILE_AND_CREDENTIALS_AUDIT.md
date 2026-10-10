# Professional Profile & Credentials Audit

**Date:** 2026-10-10
**Scope:** Individual Professional Profile, My Records, regulatory licence evidence, NERP/IERP verification, and institutional verifier workflows.

## Executive finding

The platform had the right underlying credential table and verification mutation, but the user journey was mislocated and the authority model was incomplete:

- Regulatory credentials were displayed below Paeds Resus-derived Life Support credentials inside Professional Profile.
- The upload control existed in code, but the page hierarchy made it difficult to find and the form explained programme-specific exceptions instead of presenting one clear professional-record standard.
- Platform administrators and institution administrators could verify structured credentials. Departmental Heads could view scoped individuals but were explicitly blocked from viewing evidence or verifying it.
- NERP intentionally accepted pending licence review; ERCo acceptance required a verified, current licence. This distinction was clinically safe but poorly explained.
- Older profile registrations can contain `providerProfiles.licenseNumber` without a structured `professionalCredentials` record. That is not sufficient for clinical duty, but it needed a precise diagnostic rather than a generic missing-licence message.
- IERP intern deployment evidence is a separate record from a regulatory licence. It must not be treated as proof of a professional licence or as proof of clinical duty readiness.

## Authority model

| Actor | Regulatory licence evidence | IERP intern profile/deployment evidence | Scope |
|---|---|---|---|
| Paeds Resus platform administrator | Verify, reject, revoke | Verify, reject, revoke through IERP admin workflow | Platform-wide according to admin policy |
| Institutional administrator | Verify, reject, revoke | Not automatically granted by this change; IERP evidence remains a separate controlled workflow | All active staff in the institution |
| Credential manager | Verify, reject, revoke | Not automatically granted by this change | Institution-wide if assigned the credential-manager scope |
| Departmental Head | Verify, reject, revoke after this release | Not automatically granted by this change | Only active staff linked to the Head's department(s) |
| Education/CPD coordinator | View scoped accountability data | No evidence-verification authority | Department scope where assigned |
| Provider | Submit and replace own evidence; view own evidence | Submit own IERP profile/evidence | Own records only |

Verification never proves bedside competence, current shift assignment, emergency dispatch authority, or patient outcome. ERCo acceptance continues to require a verified current licence with number, first issue date, and future Valid until date.

## Implemented in this release

### 1. My Records information architecture

Professional Credentials has moved out of the long scrolling Professional Profile page into a dedicated **Professional Credentials** tab in **My Records**, alongside:

- Life Support records
- CPD records
- Fellowship records
- Professional Credentials

Professional Profile now focuses on professional identity, workplace context, and profile completeness, with a clear link to My Records for evidence and certificates.

### 2. Clear licence form

Regulatory licence submission now presents one consistent requirement:

- Licensing jurisdiction/country
- Licensing body
- Licence number
- **First Licence issued on** — explicitly the date the person first received the professional licence, not the latest renewal date
- Valid until
- Evidence upload

Accepted evidence types remain PDF, JPG/JPEG, and PNG, with the existing 5 MB limit.

Programme-specific wording about optional dates for NERP or IERP was removed from the professional-record workflow. The server now requires complete dates and evidence when a regulatory licence is submitted.

### 3. Institutional verification

The institutional accountability workspace now exposes scoped licence-review controls to authorized institution users:

- View private evidence through a short-lived storage URL
- Verify complete licence records
- Reject pending evidence with a reason
- Revoke previously verified evidence with a reason

Departmental Heads are now authorized to verify evidence for active staff in their own departments. Tenant and department-scope checks remain enforced server-side.

Institution administrators and credential managers retain institution-wide authority. Cross-institution access remains rejected.

### 4. Safer approval rules

A regulatory licence cannot be marked verified unless it has:

- Evidence file
- Licence number
- First issue date
- Valid until date

This prevents an administrator from accidentally approving an incomplete record that would later be unusable for ERCo clinical responsibility.

### 5. Legacy-record diagnosis

If a licence number exists only in the older provider profile record and no structured regulatory credential exists, the ERCo error now explains that the number must be resubmitted under Professional Credentials with evidence. The safety gate is not weakened.

## Remaining gaps / next work

### A. IERP evidence authority alignment

IERP deployment-letter and phase-1 evidence use their own router and admin review workflow. They are not the same as regulatory licence verification. If institutional users should also verify IERP deployment or phase evidence, that requires a separate decision and implementation of:

- institution-scoped IERP evidence access
- Departmental Head scope checks
- reviewer audit events
- conflict-of-interest controls
- evidence URL authorization
- separate UI labels preventing confusion with professional licensure

Recommendation: keep IERP evidence separate and add institutional review only after confirming the institution is authorized to attest to the deployment record.

### B. Verification queue usability

The current review controls are embedded in the accountability people table. A future dedicated **Credentials to review** lane should provide:

- pending-first sorting
- filters by department, cadre, status, and expiry
- reviewer workload count
- evidence preview metadata
- reason history
- duplicate/superseded record visibility

### C. Audit trail visibility

The database records verifier, time, decision, and reason. The institutional UI should later show a read-only review history to authorized administrators and the provider.

### D. Provider feedback and reminders

Providers should see a prominent status card in My Records:

- Pending review
- Verified/current
- Rejected with reason
- Revoked with reason
- Expiring soon
- Expired

Expiry reminders already exist in the broader credential system; the My Records status surface should make the next action more visible.

### E. Account-level smoke tests

Before declaring the workflow globally ready, test with:

1. Platform admin verifying a submitted licence.
2. Institution administrator verifying a staff licence.
3. Departmental Head verifying a licence in their department.
4. Departmental Head attempting to access another department.
5. Provider submitting PDF, JPG, and PNG evidence.
6. Provider submitting incomplete dates and receiving a clear validation error.
7. Provider with pending licence attempting ERCo acceptance and receiving a verification message.
8. Provider with verified current licence accepting ERCo.
9. Cross-institution evidence URL request being rejected.
10. Rejection and revocation reasons appearing to the provider.

## Safety and product conclusion

The Professional Profile should be the place for identity and workplace context. **My Records should be the place for evidence, credentials, certificates, and professional history.** This separation reduces search burden, prevents users from confusing Paeds Resus learning credentials with regulatory licensure, and gives institutional teams a controlled path to verify the evidence they are responsible for.
