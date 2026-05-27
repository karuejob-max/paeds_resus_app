import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { LEGAL_CONTACT, LEGAL_LAST_UPDATED, LEGAL_DOCUMENT_VERSIONS } from "@shared/legal-versions";
import { useAuth } from "@/_core/hooks/useAuth";

export default function DataRequest() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [requestType, setRequestType] = useState<
    "access" | "correction" | "deletion" | "objection" | "portability"
  >("access");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = trpc.legal.submitDataRequest.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Data subject request</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Exercise your rights under the Kenya Data Protection Act 2019. We respond within 30 days.
          Version {LEGAL_DOCUMENT_VERSIONS.privacyPolicy} · Last updated: {LEGAL_LAST_UPDATED}
        </p>

        {submitted ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
            <p className="text-foreground font-medium">Request received</p>
            <p className="text-sm text-muted-foreground mt-2">
              We will contact you at {email}. Reference emails go to {LEGAL_CONTACT.dataRequestsEmail}.
            </p>
            <Link href="/privacy" className="text-primary underline text-sm mt-4 inline-block">
              Back to Privacy Policy
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate({ requesterEmail: email, requesterName: name, requestType, details });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="dsar-email">Email</Label>
              <Input id="dsar-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dsar-name">Full name (optional)</Label>
              <Input id="dsar-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Request type</Label>
              <Select value={requestType} onValueChange={(v) => setRequestType(v as typeof requestType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="access">Access my data</SelectItem>
                  <SelectItem value="correction">Correct inaccurate data</SelectItem>
                  <SelectItem value="deletion">Delete my data</SelectItem>
                  <SelectItem value="objection">Object to processing</SelectItem>
                  <SelectItem value="portability">Data portability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dsar-details">Details</Label>
              <Textarea
                id="dsar-details"
                rows={4}
                placeholder="Describe your request…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submit.isPending} className="w-full">
              {submit.isPending ? "Submitting…" : "Submit request"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Or email{" "}
              <a href={`mailto:${LEGAL_CONTACT.dataRequestsEmail}`} className="text-primary underline">
                {LEGAL_CONTACT.dataRequestsEmail}
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
