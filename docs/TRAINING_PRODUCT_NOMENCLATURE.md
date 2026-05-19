# Training product nomenclature

**Purpose:** Reduce confusion between **product lines**, **offerings (courses customers buy)**, and **LMS catalog rows** (`courses` table).

---

## Definitions (recommended)

| Term | Meaning | Examples |
|------|---------|----------|
| **Product line** | Top-level program family on the platform | **AHA**, **Fellowship**, **Instructor** |
| **Offering** | What the customer enrolled in (audit label) | **BLS**, **ACLS**, **PALS**, **Heartsaver** within AHA; individual **micro-courses** within Fellowship |
| **Catalog row** | Internal `courses.id` + `courses.title` (LMS content) | May differ from offering name; multiple rows can share `programType` |

Your mental model matches how we document the platform:

- **Fellowship** = program → **micro-courses** = courses (pillar A).
- **AHA** = program (product line) → **BLS / ACLS / PALS / Heartsaver** = courses (offerings).

---

## Why PALS showed “seriously ill child” in the enrollment ledger

Historically, two different products both used `enrollments.programType = "pals"`:

1. **AHA PALS certification** — full cognitive + practical path (AHA hub, `/aha-courses`).
2. **ADF “systematic approach to a seriously ill child”** — a Paeds Resus micro-style catalog row (E2E / KES 100 path) stored under the same `programType`.

`enrollment.create` used to **always** attach PALS enrollments to catalog row #3 (“seriously ill child”) unless `pricingSku = pals_septic`. The admin ledger joined `courses.title`, so auditors saw the LMS title, not “PALS (AHA)”.

**Fix (2026-05):**

- New AHA enrollments (BLS, ACLS, PALS, Heartsaver) resolve `courseId` via `resolveAhaCourseAnchor` (row with most modules).
- Legacy ADF paths still use `pricingSku: "pals"` or `"pals_septic"` for the ADF catalog rows.
- Admin **Enrollment ledger** shows **Product line**, **Offering**, and **Catalog (LMS)** columns (`shared/training-product-taxonomy.ts`).

---

## `programType` column (database)

Still stored on `enrollments` for compatibility. Treat it as **offering code** for AHA (`bls` | `acls` | `pals` | `heartsaver`), not as “program family”. For audits, prefer **productLineLabel** + **offeringLabel** from the ledger API.

---

## Code references

- Taxonomy: `shared/training-product-taxonomy.ts`
- AHA catalog anchor: `server/lib/resolve-aha-course-anchor.ts`
- Enrollment create: `server/routers/enrollment.ts` → `resolveTrainingCourseIdOnCreate`
- Admin ledger: `adminStats.getEnrollmentLedger`
