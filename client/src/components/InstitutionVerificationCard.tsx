import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const METHODS = [
  { value: "letterhead", label: "Letter on the facility's letterhead" },
  { value: "facility_domain_email", label: "Email from the facility's own domain" },
  { value: "other", label: "Other evidence" },
] as const;

/**
 * Verification status for an institution, shown to its administrators. Providers can send link
 * requests to an institution only once it is verified.
 */
export function InstitutionVerificationCard({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const { data } = trpc.institutionVerification.status.useQuery({ institutionId });
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("letterhead");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [note, setNote] = useState("");
  const submit = trpc.institutionVerification.submitEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence sent for review.");
      setEvidenceUrl("");
      setNote("");
      void utils.institutionVerification.status.invalidate({ institutionId });
    },
    onError: (error) => toast.error(error.message),
  });
  if (!data) return null;

  const status = data.verificationStatus;
  const canSubmit = status === "unverified" || status === "rejected";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5" /> Institution verification
          <Badge variant="outline">
            {status === "verified" ? "Verified" : status === "pending_review" ? "Awaiting review" : status === "rejected" ? "Not approved" : "Not verified"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Providers can send link requests to your institution only once it is verified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {status === "verified" && data.grandfathered ? (
          <p>Your institution was active before verification was introduced, so it stays verified while a platform administrator reviews it. You may be asked for evidence.</p>
        ) : null}
        {status === "verified" && !data.grandfathered ? <p>Your institution is verified.</p> : null}
        {status === "pending_review" ? <p>Your evidence is with a platform administrator. You will be notified of the decision.</p> : null}
        {status === "rejected" && data.verificationReviewNote ? <p>Not approved: {data.verificationReviewNote}</p> : null}
        {data.facilityClaimedElsewhere && status !== "verified" ? (
          <p className="text-amber-800">Another institution has already been verified for the facility you selected. A platform administrator will need to resolve this before yours can be verified.</p>
        ) : null}
        {canSubmit ? (
          <div className="space-y-2">
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={method}
              onChange={(event) => setMethod(event.target.value as typeof method)}
            >
              {METHODS.map((entry) => (
                <option key={entry.value} value={entry.value}>{entry.label}</option>
              ))}
            </select>
            <Input
              placeholder="https:// link to the evidence (letter scan, or the email in a shared folder)"
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
            />
            <Textarea placeholder="Anything the reviewer should know (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
            <Button
              size="sm"
              disabled={submit.isPending || !evidenceUrl.startsWith("https://")}
              onClick={() => submit.mutate({ institutionId, method, evidenceUrl: evidenceUrl.trim(), note: note.trim() || undefined })}
            >
              Send for verification
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
