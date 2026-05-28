import { memo, type ReactNode } from "react";
import { CheckCircle2, Award } from "lucide-react";
import type { AhaProgramType } from "@/lib/providerCourseRoutes";
import { AhaHubCourseCard } from "@/components/AhaHubCourseCard";
import { AhaCertificationPath } from "@/components/AhaCertificationPath";
import { Button } from "@/components/ui/button";
import type { AhaHubEnrollmentRow } from "@/lib/pick-aha-hub-enrollment";

type AhaHubProviderCourseCardProps = {
  programType: AhaProgramType;
  enrollment?: AhaHubEnrollmentRow;
  /** True while enrollment/progress is still loading — show stable placeholders in middle/footer. */
  enrollmentPending?: boolean;
  onContinue: (programType: AhaProgramType, enrollmentId: number) => void;
  onEnroll: (programType: AhaProgramType) => void;
  onViewCertificates: () => void;
};

function FooterButtonSkeleton() {
  return <div className="h-9 w-full rounded-md bg-accent animate-pulse" aria-hidden />;
}

export const AhaHubProviderCourseCard = memo(function AhaHubProviderCourseCard({
  programType,
  enrollment,
  enrollmentPending = false,
  onContinue,
  onEnroll,
  onViewCertificates,
}: AhaHubProviderCourseCardProps) {
  const isEnrolled = !!enrollment;
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

  const middle =
    !enrollmentPending && isEnrolled ? (
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <AhaCertificationPath
          cognitiveComplete={cognitiveComplete}
          practicalSignedOff={practicalSignedOff}
          certificateIssued={certIssued}
        />
      </div>
    ) : null;

  const footer = enrollmentPending ? (
    <FooterButtonSkeleton />
  ) : (
    <div className="space-y-2">
      {isEnrolled && !certIssued && (
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
      {isEnrolled && cognitiveComplete && !certIssued && (
        <Button size="sm" variant="outline" className="w-full" onClick={onViewCertificates}>
          Download gatepass certificate
        </Button>
      )}
      {isEnrolled && certIssued && (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
          onClick={onViewCertificates}
        >
          View full certificate
        </Button>
      )}
      {!isEnrolled && (
        <Button size="sm" className="w-full" onClick={() => onEnroll(programType)}>
          Start enrollment
        </Button>
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
