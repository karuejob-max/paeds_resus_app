/**
 * Shared clinical content version + unsafe-content report (B1/B4/B13).
 * Used on fellowship player, AHA player, and ResusGPS.
 */
import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import type { FeedbackCategory, FeedbackContextJson } from "@shared/platform-feedback";

export type ClinicalContentSafetySurface = "fellowship_player" | "aha_player" | "resus_gps";

type Props = {
  /** Course slug, AHA program type, or `resus-gps`. */
  surfaceId: string;
  surface?: ClinicalContentSafetySurface;
  moduleId?: number;
  pageUrl?: string;
  /** Extra player/session context merged into feedback tickets. */
  feedbackContext?: FeedbackContextJson;
  className?: string;
  /** Smaller padding for bedside ResusGPS idle screen. */
  compact?: boolean;
};

export function ClinicalContentSafetyFooter({
  surfaceId,
  surface = "fellowship_player",
  moduleId,
  pageUrl,
  feedbackContext,
  className,
  compact,
}: Props) {
  const { data: clinicalVersion } = trpc.courses.getClinicalContentVersion.useQuery();
  const trackProductActivity = trpc.events.trackEvent.useMutation();
  const reportUnsafeMutation = trpc.contentSafety.reportUnsafeContent.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        const ref = "ticketId" in res && res.ticketId ? ` — reference #${res.ticketId}` : "";
        toast.success(`Report submitted${ref}.`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const [unsafeReportOpen, setUnsafeReportOpen] = useState(false);
  const [unsafeReportMessage, setUnsafeReportMessage] = useState("");
  const contentVersionTracked = useRef(false);

  const resolvedPageUrl =
    pageUrl ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  const feedbackCategory: FeedbackCategory = surface === "resus_gps" ? "resus_gps" : "course_content";

  useEffect(() => {
    if (contentVersionTracked.current || !surfaceId || !clinicalVersion?.version) return;
    contentVersionTracked.current = true;
    trackProductActivity.mutate({
      eventType: "content_safety",
      eventName: "content_version_viewed",
      eventData: {
        courseId: surfaceId,
        contentVersion: clinicalVersion.version,
        surface,
      },
      sessionId: getAnalyticsSessionId(),
      pageUrl: resolvedPageUrl,
    });
  }, [surfaceId, clinicalVersion?.version, surface, trackProductActivity, resolvedPageUrl]);

  if (!surfaceId) return null;

  return (
    <footer
      className={cn(
        "border-t border-slate-200 text-center text-xs text-muted-foreground space-y-2",
        compact ? "px-3 py-3" : "px-4 py-6 mt-8",
        className
      )}
    >
      {clinicalVersion?.version && (
        <p>Clinical content v{clinicalVersion.version}</p>
      )}
      <Dialog open={unsafeReportOpen} onOpenChange={setUnsafeReportOpen}>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="text-xs h-auto p-0 text-amber-800">
            <ShieldAlert className="w-3 h-3 mr-1 inline" />
            Report unsafe or incorrect content
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Report content safety concern</DialogTitle>
            <DialogDescription>
              Describe what may be unsafe or incorrect. Reports are reviewed by the clinical team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`unsafe-report-${surfaceId}`}>Your message</Label>
            <Textarea
              id={`unsafe-report-${surfaceId}`}
              rows={4}
              value={unsafeReportMessage}
              onChange={(e) => setUnsafeReportMessage(e.target.value)}
              placeholder="e.g. dose conflict, missing neonate warning, wrong first-line drug…"
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              disabled={unsafeReportMessage.trim().length < 10 || reportUnsafeMutation.isPending}
              className="w-full sm:w-auto"
              onClick={() => {
                reportUnsafeMutation.mutate(
                  {
                    courseId: surfaceId,
                    moduleId,
                    message: unsafeReportMessage.trim(),
                    surface,
                  },
                  {
                    onSuccess: (res) => {
                      if (res.success) {
                        setUnsafeReportMessage("");
                        setUnsafeReportOpen(false);
                      }
                    },
                  }
                );
              }}
            >
              {reportUnsafeMutation.isPending ? "Sending…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FeedbackDialog
        defaultCategory={feedbackCategory}
        contextJson={{
          pageUrl: resolvedPageUrl,
          courseSlug: surfaceId,
          courseId: surfaceId,
          moduleId,
          surface,
          ...feedbackContext,
        }}
        compact
      />
      <p className="text-[10px]">Educational use only — apply your facility protocol and senior review.</p>
    </footer>
  );
}
