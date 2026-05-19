import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const ACK_KEY = "paeds_resus_training_sim_ack_v1";

type Props = {
  title: string;
  children: React.ReactNode;
};

/**
 * Blocks training/demo surfaces until the user acknowledges simulation-only use.
 * See docs/CLINICAL_SAFETY_REGISTER.md (PROBLEM-ID).
 */
export function TrainingSimulationGate({ title, children }: Props) {
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
        <AlertTitle className="text-amber-900">Training / simulation only</AlertTitle>
        <AlertDescription className="text-amber-900/90">
          <strong>{title}</strong> uses mock data — not live vitals or bedside assessment. Do not use
          for real patient care. For clinical workflow use <strong>ResusGPS</strong> from the provider
          workspace.
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
        I understand — open training demo
      </Button>
    </div>
  );
}
