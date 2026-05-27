import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { clinicalIntendedUseDocument } from "@/legal/clinical-intended-use";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ClinicalIntendedUse() {
  usePageMeta({
    title: "ResusGPS Intended Use — Paeds Resus",
    description: "Clinical intended use statement and limitations for ResusGPS.",
    path: "/legal/clinical-use",
  });

  return <LegalDocumentLayout document={clinicalIntendedUseDocument} />;
}
