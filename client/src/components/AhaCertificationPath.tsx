import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AhaCertificationPathProps = {
  cognitiveComplete: boolean;
  practicalSignedOff: boolean;
  certificateIssued: boolean;
  className?: string;
};

/** Two-gate AHA certification progress — same structure on every hub course card. */
export function AhaCertificationPath({
  cognitiveComplete,
  practicalSignedOff,
  certificateIssued,
  className,
}: AhaCertificationPathProps) {
  if (certificateIssued) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Full AHA certificate issued — valid for 2 years
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">Certification path</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          {cognitiveComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className={cognitiveComplete ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
            {cognitiveComplete
              ? "Cognitive modules complete — gatepass certificate issued"
              : "Complete all cognitive modules"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {practicalSignedOff ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
          <span
            className={
              practicalSignedOff ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }
          >
            {practicalSignedOff
              ? "Practical skills signed off"
              : "Practical skills — awaiting instructor sign-off"}
          </span>
        </div>
      </div>
      {cognitiveComplete && !practicalSignedOff && (
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed bg-blue-50 dark:bg-blue-950/30 rounded p-2 mt-1">
          Your cognitive gatepass certificate is ready. Present it at your hands-on session to complete practical
          sign-off.
        </p>
      )}
      {!cognitiveComplete && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Complete all cognitive modules to receive your gatepass certificate for the hands-on practical session.
        </p>
      )}
    </div>
  );
}
