import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IersEvidencePanel } from "@/components/IersEvidencePanel";

interface IermsAuditScorecardPanelProps {
  institutionId: number;
}

/**
 * Compatibility wrapper for the existing dashboard route.
 * The former editable five-slider scorecard is intentionally retired: it
 * created an accreditation-looking number without criterion-level evidence.
 */
export function IermsAuditScorecardPanel({ institutionId }: IermsAuditScorecardPanelProps) {
  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50 text-amber-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          The former self-scored IERMS total is retired. Readiness is now calculated from accepted evidence and remains subject to human certification review.
        </AlertDescription>
      </Alert>
      <IersEvidencePanel institutionId={institutionId} />
    </div>
  );
}
