import { useMemo } from "react";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/**
 * Public certificate check — URL from PDF QR: /verify?code=...
 */
export default function VerifyCertificate() {
  const search = useSearch();
  const code = useMemo(() => new URLSearchParams(search).get("code")?.trim() ?? "", [search]);

  const q = trpc.certificates.verifyByCode.useQuery(
    { code: code.length >= 16 ? code : "x".repeat(16) },
    { enabled: code.length >= 16, retry: false }
  );

  return (
    <div className="min-h-screen bg-brand-surface py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Certificate verification</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scan the QR code on your Paeds Resus certificate or paste the verification link you were given.
          </p>
        </div>

        {code.length < 16 ? (
          <Card className="border-border shadow-sm rounded-2xl">
            <CardContent className="pt-6 pb-6 text-center text-muted-foreground text-sm">
              No verification code in this link. Open the full URL from your certificate QR code (
              <span className="text-foreground font-medium">/verify?code=…</span>).
            </CardContent>
          </Card>
        ) : q.isLoading ? (
          <Card className="border-border shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking certificate…</p>
            </CardContent>
          </Card>
        ) : q.data?.valid && q.data.certificate ? (
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-brand-surface/80 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                Authentic Paeds Resus certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Programme</span>
                <span className="font-semibold text-foreground text-right uppercase">
                  {q.data.certificate.programType}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Certificate no.</span>
                <span className="font-mono text-xs text-foreground text-right break-all">
                  {q.data.certificate.certificateNumber}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Issued</span>
                <span className="text-foreground text-right">
                  {q.data.certificate.issueDate
                    ? new Date(q.data.certificate.issueDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Expires</span>
                <span className="text-foreground text-right">
                  {q.data.certificate.expiryDate
                    ? new Date(q.data.certificate.expiryDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-sm rounded-2xl border-destructive/25">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <ShieldX className="h-6 w-6 shrink-0" />
                Not verified
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {q.data?.error ?? q.error?.message ?? "This certificate could not be verified."}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Link href="/">
            <Button variant="outline" className="rounded-xl">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
