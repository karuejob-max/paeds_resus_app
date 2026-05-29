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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptResusGps, setAcceptResusGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const utils = trpc.useUtils();

  const allAgreed = acceptTerms && acceptPrivacy && acceptResusGps;

  const { data: status, isLoading } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    enabled: isAuthenticated && sessionSettled,
  });

  const acceptTermsAndPrivacy = trpc.legal.acceptTermsAndPrivacy.useMutation();
  const acceptResusGpsDisclaimer = trpc.legal.acceptResusGpsDisclaimer.useMutation();

  const resetForm = () => {
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setAcceptResusGps(false);
  };

  const handleAccept = async () => {
    if (!allAgreed || submitting) return;
    setSubmitting(true);
    try {
      await acceptTermsAndPrivacy.mutateAsync();
      await acceptResusGpsDisclaimer.mutateAsync();
      await utils.legal.getMyConsentStatus.invalidate();
      setOpen(false);
      resetForm();
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
            <DialogDescription>
              Our Terms and Privacy Policy were updated (version{" "}
              {LEGAL_DOCUMENT_VERSIONS.termsOfUse}). Open the links below for details, then
              confirm each item to continue.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm">
            <LegalExternalLink href="/terms" className="text-primary underline">
              Terms of Use
            </LegalExternalLink>
            <span className="text-muted-foreground"> · </span>
            <LegalExternalLink href="/privacy" className="text-primary underline">
              Privacy Policy
            </LegalExternalLink>
            <span className="text-muted-foreground"> · </span>
            <LegalExternalLink href="/legal/clinical-use" className="text-primary underline">
              ResusGPS intended use
            </LegalExternalLink>
          </p>

          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="reconsent-terms"
                checked={acceptTerms}
                onCheckedChange={(v) => setAcceptTerms(v === true)}
              />
              <Label
                htmlFor="reconsent-terms"
                className="cursor-pointer text-sm font-normal leading-snug"
              >
                I agree to the{" "}
                <LegalExternalLink href="/terms" className="text-primary underline">
                  Terms of Use
                </LegalExternalLink>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="reconsent-privacy"
                checked={acceptPrivacy}
                onCheckedChange={(v) => setAcceptPrivacy(v === true)}
              />
              <Label
                htmlFor="reconsent-privacy"
                className="cursor-pointer text-sm font-normal leading-snug"
              >
                I agree to the{" "}
                <LegalExternalLink href="/privacy" className="text-primary underline">
                  Privacy Policy
                </LegalExternalLink>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="reconsent-resusgps"
                checked={acceptResusGps}
                onCheckedChange={(v) => setAcceptResusGps(v === true)}
              />
              <Label
                htmlFor="reconsent-resusgps"
                className="cursor-pointer text-sm font-normal leading-snug"
              >
                I understand{" "}
                <LegalExternalLink href="/legal/clinical-use" className="text-primary underline">
                  ResusGPS intended use
                </LegalExternalLink>{" "}
                (clinical support, not a substitute for judgment)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/help">Contact support</Link>
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!allAgreed || submitting}
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
