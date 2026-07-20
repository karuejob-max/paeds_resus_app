import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * North Star v2.0 §6.1: "If both admin contacts are unreachable, recovery
 * is via institutional verification only." Deliberately no login required
 * — the entire scenario this page exists for is "nobody at this
 * institution can log in." A platform admin manually reviews and matches
 * each submission to a real institution; this form does not attempt to
 * auto-match or grant access itself.
 */
export default function InstitutionalRecovery() {
  const [companyNameClaimed, setCompanyNameClaimed] = useState("");
  const [claimedRegistrationNumber, setClaimedRegistrationNumber] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterRoleClaim, setRequesterRoleClaim] = useState("");
  const [letterheadUrl, setLetterheadUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = trpc.institutionRecovery.submit.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!letterheadUrl.startsWith("http")) {
      setError("Please paste a link to your facility letterhead or supporting document.");
      return;
    }
    submit.mutate({
      companyNameClaimed,
      claimedRegistrationNumber: claimedRegistrationNumber || undefined,
      requesterName,
      requesterEmail,
      requesterPhone: requesterPhone || undefined,
      requesterRoleClaim: requesterRoleClaim || undefined,
      letterheadUrl,
      notes: notes || undefined,
    });
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Request received</h1>
        <p className="text-muted-foreground">
          A platform admin will review your submission and verify it against your institution's
          records. We'll reach out at {requesterEmail} once it's reviewed — this is a manual process,
          so it may take a little time.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-6 h-6 text-brand-teal" />
        <h1 className="text-2xl font-bold text-foreground">Institutional account recovery</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Use this if your institution's admins are unreachable and nobody can sign in to your
        account. We verify recovery requests against your institution's identity — a facility
        letterhead and MoH registration number — not a password reset, since this account belongs to
        your institution, not to any one person.
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="companyNameClaimed">Institution / facility name *</Label>
            <Input
              id="companyNameClaimed"
              value={companyNameClaimed}
              onChange={(e) => setCompanyNameClaimed(e.target.value)}
              placeholder="As registered on the platform"
              required
            />
          </div>

          <div>
            <Label htmlFor="claimedRegistrationNumber">MoH registration number</Label>
            <Input
              id="claimedRegistrationNumber"
              value={claimedRegistrationNumber}
              onChange={(e) => setClaimedRegistrationNumber(e.target.value)}
              placeholder="If known — helps us verify faster"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requesterName">Your full name *</Label>
              <Input
                id="requesterName"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="requesterRoleClaim">Your role</Label>
              <Input
                id="requesterRoleClaim"
                value={requesterRoleClaim}
                onChange={(e) => setRequesterRoleClaim(e.target.value)}
                placeholder="e.g. new hospital administrator"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requesterEmail">Your email *</Label>
              <Input
                id="requesterEmail"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="requesterPhone">Your phone</Label>
              <Input
                id="requesterPhone"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="letterheadUrl">Facility letterhead / supporting document link *</Label>
            <Input
              id="letterheadUrl"
              value={letterheadUrl}
              onChange={(e) => setLetterheadUrl(e.target.value)}
              placeholder="Link to a document hosted on Google Drive, Dropbox, etc."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload your document somewhere you can share a link — e.g. Google Drive — and paste
              the link here.
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Anything else that would help us verify this</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit recovery request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
