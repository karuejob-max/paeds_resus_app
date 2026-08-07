import { LegalDocumentLayout } from "@/components/LegalDocumentLayout";
import { codeSignalNoticeDocument } from "@/legal/code-signal-notice";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CodeSignalNotice() {
  usePageMeta({
    title: "Code Signal Notice — Paeds Resus",
    description: "Data processing notice for Code Signal quality improvement reporting.",
    path: "/legal/code-signal",
  });

  return <LegalDocumentLayout document={codeSignalNoticeDocument} />;
}
