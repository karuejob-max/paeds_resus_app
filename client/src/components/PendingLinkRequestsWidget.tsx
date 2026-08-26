import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Institution-admin review surface for provider-to-facility relationships.
 *
 * New explicit requests use facilityLinking.reviewRequest, which materializes
 * both the general membership and roster link in one transaction. The legacy
 * queue remains visible so existing profile-selected staff rows can be safely
 * repaired through facilityLinking.repairApprovedStaffLink instead of leaving
 * facilityLinkStatus="linked" without an active membership.
 */
export function PendingLinkRequestsWidget({
  institutionId,
}: {
  institutionId: number;
}) {
  const utils = trpc.useUtils();
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const { data: requests, isLoading: requestsLoading } =
    trpc.facilityLinking.getPendingRequests.useQuery({ institutionId });
  const { data: legacyRequests, isLoading: legacyLoading } =
    trpc.institution.getPendingLinkRequests.useQuery({ institutionId });
  const reviewMutation = trpc.facilityLinking.reviewRequest.useMutation({
    onSuccess: async data => {
      toast.success(
        data.status === "approved"
          ? "Facility link approved and membership activated"
          : "Facility link request rejected"
      );
      await Promise.all([
        utils.facilityLinking.getPendingRequests.invalidate({ institutionId }),
        utils.institution.getPendingLinkRequests.invalidate({ institutionId }),
        utils.institution.getStaffMembers.invalidate({ institutionId }),
      ]);
    },
    onError: error => toast.error(error.message),
  });
  const legacyMutation =
    trpc.facilityLinking.repairApprovedStaffLink.useMutation({
      onSuccess: async data => {
        toast.success(
          data.status === "linked"
            ? "Legacy provider link repaired and membership activated"
            : "Legacy facility link rejected"
        );
        await Promise.all([
          utils.institution.getPendingLinkRequests.invalidate({
            institutionId,
          }),
          utils.institution.getStaffMembers.invalidate({ institutionId }),
        ]);
      },
      onError: error => toast.error(error.message),
    });

  if (requestsLoading || legacyLoading)
    return (
      <p className="py-4 text-center text-sm text-slate-500">
        Loading facility link requests…
      </p>
    );
  if (
    (!requests || requests.length === 0) &&
    (!legacyRequests || legacyRequests.length === 0)
  )
    return null;

  const setReason = (id: number, value: string) =>
    setReasons(current => ({ ...current, [id]: value }));
  const busy = reviewMutation.isPending || legacyMutation.isPending;
  const explicitRequestEmails = new Set(
    (requests ?? []).map(request => request.requesterEmail.trim().toLowerCase())
  );
  const legacyOnlyRequests = (legacyRequests ?? []).filter(
    request =>
      !explicitRequestEmails.has(request.staffEmail.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      {requests && requests.length > 0 ? (
        <Card className="border-teal-200 bg-teal-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-teal-950">
              <Link2 className="h-5 w-5 text-teal-700" /> Facility link requests
            </CardTitle>
            <CardDescription>
              These providers explicitly requested general membership at a
              facility registered to this institution. Approval does not create
              IERS duties or operational roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map(request => {
              const reason = reasons[request.id] ?? "";
              return (
                <div
                  key={request.id}
                  className="rounded-lg border border-teal-100 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {request.requesterName || "Provider"}
                      </p>
                      <p className="text-xs text-slate-600">
                        {request.requesterEmail}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {request.facilityName}
                        {request.county ? ` · ${request.county}` : ""}
                        {request.department ? ` · ${request.department}` : ""}
                      </p>
                      <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Pending review
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          reviewMutation.mutate({
                            institutionId,
                            requestId: request.id,
                            approve: true,
                            reason: reason || undefined,
                          })
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        disabled={busy || reason.trim().length < 10}
                        onClick={() =>
                          reviewMutation.mutate({
                            institutionId,
                            requestId: request.id,
                            approve: false,
                            reason,
                          })
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  <Input
                    className="mt-3"
                    value={reason}
                    onChange={event =>
                      setReason(request.id, event.target.value)
                    }
                    placeholder="Review note; at least 10 characters for rejection"
                    aria-label={`Review note for ${request.requesterName || request.requesterEmail}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {legacyOnlyRequests.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-950">
              <AlertCircle className="h-5 w-5 text-amber-600" /> Legacy link
              records needing repair
            </CardTitle>
            <CardDescription>
              These rows came from the older profile-selection path. Approve
              only when the provider should receive general institutional
              membership; the repair is atomic and preserves separate IERS
              acceptance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {legacyOnlyRequests.map(request => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {request.staffName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {request.staffEmail} · {request.staffRole}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      legacyMutation.mutate({
                        institutionId,
                        staffMemberId: request.id,
                        approve: true,
                      })
                    }
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve and link
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={busy}
                    onClick={() =>
                      legacyMutation.mutate({
                        institutionId,
                        staffMemberId: request.id,
                        approve: false,
                      })
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {busy ? (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Updating facility access…
        </p>
      ) : null}
    </div>
  );
}
