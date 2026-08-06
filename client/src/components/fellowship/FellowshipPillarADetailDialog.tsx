import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Award } from "lucide-react";

const TEAM_MEMBER_ROLE_LABELS: Record<string, string> = {
  team_member_airway_ventilation: "Airway / Ventilation",
  team_member_compressor_1: "Compressor 1",
  team_member_compressor_2: "Compressor 2",
  team_member_monitor_defib_cpr_coach: "Monitor / Defib / CPR Coach",
  team_member_iv_io_meds: "IV/IO Access & Meds",
  team_member_scribe: "Scribe",
};
const ALL_TEAM_MEMBER_ROLES = Object.keys(TEAM_MEMBER_ROLE_LABELS);
const REQUIRED_TEAM_LEADER_SESSIONS = 3;

type CoursePhase2Status = {
  course: string;
  met: boolean;
  cognitiveComplete: boolean;
  ahaPrecourseComplete: boolean;
  teamLeaderSessionsPassed: number;
  teamMemberRolesCovered: string[];
  grandfathered: boolean;
};

interface FellowshipPillarADetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  microCoursesCompleted: number;
  microCoursesRequired: number;
  phase2Courses: CoursePhase2Status[];
}

const COURSE_LABELS: Record<string, string> = {
  bls: "BLS",
  acls: "ACLS",
  pals: "PALS",
  nrp: "NRP",
};

function StatusRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      {met ? (
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Done
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="h-4 w-4" /> Not yet
        </span>
      )}
    </div>
  );
}

export function FellowshipPillarADetailDialog({
  open,
  onOpenChange,
  microCoursesCompleted,
  microCoursesRequired,
  phase2Courses,
}: FellowshipPillarADetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pillar 1: Courses — detail</DialogTitle>
          <DialogDescription>
            Micro-courses and per-course Phase 2 (online team simulation) status. Team member
            requires one passed session in each of six distinct roles — not just six sessions
            in any role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-1">Fellowship micro-courses</p>
            <p className="text-sm text-muted-foreground">
              {microCoursesCompleted} of {microCoursesRequired} completed
            </p>
          </div>

          <div className="space-y-3">
            {phase2Courses.map((c) => (
              <div key={c.course} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{COURSE_LABELS[c.course] ?? c.course.toUpperCase()}</p>
                  <div className="flex items-center gap-2">
                    {c.grandfathered && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Award className="h-3 w-3" /> Grandfathered
                      </Badge>
                    )}
                    <Badge variant={c.met ? "default" : "secondary"}>{c.met ? "Complete" : "In progress"}</Badge>
                  </div>
                </div>

                {c.grandfathered ? (
                  <p className="text-sm text-muted-foreground">
                    Signed off by a Lead Instructor as completed through physical, in-person training.
                  </p>
                ) : c.course === "bls" ? (
                  <StatusRow label="Cognitive modules" met={c.cognitiveComplete} />
                ) : (
                  <>
                    <StatusRow label="Cognitive modules" met={c.cognitiveComplete} />
                    <StatusRow label="AHA precourse assessment" met={c.ahaPrecourseComplete} />
                    <div className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">Team leader sessions</span>
                      <span
                        className={
                          c.teamLeaderSessionsPassed >= REQUIRED_TEAM_LEADER_SESSIONS
                            ? "text-emerald-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {c.teamLeaderSessionsPassed}/{REQUIRED_TEAM_LEADER_SESSIONS}
                      </span>
                    </div>
                    <div className="pt-2 mt-1 border-t">
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Team member roles ({c.teamMemberRolesCovered.length}/{ALL_TEAM_MEMBER_ROLES.length}) — one
                        session needed in each
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {ALL_TEAM_MEMBER_ROLES.map((role) => {
                          const covered = c.teamMemberRolesCovered.includes(role);
                          return (
                            <div key={role} className="flex items-center justify-between text-xs">
                              <span className={covered ? "" : "text-muted-foreground"}>
                                {TEAM_MEMBER_ROLE_LABELS[role]}
                              </span>
                              {covered ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
