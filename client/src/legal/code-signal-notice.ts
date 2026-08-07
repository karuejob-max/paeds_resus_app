import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import type { LegalDocumentMeta } from "./types";

/**
 * Drafted 2026-08-07, mirroring care-signal-notice.ts's structure and most
 * of its wording (same controller, same lawful bases, same retention
 * defaults) with the differences that actually follow from Code Signal
 * being a different product: no Fellowship Pillar C language (Code Signal
 * carries no Fellowship credit — see NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md
 * §4), and an explicit patient-category scope section covering the
 * mother/staff-member case.
 *
 * FLAGGED, NOT YET COUNSEL-REVIEWED: this is drafted product copy, not
 * legal advice, and retention/lawful-basis specifics here are copied from
 * an existing document rather than independently verified for Code
 * Signal's adult-patient context. Treat "1.0.0" as a draft version pending
 * the same sign-off Care Signal's notice already had — do not treat its
 * presence in the codebase as equivalent to legal clearance.
 */
export const codeSignalNoticeDocument: LegalDocumentMeta = {
  title: "Code Signal — Data Processing Notice",
  version: LEGAL_DOCUMENT_VERSIONS.codeSignalNotice,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    "This notice supplements the Privacy Policy and applies specifically to Code Signal — Paeds Resus quality improvement reporting for adult and whole-hospital resuscitation incidents and near-misses.",
  sections: [
    {
      id: "purpose",
      title: "1. Purpose",
      paragraphs: [
        "By submitting your first Code Signal report, you provide explicit consent to processing described here (recorded via a Code Signal consent step and legal.acceptCodeSignalConsent).",
      ],
    },
    {
      id: "scope",
      title: "2. What Code Signal is — and is not",
      bullets: [
        "Code Signal is a structured QI and learning tool for whole-hospital Emergency Response Team members — not a patient medical record.",
        "It covers adult patients, mothers of paediatric patients, hospital staff, and other adults on the premises who required resuscitation — not paediatric patients, who remain covered by Care Signal's separate notice.",
        "Code Signal does not carry Fellowship credit or count toward any Fellowship pillar.",
        "Reports produce de-identified-from-patient facility aggregates — your provider account is known to the platform.",
        "It is a near-miss and systems-gap learning system — not a whistleblower hotline with statutory protections unless your employer provides them.",
        "You remain responsible for any parallel reporting required by your hospital, county, or regulator.",
      ],
    },
    {
      id: "data",
      title: "3. Categories of data processed",
      bullets: [
        "Event metadata: date/time (EAT), facility, department — no patient identifiers in schema.",
        "Patient category: adult patient, mother of a paediatric patient, staff member, or other adult — not an identifying detail on its own.",
        "Clinical context: presenting condition category, outcome category.",
        "Systems factors: recognition, escalation, vascular access, treatment, referral, monitoring, communication, and resource-availability gaps.",
        "Narrative: free-text description — must not include patient names, IDs, addresses, or photos.",
        "Provider link: your user ID, role at the time of the event, and institutional affiliation (unless submitted anonymously).",
        "Technical: IP, user agent on consent; rate-limit counters.",
      ],
    },
    {
      id: "lawful-basis",
      title: "4. Lawful basis",
      bullets: [
        "First submission and storage: consent (this notice + Privacy Policy).",
        "Facility dashboards for authorised admins: legitimate interests / B2B contract.",
        "National aggregate (admin-only): legitimate interests / public interest in health system QI — subject to governance MOU.",
        "Abuse prevention (rate limits, duplicate detection): legitimate interests.",
      ],
    },
    {
      id: "visibility",
      title: "5. Who can see your data",
      bullets: [
        "You: your own submission history.",
        "Paeds Resus operations: full report for moderation and platform integrity.",
        "Facility administrators (if registered): aggregated and facility-scoped views — not public league tables.",
        "Platform administrators: review queues and national aggregate tools.",
        "MOH / WHO / IERMS partner institutions: only under signed governance — not routine public disclosure.",
        "Other providers: not your individual reports unless you share them.",
      ],
      paragraphs: [
        "Reports are de-identified from patients but not anonymous to Paeds Resus or authorised institutional viewers, unless submitted via the anonymous option.",
      ],
    },
    {
      id: "retention",
      title: "6. Retention",
      bullets: [
        "Individual Code Signal events: 7 years from submission (counsel to confirm — carried over from Care Signal's retention default, not independently verified for Code Signal).",
        "Consent records: account lifetime + 6 years.",
        "Aggregates derived from events: may be retained in statistical form after event purge.",
      ],
    },
    {
      id: "obligations",
      title: "7. Your obligations as a reporter",
      bullets: [
        "Submit only good-faith QI reports based on your professional experience.",
        "Never include patient names, national ID numbers, exact dates of birth, photographs, or other direct patient identifiers — including for the mother or staff member involved, where applicable.",
        "Follow local clinical governance when preventability comments could affect colleagues — use systems-focused language.",
        "Not submit more than 5 reports per day (EAT) or duplicate reports within 10 minutes for the same event.",
      ],
    },
    {
      id: "rights",
      title: "8. Your rights",
      paragraphs: [
        `You may access, correct, or request deletion of your Code Signal submissions subject to exceptions (legal hold, institutional contract). Contact ${LEGAL_CONTACT.dpoEmail} or use /legal/data-request. Response SLA: 30 days.`,
        "Withdrawing consent stops new submissions; prior processing remains lawful.",
      ],
    },
    {
      id: "changes",
      title: "9. Changes",
      paragraphs: [
        "Version tracked as LEGAL_DOCUMENT_VERSIONS.codeSignalNotice. Material changes require new consent at next submission or via platform notice.",
      ],
    },
  ],
};
