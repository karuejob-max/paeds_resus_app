import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface GapRecommendation {
  gap: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  action: string;
}

interface SubmissionData {
  eventDate: string;
  childAge: number;
  hospital?: string;
  outcome?: string;
  systemGaps?: string[];
  eventType?: string;
  algorithm?: string;
  isAnonymous: boolean;
  /** Server-generated recommendations returned from logEvent mutation */
  recommendations?: GapRecommendation[];
  eventId?: string;
  timestamp?: Date | string;
}

interface SubmissionConfirmationModalProps {
  isOpen: boolean;
  isProvider: boolean;
  data: SubmissionData;
  onClose: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-red-900",
  medium: "bg-amber-50 border-amber-200 text-amber-900",
  low: "bg-blue-50 border-blue-200 text-blue-900",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-blue-100 text-blue-800",
};

export default function SubmissionConfirmationModal({
  isOpen,
  isProvider,
  data,
  onClose,
}: SubmissionConfirmationModalProps) {
  const [, setLocation] = useLocation();
  const destination = isProvider ? "/care-signal-analytics" : "/parent-safe-truth";
  const destinationLabel = isProvider
    ? "Open Care Signal dashboard"
    : "Go to my Safe-Truth stories";

  // Fetch live fellowship progress to show streak update in the modal
  const { data: fellowshipData } = trpc.fellowship.getProgress.useQuery(undefined, {
    enabled: isOpen && isProvider,
    staleTime: 0, // always fresh after a submission
  });

  const streak = fellowshipData?.careSignalPillar?.streak ?? null;
  const recommendations: GapRecommendation[] = data.recommendations ?? [];
  const highPriorityRecs = recommendations.filter((r) => r.priority === "high");
  const otherRecs = recommendations.filter((r) => r.priority !== "high");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
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
                  <p className="font-medium">
                    {new Date(data.eventDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Child Age</p>
                  <p className="font-medium">{data.childAge} months</p>
                </div>
                {data.outcome && (
                  <div>
                    <p className="text-gray-600">Outcome</p>
                    <p className="font-medium capitalize">
                      {data.outcome.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {isProvider && data.algorithm && (
                  <div>
                    <p className="text-gray-600">Event Type</p>
                    <p className="font-medium capitalize">
                      {data.algorithm.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Submission Type</p>
                  <p className="font-medium">
                    {data.isAnonymous ? "Anonymous" : "Identified"}
                  </p>
                </div>
                {data.eventId && (
                  <div>
                    <p className="text-gray-600">Reference ID</p>
                    <p className="font-medium font-mono text-xs">#{data.eventId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fellowship Streak Update — live from server */}
          {isProvider && streak !== null && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-700" />
                  <h3 className="font-semibold text-purple-900">
                    Fellowship Pillar C — Streak Update
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-purple-700">{streak}</div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">
                      of 24 consecutive qualifying months
                    </p>
                    <p className="text-gray-500">
                      {streak >= 24
                        ? "Fellowship requirement met!"
                        : `${24 - streak} month${24 - streak === 1 ? "" : "s"} remaining`}
                    </p>
                  </div>
                  {streak >= 24 && (
                    <Badge className="ml-auto bg-purple-600 text-white">
                      Qualified
                    </Badge>
                  )}
                </div>
                <div className="mt-3 w-full bg-purple-100 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((streak / 24) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This submission counts toward your current month's qualifying event.
                  Streak resets if you miss a month without a grace period.
                </p>
              </CardContent>
            </Card>
          )}

          {/* System Gaps Identified */}
          {data.systemGaps && data.systemGaps.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  System Gaps Identified ({data.systemGaps.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.systemGaps.map((gap, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-blue-300 text-blue-800"
                    >
                      {gap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actionable Recommendations — server-generated, gap-specific */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  Recommended Actions ({recommendations.length})
                </h3>
              </div>

              {/* High priority first */}
              {highPriorityRecs.map((rec, i) => (
                <Card key={`high-${i}`} className={`border ${PRIORITY_COLORS[rec.priority]}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{rec.gap}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[rec.priority]}`}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.recommendation}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <ArrowRight className="w-3 h-3" />
                      {rec.action}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Medium/low priority */}
              {otherRecs.map((rec, i) => (
                <Card key={`other-${i}`} className={`border ${PRIORITY_COLORS[rec.priority]}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{rec.gap}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[rec.priority]}`}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.recommendation}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <ArrowRight className="w-3 h-3" />
                      {rec.action}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Impact Message */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-900 mb-2">Your Impact</h3>
              <p className="text-sm text-gray-700">
                {isProvider
                  ? "Your clinical insights help identify patterns in emergency response, escalation, and system gaps. We aggregate this to guide quality-improvement priorities across facilities."
                  : "Your family experience helps identify communication and support gaps. We combine stories to improve how parents are informed and supported during emergencies."}
              </p>
            </CardContent>
          </Card>

          {/* Privacy Assurance */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Privacy & Confidentiality</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">✓</span>
                  <span>
                    Your submission is{" "}
                    {data.isAnonymous
                      ? "sent without your identity"
                      : "stored with your account details"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">✓</span>
                  <span>Data is used for system improvement, not individual blame</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">✓</span>
                  <span>
                    Facility-level reporting is aggregated to protect individual privacy
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 pt-2">
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
