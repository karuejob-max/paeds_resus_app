import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { privacyPolicyDocument } from "@/legal/privacy-policy";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function PrivacyPolicy() {
  usePageMeta({
    title: "Privacy Policy — Paeds Resus",
    description: "How Paeds Resus Limited collects, uses, and protects your data under Kenya Data Protection Act 2019.",
    path: "/privacy",
  });

  return <LegalDocumentLayout document={privacyPolicyDocument} />;
}
