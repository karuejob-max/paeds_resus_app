/**
 * Live Fellowship Pillar B mini-bar — shown after ResusGPS session save.
 * Surfaces ResusGPS case credit toward Paeds Resus Fellowship without leaving bedside.
 */

import { GraduationCap, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type Props = {
  open: boolean;
  onDismiss: () => void;
};

export function ResusGpsFellowshipPillarBanner({ open, onDismiss }: Props) {
  const [, navigate] = useLocation();

  const { data: progress, isLoading } = trpc.fellowship.getProgress.useQuery(undefined, {
    enabled: open,
    staleTime: 0,
  });

  if (!open) return null;

  const pillar = progress?.resusGPSPillar;
  const pct = pillar?.percentage ?? 0;
  const conditionsMet = pillar?.conditionsWithThreshold ?? 0;
  const conditionsRequired = pillar?.totalConditionsTaught ?? 10;
  const casesTotal = pillar?.casesCompleted ?? 0;

  return (
    <div
      className="border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
      role="status"
      aria-live="polite"
      aria-label="Fellowship ResusGPS progress update"
    >
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <GraduationCap className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Fellowship Pillar B — ResusGPS cases
            </p>
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
              {isLoading ? "Updating…" : `${pct}% toward pillar`}
            </span>
          </div>
          <Progress value={isLoading ? 0 : pct} className="h-2 bg-emerald-200/60" />
          <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80">
            {isLoading ? (
              "Calculating your case credit…"
            ) : (
              <>
                <strong>{conditionsMet}</strong> of {conditionsRequired} taught conditions have ≥3
                attributable cases · <strong>{casesTotal}</strong> total cases logged
              </>
            )}
          </p>
          {!isLoading && conditionsMet < conditionsRequired && (
            <p className="text-[11px] text-emerald-800/70 dark:text-emerald-200/70">
              Each saved session adds credit. Reach 3 cases per condition to complete this pillar.
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-emerald-800 hover:text-emerald-950 hover:bg-emerald-500/20"
            onClick={() => {
              navigate("/fellowship");
              onDismiss();
            }}
          >
            Fellowship
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-emerald-800 hover:bg-emerald-500/20"
            onClick={onDismiss}
            aria-label="Dismiss fellowship progress"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
