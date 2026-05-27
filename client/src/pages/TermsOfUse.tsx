import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { termsOfUseDocument } from "@/legal/terms-of-use";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TermsOfUse() {
  usePageMeta({
    title: "Terms of Use — Paeds Resus",
    description: "Terms governing use of Paeds Resus, ResusGPS, Care Signal, Fellowship, and training services.",
    path: "/terms",
  });

  return <LegalDocumentLayout document={termsOfUseDocument} />;
}
