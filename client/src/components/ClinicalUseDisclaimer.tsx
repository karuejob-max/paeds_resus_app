import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

const KEY = "paeds_resus_clinical_scope_ack_v1";

/**
 * Bedside scope notice (Codex audit): reference support, not a substitute for clinical judgment.
 */
export function ClinicalUseDisclaimer() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  return (
    <Alert className="mx-4 mt-2 border-[#1a4d4d]/30 bg-[#f0f9f9]/80">
      <Info className="h-4 w-4 text-[#1a4d4d]" />
      <AlertDescription className="text-sm text-[#1a4d4d] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          ResusGPS provides structured paediatric emergency <strong>reference support</strong>. It does
          not replace local protocols, senior review, or your clinical judgment.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-[#1a4d4d]/40"
          onClick={() => {
            try {
              sessionStorage.setItem(KEY, "1");
            } catch {
              /* private mode */
            }
            setDismissed(true);
          }}
        >
          Understood
        </Button>
      </AlertDescription>
    </Alert>
  );
}
