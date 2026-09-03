import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const labels = {
  video_prework: "Video Prework Completion Certificate",
  precourse_assessment: "Passed Precourse Self-Assessment Certificate",
} as const;

function ReviewRow({ row, onRefresh }: { row: any; onRefresh: () => void }) {
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();
  const review = trpc.courses.reviewElearningProof.useMutation({
    onSuccess: async () => {
      setReason("");
      await utils.courses.getElearningProofReviewQueue.invalidate();
      onRefresh();
    },
  });
  const video = trpc.courses.getElearningProofDownloadUrl.useQuery(
    { enrollmentId: row.enrollmentId, documentType: "video_prework" },
    { enabled: false, retry: false }
  );
  const assessment = trpc.courses.getElearningProofDownloadUrl.useQuery(
    { enrollmentId: row.enrollmentId, documentType: "precourse_assessment" },
    { enabled: false, retry: false }
  );

  const openEvidence = async (query: typeof video) => {
    const result = await query.refetch();
    if (result.data?.url)
      window.open(result.data.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {row.userName || "Unnamed learner"}
            </CardTitle>
            <CardDescription>
              {row.userEmail || "No email"} · {row.programType.toUpperCase()} ·
              Enrollment #{row.enrollmentId}
            </CardDescription>
          </div>
          {row.verifiedAt ? (
            <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge>
          ) : row.rejectedAt ? (
            <Badge variant="destructive">Rejected</Badge>
          ) : (
            <Badge variant="secondary">Pending review</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="justify-between"
            onClick={() => openEvidence(video)}
            disabled={!row.videoPreworkCertificateUrl || video.isFetching}
          >
            {labels.video_prework}
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="justify-between"
            onClick={() => openEvidence(assessment)}
            disabled={
              !row.precourseAssessmentCertificateUrl || assessment.isFetching
            }
          >
            {labels.precourse_assessment}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        {row.rejectionReason && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            <strong>Previous reason:</strong> {row.rejectionReason}
          </p>
        )}
        {!row.verifiedAt && (
          <>
            <Textarea
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder="Review note. Required when rejecting; recommended when verifying."
              maxLength={1000}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  review.isPending ||
                  !row.cognitiveModulesComplete ||
                  !row.videoPreworkCertificateUrl ||
                  !row.precourseAssessmentCertificateUrl ||
                  row.precourseAssessmentPassed !== true
                }
                onClick={() =>
                  review.mutate({
                    enrollmentId: row.enrollmentId,
                    decision: "verified",
                    reason: reason.trim(),
                  })
                }
              >
                {review.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}{" "}
                Verify certificates
              </Button>
              <Button
                variant="destructive"
                disabled={review.isPending || !reason.trim()}
                onClick={() =>
                  review.mutate({
                    enrollmentId: row.enrollmentId,
                    decision: "rejected",
                    reason: reason.trim(),
                  })
                }
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject with reason
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function IerpReviewRow({
  rows,
  onRefresh,
}: {
  rows: any[];
  onRefresh: () => void;
}) {
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();
  const review = trpc.ierp.reviewPhase1Evidence.useMutation({
    onSuccess: async () => {
      setReason("");
      await utils.ierp.listPhase1EvidenceForReview.invalidate();
      onRefresh();
    },
  });
  const openEvidence = async (evidenceId: number) => {
    const result = await utils.ierp.getPhase1EvidenceDownloadUrl.fetch({
      evidenceId,
    });
    if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
  };
  const program = rows[0];
  const hasBoth = new Set(rows.map(row => row.documentType)).size === 2;
  const verified = rows.length > 0 && rows.every(row => row.status === "verified");
  const rejected = rows.some(row => row.status === "rejected");
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {program.userName || "Unnamed intern"}
            </CardTitle>
            <CardDescription>
              {program.userEmail || "No email"} · IERP · Enrollment #
              {program.programEnrollmentId}
            </CardDescription>
          </div>
          <Badge className={verified ? "bg-emerald-100 text-emerald-800" : undefined} variant={verified ? "default" : rejected ? "destructive" : "secondary"}>
            {verified ? "Verified" : rejected ? "Rejected" : "Pending review"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((row, index) => (
            <Button
              key={row.evidenceId}
              variant="outline"
              className="justify-between"
              onClick={() => openEvidence(row.evidenceId)}
            >
              {row.documentType === "video_prework"
                ? labels.video_prework
                : labels.precourse_assessment}
              <ExternalLink className="h-4 w-4" />
            </Button>
          ))}
        </div>
        {rows.find(row => row.reviewReason)?.reviewReason && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            <strong>Previous reason:</strong>{" "}
            {rows.find(row => row.reviewReason)?.reviewReason}
          </p>
        )}
        {!hasBoth && (
          <p className="text-sm text-amber-700">
            Both IERP Phase 1 certificates are required before approval.
          </p>
        )}
        {!verified && <Textarea
          value={reason}
          onChange={event => setReason(event.target.value)}
          placeholder="Review reason. Required for rejection and recommended for approval."
          maxLength={1000}
        />}
        {!verified && <div className="flex flex-wrap gap-2">
          <Button
            disabled={review.isPending || !hasBoth}
            onClick={() =>
              review.mutate({
                programEnrollmentId: program.programEnrollmentId,
                approve: true,
                reviewReason: reason.trim() || undefined,
              })
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve IERP Phase 1
          </Button>
          <Button
            variant="destructive"
            disabled={review.isPending || !reason.trim()}
            onClick={() =>
              review.mutate({
                programEnrollmentId: program.programEnrollmentId,
                approve: false,
                reviewReason: reason.trim(),
              })
            }
          >
            <XCircle className="mr-2 h-4 w-4" /> Reject with reason
          </Button>
        </div>}
      </CardContent>
    </Card>
  );
}

export default function AdminAhaProofReview() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const queue = trpc.courses.getElearningProofReviewQueue.useQuery(
    { search: submittedSearch || undefined, limit: 100 },
    { retry: false }
  );
  const ierpQueue = trpc.ierp.listPhase1EvidenceForReview.useQuery(
    { search: submittedSearch || undefined, limit: 100 },
    { retry: false }
  );
  const ierpGroups = Object.values(
    (ierpQueue.data ?? []).reduce<Record<string, any[]>>((groups, row) => {
      (groups[row.programEnrollmentId] ??= []).push(row);
      return groups;
    }, {})
  );
  const pendingAhaRows = (queue.data ?? []).filter(row => !row.verifiedAt);
  const verifiedAhaRows = (queue.data ?? []).filter(row => Boolean(row.verifiedAt));
  const pendingIerpGroups = ierpGroups.filter(rows => !rows.every(row => row.status === "verified"));
  const verifiedIerpGroups = ierpGroups.filter(rows => rows.every(row => row.status === "verified"));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          AHA eLearning proof review
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review private Video Prework and Passed Precourse Self-Assessment
          certificates before Phase 2 booking.
        </p>
      </div>
      <Card>
        <CardContent className="flex gap-2 p-4">
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search learner name or email"
            onKeyDown={event => {
              if (event.key === "Enter") setSubmittedSearch(search.trim());
            }}
          />
          <Button onClick={() => setSubmittedSearch(search.trim())}>
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </CardContent>
      </Card>
      {queue.isLoading && (
        <p className="text-sm text-slate-600">
          Loading submitted certificates…
        </p>
      )}
      {queue.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {queue.error.message}
        </p>
      )}
      <h2 className="pt-4 text-lg font-semibold">
        NERP and independent AHA proof — needs review
      </h2>
      {!queue.isLoading &&
        !queue.error &&
        (pendingAhaRows.length ? (
          pendingAhaRows.map(row => (
            <ReviewRow
              key={row.enrollmentId}
              row={row}
              onRefresh={() => queue.refetch()}
            />
          ))
        ) : (
          <p className="text-sm text-slate-600">
            No submitted certificates match this search.
          </p>
        ))}
      <h2 className="pt-4 text-lg font-semibold">IERP Phase 1 evidence — needs review</h2>
      {ierpQueue.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {ierpQueue.error.message}
        </p>
      )}
      {!ierpQueue.isLoading &&
        !ierpQueue.error &&
        (pendingIerpGroups.length ? (
          pendingIerpGroups.map(rows => (
            <IerpReviewRow
              key={rows[0].programEnrollmentId}
              rows={rows}
              onRefresh={() => ierpQueue.refetch()}
            />
          ))
        ) : (
          <p className="text-sm text-slate-600">
            No submitted IERP Phase 1 evidence needs review.
          </p>
        ))}
      <h2 className="pt-6 text-lg font-semibold text-emerald-800">Verified evidence</h2>
      {!queue.isLoading && !queue.error && verifiedAhaRows.map(row => (
        <ReviewRow key={row.enrollmentId} row={row} onRefresh={() => queue.refetch()} />
      ))}
      {!ierpQueue.isLoading && !ierpQueue.error && verifiedIerpGroups.map(rows => (
        <IerpReviewRow key={rows[0].programEnrollmentId} rows={rows} onRefresh={() => ierpQueue.refetch()} />
      ))}
      {!queue.isLoading && !ierpQueue.isLoading && verifiedAhaRows.length === 0 && verifiedIerpGroups.length === 0 && (
        <p className="text-sm text-slate-600">No verified evidence matches this search yet.</p>
      )}
    </div>
  );
}
