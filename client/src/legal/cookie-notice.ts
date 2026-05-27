import { LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import type { LegalDocumentMeta } from "./types";

export const cookieNoticeDocument: LegalDocumentMeta = {
  title: "Cookie and Analytics Notice",
  version: LEGAL_DOCUMENT_VERSIONS.cookieNotice,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: "This notice describes cookies and similar technologies used on Paeds Resus.",
  sections: [
    {
      id: "essential",
      title: "1. Essential cookies",
      paragraphs: [
        "We use session cookies to keep you signed in securely. These are strictly necessary for the service and cannot be disabled while using authenticated features.",
      ],
    },
    {
      id: "analytics",
      title: "2. Analytics",
      paragraphs: [
        "We collect pseudonymous analytics events (page views, feature usage, session IDs) to improve reliability and safety. Where required by law, we rely on legitimate interests balanced against your rights, or consent for non-essential tracking.",
      ],
    },
    {
      id: "local-storage",
      title: "3. Local storage",
      paragraphs: [
        "ResusGPS may store session parameters in sessionStorage. Care Signal consent and clinical disclaimer acknowledgments may be stored in localStorage for UX continuity — server records apply where you are signed in.",
      ],
    },
    {
      id: "control",
      title: "4. Your choices",
      paragraphs: [
        "You can clear browser storage or use private browsing. Blocking essential cookies will prevent login. Contact privacy@paeds-resus.com for data subject requests.",
      ],
    },
  ],
};

export const subprocessorsDocument: LegalDocumentMeta = {
  title: "Subprocessors",
  version: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: "Paeds Resus Limited uses the following subprocessors to operate the platform. This list may be updated; material changes are reflected in our Privacy Policy.",
  sections: [
    {
      id: "table",
      title: "Current subprocessors",
      bullets: [
        "Render — application hosting (United States / EU regions) — infrastructure.",
        "Aiven — managed MySQL database (EU cloud regions typical) — data storage.",
        "Cloudflare — CDN, R2 object storage, DDoS protection — static assets.",
        "Safaricom M-Pesa (Daraja) — payment processing — phone, transaction metadata.",
        "AWS SES / SendGrid — transactional email — email addresses, message content.",
        "Africa's Talking / SMS providers (if enabled) — SMS reminders — phone numbers.",
      ],
    },
    {
      id: "safeguards",
      title: "Safeguards",
      paragraphs: [
        "Contracts require appropriate security, confidentiality, and data processing terms. Cross-border transfers use encryption and access minimisation.",
      ],
    },
  ],
};
