import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VerifyCertificate() {
  const [certificateId, setCertificateId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: result, isLoading, error } = trpc.certificate.verify.useQuery(
    { certificateId, staffName },
    { enabled: submitted }
  );

  const handleVerify = () => {
    if (!certificateId || !staffName) {
      return;
    }
    setSubmitted(true);
  };

  const isValid = result?.isValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verify Certificate</h1>
          <p className="text-gray-600">
            Verify the authenticity of a Paeds Resus training certificate
          </p>
        </div>

        {/* Verification Form */}
        <Card className="p-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="e.g., CERT-2026-001234"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Name
              </label>
              <Input
                type="text"
                placeholder="e.g., John Doe"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={!certificateId || !staffName || isLoading}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify Certificate"}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {submitted && (
          <div className="space-y-4">
            {isLoading && (
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Verifying certificate...</p>
              </Card>
            )}

            {error && (
              <Card className="p-8 border-red-200 bg-red-50">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900">Verification Failed</h3>
                    <p className="text-red-700 mt-1">
                      {error.message || "Unable to verify certificate. Please check the details and try again."}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {result && !isLoading && (
              <>
                {isValid ? (
                  <Card className="p-8 border-green-200 bg-green-50">
                    <div className="flex items-start gap-4 mb-6">
                      <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-2xl font-bold text-green-900">Certificate Verified</h3>
                        <p className="text-green-700 mt-1">This certificate is authentic and valid</p>
                      </div>
                    </div>

                    <div className="space-y-4 mt-6 border-t border-green-200 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Staff Name</p>
                          <p className="text-lg font-semibold text-gray-900">{result.staffName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Course</p>
                          <p className="text-lg font-semibold text-gray-900">{result.course}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Issue Date</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(result.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Expiry Date</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(result.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Institution</p>
                          <p className="text-lg font-semibold text-gray-900">{result.institution}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Certificate ID</p>
                          <p className="text-lg font-mono font-semibold text-gray-900">{result.certificateId}</p>
                        </div>
                      </div>

                      {result.status === "expired" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ This certificate has expired. Please contact the institution for renewal.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 border-red-200 bg-red-50">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-red-900">Certificate Not Found</h3>
                        <p className="text-red-700 mt-1">
                          No valid certificate found with the provided details. Please verify:
                        </p>
                        <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                          <li>Certificate ID is correct</li>
                          <li>Staff name matches exactly</li>
                          <li>Certificate has not been revoked</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>This verification tool is provided by Paeds Resus Limited</p>
          <p className="mt-2">
            For questions about certificate authenticity, contact{" "}
            <a href="mailto:verify@paedsresus.com" className="text-blue-600 hover:underline">
              verify@paedsresus.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
