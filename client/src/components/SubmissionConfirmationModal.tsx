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
import { PAGE_BODY_MUTED } from "@/lib/readable-surfaces";
import { cn } from "@/lib/utils";

const SUMMARY_LABEL = "text-xs font-semibold text-slate-800 dark:text-slate-200";
const SUMMARY_VALUE = "font-medium text-foreground";
const CARD_BODY = "text-sm text-slate-800 dark:text-slate-200 leading-relaxed";
const CARD_NOTE = "text-xs text-slate-700 dark:text-slate-300";

interface GapRecommendation {
  gap: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  action: string;
}

export interface SubmissionData {
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
  high: "bg-red-50 border-red-300 text-red-950 dark:bg-red-950/40 dark:border-red-800 dark:text-red-50",
  medium: "bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-50",
  low: "bg-blue-50 border-blue-300 text-blue-950 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-50",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-200 text-red-950 dark:bg-red-900 dark:text-red-100",
  medium: "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100",
  low: "bg-blue-200 text-blue-950 dark:bg-blue-900 dark:text-blue-100",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden />
            <div>
              <DialogTitle className="text-foreground">Event submitted successfully</DialogTitle>
              <DialogDescription className={PAGE_BODY_MUTED}>
                Thank you for contributing to safer pediatric emergency care.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Submission Summary */}
          <Card className="bg-green-50 border-green-300 dark:bg-green-950/40 dark:border-green-800 shadow-sm">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-green-950 dark:text-green-100 mb-3">Submission summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={SUMMARY_LABEL}>Event date</p>
                  <p className={SUMMARY_VALUE}>
                    {new Date(data.eventDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className={SUMMARY_LABEL}>Child age</p>
                  <p className={SUMMARY_VALUE}>{data.childAge} months</p>
                </div>
                {data.outcome && (
                  <div>
                    <p className={SUMMARY_LABEL}>Outcome</p>
                    <p className={cn(SUMMARY_VALUE, "capitalize")}>
                      {data.outcome.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {isProvider && data.algorithm && (
                  <div>
                    <p className={SUMMARY_LABEL}>Event type</p>
                    <p className={cn(SUMMARY_VALUE, "capitalize")}>
                      {data.algorithm.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                <div>
                  <p className={SUMMARY_LABEL}>Submission type</p>
                  <p className={SUMMARY_VALUE}>
                    {data.isAnonymous ? "Anonymous" : "Identified"}
                  </p>
                </div>
                {data.eventId && (
                  <div>
                    <p className={SUMMARY_LABEL}>Reference ID</p>
                    <p className="font-medium font-mono text-xs text-foreground">#{data.eventId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fellowship Streak Update — live from server */}
          {isProvider && streak !== null && (
            <Card className="bg-violet-50 border-violet-300 dark:bg-violet-950/40 dark:border-violet-800 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-violet-800 dark:text-violet-300" aria-hidden />
                  <h3 className="font-semibold text-violet-950 dark:text-violet-100">
                    Fellowship Pillar C — streak update
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-violet-800 dark:text-violet-200">{streak}</div>
                  <div className="text-sm">
                    <p className="font-medium text-violet-950 dark:text-violet-100">
                      of 24 consecutive qualifying months
                    </p>
                    <p className={CARD_NOTE}>
                      {streak >= 24
                        ? "Fellowship requirement met!"
                        : `${24 - streak} month${24 - streak === 1 ? "" : "s"} remaining`}
                    </p>
                  </div>
                  {streak >= 24 && (
                    <Badge className="ml-auto bg-violet-700 text-white hover:bg-violet-700">
                      Qualified
                    </Badge>
                  )}
                </div>
                <div className="mt-3 w-full bg-violet-200 dark:bg-violet-900 rounded-full h-2">
                  <div
                    className="bg-violet-700 dark:bg-violet-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((streak / 24) * 100))}%` }}
                  />
                </div>
                <p className={cn(CARD_NOTE, "mt-2")}>
                  This submission counts toward your current month&apos;s qualifying event. Streak resets if you miss a
                  month without a grace period.
                </p>
              </CardContent>
            </Card>
          )}

          {/* System Gaps Identified */}
          {data.systemGaps && data.systemGaps.length > 0 && (
            <Card className="bg-sky-50 border-sky-300 dark:bg-sky-950/40 dark:border-sky-800 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sky-950 dark:text-sky-100 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" aria-hidden />
                  System gaps identified ({data.systemGaps.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.systemGaps.map((gap, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-sky-400 bg-white/80 text-sky-950 dark:bg-sky-950 dark:border-sky-600 dark:text-sky-100"
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
                <BookOpen className="w-4 h-4 text-brand-teal shrink-0" aria-hidden />
                <h3 className="font-semibold text-foreground">
                  Recommended actions ({recommendations.length})
                </h3>
              </div>

              {/* High priority first */}
              {highPriorityRecs.map((rec, i) => (
                <Card key={`high-${i}`} className={cn("border shadow-sm", PRIORITY_COLORS[rec.priority])}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm">{rec.gap}</p>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-semibold",
                          PRIORITY_BADGE[rec.priority],
                        )}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className={cn(CARD_BODY, "mb-2")}>{rec.recommendation}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-semibold", CARD_NOTE)}>
                      <ArrowRight className="w-3 h-3 shrink-0" aria-hidden />
                      {rec.action}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Medium/low priority */}
              {otherRecs.map((rec, i) => (
                <Card key={`other-${i}`} className={cn("border shadow-sm", PRIORITY_COLORS[rec.priority])}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm">{rec.gap}</p>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-semibold",
                          PRIORITY_BADGE[rec.priority],
                        )}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className={cn(CARD_BODY, "mb-2")}>{rec.recommendation}</p>
                    <div className={cn("flex items-center gap-1 text-xs font-semibold", CARD_NOTE)}>
                      <ArrowRight className="w-3 h-3 shrink-0" aria-hidden />
                      {rec.action}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Impact Message */}
          <Card className="bg-brand-surface border-border dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Your impact</h3>
              <p className={CARD_BODY}>
                {isProvider
                  ? "Your clinical insights help identify patterns in emergency response, escalation, and system gaps. We aggregate this to guide quality-improvement priorities across facilities."
                  : "Your family experience helps identify communication and support gaps. We combine stories to improve how parents are informed and supported during emergencies."}
              </p>
            </CardContent>
          </Card>

          {/* Privacy Assurance */}
          <Card className="bg-slate-100 border-slate-300 dark:bg-slate-900/60 dark:border-slate-700 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-brand-teal shrink-0" aria-hidden />
                <h3 className="font-semibold text-foreground">Privacy & confidentiality</h3>
              </div>
              <ul className={cn("space-y-2", CARD_BODY)}>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>
                    Your submission is{" "}
                    {data.isAnonymous
                      ? "sent without your identity"
                      : "stored with your account details"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Data is used for system improvement, not individual blame</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Facility-level reporting is aggregated to protect individual privacy</span>
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
          <Button onClick={onClose} className="bg-brand-teal hover:bg-[#143333] text-white">
            {isProvider ? "Submit another event" : "Share another story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
