# Institutional People & Roles Authority Model

## Purpose

Institutional roles must grant the smallest authority needed for the assigned work. A role assignment is an operational delegation, not proof of clinical competence, provider-duty acceptance, or emergency availability. Those states remain separate records and must continue to be accepted or verified through their own workflows.

## Authority matrix

| Role | Scope | May assign or manage | May not do |
|---|---|---|---|
| Institutional administrator | Whole institution | Staff institutional roles, Institutional Emergency Readiness Chair, Institutional CPD Coordinator, Departmental Heads, all product roles, and shared account scopes | Nothing outside the institution tenant |
| Institutional Emergency Readiness Chair | Whole institution | All IERS roles, ERCo appointments, Departmental Heads’ emergency-preparedness responsibilities, readiness governance, evidence, and review work | Grant authority in another institution; bypass provider-duty acceptance |
| Institutional CPD Coordinator | Whole institution | All CPD roles, Departmental CPD Coordinator appointments, institution-wide CPD scheduling, attendance, certificates, and reports | Manage IERS assignments unless separately appointed |
| Departmental Head | Appointed department only | ERCo and Departmental CPD Coordinator appointments for the appointed department | Assign or manage another department; assign an Institutional Chair or Institutional CPD Coordinator |
| ERCo | Assigned department | Department UTL staffing roster and department readiness governance | Treat governance appointment as a dated emergency responder duty |
| Departmental CPD Coordinator | Assigned department | Department CPD roster and department learning coordination | View or modify another department’s private learning records unless separately authorized |

## Enforcement rules

The server is authoritative. Institution administrators are recognized through the shared institution-admin check. Institutional Emergency Readiness Chair authority is represented by the IERS product role `iers_chair`; Institutional CPD Coordinator authority is represented by the CPD product role `cpd_coordinator`. Departmental Head authority is represented by an active Departmental Head appointment for the target department.

Product-role management is area-specific. An Institutional Emergency Readiness Chair may manage IERS product roles only. An Institutional CPD Coordinator may manage CPD Portal product roles only. Shared account scopes and connected-services roles remain institution-administrator responsibilities.

Departmental Head delegation is checked against the target department on every mutation. Listing endpoints return only the appointed department data for a Departmental Head. Appointment replacement, ending, and reassignment are audit-preserving operations; records are not deleted to hide history.

## Operational surfaces

Administration → People & roles contains the canonical authority map and the product-role controls. Administration → Departments & CPD and the Learning workspace contain Departmental CPD Coordinator assignment and CPD operations. Readiness → Department ERCo governance contains ERCo assignment and the UTL handoff. Accountability contains Departmental Head appointments. Each workflow continues to use its domain-specific validation and acceptance controls.

## Safety review checklist

Before adding or changing an institutional role, confirm the role has one explicit scope, one authoritative assignment record, a server-side mutation gate, a read-scope filter, an audit trail, and a clear UI explanation. Confirm that assignment does not silently create clinical competence, a responder duty, a certificate, or payment entitlement.
