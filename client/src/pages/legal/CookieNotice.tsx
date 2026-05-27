import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { cookieNoticeDocument } from "@/legal/cookie-notice";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CookieNotice() {
  usePageMeta({
    title: "Cookie Notice — Paeds Resus",
    description: "Cookies and analytics on the Paeds Resus platform.",
    path: "/legal/cookies",
  });

  return <LegalDocumentLayout document={cookieNoticeDocument} />;
}
