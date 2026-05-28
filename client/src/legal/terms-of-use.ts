import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import type { LegalDocumentMeta } from "./types";

export const termsOfUseDocument: LegalDocumentMeta = {
  title: "Terms of Use",
  version: LEGAL_DOCUMENT_VERSIONS.termsOfUse,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    "These Terms govern your use of the Paeds Resus platform operated by Paeds Resus Limited, Kenya. By creating an account or using our services, you agree to these Terms and our Privacy Policy.",
  sections: [
    {
      id: "definitions",
      title: "1. Definitions",
      bullets: [
        "Paeds Resus — the organisation and multi-product software platform.",
        "Paeds Resus Limited — the registered legal entity providing training, invoices, and certificates.",
        "ResusGPS — bedside paediatric emergency decision-support product (/resus).",
        "Care Signal — provider QI incident/near-miss reporting.",
        "Parent Safe-Truth — guardian journey feedback product.",
        "Fellowship — Paeds Resus Fellowship pathway; title “Paeds Resus Fellow” when enabled.",
      ],
    },
    {
      id: "not-medical-advice",
      title: "2. Not medical advice; not emergency services",
      paragraphs: [
        "Paeds Resus provides education, training, and structured reference support. Nothing on the platform is medical advice, diagnosis, or treatment. We are not an emergency service. In an emergency, call your local emergency number immediately (Kenya: 999 or 112; other EAC countries: use local numbers).",
        "ResusGPS outputs are decision support only. You remain solely responsible for clinical decisions. Your facility protocol, senior review, and professional judgment always prevail.",
      ],
    },
    {
      id: "resusgps",
      title: "3. ResusGPS intended use",
      paragraphs: [
        "ResusGPS is educational clinical decision support for trained healthcare providers in paediatric emergencies. It is not a medical device unless separately registered in your jurisdiction. Drug dosing and pathways are reference aids — verify against local formularies, weight, and senior guidance.",
        "You acknowledge that connectivity, device errors, or outdated pathways may occur. Do not rely on ResusGPS as the sole basis for care.",
      ],
    },
    {
      id: "eligibility",
      title: "4. Eligibility",
      paragraphs: [
        "Healthcare provider features are for qualified clinical staff or trainees under supervision. Parent features are for adults with parental responsibility. Institutional features require authorised representatives of a healthcare organisation.",
        "You must provide accurate registration information. Misrepresenting credentials or gaming Care Signal streaks is prohibited.",
      ],
    },
    {
      id: "accounts",
      title: "5. Accounts and security",
      paragraphs: [
        "You are responsible for safeguarding credentials and all activity under your account. Notify us promptly of unauthorised access. We may suspend accounts for violations or security risk.",
      ],
    },
    {
      id: "acceptable-use",
      title: "6. Acceptable use",
      bullets: [
        "Do not submit patient identifiers in Care Signal or other free-text fields.",
        "Do not upload malware, scrape the platform, or attempt unauthorised access.",
        "Do not falsify certificates, impersonate others, or misrepresent affiliation with AHA, MOH, or Paeds Resus.",
        "Do not use aggregated data to create public league tables or shaming lists without written permission.",
      ],
    },
    {
      id: "ip",
      title: "7. Intellectual property",
      paragraphs: [
        "Paeds Resus Limited and licensors own platform content, pathways, branding, and software. We grant you a limited, non-exclusive, revocable licence to use the platform for personal or institutional purposes per these Terms.",
      ],
    },
    {
      id: "fellowship",
      title: "8. Fellowship and credentials",
      paragraphs: [
        "Paeds Resus Fellow is an automated platform credential when enabled — not a medical licence, MOH specialist registration, or AHA Fellow credential unless explicitly stated on a specific certificate.",
        "AHA-aligned BLS/ACLS/PALS/Heartsaver/NRP and fellowship micro-course certificates are valid for two years from the issue date unless otherwise stated on the certificate. Fellowship micro-course certificates attest course completion, not clinical competence or licensure.",
        "We may revoke certificates obtained by fraud or policy violation. Public verification at /verify reflects current status.",
      ],
    },
    {
      id: "payments",
      title: "9. Payments and M-Pesa",
      paragraphs: [
        "Prices are shown at checkout in Kenyan Shillings unless stated otherwise. M-Pesa STK push charges your Safaricom line per Safaricom terms.",
        "Refunds: (a) Duplicate charges — full refund within 14 days of proof; (b) Course not started — refund minus payment fees within 7 days of enrollment if no modules accessed; (c) Technical failure preventing access — pro-rata or credit at our discretion; (d) No refund after certificate issuance or substantial module completion unless required by law.",
        "Chargebacks without contacting support first may result in account suspension.",
      ],
    },
    {
      id: "institutional",
      title: "10. Institutional use",
      paragraphs: [
        "Hospital administrators access staff training and facility Care Signal aggregates under the Institutional B2B Addendum. Employers remain responsible for workforce policies, mandatory reporting, and employee relations.",
      ],
    },
    {
      id: "care-signal-terms",
      title: "11. Care Signal",
      paragraphs: [
        "Care Signal reports are QI data, not medical records. Facility admins may see aggregates. Appeals for system errors affecting Fellowship streaks: /care-signal/appeal.",
      ],
    },
    {
      id: "liability",
      title: "12. Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by Kenyan law, Paeds Resus Limited is not liable for indirect, consequential, or punitive damages, or for clinical outcomes arising from your use of ResusGPS or training content.",
        "Our aggregate liability for any claim shall not exceed the fees you paid us in the 12 months before the claim, or KES 10,000 if no fees were paid — whichever is greater, except where law prohibits such limitation (including death or personal injury caused by our negligence).",
        "You indemnify us against claims arising from your misuse, false credentials, or breach of these Terms.",
      ],
    },
    {
      id: "disputes",
      title: "13. Dispute resolution",
      paragraphs: [
        "Parties will attempt good-faith negotiation, then mediation in Nairobi, before courts. Governing law: Kenya. Exclusive jurisdiction: courts of Nairobi, Kenya, subject to mandatory consumer protections in your country of residence where applicable.",
      ],
    },
    {
      id: "general",
      title: "14. General",
      bullets: [
        "Force majeure: we are not liable for failures beyond reasonable control (outages, war, natural disaster).",
        "Severability: invalid clauses do not affect the remainder.",
        "Entire agreement: these Terms plus Privacy Policy and applicable B2B addendum.",
        "Contact: " + LEGAL_CONTACT.legalEmail,
      ],
    },
  ],
};
