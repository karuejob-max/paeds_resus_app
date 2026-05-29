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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Info, Scale } from "lucide-react";
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
  const utils = trpc.useUtils();

  const allAgreed = acceptTerms && acceptPrivacy && acceptResusGps;

  const { data: status, isLoading } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    enabled: isAuthenticated && sessionSettled,
  });

  const accept = trpc.legal.acceptTermsAndPrivacy.useMutation({
    onSuccess: async () => {
      await utils.legal.getMyConsentStatus.invalidate();
      setOpen(false);
      setAcceptTerms(false);
      setAcceptPrivacy(false);
      setAcceptResusGps(false);
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
        <DialogContent
          className="flex max-h-[min(92vh,720px)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="space-y-2 px-6 pt-6 text-left">
            <DialogTitle className="text-xl tracking-tight">Updated legal terms</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Our Terms of Use and Privacy Policy have been updated (version{" "}
              <span className="font-medium text-foreground">{LEGAL_DOCUMENT_VERSIONS.termsOfUse}</span>
              ). Review the documents below, then confirm each item to continue using Paeds Resus.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 border-y">
            <div className="space-y-4 px-6 py-4">
              <section className="space-y-2" aria-labelledby="reconsent-review-heading">
                <h3
                  id="reconsent-review-heading"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <Scale className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Review updated documents
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Open each document in a new tab to read the full text before accepting.
                </p>
                <ul className="space-y-2 text-sm leading-relaxed">
                  <li>
                    <LegalExternalLink href="/terms" className="font-medium text-primary underline">
                      Terms of Use
                    </LegalExternalLink>
                    <span className="text-muted-foreground"> — platform rules and limitations</span>
                  </li>
                  <li>
                    <LegalExternalLink href="/privacy" className="font-medium text-primary underline">
                      Privacy Policy
                    </LegalExternalLink>
                    <span className="text-muted-foreground"> — how we collect and use your data</span>
                  </li>
                </ul>
              </section>

              <Alert className="border-[#1a4d4d]/30 bg-[#f0f9f9]/80 dark:bg-[#0f2525]/80">
                <Info className="h-4 w-4 text-[#1a4d4d] dark:text-teal-200" aria-hidden />
                <AlertTitle
                  id="reconsent-resusgps-heading"
                  className="text-sm font-semibold text-[#1a4d4d] dark:text-teal-100"
                >
                  ResusGPS intended use
                </AlertTitle>
                <AlertDescription className="space-y-2 text-sm leading-relaxed text-[#1a4d4d] dark:text-teal-100">
                  <p>
                    ResusGPS provides structured paediatric emergency{" "}
                    <strong>bedside reference support</strong> for trained providers. It is{" "}
                    <strong>not a substitute for clinical judgment</strong>, medical advice, or your
                    facility protocol.
                  </p>
                  <p>
                    Read the full statement:{" "}
                    <LegalExternalLink
                      href="/legal/clinical-use"
                      className="font-medium text-primary underline"
                    >
                      ResusGPS intended use
                    </LegalExternalLink>
                    .
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>

          <div className="space-y-3 px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Your agreement</h3>
            <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reconsent-terms"
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(v === true)}
                />
                <Label
                  htmlFor="reconsent-terms"
                  className="cursor-pointer text-sm font-normal leading-relaxed"
                >
                  I have read and agree to the{" "}
                  <LegalExternalLink href="/terms" className="text-primary underline">
                    Terms of Use
                  </LegalExternalLink>
                  .
                </Label>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reconsent-privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(v) => setAcceptPrivacy(v === true)}
                />
                <Label
                  htmlFor="reconsent-privacy"
                  className="cursor-pointer text-sm font-normal leading-relaxed"
                >
                  I have read and agree to the{" "}
                  <LegalExternalLink href="/privacy" className="text-primary underline">
                    Privacy Policy
                  </LegalExternalLink>
                  .
                </Label>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reconsent-resusgps"
                  checked={acceptResusGps}
                  onCheckedChange={(v) => setAcceptResusGps(v === true)}
                />
                <Label
                  htmlFor="reconsent-resusgps"
                  className="cursor-pointer text-sm font-normal leading-relaxed"
                >
                  I understand that ResusGPS provides bedside reference support (not a substitute for
                  clinical judgment) per the{" "}
                  <LegalExternalLink href="/legal/clinical-use" className="text-primary underline">
                    ResusGPS intended use
                  </LegalExternalLink>
                  .
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/help">Contact support</Link>
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!allAgreed || accept.isPending}
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
