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

const CONSENT_STORAGE_KEY = "care_signal_consent_v1";

export function hasStoredCareSignalConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
}

type Props = {
  children: ReactNode;
};

export function CareSignalConsentGate({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const trackEvent = trpc.events.trackEvent.useMutation();

  const { data: history, isLoading } = trpc.careSignalEvents.getEventHistory.useQuery(
    { limit: 1, offset: 0 },
    { staleTime: 60_000 }
  );

  useEffect(() => {
    if (isLoading) return;
    const priorSubmission = (history?.events?.length ?? 0) > 0;
    if (priorSubmission || hasStoredCareSignalConsent()) return;
    setOpen(true);
  }, [isLoading, history?.events?.length]);

  const handleAccept = () => {
    if (!agreed) return;
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    void trackEvent.mutateAsync({
      eventType: "care_signal",
      eventName: "care_signal_consent_granted",
      sessionId: getAnalyticsSessionId(),
      pageUrl: "/care-signal",
      eventData: { version: "v1", purposes: ["qi", "fellowship_pillar_c", "aggregated_surveillance"] },
    });
    setOpen(false);
  };

  if (open) {
    return (
      <>
        <Dialog open={open} onOpenChange={() => {}}>
          <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-teal" />
                Care Signal consent
              </DialogTitle>
              <DialogDescription>
                Before your first report, please confirm how your data will be used.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Care Signal reports are used for <strong className="text-foreground">quality improvement</strong>,
                fellowship Pillar C streak tracking, and <strong className="text-foreground">aggregated</strong> facility
                and national surveillance. We do not publish identifiable provider performance.
              </p>
              <p>
                Do not include patient names or identifiers in free text. Follow your local protocol and
                institutional policies.
              </p>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="care-signal-consent"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                />
                <Label htmlFor="care-signal-consent" className="leading-snug cursor-pointer">
                  I consent to Paeds Resus processing my Care Signal submissions for QI, fellowship progress,
                  and aggregated reporting as described in the Privacy Policy.
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!agreed} onClick={handleAccept}>
                Continue to Care Signal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {null}
      </>
    );
  }

  return <>{children}</>;
}
