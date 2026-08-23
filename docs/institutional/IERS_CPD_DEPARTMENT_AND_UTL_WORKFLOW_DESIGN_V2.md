# IERS and CPD Department, ERCo, and UTL Workflow Design V2

## Purpose

This specification corrects four usability and governance gaps reported after the first department-reconciliation and explicit UTL release. It preserves historical CPD text, keeps IERS operational decisions explicit, and aligns the platform with the intended Emergency Readiness Committee (ERC) model.

## 1. Canonical department creation and `Other` resolution

The shared CPD/profile department catalog remains the preferred source. An institutional account administrator opens **Administration → People & profile → Departments & CPD** and can add or reactivate one canonical local department from the shared catalog. A true local exception may be added only after explicit acknowledgement and a reason.

The system must distinguish two different cases:

| Case | Correct treatment |
|---|---|
| A custom label such as `Paeds Ward` was typed repeatedly | Group exact normalized historical labels together. The administrator can review the group once and map it to one confirmed canonical department, optionally backfilling nullable canonical identities while preserving the raw text. |
| Several users selected the literal `Other` | Never merge all `Other` rows into one department. `Other` is not a department identity. Show each attendee and registration separately, with name, contact, cadre, session, date, and recorded label. The administrator chooses a target department per person/attendance row, or leaves the row unresolved. Different users may be resolved to different departments. |

Every per-attendee resolution must preserve the original `department` value, record the target facility department, actor, timestamp, reason, and status. A bulk action may be offered only when the administrator explicitly selects multiple rows and one target department; it must create an auditable decision for every selected attendee.

A matched email or staff row is useful context, not proof of department membership. The report should therefore display **recorded CPD details**, **matched institutional roster identity when available**, and **administrator-confirmed canonical target** as separate fields.

## 2. People & profile compact navigation

The Administration profile tab is a control plane with several long sections. It receives its own URL-addressable, sticky inner tabs:

1. **Institution profile** — facility details and account-level contact information.
2. **People & roles** — institutional staff, responsibility roles, product roles, shared scopes, and IERS duty ledger.
3. **Departments & CPD** — canonical department creation, grouped custom-label reconciliation, per-attendee `Other` resolution, and pole eligibility.
4. **Access & links** — account administrators and pending provider-link requests.
5. **Staff import** — bulk roster import and related onboarding tools.

Only the selected panel should mount its long content. This reduces scroll burden and avoids duplicating People & roles state.

## 3. ERCo governance model

An **Emergency Readiness Coordinator (ERCo)** is a standing governance champion appointed by the Department In Charge. Department ERCo appointments collectively form the ERC, which reviews IERS evidence, readiness gaps, drills, and improvement actions.

An ERCo is **not automatically a day-to-day emergency responder**. An ERCo may appear in an emergency response team only when separately nominated and accepted for a dated UTL or ERTL duty. Product role, ERCo appointment, and dated shift duty remain distinct.

The current persisted appointment dates are retained for governance history, but the UI must explain them as:

- **Appointment starts:** when the governance appointment becomes valid.
- **Appointment ends (optional):** leave blank for an ongoing appointment; use only when the appointment is replaced or formally ends.

The existing backup field is displayed as **Assistant ERCo**. It means a governance deputy who supports continuity and may accept assistant appointment responsibility. It does **not** create automatic shift coverage or make that provider a UTL/ERTL.

## 4. UTL staffing

For each prepared monthly rota and each dated shift, the department ERCo (or authorised IERS governance administrator) explicitly selects the nurse who will be UTL for that shift. The system may prepopulate a candidate list from active linked nurses whose canonical profile department matches the department. It may also show manually entered nurse candidates awaiting account linking.

The system must not silently select the first provider, assume that the monthly source works every shift, or create a dated provider duty for a person who has not been explicitly selected and accepted. An unassigned shift remains visibly unassigned.

## 5. Deterministic ERTL rotation

The weekly ERTL department is not manually selected as an arbitrary department for each week. Within each pole, active confirmed `requiresPole=true` departments have a persisted pole sequence that records the order in which they were added to that pole. The weekly department is calculated as:

`orderedDepartments[(weekIndexFromPoleAnchor) mod orderedDepartments.length]`

The pole anchor is the first week of the pole’s operational rotation. Existing poles receive a deterministic backfill anchor during migration; future pole setup records the anchor when the first eligible department is added. Moving a department to a different pole assigns it the next sequence number at that pole. Reassignment refreshes affected weekly and shift-derived records without changing historical accepted duties.

The selected department supplies the ERTL source for that week. The ERTL provider, if one is nominated, must still be an active canonical department member and must accept the dated duty. The rotation determines the department; it does not invent a provider. If no suitable provider is nominated, the ERTL state remains visibly unassigned.

## Safety boundaries

No patient identifiers or real emergency activity are involved. Historical CPD text is never overwritten. No CPD-only department receives a pole merely because it appears in attendance data. No ERCo assignment is treated as accepted clinical duty. No scheduler or autonomous background process is introduced; all department, rota, and duty changes remain user-initiated and auditable.

## Implementation addendum — 2026-08-23

The deployed correction treats literal `Other` as a submission value, not as a department. Each attendee row is reviewed independently and may be linked to a different active, confirmed canonical department; unresolved custom text remains in the separate grouped pattern queue. The original captured CPD department text is preserved, while the nullable canonical identity may be backfilled only after explicit review. The traceability view includes the captured attendee and event details and durable resolution status.

Administration → People & profile now has URL-addressable sticky navigation for roster, IERS duty visibility, product permissions, shared scopes, and department reconciliation. ERCo is described and governed as a standing department readiness champion appointed by the department in charge. The optional second person is an Assistant ERCo for governance continuity; neither role is an automatic day-to-day response assignment. If an ERCo serves in an ERT shift, that is through a separately nominated and provider-accepted UTL or ERTL duty.

Step 3 is explicit shift staffing. The ERCo or authorised IERS governance user may select a monthly source suggestion, but the platform does not assume that person is on duty for every shift. The actual UTL is selected for each dated shift from linked active department candidates; manual candidates may be staged for account linking and cannot accept provider duty until linked. The monthly plan may remain unassigned.

Within each pole, eligible departments are assigned a durable sequence in pole-addition order. The first department is sequence 1, the next sequence 2, and the weekly ERTL department is derived automatically by cycling from the pole's Monday anchor through that order. Future unaccepted ERTL rows and derived shift flags refresh when pole membership or order changes; accepted historical duties are not overwritten. Migration 0116 provides per-attendee resolution records, pole sequence metadata, and pole rotation anchors.

These controls remain request-driven. No autonomous scheduler or implicit provider-selection rule is introduced.
