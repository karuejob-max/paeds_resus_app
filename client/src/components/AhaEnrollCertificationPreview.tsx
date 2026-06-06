import { Link } from "wouter";
import { AhaCertificationPath } from "@/components/AhaCertificationPath";
import type { AhaProgramType } from "@/lib/providerCourseRoutes";
import { examPolicyHref } from "@shared/exam-policy-learner-content";

/** Pre-enrollment certification path preview — same copy on every AHA program including PALS. */
export function AhaEnrollCertificationPreview({ programType: _programType }: { programType: AhaProgramType }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <AhaCertificationPath
        cognitiveComplete={false}
        practicalSignedOff={false}
        certificateIssued={false}
      />
      <p className="text-xs text-muted-foreground">
        <Link href={examPolicyHref("aha")} className="text-primary underline-offset-2 hover:underline">
          How assessments work
        </Link>
        {" "}
        (summative 80%, 3 attempts, 24h cooldown).
      </p>
    </div>
  );
}
