/**
 * CareSignalPostEventPrompt
 *
 * Shown after a ResusGPS session is saved for fellowship credit.
 * Invites the provider to log a Care Signal report for this case.
 * This is the closed-loop accountability bridge between ResusGPS (Pillar B)
 * and Care Signal (Pillar C).
 *
 * Design rules:
 * - Non-blocking: provider can dismiss immediately
 * - Pre-fills event type from the ResusGPS diagnosis
 * - Does NOT duplicate the full CareSignalForm — it links to /care-signal
 *   with a query param so the form opens pre-filled
 * - Shows current Care Signal streak to reinforce motivation
 * - Septic shock vertical slice: optional link to septic-shock-i micro-course
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, ArrowRight, X, BookOpen } from "lucide-react";

interface CareSignalPostEventPromptProps {
  open: boolean;
  onClose: () => void;
  diagnosis: string;
  outcome?: string;
}

function diagnosisToEventType(diagnosis: string): string {
  const d = diagnosis.toLowerCase();
  if (d.includes("cardiac") || d.includes("arrest")) return "cardiac_arrest";
  if (d.includes("septic") || d.includes("sepsis")) return "septic_shock";
  if (d.includes("respiratory") || d.includes("airway")) return "respiratory_failure";
  if (d.includes("seizure") || d.includes("epilepsy") || d.includes("status")) return "status_epilepticus";
  if (d.includes("dka") || d.includes("diabetic")) return "dka";
  if (d.includes("anaphylaxis") || d.includes("allergic")) return "anaphylaxis";
  if (d.includes("trauma")) return "trauma";
  if (d.includes("shock")) return "shock_other";
  return "other_emergency";
}

function eventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    cardiac_arrest: "Cardiac Arrest",
    septic_shock: "Septic Shock",
    respiratory_failure: "Respiratory Failure",
    status_epilepticus: "Status Epilepticus",
    dka: "Diabetic Ketoacidosis",
    anaphylaxis: "Anaphylaxis",
    trauma: "Trauma",
    shock_other: "Shock (Other)",
    other_emergency: "Paediatric Emergency",
  };
  return labels[eventType] || "Paediatric Emergency";
}

function isSepticShockCase(diagnosis: string, eventType: string): boolean {
  return eventType === "septic_shock" || /septic|sepsis/i.test(diagnosis);
}

function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "server";
  const stored = sessionStorage.getItem("analytics_session_id");
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem("analytics_session_id", newId);
  return newId;
}

export function CareSignalPostEventPrompt({
  open,
  onClose,
  diagnosis,
  outcome,
}: CareSignalPostEventPromptProps) {
  const [, navigate] = useLocation();
  const trackEventMutation = trpc.events.trackEvent.useMutation();

  const { data: eventStats } = trpc.careSignalEvents.getEventStats.useQuery(undefined, {
    enabled: open,
    staleTime: 60_000,
  });

  const eventType = diagnosisToEventType(diagnosis);
  const eventLabel = eventTypeLabel(eventType);
  const showSepticCourseLink = isSepticShockCase(diagnosis, eventType);

  const emitLoopEvent = (eventName: string, extra?: Record<string, unknown>) => {
    void trackEventMutation.mutateAsync({
      eventType: "holistic_loop",
      eventName,
      sessionId: getAnalyticsSessionId(),
      pageUrl: "/resus",
      eventData: {
        diagnosis,
        mappedEventType: eventType,
        source: "resusgps_post_case",
        ...extra,
      },
    });
  };

  useEffect(() => {
    if (open) {
      emitLoopEvent("care_signal_prompt_shown");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when dialog opens
  }, [open]);

  const handleDismiss = () => {
    emitLoopEvent("care_signal_prompt_dismissed");
    onClose();
  };

  const handleLogNow = () => {
    emitLoopEvent("care_signal_prompt_accepted", { destination: "/care-signal" });
    const params = new URLSearchParams({
      prefill_eventType: eventType,
      prefill_outcome: outcome || "survived",
      source: "resusgps",
    });
    navigate(`/care-signal?${params.toString()}`);
    onClose();
  };

  const handleSepticCourse = () => {
    emitLoopEvent("septic_shock_micro_course_clicked", {
      destination: "/micro-course/septic-shock-i",
    });
    navigate("/micro-course/septic-shock-i?programType=pals&source=resusgps_loop");
    onClose();
  };

  const streakMonths = eventStats?.streakMonths ?? 0;
  const thisMonthDone = (eventStats?.thisMonthCount ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Log a Care Signal Report
          </DialogTitle>
          <DialogDescription>
            You just managed a <strong>{eventLabel}</strong> case. Logging a Care Signal
            report for this event takes 2 minutes and counts toward your Fellowship Pillar C streak.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your Care Signal Streak</p>
              <p className="text-xs text-muted-foreground">
                {streakMonths} consecutive qualifying month{streakMonths !== 1 ? "s" : ""}
              </p>
            </div>
            {thisMonthDone ? (
              <Badge variant="outline" className="border-green-500 text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                This month: done
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                This month: pending
              </Badge>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pre-filled from this case
            </p>
            <p className="text-sm">
              Event type: <strong>{eventLabel}</strong>
            </p>
            {outcome && (
              <p className="text-sm">
                Outcome: <strong className="capitalize">{outcome.replace(/_/g, " ")}</strong>
              </p>
            )}
          </div>

          {showSepticCourseLink ? (
            <div className="rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-3 space-y-2">
              <p className="text-sm font-medium">Close the learning loop</p>
              <p className="text-xs text-muted-foreground">
                Review recognition and fluid resuscitation in the Paediatric Septic Shock I micro-course.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleSepticCourse}>
                <BookOpen className="h-4 w-4" />
                Open Septic Shock I module
              </Button>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Care Signal reports must not include patient names or identifiers. Submissions support
            quality improvement, fellowship Pillar C progress, and aggregated facility and national
            surveillance — as described in the Care Signal consent and Privacy Policy.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleDismiss} className="flex items-center gap-1">
            <X className="h-4 w-4" />
            Skip for now
          </Button>
          <Button onClick={handleLogNow} className="flex items-center gap-1">
            Log Care Signal Report
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
