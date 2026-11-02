import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Search, Clock, QrCode } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCertificateDisplayLabel, READINESS_PATHWAY_LABELS } from "@shared/paeds-resus-certificates";
import { usePageMeta } from "@/hooks/usePageMeta";

function formatVerifyDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type CertificateResult = {
  valid: boolean;
  status?: string | null;
  error?: string;
  certificate?: {
    certificateNumber?: string | null;
    recipientName?: string | null;
    programType?: string | null;
    readinessPathway?: string | null;
    issueDate?: string | Date | null;
    expiryDate?: string | Date | null;
  } | null;
};

export default function VerifyCertificate() {
  usePageMeta({
    title: "Verify certificate — Paeds Resus",
    description:
      "Verify Paeds Resus training certificates online by scanning the certificate QR code or entering the details manually.",
    path: "/verify",
  });

  const [qrCode] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("code")?.trim() ?? "",
  );
  const [certificateNumber, setCertificateNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const directQuery = trpc.certificates.verifyByCode.useQuery(
    { code: qrCode },
    { enabled: Boolean(qrCode) },
  );
  const manualQuery = trpc.certificates.verify.useQuery(
    { certificateNumber, recipientName },
    { enabled: submitted && !qrCode },
  );

  const result = (qrCode ? directQuery.data : manualQuery.data) as CertificateResult | undefined;
  const isLoading = qrCode ? directQuery.isLoading : manualQuery.isLoading;
  const error = qrCode ? directQuery.error : manualQuery.error;
  const isSubmitted = Boolean(qrCode) || submitted;
  const isAuthentic = result?.valid === true;
  const isExpired = isAuthentic && result?.status === "expired";
  const isCurrentlyValid = isAuthentic && !isExpired;
  const certificate = result?.certificate;
  const certificateHolderName = certificate?.recipientName ?? recipientName ?? "Certificate holder";
  const certificateNumberForDisplay = certificate?.certificateNumber ?? certificateNumber;
  const pathway = certificate?.readinessPathway;

  const handleVerify = () => {
    if (!certificateNumber.trim() || !recipientName.trim()) return;
    setSubmitted(true);
  };

  const certificateDetails = certificate ? (
    <div className="mt-6 space-y-4 border-t pt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><p className="text-sm text-gray-600">Certificate holder</p><p className="text-lg font-semibold text-gray-900">{certificateHolderName}</p></div>
        <div><p className="text-sm text-gray-600">Course</p><p className="text-lg font-semibold text-gray-900">{getCertificateDisplayLabel(certificate.programType ?? "", null)}</p></div>
        <div><p className="text-sm text-gray-600">Issue date</p><p className="text-lg font-semibold text-gray-900">{formatVerifyDate(certificate.issueDate)}</p></div>
        <div><p className="text-sm text-gray-600">Expiry date</p><p className="text-lg font-semibold text-gray-900">{formatVerifyDate(certificate.expiryDate)}</p></div>
        <div><p className="text-sm text-gray-600">Status</p><p className="text-lg font-semibold text-gray-900">{isExpired ? "Expired" : isCurrentlyValid ? "Valid" : "Unknown"}</p></div>
        <div><p className="text-sm text-gray-600">Verification result</p><p className="text-lg font-semibold text-gray-900">Authentic</p></div>
        <div className="sm:col-span-2"><p className="text-sm text-gray-600">Entry pathway</p><p className="text-lg font-semibold text-gray-900">{pathway ? READINESS_PATHWAY_LABELS[pathway as keyof typeof READINESS_PATHWAY_LABELS] : "Legacy certificate record"}</p></div>
        <div className="sm:col-span-2"><p className="text-sm text-gray-600">Certificate ID</p><p className="break-all font-mono text-lg font-semibold text-gray-900">{certificateNumberForDisplay || "-"}</p></div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Verify Certificate</h1>
          <p className="text-gray-600">Verify the authenticity of a Paeds Resus training certificate</p>
        </div>

        {qrCode ? (
          <Card className="mb-8 border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <QrCode className="mt-1 h-6 w-6 flex-shrink-0 text-blue-700" />
              <div><p className="font-semibold text-blue-900">QR verification</p><p className="mt-1 text-sm text-blue-800">This certificate was opened from its official QR code. No name or certificate number entry is required.</p></div>
            </div>
          </Card>
        ) : (
          <Card className="mb-8 p-8">
            <div className="space-y-4">
              <div><label className="mb-2 block text-sm font-medium text-gray-700">Certificate ID</label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input type="text" placeholder="e.g., CERT-2026-001234" value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())} className="pl-10" disabled={isLoading} /></div></div>
              <div><label className="mb-2 block text-sm font-medium text-gray-700">Certificate holder name</label><Input type="text" placeholder="e.g., John Doe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} disabled={isLoading} /></div>
              <Button onClick={handleVerify} disabled={!certificateNumber.trim() || !recipientName.trim() || isLoading} className="w-full">{isLoading ? "Verifying..." : "Verify Certificate"}</Button>
            </div>
          </Card>
        )}

        {isSubmitted && (
          <div className="space-y-4">
            {isLoading && <Card className="p-8 text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /><p className="text-gray-600">Verifying certificate...</p></Card>}
            {error && <Card className="border-red-200 bg-red-50 p-8"><div className="flex items-start gap-4"><AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-red-600" /><div><h3 className="font-semibold text-red-900">Verification failed</h3><p className="mt-1 text-red-700">{error.message || "Unable to verify this certificate."}</p></div></div></Card>}
            {result && !isLoading && (
              isCurrentlyValid ? <Card className="border-green-200 bg-green-50 p-8"><div className="mb-2 flex items-start gap-4"><CheckCircle className="h-8 w-8 flex-shrink-0 text-green-600" /><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl font-bold text-green-900">Certificate Verified</h3><Badge className="bg-green-600 hover:bg-green-600">Valid</Badge></div><p className="mt-1 text-green-700">This certificate is authentic and currently within its validity period.</p></div></div>{certificateDetails}</Card>
              : isExpired ? <Card className="border-amber-200 bg-amber-50 p-8"><div className="mb-2 flex items-start gap-4"><Clock className="h-8 w-8 flex-shrink-0 text-amber-600" /><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl font-bold text-amber-900">Certificate Authentic — Expired</h3><Badge variant="outline" className="border-amber-600 text-amber-800">Expired</Badge></div><p className="mt-1 text-amber-800">Paeds Resus issued this certificate, but it is past its validity period.</p></div></div>{certificateDetails}</Card>
              : <Card className="border-red-200 bg-red-50 p-8"><div className="flex items-start gap-4"><AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-red-600" /><div><h3 className="font-semibold text-red-900">Certificate not found</h3><p className="mt-1 text-red-700">No matching certificate was found. Confirm that you are using the official Paeds Resus QR code or manual certificate details.</p></div></div></Card>
            )}
          </div>
        )}

        <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-medium">Credential limitations</p><p className="mt-2">Verification confirms that Paeds Resus Limited issued a certificate for the stated course completion. It does not attest medical licensure, clinical competence, MOH specialist registration, or AHA Fellow status unless explicitly stated on the certificate.</p></div>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"><p>This verification tool is provided by Paeds Resus Limited</p><p className="mt-2">For questions about certificate authenticity, contact <a href="mailto:verify@paedsresus.com" className="text-blue-600 hover:underline">verify@paedsresus.com</a></p></div>
      </div>
    </div>
  );
}
