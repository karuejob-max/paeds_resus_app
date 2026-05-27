# NRP — AHA certification track

**Program type:** `nrp`  
**Guideline basis:** 2025 American Heart Association Guidelines for CPR and ECC, Part 5: Neonatal Resuscitation (co-developed with AAP).

## Catalog

- Runtime: `server/lib/ensure-nrp-catalog.ts` + `server/lib/nrp-modules-data.ts` (6 modules, sections, knowledge checks).
- Full refresh seed: `pnpm run seed:nrp` (after `pnpm run db:apply-0045`).

## Learner flow

Same two-gate model as BLS/ACLS/PALS/Heartsaver (PSoT §19):

1. Cognitive modules → `nrp_cognitive` gatepass certificate  
2. Instructor practical sign-off → full `nrp` certificate (2-year validity)

## Enrollment & UI

- `/enroll?courseId=nrp`  
- `/aha-courses` hub (via `listAhaHubPrograms`)  
- Player: `/micro-course/{id}?programType=nrp`

## Distinction from Fellowship / ResusGPS

- **Not** a Fellowship micro-course.  
- ResusGPS `NeonatalResuscitationFlow` is bedside guidance; this track is **training certification**.
