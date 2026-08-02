import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, Clock, Calendar, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";

interface ErtRosterPanelProps {
  institutionId: number;
}

export function ErtRosterPanel({ institutionId }: ErtRosterPanelProps) {
  const [selectedPoleId, setSelectedPoleId] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | "night">("morning");
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: poles, isLoading: polesLoading } = trpc.institution.getFacilityPoles.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const { data: departments } = trpc.institution.getFacilityDepartments.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const { data: staffMembers } = trpc.institution.getStaffMembers.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const activePoleId = selectedPoleId ?? (poles && poles.length > 0 ? poles[0].id : null);

  const { data: shiftRosters, refetch: refetchRoster } = trpc.institution.getShiftUtlRoster.useQuery(
    {
      institutionId,
      poleId: activePoleId ?? 0,
      shiftDate: todayStr,
      shiftType: selectedShift,
    },
    { enabled: !!institutionId && !!activePoleId }
  );

  const createPoleMutation = trpc.institution.createFacilityPole.useMutation({
    onSuccess: () => {
      toast.success("Facility Pole created!");
    },
  });

  const submitRosterMutation = trpc.institution.submitShiftUtlRoster.useMutation({
    onSuccess: () => {
      toast.success("Shift UTL updated!");
      void refetchRoster();
    },
    onError: (err) => toast.error(err.message || "Failed to update UTL"),
  });

  if (polesLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading ERT Roster Matrix...</div>;
  }

  const poleList = poles && poles.length > 0 ? poles : [{ id: 1, poleName: "Main Pole", description: "Default Hospital Pole" }];

  return (
    <div className="space-y-6">
      {/* Top Banner: Pole Selection & ERTL Department Rotation Notice */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                24/7 ERT Roster Matrix & Shift UTL Allocation
              </CardTitle>
              <CardDescription>
                Shift-by-shift Unit Team Leader (UTL) roster forming the active 6-8 member Emergency Response Team.
              </CardDescription>
            </div>

            {/* Shift Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Shift:</span>
              <Select value={selectedShift} onValueChange={(val: any) => setSelectedShift(val)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning Shift</SelectItem>
                  <SelectItem value="evening">Evening Shift</SelectItem>
                  <SelectItem value="night">Night Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Geographic Pole Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Facility Zone:</span>
            {poleList.map((pole) => (
              <Button
                key={pole.id}
                variant={activePoleId === pole.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPoleId(pole.id)}
                className="gap-2"
              >
                <Shield className="w-3.5 h-3.5" />
                {pole.poleName}
              </Button>
            ))}
          </div>

          {/* ERTL Rotation Rule Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Weekly ERTL Rotation Active Rule
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Within each Pole, departments take weekly turns producing the ERT Team Leader (ERTL). The on-duty UTL from the designated department automatically acts as the Scene Commander for this shift.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift UTL Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Active ERT Shift Team ({selectedShift.toUpperCase()} - {todayStr})
          </CardTitle>
          <CardDescription>
            On-duty UTLs representing the 6-8 departments in this Pole.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Shift UTL Nurse</TableHead>
                <TableHead>ERT Role Designation</TableHead>
                <TableHead>Shift Readiness Check</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(departments && departments.length > 0 ? departments : [
                { id: 101, departmentName: "Paediatric Emergency (Casualty)" },
                { id: 102, departmentName: "Paediatric Medical Ward" },
                { id: 103, departmentName: "Newborn Unit (NBU / NICU)" },
                { id: 104, departmentName: "Maternity / Labour Ward" },
                { id: 105, departmentName: "Main Intensive Care (ICU)" },
                { id: 106, departmentName: "Paediatric Surgical Ward" },
              ]).map((dept, idx) => {
                const rosterEntry = shiftRosters?.find((r) => r.departmentId === dept.id);
                const assignedStaff = staffMembers?.find((s) => s.userId === rosterEntry?.utlUserId || s.id === rosterEntry?.utlUserId);
                const isErtl = idx === 0; // Top department is weekly ERTL lead

                return (
                  <TableRow key={dept.id}>
                    <TableCell className="font-semibold">{dept.departmentName}</TableCell>
                    <TableCell>
                      {assignedStaff ? (
                        <div>
                          <p className="font-medium text-sm">{assignedStaff.staffName}</p>
                          <p className="text-xs text-muted-foreground">{assignedStaff.staffRole} ({assignedStaff.department})</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No UTL assigned yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isErtl ? (
                        <Badge className="bg-amber-600 text-white font-bold">ERTL (Team Leader)</Badge>
                      ) : (
                        <Badge variant="outline" className="font-medium">ERT Primary Responder</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {rosterEntry?.readinessSignOffAt ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">
                          Sign-Off Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Pending Check-in
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        onValueChange={(staffUserId) =>
                          submitRosterMutation.mutate({
                            institutionId,
                            poleId: activePoleId ?? 1,
                            departmentId: dept.id,
                            shiftDate: todayStr,
                            shiftType: selectedShift,
                            utlUserId: parseInt(staffUserId),
                            isShiftErtl: isErtl,
                          })
                        }
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder="Assign UTL Nurse" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers?.map((staff) => (
                            <SelectItem key={staff.id} value={staff.userId ? String(staff.userId) : String(staff.id)}>
                              {staff.staffName} ({staff.staffRole})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
