import { memo, type ReactNode } from "react";
import { useState } from "react";
import { CheckCircle2, Award } from "lucide-react";
import type { AhaProgramType } from "@/lib/providerCourseRoutes";
import { AhaHubCourseCard } from "@/components/AhaHubCourseCard";
import { AhaCertificationPath } from "@/components/AhaCertificationPath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AhaHubEnrollmentRow } from "@/lib/pick-aha-hub-enrollment";

type AhaAccessDecision = {
  allowed: boolean;
  pathway: string | null;
  message: string;
};

type AhaHubProviderCourseCardProps = {
  programType: AhaProgramType;
  accessDecision?: AhaAccessDecision;
  enrollment?: AhaHubEnrollmentRow;
  /** True while enrollment/progress is still loading — show stable placeholders in middle/footer. */
  enrollmentPending?: boolean;
  onContinue: (programType: AhaProgramType, enrollmentId: number) => void;
  onEnroll: (programType: AhaProgramType) => void;
  onViewCertificates: () => void;
  onRedeemAccessCode?: (programType: AhaProgramType, accessCode: string) => void;
  accessCodePending?: boolean;
};

function FooterButtonSkeleton() {
  return <div className="h-9 w-full rounded-md bg-accent animate-pulse" aria-hidden />;
}

export const AhaHubProviderCourseCard = memo(function AhaHubProviderCourseCard({
  programType,
  accessDecision,
  enrollment,
  enrollmentPending = false,
  onContinue,
  onEnroll,
  onViewCertificates,
  onRedeemAccessCode,
  accessCodePending = false,
}: AhaHubProviderCourseCardProps) {
  const isEnrolled = !!enrollment;
  // Backward-compatible default for standalone card consumers; the AHA Hub always supplies the server decision.
  const canAccess = accessDecision ? accessDecision.allowed : true;
  const [accessCode, setAccessCode] = useState("");
  const cognitiveComplete = enrollment?.cognitiveModulesComplete ?? false;
  const practicalSignedOff = enrollment?.practicalSkillsSignedOff ?? false;
  const certIssued = cognitiveComplete && practicalSignedOff;

  let titleAdornment: ReactNode = null;
  if (!enrollmentPending) {
    if (certIssued) {
      titleAdornment = <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />;
    } else if (cognitiveComplete) {
      titleAdornment = <Award className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
  }

  const middle = enrollmentPending ? null : (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <AhaCertificationPath
        cognitiveComplete={cognitiveComplete}
        practicalSignedOff={practicalSignedOff}
        certificateIssued={certIssued}
      />
    </div>
  );

  const footer = enrollmentPending ? (
    <FooterButtonSkeleton />
  ) : (
    <div className="space-y-2">
      {isEnrolled && canAccess && !certIssued && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (enrollment?.id) onContinue(programType, enrollment.id);
          }}
        >
          {enrollment?.id ? "Start course" : "Open learner dashboard"}
        </Button>
      )}
      {isEnrolled && canAccess && cognitiveComplete && !certIssued && (
        <Button size="sm" variant="outline" className="w-full" onClick={onViewCertificates}>
          Download gatepass certificate
        </Button>
      )}
      {isEnrolled && canAccess && certIssued && (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
          onClick={onViewCertificates}
        >
          View full certificate
        </Button>
      )}
      {isEnrolled && !canAccess && (
        <>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
            <p className="font-medium">Course access is locked</p>
            <p className="mt-1">This legacy enrollment does not provide current self-pay access. Complete payment or redeem an access code. NERP, IERP, and ILSP learners should use their dedicated portal.</p>
          </div>
          <Button size="sm" className="w-full" onClick={() => onEnroll(programType)}>
            Unlock with payment
          </Button>
          {onRedeemAccessCode && <div className="rounded-md border border-dashed p-2">
            <p className="mb-1 text-xs text-muted-foreground">Have a Paeds Resus access code?</p>
            <div className="flex gap-2">
              <Input
                aria-label={`Access code for ${programType.toUpperCase()}`}
                placeholder="PAEDS-XXXXXXXXXX"
                value={accessCode}
                onChange={event => setAccessCode(event.target.value.toUpperCase())}
                className="h-9 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 shrink-0"
                disabled={accessCodePending || accessCode.trim().length < 8}
                onClick={() => onRedeemAccessCode(programType, accessCode.trim())}
              >
                {accessCodePending ? "…" : "Redeem"}
              </Button>
            </div>
          </div>}
        </>
      )}
      {!isEnrolled && (
        <>
          <Button size="sm" className="w-full" onClick={() => onEnroll(programType)}>
            Start enrollment
          </Button>
          {onRedeemAccessCode && <div className="rounded-md border border-dashed p-2">
            <p className="mb-1 text-xs text-muted-foreground">Have a Paeds Resus access code?</p>
            <div className="flex gap-2">
              <Input aria-label={`Access code for ${programType.toUpperCase()}`} placeholder="PAEDS-XXXXXXXXXX" value={accessCode} onChange={event => setAccessCode(event.target.value.toUpperCase())} className="h-9 text-xs" />
              <Button type="button" size="sm" variant="outline" className="h-9 shrink-0" disabled={accessCodePending || accessCode.trim().length < 8} onClick={() => onRedeemAccessCode(programType, accessCode.trim())}>{accessCodePending ? "…" : "Redeem"}</Button>
            </div>
          </div>}
        </>
      )}
    </div>
  );

  return (
    <AhaHubCourseCard
      programType={programType}
      titleAdornment={titleAdornment}
      className={certIssued ? "border-emerald-300 dark:border-emerald-700" : undefined}
      middle={middle}
      footer={footer}
    />
  );
});
