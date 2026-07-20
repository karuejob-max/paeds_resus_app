import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Platform-admin-only review queue for institutional recovery requests
 * (North Star §6.1). Matching a request to a real institutionalAccountId is
 * a deliberate manual step by the reviewer, weighing the letterhead and MoH
 * registration number evidence against the claimed institution name — the
 * human reviewer is the actual security control here, not the code.
 */
export default function AdminInstitutionalRecovery() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.institutionRecovery.list.useQuery({ status: "pending" });
  const [matchIds, setMatchIds] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const review = trpc.institutionRecovery.review.useMutation({
    onSuccess: (result) => {
      toast.success(result.status === "approved" ? "Approved — invite created" : "Request rejected");
      void utils.institutionRecovery.list.invalidate({ status: "pending" });
    },
    onError: (err) => toast.error(err.message),
  });

  const requests = data?.requests ?? [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-6 h-6 text-brand-teal" />
        <h1 className="text-2xl font-bold text-foreground">Institutional recovery requests</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500">No pending recovery requests.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{r.companyNameClaimed}</span>
                  <Badge variant="outline">{new Date(r.createdAt).toLocaleDateString()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p><strong>Requester:</strong> {r.requesterName} ({r.requesterEmail})</p>
                  <p><strong>Phone:</strong> {r.requesterPhone || "—"}</p>
                  <p><strong>Claimed role:</strong> {r.requesterRoleClaim || "—"}</p>
                  <p><strong>Claimed reg. number:</strong> {r.claimedRegistrationNumber || "—"}</p>
                </div>
                <p className="text-sm">
                  <strong>Letterhead / evidence:</strong>{" "}
                  <a
                    href={r.letterheadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-teal underline inline-flex items-center gap-1"
                  >
                    Open document <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                {r.notes && <p className="text-sm text-slate-600"><strong>Notes from requester:</strong> {r.notes}</p>}

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Match to the real institution by ID before approving (look it up in Admin Reports /
                    the institutions list first).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <Input
                      type="number"
                      placeholder="Matched institutionalAccountId"
                      value={matchIds[r.id] ?? ""}
                      onChange={(e) => setMatchIds((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <Input
                      placeholder="Review notes (optional)"
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={() =>
                        review.mutate({
                          requestId: r.id,
                          decision: "approve",
                          matchedInstitutionalAccountId: Number(matchIds[r.id]),
                          reviewNotes: notes[r.id] || undefined,
                        })
                      }
                      disabled={!matchIds[r.id] || review.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() =>
                        review.mutate({
                          requestId: r.id,
                          decision: "reject",
                          reviewNotes: notes[r.id] || undefined,
                        })
                      }
                      disabled={review.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
