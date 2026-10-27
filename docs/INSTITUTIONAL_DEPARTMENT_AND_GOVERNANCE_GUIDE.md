# Institutional Department and Governance Guide

## Where a provider updates their department

A provider updates their current institution-specific department from **Workplaces & access → Institutional department**. The provider can choose a confirmed department or subdepartment for each active institution membership and change it later when their assignment changes.

The selection is deliberately institution-specific. It updates the provider's linked institutional staff record and is used to prefill future CPD registrations. It does not change the provider's global professional identity, grant a governance role, or prove clinical competence.

The CPD registration form remains an editable safety net. It records the department context for that particular session and should not be treated as the permanent institutional assignment.

## Where an institutional administrator manages departments

Institution administrators manage the institution's canonical department registry from:

**Institution Workspace → Administration → Institution Profile / Department structure**

The existing department reconciliation/setup flow is the source of truth for the institution. It supports institution-specific departments such as **Surgery → Theatre**, local naming, activation/deactivation, and later corrections. A department must be active and confirmed before it appears in provider self-service or CPD prefill.

A department-wide selection is valid. A provider should select a subdepartment only when it is relevant to their actual work. This avoids forcing a consultant, pediatrician, or a session covering an entire department into an artificial ward or subdepartment.

## Where administrators appoint people to roles

Role appointment is separate from department selection and is managed from:

**Institution Workspace → Administration → People & Roles**

The administrator selects the person and assigns only the role required:

- **Departmental Head / deputy:** governance or departmental leadership workflow, scoped to the institution and relevant department.
- **CPD coordinator:** CPD Portal coordination, attendance, certificates, points, and reports.
- **IERS Lead / response operator / reviewer / governance / viewer:** IERS product roles, scoped by the product capability and institutional authorization rules.
- **ERCo / Assistant ERCo:** standing emergency-readiness governance appointments.
- **UTL / ERTL / dated duty:** operational assignments that still require separate acceptance and readiness evidence.

A person’s department, governance role, emergency duty, and competence evidence are different records. Updating one must not silently appoint, dispatch, certify, or imply competence in another.

## Safety and audit boundaries

All provider self-service changes are checked against the provider’s own active institution membership and the institution’s active, confirmed department registry. Cross-tenant department IDs are rejected. Institutional changes are written to the institutional action log. The server remains the security boundary; hiding controls in the interface is not authorization.
