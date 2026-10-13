import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
import {
  ClipboardCheck,
  ExternalLink,
  Search,
  ShieldCheck,
} from "lucide-react";

function credentialLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

export default function AdminCredentialVerification() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [evidenceTarget, setEvidenceTarget] = useState<{
    institutionId: number;
    credentialId: number;
  } | null>(null);
  const queue =
    trpc.institutionAccountability.listCredentialReviewQueue.useQuery(
      { search: search.trim() || undefined, limit: 100 },
      { retry: false }
    );
  const review = trpc.institutionAccountability.reviewCredential.useMutation({
    onSuccess: () => void queue.refetch(),
  });
  const evidence =
    trpc.institutionAccountability.getScopedCredentialEvidenceUrl.useQuery(
      evidenceTarget ?? { institutionId: 1, credentialId: 1 },
      { enabled: evidenceTarget != null, retry: false }
    );

  const openEvidence = (institutionId: number | null, credentialId: number) => {
    if (institutionId) setEvidenceTarget({ institutionId, credentialId });
  };

  useEffect(() => {
    if (!evidence.data?.url) return;
    window.open(evidence.data.url, "_blank", "noopener,noreferrer");
    setEvidenceTarget(null);
  }, [evidence.data]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" /> Platform governance
          </div>
          <h1 className="mt-1 text-2xl font-semibold">
            Professional credential verification
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review regulatory licences and external life-support evidence
            submitted by providers. A verified course record is not the same as
            a regulatory licence or clinical competence.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation("/admin")}
        >
          Back to admin hub
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pending review queue
          </CardTitle>
          <CardDescription>
            Oldest submissions appear first. Institution and department context
            is shown so platform decisions can be handed off safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, issuer, or credential number"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          {queue.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading review queue…
            </p>
          ) : null}
          {queue.isError ? (
            <p role="alert" className="text-sm text-destructive">
              Could not load the credential queue: {queue.error.message}
            </p>
          ) : null}
          {!queue.isLoading && !queue.isError && !queue.data?.length ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No pending professional credentials match this search.
            </p>
          ) : null}
          <div className="space-y-3">
            {queue.data?.map(item => (
              <div
                key={`${item.id}-${item.institutionId ?? "unlinked"}`}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {item.userName || "Unnamed provider"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.userEmail || "Email unavailable"}
                    </p>
                    <p className="mt-2 text-sm">
                      {credentialLabel(item.credentialType)} · {item.issuer}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.institutionName || "Not linked to an institution"}
                      {item.cadre ? ` · ${item.cadre}` : ""}
                      {item.credentialNumber
                        ? ` · No. ${item.credentialNumber}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Source: {credentialLabel(item.sourceType)}</span>
                  <span>
                    Evidence: {item.evidenceUploaded ? "uploaded" : "missing"}
                  </span>
                  {item.expiresAt ? (
                    <span>
                      Valid until:{" "}
                      {new Date(item.expiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>Valid until: not provided</span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.evidenceUploaded && item.institutionId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void openEvidence(item.institutionId, item.id)
                      }
                      disabled={evidence.isFetching}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View evidence
                    </Button>
                  ) : null}
                  {item.institutionId ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        review.mutate({
                          institutionId: item.institutionId!,
                          credentialId: item.id,
                          decision: "verified",
                          reason:
                            "Professional credential evidence reviewed by platform administration.",
                        })
                      }
                      disabled={review.isPending || !item.evidenceUploaded}
                    >
                      Verify
                    </Button>
                  ) : null}
                  {item.institutionId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = window.prompt(
                          "Reason for rejecting this credential:"
                        );
                        if (reason?.trim())
                          review.mutate({
                            institutionId: item.institutionId!,
                            credentialId: item.id,
                            decision: "rejected",
                            reason: reason.trim(),
                          });
                      }}
                      disabled={review.isPending}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
