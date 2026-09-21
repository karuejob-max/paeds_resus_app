# ResusGPS Clinical-Owner Review Packet

**Status:** Required before any claim of clinical validation, pilot readiness, regulatory suitability, or unsupervised use.

## Purpose

This packet is the review boundary for the current ResusGPS safety hardening. The software changes centralize age, care setting, weight provenance, and life-support pathway selection; block adult ACLS unless explicitly governed; preserve witnessed-arrival provenance; and quarantine ResusGPS event evidence by default. The packet does **not** approve the clinical content. A named clinical owner must review and sign the decisions below.

## Named owner

| Field | Required entry |
|---|---|
| Clinical owner name | **To be assigned** |
| Cadre and current clinical role | **To be assigned** |
| Institution/service | **To be assigned** |
| Review date | **To be assigned** |
| Version reviewed | `ResusGPS hardening slice — 2026-09-21` |
| Decision | Pending / Approved with conditions / Rejected |

## Decisions requiring clinical review

| Decision | Current software behavior | Owner decision/evidence |
|---|---|---|
| Delivery-room newborn routing | NRP requires explicit `delivery_room` context and age under one month; hospital newborns route to PALS. | Confirm or amend. |
| Preterm weight estimate | A clearly labelled low-confidence gestational-age estimate is available only when measured or last-known weight is absent. | Confirm acceptable emergency fallback and wording. |
| Weight provenance | Measured weight is high confidence; last-known/caregiver-reported weight requires verification; age estimate requires verification. | Confirm which pathways may calculate doses from each source. |
| Adult ACLS | Blocked unless a governed adult-content feature is explicitly enabled. | Confirm product scope and approval gate. |
| Ambiguous context | No pathway pack is selected until age and care setting are confirmed. | Confirm fail-closed behavior. |
| Witnessed arrival | Arrival records physical presence only; it no longer backfills notification receipt, acknowledgement, or response. | Confirm operational semantics. |
| Synthetic/manikin records | ResusGPS event evidence is server-stamped `unknown`, quarantined, and excluded from production analytics by default. | Confirm data policy and review route. |

## Required evidence

The owner should review the active clinical protocol registry, unified flow contract, age/weight resolver matrix, and the labelled usability protocol. The owner must specifically review neonatal/preterm, hospital infant/child, adult blocked, out-of-range/incomplete input, and context-change cases.

## Sign-off

> I have reviewed the listed behavior against the locally approved clinical protocols and understand that this review is not a regulatory clearance or a claim that ResusGPS is a monitored clinical device.

**Name:** ____________________  **Signature/record ID:** ____________________  **Date:** __________

**Conditions or required changes:**

______________________________________________________________________________

______________________________________________________________________________
