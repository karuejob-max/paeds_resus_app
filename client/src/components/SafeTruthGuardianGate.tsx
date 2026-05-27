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
import { Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LEGAL_DOCUMENT_VERSIONS } from "@shared/legal-versions";

type Props = { children: ReactNode };

/** Guardian acknowledgment before Parent Safe-Truth submissions. */
export function SafeTruthGuardianGate({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [agreedGuardian, setAgreedGuardian] = useState(false);
  const [agreedEmergency, setAgreedEmergency] = useState(false);
  const accept = trpc.legal.acceptSafeTruthGuardian.useMutation();
  const { data: status, isLoading } = trpc.legal.getMyConsentStatus.useQuery(undefined, {
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (status?.safeTruthGuardianAckVersion === LEGAL_DOCUMENT_VERSIONS.safeTruthGuardian) return;
    setOpen(true);
  }, [isLoading, status?.safeTruthGuardianAckVersion]);

  const allAgreed = agreedGuardian && agreedEmergency;

  if (open) {
    return (
      <>
        <Dialog open={open} onOpenChange={() => {}}>
          <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-brand-orange" />
                Guardian acknowledgment
              </DialogTitle>
              <DialogDescription>
                Parent Safe-Truth is for parents and legal guardians sharing care journey feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="guardian-responsibility"
                  checked={agreedGuardian}
                  onCheckedChange={(v) => setAgreedGuardian(v === true)}
                />
                <Label htmlFor="guardian-responsibility" className="leading-snug cursor-pointer">
                  I confirm I am a parent or legal guardian with authority to share this information. I understand
                  Safe-Truth is not a substitute for emergency care or formal complaints.
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  id="guardian-emergency"
                  checked={agreedEmergency}
                  onCheckedChange={(v) => setAgreedEmergency(v === true)}
                />
                <Label htmlFor="guardian-emergency" className="leading-snug cursor-pointer">
                  If my child needs urgent care now, I will call local emergency services (Kenya: 999 or 112) — not
                  this platform.
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!allAgreed || accept.isPending}
                onClick={() => {
                  void accept.mutateAsync().then(() => setOpen(false));
                }}
              >
                Continue
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
