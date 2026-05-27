import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { careSignalNoticeDocument } from "@/legal/care-signal-notice";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CareSignalNotice() {
  usePageMeta({
    title: "Care Signal Notice — Paeds Resus",
    description: "Data processing notice for Care Signal quality improvement reporting.",
    path: "/legal/care-signal",
  });

  return <LegalDocumentLayout document={careSignalNoticeDocument} />;
}
