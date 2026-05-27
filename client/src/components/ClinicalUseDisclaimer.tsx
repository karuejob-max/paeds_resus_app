import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LEGAL_DOCUMENT_VERSIONS } from "@shared/legal-versions";

const LOCAL_KEY = "paeds_resus_clinical_scope_ack";

/**
 * Bedside scope notice: reference support, not emergency services; facility protocol prevails.
 */
export function ClinicalUseDisclaimer() {
  const [dismissed, setDismissed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const accept = trpc.legal.acceptResusGpsDisclaimer.useMutation();

  const { data: status } = trpc.legal.getMyConsentStatus.useQuery(undefined, { staleTime: 30_000 });

  useEffect(() => {
    const version = LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer;
    if (status?.resusGpsAckVersion === version) {
      setDismissed(true);
      return;
    }
    try {
      if (sessionStorage.getItem(`${LOCAL_KEY}_${version}`) === "1") {
        setDismissed(true);
      }
    } catch {
      /* private mode */
    }
  }, [status?.resusGpsAckVersion]);

  if (dismissed) return null;

  return (
    <Alert className="mx-4 mt-2 border-[#1a4d4d]/30 bg-[#f0f9f9]/80 dark:bg-[#0f2525]/80">
      <Info className="h-4 w-4 text-[#1a4d4d] dark:text-teal-200" />
      <AlertDescription className="text-sm text-[#1a4d4d] dark:text-teal-100 flex flex-col gap-3">
        <div>
          <strong>ResusGPS intended use:</strong> structured paediatric emergency{" "}
          <strong>reference support</strong> for trained providers. Not medical advice. Not an emergency service — call{" "}
          <strong>999 or 112</strong> in Kenya; use local emergency numbers in Uganda, Tanzania, Rwanda, Burundi, South
          Sudan, and DRC. Your facility protocol and senior review always prevail.
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} />
          <span className="leading-snug">
            I understand ResusGPS is decision support only and I remain clinically responsible.
          </span>
        </label>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-[#1a4d4d]/40 self-start"
          disabled={!acknowledged || accept.isPending}
          onClick={() => {
            const version = LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer;
            void accept.mutateAsync().catch(() => {});
            try {
              sessionStorage.setItem(`${LOCAL_KEY}_${version}`, "1");
            } catch {
              /* private mode */
            }
            setDismissed(true);
          }}
        >
          Acknowledge and continue
        </Button>
      </AlertDescription>
    </Alert>
  );
}
