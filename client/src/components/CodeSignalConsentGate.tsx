/**
 * First-submission consent gate for Code Signal — sibling of
 * CareSignalConsentGate.tsx. Replaces the inline, unversioned notice that
 * shipped with the initial Code Signal build (flagged there as a deferred
 * item; this is that follow-up).
 *
 * Deliberately different from Care Signal's copy in two ways: no Fellowship
 * Pillar C language (Code Signal carries no Fellowship credit), and no
 * appeals-process link (Code Signal has no appeals flow yet — flagged, not
 * built in this pass, unlike Care Signal's /care-signal/appeal).
 */
import { useEffect, useState, type ReactNode } from "react";
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
import { Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getAnalyticsSessionId } from "@/lib/analytics-session";
import { LEGAL_DOCUMENT_VERSIONS } from "@shared/legal-versions";
import { LegalExternalLink } from "@/components/LegalExternalLink";

const CONSENT_STORAGE_KEY = "code_signal_consent_v1";

export function hasStoredCodeSignalConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_STORAGE_KEY) === LEGAL_DOCUMENT_VERSIONS.codeSignalNotice;
}

type Props = {
  children: ReactNode;
};

export function CodeSignalConsentGate({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [agreedQi, setAgreedQi] = useState(false);
  const [agreedNoPatientIds, setAgreedNoPatientIds] = useState(false);
  const [agreedFacility, setAgreedFacility] = useState(false);
  const trackEvent = trpc.events.trackEvent.useMutation();
  const acceptConsent = trpc.legal.acceptCodeSignalConsent.useMutation();
  const utils = trpc.useUtils();

  const { data: history, isLoading } = trpc.codeSignalEvents.getEventHistory.useQuery(
    { limit: 1, offset: 0 },
    { staleTime: 60_000 }
  );

  const { data: consentStatus } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isLoading) return;
    const serverConsented =
      consentStatus?.codeSignalConsentVersion === LEGAL_DOCUMENT_VERSIONS.codeSignalNotice;
    const priorSubmission = (history?.events?.length ?? 0) > 0;
    if (serverConsented || priorSubmission || hasStoredCodeSignalConsent()) return;
    setOpen(true);
  }, [isLoading, history?.events?.length, consentStatus?.codeSignalConsentVersion]);

  const allAgreed = agreedQi && agreedNoPatientIds && agreedFacility;

  const handleAccept = async () => {
    if (!allAgreed) return;
    localStorage.setItem(CONSENT_STORAGE_KEY, LEGAL_DOCUMENT_VERSIONS.codeSignalNotice);
    try {
      await acceptConsent.mutateAsync();
      await utils.legal.getMyConsentStatus.invalidate();
    } catch {
      /* localStorage fallback if offline */
    }
    void trackEvent.mutateAsync({
      eventType: "code_signal",
      eventName: "code_signal_consent_granted",
      sessionId: getAnalyticsSessionId(),
      pageUrl: "/code-signal",
      eventData: {
        version: LEGAL_DOCUMENT_VERSIONS.codeSignalNotice,
        purposes: ["qi", "aggregated_surveillance"],
      },
    });
    setOpen(false);
  };

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-teal" />
              Code Signal consent
            </DialogTitle>
            <DialogDescription>
              Before your first report, confirm how your quality-improvement data will be used.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Code Signal is for <strong className="text-foreground">quality improvement (QI)</strong> — not a
              patient medical record. It covers adult patients, mothers of paediatric patients, and staff members who
              required resuscitation. Reports support facility dashboards and{" "}
              <strong className="text-foreground">aggregated</strong> surveillance. Your provider account is linked
              for audit integrity unless you submit anonymously — this is not anonymous to the platform by default.
            </p>
            <p>
              Read the{" "}
              <LegalExternalLink href="/legal/code-signal" className="text-primary underline">
                Code Signal Notice
              </LegalExternalLink>{" "}
              and{" "}
              <LegalExternalLink href="/terms" className="text-primary underline">
                Terms of Use
              </LegalExternalLink>
              .
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="code-signal-qi"
                  checked={agreedQi}
                  onCheckedChange={(v) => setAgreedQi(v === true)}
                />
                <Label htmlFor="code-signal-qi" className="leading-snug cursor-pointer font-normal">
                  I consent to Paeds Resus processing my Code Signal submissions for QI and aggregated reporting.
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="code-signal-no-phi"
                  checked={agreedNoPatientIds}
                  onCheckedChange={(v) => setAgreedNoPatientIds(v === true)}
                />
                <Label htmlFor="code-signal-no-phi" className="leading-snug cursor-pointer font-normal">
                  I will not include patient names, national IDs, or other identifiers — including for the mother or
                  staff member involved, where applicable — in free text.
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="code-signal-facility"
                  checked={agreedFacility}
                  onCheckedChange={(v) => setAgreedFacility(v === true)}
                />
                <Label htmlFor="code-signal-facility" className="leading-snug cursor-pointer font-normal">
                  I understand facility administrators may view de-identified aggregates and that I must follow local
                  protocol and institutional policies.
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!allAgreed || acceptConsent.isPending} onClick={() => void handleAccept()}>
              Continue to Code Signal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
