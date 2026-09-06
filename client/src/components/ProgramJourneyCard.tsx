import { CheckCircle2, LockKeyhole, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import type { JourneyPhase } from "@shared/program-journey";

type ProgramJourneyCardProps = {
  title: string;
  subtitle: string;
  percentComplete: number;
  phases: JourneyPhase[];
  nextAction: { label: string; destination: string } | null;
  compact?: boolean;
};

const statusLabel = {
  complete: "Complete",
  current: "Current step",
  locked: "Up next",
} as const;

export function ProgramJourneyCard({
  title,
  subtitle,
  percentComplete,
  phases,
  nextAction,
  compact = false,
}: ProgramJourneyCardProps) {
  const currentPhase = phases.find((phase) => phase.status === "current") ?? phases.find((phase) => phase.status === "locked");

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]">
      <CardHeader className={compact ? "pb-3" : "pb-4"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">Your next programme step</p>
            <CardTitle className="mt-2 text-xl text-slate-950 sm:text-2xl">{title}</CardTitle>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          <Badge className="border-slate-200 bg-slate-50 text-slate-700" variant="outline">
            {percentComplete}% overall progress
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {currentPhase ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-teal-700 p-2 text-white">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">You are here</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{currentPhase.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">{currentPhase.detail}</p>
                {currentPhase.lockedReason ? <p className="mt-2 text-sm leading-6 text-slate-600">{currentPhase.lockedReason}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
            <span>Overall programme progress</span>
            <span>{percentComplete}%</span>
          </div>
          <div
            aria-label={`${percentComplete}% overall programme progress`}
            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentComplete}
          >
            <div className="h-full rounded-full bg-teal-700 transition-[width] duration-200" style={{ width: `${percentComplete}%` }} />
          </div>
        </div>

        {!compact ? (
          <div className="grid gap-3 md:grid-cols-4">
            {phases.map((phase, index) => (
              <div
                key={phase.key}
                className={`relative rounded-xl border p-3 ${
                  phase.status === "complete"
                    ? "border-emerald-200 bg-emerald-50"
                    : phase.status === "current"
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                {index < phases.length - 1 ? <span className="absolute -right-3 top-1/2 hidden h-px w-3 bg-slate-200 md:block" aria-hidden="true" /> : null}
                <div className="flex items-start gap-2">
                  {phase.status === "complete" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  ) : phase.status === "locked" ? (
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  ) : (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-700" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{statusLabel[phase.status]}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{phase.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{phase.detail}</p>
                    {phase.lockedReason ? <p className="mt-1 text-xs leading-5 text-slate-500">{phase.lockedReason}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {nextAction ? (
          <Button asChild className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto">
            <Link href={nextAction.destination}>
              {nextAction.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
