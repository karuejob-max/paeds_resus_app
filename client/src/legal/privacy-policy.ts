import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import type { LegalDocumentMeta } from "./types";

export const privacyPolicyDocument: LegalDocumentMeta = {
  title: "Privacy Policy",
  version: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    "This Privacy Policy explains how Paeds Resus Limited (“we”, “us”, “Paeds Resus”) collects, uses, stores, and protects personal data when you use the Paeds Resus platform, including ResusGPS, Care Signal, Parent Safe-Truth, Fellowship, training, payments, and institutional services.",
  sections: [
    {
      id: "controller",
      title: "1. Data controller",
      paragraphs: [
        `${LEGAL_CONTACT.controllerName} is the data controller for personal data processed through paeds-resus.com and related applications.`,
        `Registered address: ${LEGAL_CONTACT.registeredAddress}.`,
        `Data Protection contact: ${LEGAL_CONTACT.dpoEmail}. General support: ${LEGAL_CONTACT.supportEmail}.`,
        `Kenya Data Protection Act 2019: We process personal data in accordance with the Act. Our ODPC registration status: ${LEGAL_CONTACT.odpcRegistrationPlaceholder}.`,
      ],
    },
    {
      id: "scope",
      title: "2. Scope of this policy",
      paragraphs: [
        "This policy applies to all Paeds Resus products: the Paeds Resus organisation platform, ResusGPS (clinical decision support), Care Signal (provider QI reporting), Parent Safe-Truth (guardian journey feedback), Fellowship pathways, AHA-aligned training issued by Paeds Resus Limited, institutional hospital portals, certificate verification, analytics, and payment services (including M-Pesa).",
        "Institutional customers may also be governed by our Institutional B2B Addendum where a signed agreement exists.",
      ],
    },
    {
      id: "categories",
      title: "3. Categories of data we collect",
      bullets: [
        "Account data: name, email, phone, password hash, user type (provider, parent, institutional), role, login method.",
        "Professional profile: provider type, facility affiliation, instructor credentials where applicable.",
        "Training & Fellowship: enrollments, progress, certificates, verification codes, streak and grace usage.",
        "ResusGPS: session parameters (e.g. age/weight bands) stored client-side or optionally saved for Fellowship case requirements — no patient names in saved cases.",
        "Care Signal: QI reports (facility, delays, equipment gaps, outcomes, preventability). Reports are linked to your provider account for fellowship and facility aggregation — not anonymous to the platform. Do not include patient identifiers.",
        "Parent Safe-Truth: guardian submissions, child age band, care journey narrative, optional named guardian — separate from Care Signal.",
        "Payments: M-Pesa STK requests, transaction references, amounts, webhook audit logs.",
        "Institutional: staff roster, training schedules, facility aggregates, action logs.",
        "Analytics: pseudonymous session IDs, page events, feature usage.",
        "Support & DSAR: correspondence when you contact us or submit a data request.",
      ],
    },
    {
      id: "lawful-bases",
      title: "4. Lawful bases (Kenya DPA 2019)",
      bullets: [
        "Contract: account creation, course delivery, certificate issuance, M-Pesa payments.",
        "Consent: Care Signal QI submissions, Parent Safe-Truth guardian narratives, non-essential analytics where required, marketing if opted in.",
        "Legitimate interests: platform security, fraud prevention, aggregated QI insights, service improvement — balanced against your rights.",
        "Legal obligation: tax, payment reconciliation, regulatory requests lawfully made.",
        "Vital interests: rarely, where necessary to protect life in an emergency communicated to us (we are not an emergency service).",
      ],
    },
    {
      id: "purposes",
      title: "5. How we use your data",
      bullets: [
        "Provide and secure the platform, authenticate users, and enforce role boundaries.",
        "Deliver training, Fellowship progress, ResusGPS reference support, and certificate verification.",
        "Process Care Signal QI data for facility dashboards, fellowship Pillar C, and aggregated surveillance — not as a patient medical record.",
        "Process Parent Safe-Truth separately for family voice insights — never merged with Care Signal KPIs.",
        "Process M-Pesa and other payments; send receipts and enrollment confirmations.",
        "Operate institutional dashboards for authorised hospital administrators under B2B terms.",
        "Respond to data subject requests, support enquiries, and legal claims.",
        "Detect abuse, gaming of Care Signal, or false credentials.",
      ],
    },
    {
      id: "care-signal",
      title: "6. Care Signal — important notice",
      paragraphs: [
        "Care Signal is a quality-improvement (QI) reporting tool for healthcare providers. It is not a patient medical record, electronic health record, or substitute for mandatory incident reporting to your employer or regulator.",
        "Reports may be visible in de-identified aggregate form to facility administrators and platform operators. Your user ID is retained for fellowship streak integrity and audit. Free text must not contain patient names, national IDs, or other patient identifiers.",
        "See also our standalone Care Signal Data Processing Notice.",
      ],
    },
    {
      id: "children",
      title: "7. Children and guardians",
      paragraphs: [
        "Paeds Resus does not knowingly create accounts for children under 18. Parent Safe-Truth is intended for parents and legal guardians only.",
        "Where you submit information about a child as a guardian, you confirm you have parental responsibility and authority to provide that information for the stated purposes.",
        "We apply heightened care to bereavement-related narratives and child outcome data. Contact us to exercise rights on behalf of a child where applicable.",
      ],
    },
    {
      id: "retention",
      title: "8. Retention",
      paragraphs: [
        "We retain data only as long as necessary for the purposes above. See our Data Retention Schedule for specific periods. Summary:",
      ],
      bullets: [
        "Active account data: retained while your account is active plus 24 months after closure unless law requires longer.",
        "Care Signal QI events: 7 years from submission (QI audit trail) unless anonymised earlier per institutional agreement.",
        "Parent Safe-Truth: 5 years from submission unless you request earlier deletion and we can honour it without breaking aggregate integrity.",
        "Analytics events: 13 months rolling, then aggregate or delete.",
        "Admin audit logs: 90 days online; archived summaries up to 24 months.",
        "M-Pesa payment records: 7 years (tax and financial compliance).",
        "Certificates: retained for verification for the validity period plus 10 years.",
      ],
    },
    {
      id: "transfers",
      title: "9. International transfers",
      paragraphs: [
        "Our primary database is hosted on Aiven cloud MySQL, which may be located in the European Union or other regions depending on deployment configuration. Static assets may be served via Cloudflare. Email may be sent via AWS SES or SendGrid.",
        "Where data is transferred outside Kenya, we implement appropriate safeguards including contractual clauses with subprocessors, encryption in transit (TLS/SSL), and access controls.",
      ],
    },
    {
      id: "subprocessors",
      title: "10. Subprocessors",
      paragraphs: [
        "We use trusted third parties to operate the platform. A current list is published at /legal/subprocessors, including Render (hosting), Aiven (database), Cloudflare (CDN/R2), Safaricom M-Pesa (payments), and email providers.",
      ],
    },
    {
      id: "cookies",
      title: "11. Cookies and analytics",
      paragraphs: [
        "We use essential cookies for authentication sessions. Analytics events may be collected to improve the product. See our Cookie and Analytics Notice at /legal/cookies.",
      ],
    },
    {
      id: "rights",
      title: "12. Your rights (Kenya DPA)",
      bullets: [
        "Access — request a copy of your personal data.",
        "Correction — request correction of inaccurate data.",
        "Deletion — request deletion where no overriding legal basis exists.",
        "Objection — object to processing based on legitimate interests.",
        "Withdraw consent — where processing is consent-based (e.g. Care Signal), without affecting prior lawful processing.",
      ],
      paragraphs: [
        `Submit requests to ${LEGAL_CONTACT.dataRequestsEmail} or via /legal/data-request. We respond within 30 days unless complexity requires extension (we will notify you).`,
      ],
    },
    {
      id: "breach",
      title: "13. Personal data breach notification",
      paragraphs: [
        "We maintain an internal incident response playbook. On becoming aware of a breach likely to pose risk, we assess within 72 hours internally and notify the ODPC and affected users where required by law.",
      ],
    },
    {
      id: "eac",
      title: "14. East Africa Community users",
      paragraphs: [
        "Users in Uganda, Tanzania, Rwanda, Burundi, South Sudan, and DRC may access the platform. Local data protection laws may also apply in your country. This policy is governed by Kenya law (see Terms), but we respect applicable local mandatory provisions where they cannot be contracted out.",
        "Emergency numbers vary by country. ResusGPS and Paeds Resus are not emergency services — call local emergency numbers (Kenya: 999 or 112).",
      ],
    },
    {
      id: "changes",
      title: "15. Changes to this policy",
      paragraphs: [
        "We may update this policy. Material changes will be notified via the platform or email. Continued use after notice may require re-consent where mandated. Version history is tracked in our legal document registry.",
      ],
    },
  ],
};
