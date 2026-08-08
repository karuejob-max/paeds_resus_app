/**
 * Admin review queue for Code Signal — sibling of AdminCareSignalReview.tsx,
 * built for WORK_STATUS 2026-08-07 "In progress" queue item #1: Code Signal
 * shipped submit-only, with no way for anyone to ever look at a report
 * again. This closes that gap with the minimal useful workflow: list
 * pending reports, open one, record an outcome + notes, mark reviewed.
 *
 * Deliberately smaller than Care Signal's version — no v2-form-detail
 * rendering (Code Signal has only ever had one form version), no
 * gapDetails JSON parsing (dedicated typed columns instead, migration 0091).
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  CONDITION_CATEGORY_LABELS,
  PATIENT_CATEGORY_LABELS,
  OUTCOME_CATEGORY_LABELS,
  DOMAIN_LABELS,
  type Domain,
} from "@/lib/code-signal";

interface ReviewEvent {
  id: number;
  eventDate: Date | string;
  patientCategory: keyof typeof PATIENT_CATEGORY_LABELS;
  conditionCategory: string;
  outcomeCategory: string;
  reportTrack: "FAILURE" | "SUCCESS";
  failureDomains: string | null;
  successDomains: string | null;
  createdAt: Date | string;
}

type ReviewOutcome = "acknowledged" | "escalated" | "closed";

const OUTCOME_STYLE: Record<string, string> = {
  SURVIVED_WELL: "bg-green-100 text-green-700",
  SURVIVED_MORBIDITY: "bg-blue-100 text-blue-700",
  DIED_IN_FACILITY: "bg-red-200 text-red-900",
  DIED_IN_TRANSIT: "bg-red-200 text-red-900",
  NEAR_MISS: "bg-amber-100 text-amber-700",
  TRANSFERRED_UNKNOWN: "bg-slate-100 text-slate-600",
  UNKNOWN: "bg-slate-100 text-slate-600",
};

function parseDomains(raw: string | null): Domain[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Domain[]) : [];
  } catch {
    return [];
  }
}

export default function AdminCodeSignalReview() {
  const [, setLocation] = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<ReviewEvent | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>("acknowledged");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [reviewError, setReviewError] = useState("");

  const metricsQ = trpc.codeSignalEvents.getAdminMetrics.useQuery({ timeframe: "month" });
  const queueQ = trpc.codeSignalEvents.getEventsUnderReview.useQuery({ limit: 50, offset: 0 });

  const markReviewedMutation = trpc.codeSignalEvents.markReviewed.useMutation({
    onSuccess: () => {
      setSelectedEvent(null);
      setReviewerNotes("");
      setReviewError("");
      queueQ.refetch();
      metricsQ.refetch();
    },
    onError: (err) => setReviewError(err.message),
  });

  const metrics = metricsQ.data;
  const queue: ReviewEvent[] = (queueQ.data?.events as ReviewEvent[]) ?? [];
  const queueTotal = queueQ.data?.total ?? 0;

  const handleMarkReviewed = () => {
    if (!selectedEvent) return;
    setReviewError("");
    markReviewedMutation.mutate({ eventId: selectedEvent.id, reviewOutcome, reviewerNotes });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-6 h-6 text-slate-700" />
              <h1 className="text-3xl font-bold text-slate-900">Code Signal — Review Queue</h1>
            </div>
            <p className="text-slate-600">
              Institutional review of provider-submitted adult/whole-hospital resuscitation reports.
              All actions are logged.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => queueQ.refetch()}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setLocation("/admin")}>
              Admin Hub
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? <Skeleton className="h-9 w-16" /> : (
                <p className="text-3xl font-bold text-blue-600">{metrics?.totalSubmissions ?? 0}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? <Skeleton className="h-9 w-16" /> : (
                <p className="text-3xl font-bold text-purple-600">{metrics?.submissionsThisMonth ?? 0}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? <Skeleton className="h-9 w-16" /> : (
                <p className="text-3xl font-bold text-amber-600">{metrics?.pendingCount ?? 0}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Unique Providers</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? <Skeleton className="h-9 w-16" /> : (
                <p className="text-3xl font-bold text-green-600">{metrics?.uniqueProviders ?? 0}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">Reporting</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Events Awaiting Review
              {queueTotal > 0 && <Badge className="bg-amber-100 text-amber-800 ml-2">{queueTotal}</Badge>}
            </CardTitle>
            <CardDescription>
              Provider-submitted reports awaiting institutional review. Click a report to review and close it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueQ.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Review queue is clear</p>
                <p className="text-sm text-slate-500 mt-1">No reports are currently awaiting review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((event) => {
                  const domains = event.reportTrack === "FAILURE"
                    ? parseDomains(event.failureDomains)
                    : parseDomains(event.successDomains);
                  return (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {CONDITION_CATEGORY_LABELS[event.conditionCategory as keyof typeof CONDITION_CATEGORY_LABELS] ?? event.conditionCategory}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(event.eventDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                            <span>{PATIENT_CATEGORY_LABELS[event.patientCategory] ?? event.patientCategory}</span>
                            <span>Submitted: {new Date(event.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.reportTrack === "FAILURE" ? "Failure" : "Success"}
                          </Badge>
                          <Badge className={OUTCOME_STYLE[event.outcomeCategory] ?? "bg-slate-100 text-slate-600"}>
                            {OUTCOME_CATEGORY_LABELS[event.outcomeCategory as keyof typeof OUTCOME_CATEGORY_LABELS] ?? event.outcomeCategory}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                          >
                            Review
                            <ArrowUpRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {domains.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {domains.map((d) => (
                            <Badge key={d} variant="outline" className="text-xs border-slate-300">
                              {DOMAIN_LABELS[d] ?? d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setReviewerNotes(""); setReviewError(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Code Signal Report</DialogTitle>
            <DialogDescription>Record an outcome for this report. This closes the review loop for the reporter's facility.</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient category</span>
                  <span className="font-medium">{PATIENT_CATEGORY_LABELS[selectedEvent.patientCategory] ?? selectedEvent.patientCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Condition</span>
                  <span className="font-medium">{CONDITION_CATEGORY_LABELS[selectedEvent.conditionCategory as keyof typeof CONDITION_CATEGORY_LABELS] ?? selectedEvent.conditionCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outcome</span>
                  <span className="font-medium">{OUTCOME_CATEGORY_LABELS[selectedEvent.outcomeCategory as keyof typeof OUTCOME_CATEGORY_LABELS] ?? selectedEvent.outcomeCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Event date</span>
                  <span className="font-medium">{new Date(selectedEvent.eventDate).toLocaleDateString("en-KE")}</span>
                </div>
                {(() => {
                  const domains = selectedEvent.reportTrack === "FAILURE"
                    ? parseDomains(selectedEvent.failureDomains)
                    : parseDomains(selectedEvent.successDomains);
                  return domains.length > 0 ? (
                    <div>
                      <span className="text-slate-500">{selectedEvent.reportTrack === "FAILURE" ? "Failure domains" : "Success domains"}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {domains.map((d) => <Badge key={d} variant="outline" className="text-xs">{DOMAIN_LABELS[d] ?? d}</Badge>)}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Review Outcome</label>
                <Select value={reviewOutcome} onValueChange={(v) => setReviewOutcome(v as ReviewOutcome)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acknowledged">Acknowledged — noted and filed</SelectItem>
                    <SelectItem value="escalated">Escalated — requires further action</SelectItem>
                    <SelectItem value="closed">Closed — resolved or no action needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reviewer Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Add any notes about this review decision..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {reviewError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{reviewError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setSelectedEvent(null); setReviewerNotes(""); setReviewError(""); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkReviewed}
              disabled={markReviewedMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {markReviewedMutation.isPending ? "Saving..." : "Mark as Reviewed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
