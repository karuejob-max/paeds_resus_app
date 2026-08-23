# Institutional member removal and scalable multi-pole ERT design V1

**Status:** Approved for implementation
**Date:** 2026-08-23

## 1. Purpose

The institutional portal must let an authorised account administrator remove a person from the institution without deleting the person’s platform account, CPD history, attendance evidence, or historical IERS duty evidence. The IERS setup must also support a clearly ordered list of response poles, including facilities with more than two poles.

## 2. Member removal semantics

“Remove from institution” means **end the person’s institutional participation**, not delete the global user account and not erase institutional history. The action is restricted to an authorised account administrator with access to that institution. It requires an explicit reason and is recorded with actor, time, affected membership, staff row, and the revocations performed.

The server will preserve the staff row and all historical CPD, IERS activation, evidence, drill, and accepted-duty records. It will mark the roster record removed, end the institution membership, end active institution product roles and shared account scopes for that person, and end active standing ERCo appointments plus future uncompleted dated ERTL/UTL duties. Completed or historical records remain unchanged. The person’s global platform login remains intact and can be invited again later.

The last active institution account administrator cannot be removed through this action, and an administrator cannot remove their own access. The UI will show the difference between active, suspended, ended, and roster-removed records. Re-invitation remains the controlled recovery path; it does not silently restore old roles or duties.

## 3. CPD and identity preservation

Removing a person never deletes CPD attendance or rewrites the original department text. Historical reports continue to identify the captured attendee and recorded label according to existing privacy and reporting rules. A removed person is excluded from active institutional operational lists and candidate lists, but historical evidence remains queryable to authorised institutional reports.

## 4. Pole organization

Facility poles are institution-defined response zones. They are not limited to North and South and there is no hard-coded two-pole maximum. An institution may create as many active poles as its operating model requires, with practical UI validation and clear names such as North Pole, South Pole, East Pole, West Pole, Main Building, or Paediatric Block.

Each pole receives a durable 1-based display order within the institution. New poles are appended after the current last pole. Account administrators/IERS governance users can reorder the complete pole list using move-up/move-down controls. The server validates that the submitted order contains exactly the institution’s active poles and no foreign or duplicate IDs. Pole display order is separate from department sequence within a pole.

Step 2 displays poles in that explicit order. Within each pole, departments remain ordered by their persisted pole sequence. The screen uses grouped pole sections rather than assuming North and South labels. A facility with four poles therefore sees Pole 1, Pole 2, Pole 3, and Pole 4 in its chosen order.

## 5. ERTL interaction

Pole display order organizes the setup view only. Weekly ERTL selection continues to cycle through eligible departments **within each pole**, using each pole’s department sequence and rotation anchor. Adding or moving a department updates future unaccepted derived ERTL rows and shift flags; it does not rewrite accepted historical provider duties.

The system does not infer that a pole is staffed because it exists or because a department is assigned to it. Department eligibility, department UTL allocation, named ERTL nomination, and provider acceptance remain separate controls.

## 6. Access and testing boundaries

Member removal and pole reordering are tenant-scoped and must pass institution account-administrator or IERS governance authorization as appropriate. No patient identifiers or real emergency data are needed for testing. Tests must use the disposable MariaDB harness and the agreed `paedsresus254@gmail.com` test identity only in clearly labelled fixtures.

Production schema changes require the guarded Render migration command and strict verifier after deployment. No production removal, pole reorder, real duty assignment, or pilot drill is part of this release validation.
