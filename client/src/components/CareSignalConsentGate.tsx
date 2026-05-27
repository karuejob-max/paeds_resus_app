/**
 * First-submission consent gate for Care Signal (Fellowship §11 / LEGAL_COMPLIANCE_BASELINE).
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

const CONSENT_STORAGE_KEY = "care_signal_consent_v2";

export function hasStoredCareSignalConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_STORAGE_KEY) === LEGAL_DOCUMENT_VERSIONS.careSignalNotice;
}

type Props = {
  children: ReactNode;
};

export function CareSignalConsentGate({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [agreedQi, setAgreedQi] = useState(false);
  const [agreedNoPatientIds, setAgreedNoPatientIds] = useState(false);
  const [agreedFacility, setAgreedFacility] = useState(false);
  const trackEvent = trpc.events.trackEvent.useMutation();
  const acceptConsent = trpc.legal.acceptCareSignalConsent.useMutation();
  const utils = trpc.useUtils();

  const { data: history, isLoading } = trpc.careSignalEvents.getEventHistory.useQuery(
    { limit: 1, offset: 0 },
    { staleTime: 60_000 }
  );

  const { data: consentStatus } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isLoading) return;
    const serverConsented =
      consentStatus?.careSignalConsentVersion === LEGAL_DOCUMENT_VERSIONS.careSignalNotice;
    const priorSubmission = (history?.events?.length ?? 0) > 0;
    if (serverConsented || priorSubmission || hasStoredCareSignalConsent()) return;
    setOpen(true);
  }, [isLoading, history?.events?.length, consentStatus?.careSignalConsentVersion]);

  const allAgreed = agreedQi && agreedNoPatientIds && agreedFacility;

  const handleAccept = async () => {
    if (!allAgreed) return;
    localStorage.setItem(CONSENT_STORAGE_KEY, LEGAL_DOCUMENT_VERSIONS.careSignalNotice);
    try {
      await acceptConsent.mutateAsync();
      await utils.legal.getMyConsentStatus.invalidate();
    } catch {
      /* localStorage fallback if offline */
    }
    void trackEvent.mutateAsync({
      eventType: "care_signal",
      eventName: "care_signal_consent_granted",
      sessionId: getAnalyticsSessionId(),
      pageUrl: "/care-signal",
      eventData: {
        version: LEGAL_DOCUMENT_VERSIONS.careSignalNotice,
        purposes: ["qi", "fellowship_pillar_c", "aggregated_surveillance"],
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
              Care Signal consent
            </DialogTitle>
            <DialogDescription>
              Before your first report, confirm how your quality-improvement data will be used.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Care Signal is for <strong className="text-foreground">quality improvement (QI)</strong> — not a patient
              medical record. Reports support fellowship Pillar C, facility dashboards, and{" "}
              <strong className="text-foreground">aggregated</strong> surveillance. Your provider account is linked
              for audit and streak integrity — this is not anonymous to the platform.
            </p>
            <p>
              Read the{" "}
              <LegalExternalLink href="/privacy#care-signal" className="text-primary underline">
                Privacy Policy (Care Signal section)
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
                  id="care-signal-qi"
                  checked={agreedQi}
                  onCheckedChange={(v) => setAgreedQi(v === true)}
                />
                <Label htmlFor="care-signal-qi" className="leading-snug cursor-pointer font-normal">
                  I consent to Paeds Resus processing my Care Signal submissions for QI, fellowship progress, and
                  aggregated reporting.
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="care-signal-no-phi"
                  checked={agreedNoPatientIds}
                  onCheckedChange={(v) => setAgreedNoPatientIds(v === true)}
                />
                <Label htmlFor="care-signal-no-phi" className="leading-snug cursor-pointer font-normal">
                  I will not include patient names, national IDs, or other patient identifiers in free text.
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="care-signal-facility"
                  checked={agreedFacility}
                  onCheckedChange={(v) => setAgreedFacility(v === true)}
                />
                <Label htmlFor="care-signal-facility" className="leading-snug cursor-pointer font-normal">
                  I understand facility administrators may view de-identified aggregates and that I must follow local
                  protocol and institutional policies.
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild>
              <a href="/care-signal/appeal" target="_blank" rel="noopener noreferrer">
                Appeals process
              </a>
            </Button>
            <Button disabled={!allAgreed || acceptConsent.isPending} onClick={() => void handleAccept()}>
              Continue to Care Signal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
