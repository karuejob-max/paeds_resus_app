import { Shield, CheckCircle, Clock, Star, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ErtBillboardWidgetProps {
  poleId: number | null;
  shiftDate: string;
  shiftType: "morning" | "evening" | "night";
  shiftRosters: any[] | undefined;
  poleDepartments: any[];
  staffMembers: any[] | undefined;
  ertlDepartmentId: number | null;
}

export function ErtBillboardWidget({
  poleId,
  shiftDate,
  shiftType,
  shiftRosters,
  poleDepartments,
  staffMembers,
  ertlDepartmentId,
}: ErtBillboardWidgetProps) {
  if (!poleId || poleDepartments.length === 0) {
    return null;
  }

  // Get active roster list
  const activeResponders = poleDepartments.map((dept) => {
    const rosterEntry = shiftRosters?.find((r) => r.departmentId === dept.id);
    const assignedStaff = staffMembers?.find(
      (s) => s.userId != null && s.userId === rosterEntry?.utlUserId
    );
    const isErtl = dept.id === ertlDepartmentId;

    return {
      department: dept.departmentName,
      staff: assignedStaff,
      rosterId: rosterEntry?.id,
      isErtl,
      status: rosterEntry?.status ?? "active",
      assignmentStatus: rosterEntry?.assignmentStatus,
      acceptedAt: rosterEntry?.acceptedAt,
      signedOff: !!rosterEntry?.readinessSignOffAt,
    };
  });

  const teamLeader = activeResponders.find((r) => r.isErtl);
  const primaryResponders = activeResponders.filter((r) => !r.isErtl);

  const signedOffCount = activeResponders.filter((r) => r.staff && r.signedOff).length;
  const totalAssignedCount = activeResponders.filter((r) => r.staff).length;

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl relative">
      <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <CardHeader className="pb-3 border-b border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary-foreground tracking-tight">
              <Shield className="w-5.5 h-5.5 text-primary-foreground animate-pulse" />
              Emergency Response Team (ERT) Billboard
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Live shift view for {shiftDate} ({shiftType.toUpperCase()})
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary-foreground border border-primary/30 py-1 px-2.5 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {signedOffCount}/{totalAssignedCount} Signed Off
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* ERTL Scene Commander Header block */}
        {teamLeader && (
          <div className="relative p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300">
            <div className="absolute top-3 right-3">
              <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-white" />
                ERTL / Scene Commander
              </Badge>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-500 font-bold text-lg shrink-0">
                {teamLeader.staff?.staffName ? teamLeader.staff.staffName[0] : "?"}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs text-amber-500/90 font-bold uppercase tracking-wider">
                  {teamLeader.department}
                </p>
                <h4 className="text-lg font-bold text-slate-100 truncate">
                  {teamLeader.staff?.staffName || "Unassigned"}
                </h4>
                {teamLeader.staff && (
                  <p className="text-xs text-slate-400 truncate">
                    {teamLeader.staff.staffRole} • {teamLeader.staff.department}
                  </p>
                )}
                {teamLeader.staff && teamLeader.status === "absent" && (
                  <Badge variant="destructive" className="mt-1">ABSENT</Badge>
                )}
              </div>

              {teamLeader.staff && teamLeader.status !== "absent" && (
                <div className="flex items-center gap-3">
                  {teamLeader.signedOff ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1 rounded-full font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Ready
                    </Badge>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 gap-1 rounded-full animate-pulse font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {teamLeader.assignmentStatus === "active" && teamLeader.acceptedAt ? "Provider check-in pending" : "Awaiting provider acceptance"}
                      </Badge>
                      <span className="text-[10px] text-slate-500">Provider confirms readiness from the individual portal.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Responders Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            ERT Primary Responders
          </h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {primaryResponders.map((responder, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between gap-3 min-w-0"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-slate-300 font-semibold shrink-0">
                    {responder.staff?.staffName ? responder.staff.staffName[0] : "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-primary/80 font-bold uppercase tracking-wider truncate">
                      {responder.department}
                    </p>
                    <h5 className="font-bold text-sm text-slate-200 truncate">
                      {responder.staff?.staffName || "Unassigned"}
                    </h5>
                    {responder.staff && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {responder.staff.staffRole}
                      </p>
                    )}
                    {responder.staff && responder.status === "absent" && (
                      <Badge variant="destructive" className="mt-1 text-[9px] px-1.5 py-0">ABSENT</Badge>
                    )}
                  </div>
                </div>

                {responder.staff && responder.status !== "absent" && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-[10px] text-slate-500 font-medium">Shift readiness:</span>
                    {responder.signedOff ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1 rounded-full text-[10px] font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 gap-1 rounded-full text-[10px] animate-pulse font-semibold">
                          <Clock className="w-3 h-3" />
                          {responder.assignmentStatus === "active" && responder.acceptedAt ? "Provider check-in pending" : "Awaiting provider acceptance"}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
