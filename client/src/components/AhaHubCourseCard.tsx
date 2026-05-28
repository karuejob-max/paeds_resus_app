import { memo, type ReactNode } from "react";
import type { AhaProgramType } from "@/lib/providerCourseRoutes";
import { getAhaCourseMetadata } from "@/const/aha-course-metadata";
import { AhaCourseDurationLines } from "@/components/AhaCourseDurationLines";
import { formatPrice, getIndividualCoursePrice } from "@/const/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BADGE_COLORS: Record<AhaProgramType, string> = {
  bls: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  acls: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  pals: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  heartsaver: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  nrp: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
};

type AhaHubCourseCardProps = {
  programType: AhaProgramType;
  /** Optional status icon (checkmark, award) shown beside title */
  titleAdornment?: ReactNode;
  /** Extra content between description and footer (e.g. certification progress) */
  middle?: ReactNode;
  footer: ReactNode;
  className?: string;
  /** Override price; defaults to pricing.ts */
  price?: number | null;
};

export const AhaHubCourseCard = memo(function AhaHubCourseCard({
  programType,
  titleAdornment,
  middle,
  footer,
  className,
  price,
}: AhaHubCourseCardProps) {
  const meta = getAhaCourseMetadata(programType);
  const displayPrice = price !== undefined ? price : getIndividualCoursePrice(programType);

  return (
    <Card
      className={cn(
        "hover:border-primary/50 transition-colors flex flex-col min-h-[280px]",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              BADGE_COLORS[programType]
            )}
            aria-hidden
          >
            {meta.badge}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg leading-snug">{meta.title}</CardTitle>
              {titleAdornment}
            </div>
            <AhaCourseDurationLines programType={programType} className="mt-1.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
          {meta.shortDescription}
        </p>
        {displayPrice != null && (
          <p className="text-sm font-semibold text-foreground tabular-nums">{formatPrice(displayPrice)}</p>
        )}
        {middle}
        {footer}
      </CardContent>
    </Card>
  );
});

export function AhaHubCourseCardSkeleton() {
  return (
    <Card className="flex flex-col min-h-[280px]">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded bg-accent animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-accent animate-pulse" />
            <div className="h-4 w-2/5 rounded bg-accent animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2 min-h-[3.75rem]">
          <div className="h-4 w-full rounded bg-accent animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-accent animate-pulse" />
        </div>
        <div className="h-4 w-24 rounded bg-accent animate-pulse" />
        <div className="h-9 w-full rounded bg-accent animate-pulse mt-auto" />
      </CardContent>
    </Card>
  );
}
