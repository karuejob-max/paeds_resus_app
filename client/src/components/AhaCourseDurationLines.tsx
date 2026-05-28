import type { AhaProgramType } from "@/lib/providerCourseRoutes";
import {
  formatAhaRecommendedDurationLabel,
  formatCognitiveCourseworkDurationLabel,
} from "@/const/aha-course-metadata";
import { cn } from "@/lib/utils";

type AhaCourseDurationLinesProps = {
  programType: AhaProgramType;
  className?: string;
  /** Text size / color variant for card headers vs body copy */
  variant?: "default" | "muted" | "onDark";
};

const variantClasses: Record<NonNullable<AhaCourseDurationLinesProps["variant"]>, string> = {
  default: "text-muted-foreground",
  muted: "text-muted-foreground",
  onDark: "text-white/85",
};

export function AhaCourseDurationLines({
  programType,
  className,
  variant = "default",
}: AhaCourseDurationLinesProps) {
  return (
    <div className={cn("space-y-0.5 text-sm leading-snug", variantClasses[variant], className)}>
      <p>{formatAhaRecommendedDurationLabel(programType)}</p>
      <p>{formatCognitiveCourseworkDurationLabel(programType)}</p>
    </div>
  );
}
