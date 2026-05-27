import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LEGAL_DOCUMENT_VERSIONS } from "@shared/legal-versions";
import { LegalExternalLink } from "@/components/LegalExternalLink";
import { isLegalDocumentPath } from "@/lib/legal-routes";

/** Blocks stale Terms/Privacy until user re-accepts current versions. */
export function LegalReconsentGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, sessionSettled } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const utils = trpc.useUtils();

  const { data: status, isLoading } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    enabled: isAuthenticated && sessionSettled,
  });

  const accept = trpc.legal.acceptTermsAndPrivacy.useMutation({
    onSuccess: async () => {
      await utils.legal.getMyConsentStatus.invalidate();
      setOpen(false);
      setAgreed(false);
    },
  });

  useEffect(() => {
    if (loading || !sessionSettled || !isAuthenticated || isLoading) return;
    if (status?.termsStale) setOpen(true);
    else setOpen(false);
  }, [loading, sessionSettled, isAuthenticated, isLoading, status?.termsStale]);

  const showBlockingDialog = open && !isLegalDocumentPath(location);

  return (
    <>
      {children}
      <Dialog open={showBlockingDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Updated legal terms</DialogTitle>
            <DialogDescription>
              Our Terms of Use and Privacy Policy have been updated (version {LEGAL_DOCUMENT_VERSIONS.termsOfUse}).
              Please review and accept to continue using Paeds Resus.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md border p-3">
            <Checkbox
              id="reconsent"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
            />
            <Label htmlFor="reconsent" className="leading-snug cursor-pointer text-sm font-normal">
              I have read and agree to the{" "}
              <LegalExternalLink href="/terms" className="text-primary underline">
                Terms of Use
              </LegalExternalLink>{" "}
              and{" "}
              <LegalExternalLink href="/privacy" className="text-primary underline">
                Privacy Policy
              </LegalExternalLink>
              .
            </Label>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild>
              <Link href="/help">Contact support</Link>
            </Button>
            <Button
              disabled={!agreed || accept.isPending}
              onClick={() => accept.mutate()}
            >
              {accept.isPending ? "Saving…" : "Accept and continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
