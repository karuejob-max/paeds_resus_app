import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function CertificateVerification() {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyCertificate = trpc.certificates.verify.useQuery(
    {
      certificateNumber,
      recipientName,
    },
    {
      enabled: false,
    }
  );

  const handleVerify = async () => {
    if (!certificateNumber.trim() || !recipientName.trim()) {
      setVerificationResult({
        error: "Please enter both certificate number and recipient name",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyCertificate.refetch();
      setVerificationResult(result.data);
    } catch (error) {
      setVerificationResult({
        error: error instanceof Error ? error.message : "Verification failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verify Your Certificate
          </h1>
          <p className="text-lg text-gray-600">
            Validate your Paeds Resus training certificate using your certificate number
            and full name.
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            {/* Certificate Number Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Certificate Number
              </label>
              <Input
                placeholder="e.g., PRES-ABC123-DEF456"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this on your certificate document
              </p>
            </div>

            {/* Recipient Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name (as on Certificate)
              </label>
              <Input
                placeholder="John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must match exactly with certificate
              </p>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            >
              {isLoading ? "Verifying..." : "Verify Certificate"}
            </Button>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className="mt-8 pt-8 border-t">
              {verificationResult.valid ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        Certificate Verified
                      </h3>
                      <div className="space-y-2 text-green-800">
                        <p>
                          <span className="font-semibold">Certificate Number:</span>{" "}
                          {verificationResult.certificate?.certificateNumber}
                        </p>
                        <p>
                          <span className="font-semibold">Program Type:</span>{" "}
                          {verificationResult.certificate?.programType?.toUpperCase()}
                        </p>
                        <p>
                          <span className="font-semibold">Issue Date:</span>{" "}
                          {new Date(
                            verificationResult.certificate?.issueDate
                          ).toLocaleDateString()}
                        </p>
                        {verificationResult.certificate?.expiryDate && (
                          <p>
                            <span className="font-semibold">Expiry Date:</span>{" "}
                            {new Date(
                              verificationResult.certificate.expiryDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-green-700 mt-4">
                        This certificate is valid and authentic. You can use it for
                        professional credentials and employment verification.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Verification Failed
                      </h3>
                      <p className="text-red-800">
                        {verificationResult.error ||
                          "The certificate could not be verified. Please check the certificate number and name."}
                      </p>
                      <p className="text-sm text-red-700 mt-4">
                        If you believe this is an error, please contact support at{" "}
                        <a
                          href="mailto:support@paedsresus.com"
                          className="underline font-semibold"
                        >
                          support@paedsresus.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Why Verify?</p>
                <p>
                  Certificate verification ensures authenticity and helps employers,
                  institutions, and professional bodies confirm your training completion.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Where do I find my certificate number?
            </h3>
            <p className="text-sm text-gray-600">
              Your certificate number is displayed prominently on your certificate
              document in the format PRES-XXXXXX-XXXXXX.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              How long is my certificate valid?
            </h3>
            <p className="text-sm text-gray-600">
              Most Paeds Resus certificates are valid for 1 year from the issue date.
              Check your certificate for specific validity period.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I download my certificate?
            </h3>
            <p className="text-sm text-gray-600">
              Yes! Log into your dashboard and navigate to "My Certificates" to download
              your certificate in PDF format.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              What if my certificate is not found?
            </h3>
            <p className="text-sm text-gray-600">
              Please ensure you've entered the correct certificate number and full name
              exactly as they appear on your certificate.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
