import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, Circle } from "lucide-react";

type MonthlyTimelineEntry = {
  monthKey: string;
  label: string;
  reportCount: number;
  isCurrentMonth: boolean;
  graceUsed: boolean;
};

interface StreamSummary {
  streak: number;
  monthlyTimeline: MonthlyTimelineEntry[];
}

interface FellowshipPillarCDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careSignal: StreamSummary;
  cpd: StreamSummary;
}

function MonthRow({ entry }: { entry: MonthlyTimelineEntry }) {
  const reported = entry.reportCount > 0;
  return (
    <div
      className={`flex items-center justify-between text-sm py-1.5 px-2 rounded ${
        entry.isCurrentMonth ? "bg-accent" : ""
      }`}
    >
      <span className={entry.isCurrentMonth ? "font-medium" : "text-muted-foreground"}>
        {entry.label}
        {entry.isCurrentMonth && " (this month)"}
      </span>
      {reported ? (
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Reported
        </span>
      ) : entry.graceUsed ? (
        <span className="flex items-center gap-1 text-amber-600">
          <ShieldAlert className="h-4 w-4" /> Grace used
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Circle className="h-4 w-4" /> Missed
        </span>
      )}
    </div>
  );
}

function StreamTimeline({ title, stream }: { title: string; stream: StreamSummary }) {
  const missedNoGrace = stream.monthlyTimeline.filter((m) => m.reportCount === 0 && !m.graceUsed).length;
  const graceCount = stream.monthlyTimeline.filter((m) => m.graceUsed).length;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm">{title}</p>
        <Badge variant={stream.streak >= 24 ? "default" : "secondary"}>{stream.streak}/24 months</Badge>
      </div>
      {graceCount > 0 && (
        <p className="text-xs text-amber-600 mb-2">
          {graceCount} grace {graceCount === 1 ? "month" : "months"} used — up to 2 per calendar year.
        </p>
      )}
      {missedNoGrace > 0 && (
        <p className="text-xs text-muted-foreground mb-2">
          {missedNoGrace} {missedNoGrace === 1 ? "month" : "months"} missed without grace — this can reset the streak.
        </p>
      )}
      <div className="max-h-48 overflow-y-auto divide-y">
        {stream.monthlyTimeline.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No months to show yet.</p>
        ) : (
          stream.monthlyTimeline.map((entry) => <MonthRow key={entry.monthKey} entry={entry} />)
        )}
      </div>
    </div>
  );
}

export function FellowshipPillarCDetailDialog({
  open,
  onOpenChange,
  careSignal,
  cpd,
}: FellowshipPillarCDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pillar 3: Care Signal & CPD — detail</DialogTitle>
          <DialogDescription>
            Both streams need their own 24-month streak. Each gets up to 2 grace months per
            calendar year, independently — using a grace on one doesn't affect the other.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <StreamTimeline title="Care Signal" stream={careSignal} />
          <StreamTimeline title="CPD" stream={cpd} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
