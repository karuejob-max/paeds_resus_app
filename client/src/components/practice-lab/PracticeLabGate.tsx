import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";

const ACK_KEY = "paeds_resus_aha_practice_lab_ack_v1";

type Props = {
  children: React.ReactNode;
};

/**
 * Phase 0 governance gate for AHA Practice Lab.
 * Supplemental simulation only — not certification, not for live patient care.
 */
export function PracticeLabGate({ children }: Props) {
  const [acknowledged, setAcknowledged] = useState(() => {
    try {
      return sessionStorage.getItem(ACK_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (acknowledged) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">AHA Practice Lab — simulation only</AlertTitle>
        <AlertDescription className="text-amber-900/90 space-y-2">
          <p>
            <strong>AHA Practice Lab</strong> is self-guided supplemental practice for your AHA course.
            It does <strong>not</strong> replace hands-on skills sessions or issue AHA certification.
          </p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Not for live patient care — use ResusGPS for clinical workflow</li>
            <li>Mock scenarios and scripted feedback only</li>
            <li>AHA 2025 algorithms as reference (pediatric PALS / adult ACLS tracks)</li>
          </ul>
        </AlertDescription>
      </Alert>
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <ShieldAlert className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          Active or completed AHA enrollment is required to save attempts and receive booster reminders.
        </AlertDescription>
      </Alert>
      <Button
        className="w-full"
        onClick={() => {
          try {
            sessionStorage.setItem(ACK_KEY, "1");
          } catch {
            /* private mode */
          }
          setAcknowledged(true);
        }}
      >
        I understand — enter Practice Lab
      </Button>
    </div>
  );
}
