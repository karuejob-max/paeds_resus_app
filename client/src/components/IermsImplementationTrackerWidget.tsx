import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, PlayCircle, Award, Compass } from "lucide-react";
import { toast } from "sonner";

interface IermsImplementationTrackerWidgetProps {
  institutionId: number;
}

export function IermsImplementationTrackerWidget({ institutionId }: IermsImplementationTrackerWidgetProps) {
  const utils = trpc.useUtils();

  const { data: tracker, isLoading } = trpc.institution.getImplementationTracker.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const updatePhaseMutation = trpc.institution.updateImplementationTrackerPhase.useMutation({
    onSuccess: () => {
      toast.success("Implementation status updated!");
      void utils.institution.getImplementationTracker.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to update phase"),
  });

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground text-sm">Loading Implementation Tracker...</div>;
  }

  const phases = [
    {
      key: "phase1MouStatus" as const,
      title: "Phase 1: Foundation & Baseline Audit",
      timeline: "Days 1 – 15",
      desc: "Executive MOU sign-off, ERC establishment, and baseline 100-Point Audit.",
      status: tracker?.phase1MouStatus ?? "pending",
    },
    {
      key: "phase2ErtStatus" as const,
      title: "Phase 2: 24/7 ERT Roster & ResusGPS Bedside Setup",
      timeline: "Days 16 – 45",
      desc: "Pole partitioning, UTL shift allocation, and ResusGPS PWA deployment on ward tablets.",
      status: tracker?.phase2ErtStatus ?? "pending",
    },
    {
      key: "phase3TrainingStatus" as const,
      title: "Phase 3: Workforce Training Mesh & Care Signal Onboarding",
      timeline: "Days 46 – 75",
      desc: "Family-centered ACLS baseline (>75% RNs), PALS/NRP targeted certs, and Care Signal activation.",
      status: tracker?.phase3TrainingStatus ?? "pending",
    },
    {
      key: "phase4AuditStatus" as const,
      title: "Phase 4: Certification Audit & Continuous QI Cadence",
      timeline: "Days 76 – 90+",
      desc: "Final accreditation audit sign-off, annual certificate issuance, and 30-day FPKB QI cadence.",
      status: tracker?.phase4AuditStatus ?? "pending",
    },
  ];

  function getStatusBadge(status: string) {
    if (status === "completed") return <Badge className="bg-emerald-600 font-semibold">Completed</Badge>;
    if (status === "in_progress") return <Badge className="bg-amber-600 font-semibold">In Progress</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
  }

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            90-Day IERMS™ Onboarding & Accreditation Playbook
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            Operational Stepper
          </Badge>
        </div>
        <CardDescription>
          Guided roadmap for transforming hospital acute care into an IERMS™ Certified High-Reliability Facility.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-4">
          {phases.map((p, idx) => (
            <div
              key={p.key}
              className={`p-4 rounded-lg border transition-all ${
                p.status === "completed"
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : p.status === "in_progress"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-border/60 bg-background"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">{p.timeline}</span>
                {getStatusBadge(p.status)}
              </div>
              <h4 className="font-semibold text-sm mb-1">{p.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>

              <div className="flex items-center gap-1 pt-2 border-t">
                {p.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() =>
                      updatePhaseMutation.mutate({
                        institutionId,
                        phase: p.key,
                        status: p.status === "pending" ? "in_progress" : "completed",
                      })
                    }
                  >
                    {p.status === "pending" ? "Start Phase" : "Mark Complete"}
                  </Button>
                )}
                {p.status === "completed" && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
