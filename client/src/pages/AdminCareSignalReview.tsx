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
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// ─── types ───────────────────────────────────────────────────────────────────

interface ReviewEvent {
  id: number;
  userId: number | null;
  eventDate: Date | string;
  childAge: number;
  eventType: string;
  outcome: string;
  systemGaps: string[];
  gapDetails: Record<string, unknown>;
  status: string;
  createdAt: Date | string;
}

type ReviewOutcome = "acknowledged" | "escalated" | "closed";

const OUTCOME_STYLE: Record<string, string> = {
  survived: "bg-blue-100 text-blue-700",
  neurologically_intact: "bg-green-100 text-green-700",
  poor_outcome: "bg-red-100 text-red-700",
  died: "bg-red-200 text-red-900",
  unknown: "bg-slate-100 text-slate-600",
};

// ─── main component ──────────────────────────────────────────────────────────

export default function AdminCareSignalReview() {
  const [, setLocation] = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<ReviewEvent | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>("acknowledged");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [reviewError, setReviewError] = useState("");

  // ── data ──
  const metricsQ = trpc.careSignalEvents.getAdminMetrics.useQuery({ timeframe: "month" });
  const queueQ = trpc.careSignalEvents.getEventsUnderReview.useQuery({
    limit: 50,
    offset: 0,
  });

  const markReviewedMutation = trpc.careSignalEvents.markReviewed.useMutation({
    onSuccess: () => {
      setSelectedEvent(null);
      setReviewerNotes("");
      setReviewError("");
      queueQ.refetch();
      metricsQ.refetch();
    },
    onError: (err) => {
      setReviewError(err.message);
    },
  });

  const metrics = metricsQ.data;
  const queue: ReviewEvent[] = queueQ.data?.events ?? [];
  const queueTotal = queueQ.data?.total ?? 0;

  const handleMarkReviewed = () => {
    if (!selectedEvent) return;
    setReviewError("");
    markReviewedMutation.mutate({
      eventId: selectedEvent.id,
      reviewOutcome,
      reviewerNotes,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-6 h-6 text-slate-700" />
              <h1 className="text-3xl font-bold text-slate-900">Care Signal — Review Queue</h1>
            </div>
            <p className="text-slate-600">
              Institutional review of provider-submitted Care Signal events.
              All actions are logged.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => queueQ.refetch()}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setLocation("/admin")}
            >
              Admin Hub
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold text-blue-600">
                  {metrics?.totalSubmissions ?? 0}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold text-purple-600">
                  {metrics?.submissionsThisMonth ?? 0}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold text-amber-600">
                  {metrics?.underReviewCount ?? 0}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Unique Providers</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsQ.isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold text-green-600">
                  {metrics?.uniqueProviders ?? 0}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Reporting</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Gap Breakdown */}
        {metrics?.gapBreakdown && Object.keys(metrics.gapBreakdown).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top System Gaps (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.gapBreakdown as Record<string, number>)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([gap, count]) => (
                    <Badge key={gap} variant="outline" className="text-sm">
                      {gap}: <span className="font-bold ml-1">{count}</span>
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Events Awaiting Review
              {queueTotal > 0 && (
                <Badge className="bg-amber-100 text-amber-800 ml-2">{queueTotal}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Provider-submitted events flagged for institutional review. Click an event to
              review and close it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueQ.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Review queue is clear</p>
                <p className="text-sm text-slate-500 mt-1">
                  No events are currently awaiting review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          {event.eventType.replace(/_/g, " ")}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.eventDate).toLocaleDateString("en-KE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>Child age: {event.childAge} months</span>
                          <span>Submitted: {new Date(event.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            OUTCOME_STYLE[event.outcome] ?? "bg-slate-100 text-slate-600"
                          }
                        >
                          {event.outcome.replace(/_/g, " ")}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                        >
                          Review
                          <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {event.systemGaps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.systemGaps.map((g, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs border-slate-300"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {event.gapDetails?.reviewNotes !== undefined && (() => {
                      const note = String(event.gapDetails["reviewNotes"] ?? "");
                      return (
                        <p className="text-xs text-slate-500 mt-2 italic">
                          Provider note: &quot;{note}&quot;
                        </p>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Facilities */}
        {metrics?.topFacilities && metrics.topFacilities.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Top Reporting Facilities</CardTitle>
              <CardDescription>Facilities with the most Care Signal submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(metrics.topFacilities as { facilityName: string; count: number }[]).map(
                  (f, i) => (
                    <div key={f.facilityName} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                      <span className="flex-1 text-sm font-medium">{f.facilityName}</span>
                      <Badge variant="outline">{f.count} events</Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null);
            setReviewerNotes("");
            setReviewError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Care Signal Event #{selectedEvent?.id}</DialogTitle>
            <DialogDescription>
              Record your review outcome. This action is logged and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Event summary */}
              <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Event type</span>
                  <span className="font-medium capitalize">
                    {selectedEvent.eventType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outcome</span>
                  <span className="font-medium capitalize">
                    {selectedEvent.outcome.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Child age</span>
                  <span className="font-medium">{selectedEvent.childAge} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Event date</span>
                  <span className="font-medium">
                    {new Date(selectedEvent.eventDate).toLocaleDateString("en-KE")}
                  </span>
                </div>
                {selectedEvent.systemGaps.length > 0 && (
                  <div>
                    <span className="text-slate-500">System gaps</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEvent.systemGaps.map((g, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Review outcome */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Outcome</label>
                <Select
                  value={reviewOutcome}
                  onValueChange={(v) => setReviewOutcome(v as ReviewOutcome)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acknowledged">
                      Acknowledged — noted and filed
                    </SelectItem>
                    <SelectItem value="escalated">
                      Escalated — requires further action
                    </SelectItem>
                    <SelectItem value="closed">
                      Closed — resolved or no action needed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewer notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reviewer Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
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
              onClick={() => {
                setSelectedEvent(null);
                setReviewerNotes("");
                setReviewError("");
              }}
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
