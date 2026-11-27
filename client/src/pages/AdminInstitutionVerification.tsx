import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Platform-admin queue for institution verification. A verified institution can receive provider
 * link requests. Institutions that were active before verification existed are listed under
 * "Grandfathered" so each can be reviewed.
 */
export default function AdminInstitutionVerification() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"pending_review" | "grandfathered" | "unverified" | "archived">("pending_review");
  const { data, isLoading } = trpc.institutionVerification.listForReview.useQuery({ filter });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const review = trpc.institutionVerification.review.useMutation({
    onSuccess: (result) => {
      toast.success(`Institution is now ${result.status.replace("_", " ")}.`);
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const archive = trpc.institutionVerification.archive.useMutation({
    onSuccess: () => {
      toast.success("Institution archived.");
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const restore = trpc.institutionVerification.restore.useMutation({
    onSuccess: () => {
      toast.success("Institution restored.");
      void utils.institutionVerification.listForReview.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const institutions = data?.institutions ?? [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-6 h-6 text-brand-teal" />
        <h1 className="text-2xl font-bold text-foreground">Institution verification</h1>
      </div>
      <div className="flex gap-2 mb-6">
        <Button size="sm" variant={filter === "pending_review" ? "default" : "outline"} onClick={() => setFilter("pending_review")}>Awaiting review</Button>
        <Button size="sm" variant={filter === "grandfathered" ? "default" : "outline"} onClick={() => setFilter("grandfathered")}>Grandfathered</Button>
        <Button size="sm" variant={filter === "unverified" ? "default" : "outline"} onClick={() => setFilter("unverified")}>Unverified</Button>
        <Button size="sm" variant={filter === "archived" ? "default" : "outline"} onClick={() => setFilter("archived")}>Archived</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : institutions.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing to review here.</p>
      ) : (
        <div className="space-y-6">
          {institutions.map((institution) => {
            const note = notes[institution.id] ?? "";
            const decide = (decision: "verify" | "reject" | "revoke") => review.mutate({ institutionId: institution.id, decision, note });
            return (
              <Card key={institution.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>#{institution.id} {institution.companyName}</span>
                    <Badge variant="outline">{institution.verificationStatus.replace("_", " ")}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Contact:</strong> {institution.contactName} ({institution.contactEmail})</p>
                  <p><strong>MoH registration:</strong> {institution.registrationNumber ?? "—"} · <strong>KMHFL id:</strong> {institution.kmhflFacilityId ?? "—"}</p>
                  {institution.verificationMethod && institution.verificationMethod !== "grandfathered" ? (
                    <p><strong>Method:</strong> {institution.verificationMethod.replace(/_/g, " ")}</p>
                  ) : null}
                  {institution.verificationEvidenceUrl ? (
                    <p>
                      <a className="inline-flex items-center gap-1 text-brand-teal underline" href={institution.verificationEvidenceUrl} target="_blank" rel="noopener noreferrer">
                        Evidence <ExternalLink className="h-3 w-3" />
                      </a>
                      {institution.verificationEvidenceNote ? ` — ${institution.verificationEvidenceNote}` : ""}
                    </p>
                  ) : null}
                  {institution.conflictingInstitutionId ? (
                    <p className="text-amber-800">Institution #{institution.conflictingInstitutionId} is already verified for this KMHFL facility. Revoke that claim before verifying this one.</p>
                  ) : null}
                  {institution.archivedAt ? (
                    <p className="text-slate-600">Archived: {institution.archiveReason}</p>
                  ) : null}
                  <Input
                    placeholder="Decision note (required, recorded in the audit trail)"
                    value={note}
                    onChange={(event) => setNotes((current) => ({ ...current, [institution.id]: event.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    {institution.archivedAt ? (
                      <Button size="sm" variant="outline" disabled={restore.isPending || note.trim().length < 3} onClick={() => restore.mutate({ institutionId: institution.id, reason: note })}>Restore</Button>
                    ) : (
                      <>
                    <Button size="sm" disabled={review.isPending || note.trim().length < 3 || Boolean(institution.conflictingInstitutionId)} onClick={() => decide("verify")}>Verify</Button>
                    {institution.verificationStatus === "pending_review" ? (
                      <Button size="sm" variant="outline" disabled={review.isPending || note.trim().length < 3} onClick={() => decide("reject")}>Reject</Button>
                    ) : null}
                    {institution.verificationStatus === "verified" ? (
                      <Button size="sm" variant="outline" disabled={review.isPending || note.trim().length < 3} onClick={() => decide("revoke")}>Revoke</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={archive.isPending || note.trim().length < 3} onClick={() => archive.mutate({ institutionId: institution.id, reason: note })}>Archive (duplicate or mistake)</Button>
                    )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
