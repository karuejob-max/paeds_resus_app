import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAfterFirstPaint } from "@/hooks/useAfterFirstPaint";
import { LegalExternalLink } from "@/components/LegalExternalLink";
import { isLegalDocumentPath } from "@/lib/legal-routes";

/** Blocks stale Terms/Privacy until user re-accepts current versions. */
export function LegalReconsentGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, sessionSettled } = useAuth();
  const afterPaint = useAfterFirstPaint();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const utils = trpc.useUtils();

  const { data: status, isLoading } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    enabled: isAuthenticated && sessionSettled && afterPaint,
  });

  const acceptTermsAndPrivacy = trpc.legal.acceptTermsAndPrivacy.useMutation();
  const acceptResusGpsDisclaimer = trpc.legal.acceptResusGpsDisclaimer.useMutation();

  const handleAccept = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      await acceptTermsAndPrivacy.mutateAsync();
      await acceptResusGpsDisclaimer.mutateAsync();
      await utils.legal.getMyConsentStatus.invalidate();
      setOpen(false);
      setAgreed(false);
    } finally {
      setSubmitting(false);
    }
  };

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
        <DialogContent
          className="max-w-md sm:max-w-md"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-left">
            <DialogTitle>Updated legal terms</DialogTitle>
          </DialogHeader>

          <ul className="space-y-2 text-sm font-medium">
            <li>
              <LegalExternalLink href="/terms" className="text-primary underline">
                Terms of Use
              </LegalExternalLink>
            </li>
            <li>
              <LegalExternalLink href="/privacy" className="text-primary underline">
                Privacy Policy
              </LegalExternalLink>
            </li>
            <li>
              <LegalExternalLink href="/legal/clinical-use" className="text-primary underline">
                ResusGPS Intended Use
              </LegalExternalLink>
            </li>
          </ul>

          <div className="flex items-start gap-3 rounded-md border border-border p-3">
            <Checkbox
              id="reconsent-all"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
            />
            <Label htmlFor="reconsent-all" className="cursor-pointer text-sm font-normal leading-snug">
              I have read and agree
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/help">Contact support</Link>
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!agreed || submitting}
              onClick={() => void handleAccept()}
            >
              {submitting ? "Saving…" : "Accept and continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
