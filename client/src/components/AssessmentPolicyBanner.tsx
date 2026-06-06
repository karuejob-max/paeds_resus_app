import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { examPolicyHref, type ExamPolicyTrack } from "@shared/exam-policy-learner-content";

type AssessmentPolicyBannerProps = {
  track: ExamPolicyTrack;
  className?: string;
};

const COPY: Record<
  ExamPolicyTrack,
  { summary: string; detail: string; icon: typeof BookOpen }
> = {
  fellowship: {
    summary: "Diagnostic, formatives, and summative exams on every micro-course.",
    detail: "Pass marks, attempt limits, and retries before you enroll.",
    icon: BookOpen,
  },
  aha: {
    summary: "Diagnostic baseline, module checks, and a final summative exam.",
    detail: "Gatepass rules, retries, and what counts toward your AHA certificate.",
    icon: ClipboardCheck,
  },
};

/** Visible entry-point link to the learner assessment policy (Fellowship or AHA deep link). */
export function AssessmentPolicyBanner({ track, className }: AssessmentPolicyBannerProps) {
  const { summary, detail, icon: Icon } = COPY[track];
  const isAha = track === "aha";

  return (
    <Card
      className={cn(
        isAha
          ? "border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800"
          : "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
        className
      )}
    >
      <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            isAha ? "text-blue-700 dark:text-blue-300" : "text-amber-800 dark:text-amber-300"
          )}
          aria-hidden
        />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p
            className={cn(
              "text-sm font-medium",
              isAha ? "text-blue-900 dark:text-blue-100" : "text-amber-950 dark:text-amber-100"
            )}
          >
            {summary}
          </p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <Link href={examPolicyHref(track)} className="shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full sm:w-auto",
              isAha
                ? "border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200"
                : "border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
            )}
          >
            How assessments work
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
