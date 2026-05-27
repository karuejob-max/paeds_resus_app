import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import type { LegalDocumentMeta } from "./types";

export const careSignalNoticeDocument: LegalDocumentMeta = {
  title: "Care Signal — Data Processing Notice",
  version: LEGAL_DOCUMENT_VERSIONS.careSignalNotice,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    "This notice supplements the Privacy Policy and applies specifically to Care Signal — Paeds Resus quality improvement reporting for paediatric emergency incidents and near-misses.",
  sections: [
    {
      id: "purpose",
      title: "1. Purpose",
      paragraphs: [
        "By submitting your first Care Signal report, you provide explicit consent to processing described here (recorded via CareSignalConsentGate and legal.acceptCareSignalConsent).",
      ],
    },
    {
      id: "scope",
      title: "2. What Care Signal is — and is not",
      bullets: [
        "Care Signal is a structured QI and learning tool for providers — not a patient medical record.",
        "It supports fellowship Pillar C progress — not mandatory employer incident reporting unless your employer adopts it formally.",
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
        "Clinical context bands: age band, presentation category, outcome band.",
        "Systems factors: delays, equipment gaps, staffing, handover issues.",
        "Preventability: structured preventability assessment.",
        "Narrative: free-text description — must not include patient names, IDs, addresses, or photos.",
        "Provider link: your user ID and institutional affiliation.",
        "Technical: IP, user agent on consent; rate-limit counters.",
      ],
    },
    {
      id: "lawful-basis",
      title: "4. Lawful basis",
      bullets: [
        "First submission and storage: consent (this notice + Privacy Policy).",
        "Fellowship streak calculation: contract + legitimate interests (integrity).",
        "Facility dashboards for authorised admins: legitimate interests / B2B contract.",
        "National aggregate (admin-only): legitimate interests / public interest in health system QI — subject to governance MOU.",
        "Abuse prevention (rate limits, duplicate detection): legitimate interests.",
      ],
    },
    {
      id: "visibility",
      title: "5. Who can see your data",
      bullets: [
        "You: your submission history and fellowship-related streak status.",
        "Paeds Resus operations: full report for moderation, appeals, and platform integrity.",
        "Facility administrators (if registered): aggregated and facility-scoped views — not public league tables.",
        "Platform administrators: review queues and national aggregate tools.",
        "MOH / WHO partners: only under signed governance — not routine public disclosure.",
        "Other providers: not your individual reports unless you share them.",
      ],
      paragraphs: [
        "Reports are de-identified from patients but not anonymous to Paeds Resus or authorised institutional viewers.",
      ],
    },
    {
      id: "retention",
      title: "6. Retention",
      bullets: [
        "Individual Care Signal events: 7 years from submission (counsel to confirm).",
        "Consent records: account lifetime + 6 years.",
        "Aggregates derived from events: may be retained in statistical form after event purge.",
      ],
    },
    {
      id: "obligations",
      title: "7. Your obligations as a reporter",
      bullets: [
        "Submit only good-faith QI reports based on your professional experience.",
        "Never include patient names, national ID numbers, exact dates of birth, photographs, or other direct patient identifiers.",
        "Follow local clinical governance when preventability comments could affect colleagues — use systems-focused language.",
        "Not submit more than 5 reports per day (EAT) or duplicate reports within 10 minutes for the same event.",
        "Use appeals (/care-signal/appeal) only for documented system errors, not for disagreement with fellowship rules.",
      ],
    },
    {
      id: "rights",
      title: "8. Your rights",
      paragraphs: [
        `You may access, correct, or request deletion of your Care Signal submissions subject to exceptions (fellowship integrity, legal hold, institutional contract). Contact ${LEGAL_CONTACT.dpoEmail} or use /legal/data-request. Response SLA: 30 days.`,
        "Withdrawing consent stops new submissions; prior processing remains lawful. Fellowship progress may be affected.",
      ],
    },
    {
      id: "changes",
      title: "9. Changes",
      paragraphs: [
        "Version tracked as LEGAL_DOCUMENT_VERSIONS.careSignalNotice. Material changes require new consent at next submission or via platform notice.",
      ],
    },
  ],
};
