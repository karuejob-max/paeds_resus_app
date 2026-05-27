import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { subprocessorsDocument } from "@/legal/cookie-notice";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Subprocessors() {
  usePageMeta({
    title: "Subprocessors — Paeds Resus",
    description: "Third-party subprocessors used by Paeds Resus Limited.",
    path: "/legal/subprocessors",
  });

  return <LegalDocumentLayout document={subprocessorsDocument} />;
}
