import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Extracted from client/src/pages/InstitutionalPortal.tsx (2026-08-08) --
 * that page is not routed anywhere, so coordinators had no reachable way to
 * approve self-registered staff at all, despite the backend
 * (institution.getPendingLinkRequests / approveStaffFacilityLink) being
 * fully built.
 */
export function PendingLinkRequestsWidget({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { data: pendingRequests, isLoading } = trpc.institution.getPendingLinkRequests.useQuery({ institutionId });
  const approveMutation = trpc.institution.approveStaffFacilityLink.useMutation({
    onSuccess: (data) => {
      toast.success(`Request ${data.status} successfully`);
      void utils.institution.getPendingLinkRequests.invalidate({ institutionId });
      void utils.institution.getStaffMembers.invalidate({ institutionId });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading pending link requests...</p>;
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Pending Link Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-amber-800">
          The following providers self-registered and picked your facility. Approve them to include their metrics in your analytics and add them to the roster.
        </p>
        <div className="overflow-x-auto border border-amber-100 rounded-lg bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-amber-50/50">
                <th className="py-2 px-3 font-semibold text-amber-900">Name</th>
                <th className="py-2 px-3 font-semibold text-amber-900">Email</th>
                <th className="py-2 px-3 font-semibold text-amber-900">Role</th>
                <th className="py-2 px-3 font-semibold text-amber-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={req.id} className="border-b border-amber-100">
                  <td className="py-2 px-3 font-medium">{req.staffName}</td>
                  <td className="py-2 px-3 text-slate-600">{req.staffEmail}</td>
                  <td className="py-2 px-3 capitalize">{req.staffRole}</td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-700 hover:bg-green-50"
                      onClick={() => approveMutation.mutate({ institutionId, staffMemberId: req.id, approve: true })}
                      disabled={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => approveMutation.mutate({ institutionId, staffMemberId: req.id, approve: false })}
                      disabled={approveMutation.isPending}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
