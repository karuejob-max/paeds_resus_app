import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface SubmissionData {
  eventDate: string;
  childAge: number;
  hospital?: string;
  outcome?: string;
  systemGaps?: string[];
  eventType?: string;
  algorithm?: string;
  isAnonymous: boolean;
}

interface SubmissionConfirmationModalProps {
  isOpen: boolean;
  isProvider: boolean;
  data: SubmissionData;
  onClose: () => void;
}

export default function SubmissionConfirmationModal({
  isOpen,
  isProvider,
  data,
  onClose,
}: SubmissionConfirmationModalProps) {
  const [, setLocation] = useLocation();
  const destination = isProvider ? "/care-signal-analytics" : "/parent-safe-truth";
  const destinationLabel = isProvider ? "Open Care Signal dashboard" : "Go to my Safe-Truth stories";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <DialogTitle>Event Submitted Successfully</DialogTitle>
              <DialogDescription>
                Thank you for contributing to safer pediatric emergency care
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Submission Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-green-900 mb-3">Submission Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Event Date</p>
                  <p className="font-medium">{new Date(data.eventDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Child Age</p>
                  <p className="font-medium">{data.childAge} years</p>
                </div>
                {data.hospital && (
                  <div>
                    <p className="text-gray-600">Hospital</p>
                    <p className="font-medium">{data.hospital}</p>
                  </div>
                )}
                {data.outcome && (
                  <div>
                    <p className="text-gray-600">Outcome</p>
                    <p className="font-medium">{data.outcome}</p>
                  </div>
                )}
                {isProvider && data.algorithm && (
                  <div>
                    <p className="text-gray-600">Algorithm</p>
                    <p className="font-medium">{data.algorithm}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Submission Type</p>
                  <p className="font-medium">{data.isAnonymous ? "Anonymous" : "Identified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Gaps Identified */}
          {data.systemGaps && data.systemGaps.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  System Gaps Identified
                </h3>
                <ul className="space-y-2">
                  {data.systemGaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-gray-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Impact Message */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-900 mb-2">Your Impact</h3>
              <p className="text-sm text-gray-700">
                {isProvider
                  ? "Your clinical insights help identify patterns in emergency response, escalation, and system gaps. We aggregate this to guide quality-improvement priorities."
                  : "Your family experience helps identify communication and support gaps. We combine stories to improve how parents are informed and supported during emergencies."}
              </p>
            </CardContent>
          </Card>

          {/* Privacy Assurance */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy & Confidentiality</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">✓</span>
                  <span>Your submission is {data.isAnonymous ? "sent without your identity" : "stored with your account details"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">✓</span>
                  <span>Data is used for system improvement, not individual blame</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">✓</span>
                  <span>Facility-level reporting is aggregated to protect individual privacy</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-amber-900 mb-2">What Happens Next?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">1</span>
                  <span>Your submission is queued for review and categorized by issue type.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">2</span>
                  <span>It is aggregated with other reports to identify recurring patterns.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">3</span>
                  <span>
                    {isProvider
                      ? "Relevant institutional teams can use trend insights for quality-improvement work."
                      : "If you are signed in, the status appears in your Safe-Truth stories list when reviewed."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">4</span>
                  <span>
                    {isProvider
                      ? "You can continue submitting events to build a stronger safety signal over time."
                      : "We may also send an email update when a review response is available."}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              setLocation(destination);
            }}
          >
            {destinationLabel}
          </Button>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            {isProvider ? "Submit another event" : "Share another story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
