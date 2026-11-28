import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

const QUICK_REASONS = [
  "The photo is blurry or cut off. Please upload a clear, full-page photo or scan.",
  "The licence number does not match the document. Please re-enter it exactly as printed.",
  "The licence has expired or the valid-until date does not match the document.",
  "The name on the document does not match your profile.",
  "This is not a regulatory licence. Please upload your practising licence.",
];

const dateLabel = (value: string | Date | null) => (value ? new Date(value).toLocaleDateString() : "not given");

/** Works through pending licences one at a time: open the evidence, compare, verify or reject with a reason. */
export function LicenceReviewQueue({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const queue = trpc.institutionLicenceFollowup.pendingLicences.useQuery({ institutionId }, { retry: false });
  const [openedIds, setOpenedIds] = useState<Set<number>>(new Set());
  const [evidenceId, setEvidenceId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const evidence = trpc.institutionAccountability.getScopedCredentialEvidenceUrl.useQuery(
    { institutionId, credentialId: evidenceId ?? 0 },
    { enabled: evidenceId != null, retry: false },
  );
  const review = trpc.institutionAccountability.reviewCredential.useMutation({
    onSuccess: (result) => {
      toast.success(result.decision === "verified" ? "Licence verified. The person has been notified." : "Licence returned with your note. The person has been notified.");
      setRejecting(false);
      setReason("");
      void utils.institutionLicenceFollowup.pendingLicences.invalidate({ institutionId });
      void utils.institutionLicenceFollowup.summary.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!evidence.data?.url || evidenceId == null) return;
    window.open(evidence.data.url, "_blank", "noopener,noreferrer");
    setOpenedIds((prev) => new Set(prev).add(evidenceId));
    setEvidenceId(null);
  }, [evidence.data, evidenceId]);

  const items = queue.data ?? [];
  if (queue.isLoading || items.length === 0) return null;
  const current = items[0];
  const opened = openedIds.has(current.credentialId);

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="h-5 w-5 text-blue-700" /> Licences to review
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{items.length} waiting</span>
        </CardTitle>
        <CardDescription>Oldest first. Open the evidence, compare it with the details below, then verify or return it with a reason. Each person is notified of your decision.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-base font-semibold">{current.name}</p>
          <p className="text-xs text-muted-foreground">{current.department ?? "No department"} · submitted {dateLabel(current.submittedAt)}</p>
          <dl className="grid gap-x-6 gap-y-1 pt-2 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Licensing body</dt><dd>{current.issuer}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Country</dt><dd>{current.jurisdiction ?? "not given"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Cadre</dt><dd>{current.cadre ?? "not given"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Licence number</dt><dd className="font-mono">{current.credentialNumber ?? "not given"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">First licensed</dt><dd>{dateLabel(current.issuedAt)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Valid until</dt><dd>{dateLabel(current.expiresAt)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-3">
            <Button type="button" variant="outline" disabled={!current.evidenceUploaded || evidence.isFetching} onClick={() => setEvidenceId(current.credentialId)}>
              <ExternalLink className="mr-1 h-4 w-4" /> {opened ? "Open evidence again" : "Open evidence"}
            </Button>
            <Button
              type="button"
              disabled={!opened || review.isPending}
              onClick={() => review.mutate({ institutionId, credentialId: current.credentialId, decision: "verified", reason: "Licence evidence reviewed and matches the details entered." })}
            >
              Verify
            </Button>
            <Button type="button" variant="destructive" disabled={review.isPending} onClick={() => { setReason(""); setRejecting(true); }}>
              Return with a reason
            </Button>
          </div>
          {!opened ? <p className="text-xs text-muted-foreground">Open the evidence first. Verify unlocks once you have looked at it.</p> : null}
          {!current.evidenceUploaded ? <p className="text-xs text-red-700">No evidence was uploaded, so this can only be returned.</p> : null}
        </div>
        {items.length > 1 ? <p className="text-xs text-muted-foreground">Next: {items.slice(1, 4).map((i) => i.name).join(", ")}{items.length > 4 ? ` and ${items.length - 4} more` : ""}</p> : null}
      </CardContent>

      <Dialog open={rejecting} onOpenChange={(open) => { if (!open && !review.isPending) setRejecting(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return licence to {current.name}</DialogTitle>
            <DialogDescription>They will see this note and can submit again.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((text) => (
              <button key={text} type="button" className="rounded-full border px-3 py-1 text-left text-xs hover:bg-muted" onClick={() => setReason(text)}>
                {text.split(".")[0]}
              </button>
            ))}
          </div>
          <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason for returning this licence" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejecting(false)} disabled={review.isPending}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={reason.trim().length < 3 || review.isPending} onClick={() => review.mutate({ institutionId, credentialId: current.credentialId, decision: "rejected", reason: reason.trim() })}>
              {review.isPending ? "Saving…" : "Return licence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
