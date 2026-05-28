import { AhaCertificationPath } from "@/components/AhaCertificationPath";
import type { AhaProgramType } from "@/lib/providerCourseRoutes";

/** Pre-enrollment certification path preview — same copy on every AHA program including PALS. */
export function AhaEnrollCertificationPreview({ programType: _programType }: { programType: AhaProgramType }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <AhaCertificationPath
        cognitiveComplete={false}
        practicalSignedOff={false}
        certificateIssued={false}
      />
    </div>
  );
}
