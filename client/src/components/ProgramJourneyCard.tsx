import { CheckCircle2, LockKeyhole } from "lucide-react";
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

export function ProgramJourneyCard({ title, subtitle, percentComplete, phases, nextAction, compact = false }: ProgramJourneyCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-slate-950">{title}</CardTitle>
          <Badge variant="secondary">{percentComplete}% programme progress</Badge>
        </div>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div aria-label={`${percentComplete}% programme progress`} className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-200" style={{ width: `${percentComplete}%` }} />
        </div>
        {!compact && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase) => (
              <div key={phase.key} className={`rounded-lg border p-3 ${phase.status === "complete" ? "border-emerald-200 bg-emerald-50" : phase.status === "current" ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-start gap-2">
                  {phase.status === "complete" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : phase.status === "locked" ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /> : <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">{phase.label}</p>
                    <p className="mt-1 text-xs text-slate-600">{phase.detail}</p>
                    {phase.lockedReason && <p className="mt-1 text-xs text-slate-500">{phase.lockedReason}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {nextAction && <Button asChild className="bg-indigo-700 text-white hover:bg-indigo-800"><Link href={nextAction.destination}>{nextAction.label}</Link></Button>}
      </CardContent>
    </Card>
  );
}
