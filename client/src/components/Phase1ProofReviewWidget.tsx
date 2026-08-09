import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Extracted from client/src/pages/InstitutionalPortal.tsx (2026-08-08) --
 * that page is not routed anywhere, so coordinators had no reachable way to
 * approve Phase 1 elearning proof at all -- meaning nobody could actually
 * advance a learner to Phase 2 through the UI, despite the backend
 * (institution.approvePhase1Proof) being fully built.
 */
export function Phase1ProofReviewWidget({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { data: staffMembers, isLoading } = trpc.institution.getStaffMembers.useQuery({ institutionId });

  const approveMutation = trpc.institution.approvePhase1Proof.useMutation({
    onSuccess: (data) => {
      toast.success(data.approved ? "Phase 1 approved — learner advanced to Phase 2" : "Proof rejected — learner must re-upload");
      void utils.institution.getStaffMembers.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading proof reviews...</p>;

  // Filter to members who have uploaded proof but not yet been approved
  const pending = (staffMembers ?? []).filter(
    (m: any) => m.phase1ProofUrl && !m.phase1ProofApprovedAt
  );

  if (pending.length === 0) return null;

  return (
    <Card className="mb-6 border-purple-200 bg-purple-50/20">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-900">
          <CheckCircle2 className="w-5 h-5 text-purple-600" />
          Phase 1 Proof Reviews ({pending.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-purple-800 mb-3">
          The following learners have submitted their AHA elearning completion proof. Review and approve to advance them to Phase 2 simulations.
        </p>
        <div className="overflow-x-auto border border-purple-100 rounded-lg bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-purple-50/50">
                <th className="py-2 px-3 font-semibold text-purple-900">Name</th>
                <th className="py-2 px-3 font-semibold text-purple-900">Designation</th>
                <th className="py-2 px-3 font-semibold text-purple-900">Proof Link</th>
                <th className="py-2 px-3 font-semibold text-purple-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((req: any) => (
                <tr key={req.id} className="border-b border-purple-100">
                  <td className="py-2 px-3 font-medium">{req.staffName}</td>
                  <td className="py-2 px-3 capitalize text-slate-600">{req.designation?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="py-2 px-3">
                    <a
                      href={req.phase1ProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline flex items-center gap-1 text-xs"
                    >
                      View Proof <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
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
