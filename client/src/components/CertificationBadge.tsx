/**
 * Certification Badge Component
 * 
 * Displays digital certificates and badges for completed courses
 * Features:
 * - Digital certificate display
 * - Badge system with different tiers
 * - Certificate download (PDF)
 * - Certificate verification code
 * - Share certificate on social media
 * - Certificate history
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Share2, Copy, CheckCircle2, Award, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  providerName: string;
  completionDate: Date;
  verificationCode: string;
  score: number;
  issueDate: Date;
  expiryDate?: Date;
  badgeUrl?: string;
}

interface CertificationBadgeProps {
  certificate: Certificate;
  onDownload?: (certificateId: string) => void;
  onShare?: (certificateId: string) => void;
}

export function CertificationBadge({ certificate, onDownload, onShare }: CertificationBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyVerificationCode = () => {
    navigator.clipboard.writeText(certificate.verificationCode);
    setCopied(true);
    toast.success('Verification code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(certificate.id);
      toast.success('Downloading certificate...');
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(certificate.id);
    }
  };

  const completionDate = new Date(certificate.completionDate);
  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                {certificate.courseTitle}
              </CardTitle>
              <CardDescription>Paeds Resus Fellowship</CardDescription>
            </div>
            <Badge variant="default" className="bg-green-600">
              Completed
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Certificate Preview */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-indigo-200">
            <div className="text-center space-y-2">
              <Award className="h-12 w-12 text-amber-600 mx-auto" />
              <p className="font-semibold text-slate-900">Certificate of Completion</p>
              <p className="text-sm text-slate-600">{certificate.courseTitle}</p>
              <p className="text-xs text-slate-500">Completed on {formattedDate}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600 font-medium">Score</p>
              <p className="text-lg font-bold text-green-600">{certificate.score}%</p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">Verification Code</p>
              <p className="font-mono text-xs text-slate-700 truncate">{certificate.verificationCode}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setShowDetails(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              View Details
            </Button>
            <Button onClick={handleDownload} size="sm" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
            <DialogDescription>
              Paeds Resus Fellowship Certificate of Completion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Certificate Display */}
            <div className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-4 border-indigo-200 text-center space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 uppercase tracking-widest">Certificate of Completion</p>
                <h2 className="text-3xl font-bold text-slate-900">Paeds Resus Fellowship</h2>
              </div>

              <div className="py-4 border-t-2 border-b-2 border-indigo-200">
                <p className="text-sm text-slate-600 mb-1">This certifies that</p>
                <p className="text-xl font-bold text-slate-900">{certificate.providerName}</p>
                <p className="text-sm text-slate-600 mt-1">has successfully completed</p>
                <p className="text-lg font-semibold text-indigo-700 mt-2">{certificate.courseTitle}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Completion Date:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Score:</span>
                  <span className="font-medium text-green-600">{certificate.score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Verification Code:</span>
                  <span className="font-mono text-xs">{certificate.verificationCode}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">
                This certificate is valid and can be verified at paeds-resus.com/verify
              </p>
            </div>

            {/* Verification Code */}
            <div className="space-y-2">
              <h3 className="font-semibold">Verification Code</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certificate.verificationCode}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 font-mono text-sm"
                />
                <Button
                  onClick={handleCopyVerificationCode}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-slate-600">
                Share this code to verify your certificate authenticity
              </p>
            </div>

            {/* Certificate Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-600 font-medium mb-1">Issue Date</p>
                <p className="font-semibold">
                  {new Date(certificate.issueDate).toLocaleDateString()}
                </p>
              </div>
              {certificate.expiryDate && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-600 font-medium mb-1">Expiry Date</p>
                  <p className="font-semibold">
                    {new Date(certificate.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Download and Share */}
            <div className="flex gap-3">
              <Button onClick={handleDownload} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Share Certificate
              </Button>
            </div>

            {/* Verification Info */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This certificate can be verified at paeds-resus.com/verify using the verification code above.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Certificate History Component
 * Displays all certificates earned by a user
 */
interface CertificateHistoryProps {
  certificates: Certificate[];
  onDownload?: (certificateId: string) => void;
  onShare?: (certificateId: string) => void;
}

export function CertificateHistory({
  certificates,
  onDownload,
  onShare,
}: CertificateHistoryProps) {
  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No certificates yet</p>
            <p className="text-sm text-slate-500">
              Complete courses to earn certificates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Certificates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <CertificationBadge
            key={cert.id}
            certificate={cert}
            onDownload={onDownload}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
}
