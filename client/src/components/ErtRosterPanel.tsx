import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, Clock, AlertCircle, Plus, Star, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ErtBillboardWidget } from "./ErtBillboardWidget";

interface ErtRosterPanelProps {
  institutionId: number;
}

/** ISO-8601 week number and year for a given date, used to key the weekly ERTL rotation. */
function getIsoWeek(date: Date): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}

/** Monday..Sunday date range (YYYY-MM-DD) containing the given date. */
function getWeekRange(date: Date): { startDate: string; endDate: string } {
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(monday), endDate: fmt(sunday) };
}

export function ErtRosterPanel({ institutionId }: ErtRosterPanelProps) {
  const utils = trpc.useUtils();
  const [selectedPoleId, setSelectedPoleId] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | "night">("morning");
  const [newPoleName, setNewPoleName] = useState("");
  const [showNewPoleForm, setShowNewPoleForm] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [showNewDeptForm, setShowNewDeptForm] = useState(false);
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const targetDateObj = new Date(selectedDate);
  const { weekNumber, year } = getIsoWeek(targetDateObj);
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange(targetDateObj);

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
      shiftDate: selectedDate,
      shiftType: selectedShift,
    },
    { enabled: !!institutionId && !!activePoleId }
  );

  const { data: weeklyRotation } = trpc.institution.getWeeklyErtlRotation.useQuery(
    { institutionId, poleId: activePoleId ?? 0, weekNumber, year },
    { enabled: !!institutionId && !!activePoleId }
  );

  const createPoleMutation = trpc.institution.createFacilityPole.useMutation({
    onSuccess: (result) => {
      toast.success("Facility Pole created!");
      setNewPoleName("");
      setShowNewPoleForm(false);
      void utils.institution.getFacilityPoles.invalidate({ institutionId });
      setSelectedPoleId(result.poleId);
    },
    onError: (err) => toast.error(err.message || "Failed to create pole"),
  });

  const assignDeptMutation = trpc.institution.assignDepartmentToPole.useMutation({
    onSuccess: () => {
      toast.success("Department added to this pole!");
      setNewDeptName("");
      setShowNewDeptForm(false);
      void utils.institution.getFacilityDepartments.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to add department"),
  });

  const setErtlMutation = trpc.institution.setWeeklyErtlRotation.useMutation({
    onSuccess: () => {
      toast.success("This week's ERTL department updated!");
      void utils.institution.getWeeklyErtlRotation.invalidate({ institutionId, poleId: activePoleId ?? 0, weekNumber, year });
    },
    onError: (err) => toast.error(err.message || "Failed to update weekly ERTL"),
  });

  const submitRosterMutation = trpc.institution.submitShiftUtlRoster.useMutation({
    onSuccess: () => {
      toast.success("Shift UTL updated!");
      void refetchRoster();
    },
    onError: (err) => toast.error(err.message || "Failed to update UTL"),
  });

  const signOffMutation = trpc.institution.signOffShiftReadiness.useMutation({
    onSuccess: () => {
      toast.success("Readiness checked in and signed off!");
      void refetchRoster();
    },
    onError: (err) => toast.error(err.message || "Failed to sign off readiness"),
  });

  if (polesLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading ERT Roster Matrix...</div>;
  }

  const poleList = poles ?? [];
  const poleDepartments = departments?.filter((d) => d.poleId === activePoleId) ?? [];
  const ertlDepartmentId = weeklyRotation?.departmentId ?? null;

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

            {/* Date and Shift Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Date:</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 text-xs w-[140px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Shift:</span>
                <Select value={selectedShift} onValueChange={(val: any) => setSelectedShift(val)}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Geographic Pole Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Facility Zone:</span>
            {poleList.length === 0 && !showNewPoleForm && (
              <span className="text-xs text-muted-foreground italic mr-2">No poles set up yet.</span>
            )}
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
            {showNewPoleForm ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newPoleName}
                  onChange={(e) => setNewPoleName(e.target.value)}
                  placeholder="Pole name, e.g. East Wing"
                  className="h-8 w-48 text-xs"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!newPoleName.trim() || createPoleMutation.isPending}
                  onClick={() => createPoleMutation.mutate({ institutionId, poleName: newPoleName.trim() })}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewPoleForm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setShowNewPoleForm(true)}>
                <Plus className="w-3.5 h-3.5" />
                New Pole
              </Button>
            )}
          </div>

          {/* ERTL Rotation Rule Notice + this week's assignment */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Weekly ERTL Rotation — week {weekNumber}, {year} ({weekStart} to {weekEnd})
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Within each Pole, departments take weekly turns producing the ERT Team Leader (ERTL). The on-duty UTL from the designated department automatically acts as the Scene Commander for this shift.
              </p>
              {activePoleId && poleDepartments.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-300">This week's ERTL department:</span>
                  <Select
                    value={ertlDepartmentId ? String(ertlDepartmentId) : undefined}
                    onValueChange={(deptId) =>
                      setErtlMutation.mutate({
                        institutionId,
                        poleId: activePoleId,
                        departmentId: parseInt(deptId),
                        weekNumber,
                        year,
                        startDate: weekStart,
                        endDate: weekEnd,
                        ertlUserId: weeklyRotation?.ertlUserId ?? null,
                      })
                    }
                  >
                    <SelectTrigger className="w-[220px] h-8 text-xs bg-white dark:bg-background">
                      <SelectValue placeholder="Not set yet — choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {poleDepartments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={weeklyRotation?.ertlUserId ? String(weeklyRotation.ertlUserId) : "none"}
                    onValueChange={(providerId) => ertlDepartmentId && setErtlMutation.mutate({
                      institutionId,
                      poleId: activePoleId,
                      departmentId: ertlDepartmentId,
                      weekNumber,
                      year,
                      startDate: weekStart,
                      endDate: weekEnd,
                      ertlUserId: providerId === "none" ? null : parseInt(providerId, 10),
                    })}
                  >
                    <SelectTrigger className="w-[220px] h-8 text-xs bg-white dark:bg-background">
                      <SelectValue placeholder="Assign named ERTL provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No named ERTL yet</SelectItem>
                      {staffMembers?.filter((staff) => staff.userId != null).map((staff) => <SelectItem key={staff.userId} value={String(staff.userId)}>{staff.staffName} ({staff.staffRole})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {ertlDepartmentId && <Badge variant={weeklyRotation?.assignmentStatus === "active" ? "default" : "secondary"}>{weeklyRotation?.ertlUserId ? weeklyRotation.assignmentStatus === "pending_acceptance" ? "ERTL acceptance pending" : "ERTL accepted" : "No named ERTL"}</Badge>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERT Billboard Live Widget */}
      <ErtBillboardWidget
        institutionId={institutionId}
        poleId={activePoleId}
        shiftDate={selectedDate}
        shiftType={selectedShift}
        shiftRosters={shiftRosters}
        poleDepartments={poleDepartments}
        staffMembers={staffMembers}
        ertlDepartmentId={ertlDepartmentId}
        onCheckInSuccess={() => void refetchRoster()}
      />

      {/* Shift UTL Roster Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Active ERT Shift Team ({selectedShift.toUpperCase()} - {selectedDate})
            </CardTitle>
            <CardDescription>
              On-duty UTLs representing the departments in this Pole.
            </CardDescription>
          </div>
          {showNewDeptForm ? (
            <div className="flex items-center gap-2">
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Department name"
                className="h-8 w-48 text-xs"
                autoFocus
              />
              <Button
                size="sm"
                className="h-8"
                disabled={!newDeptName.trim() || !activePoleId || assignDeptMutation.isPending}
                onClick={() =>
                  activePoleId &&
                  assignDeptMutation.mutate({ institutionId, poleId: activePoleId, departmentName: newDeptName.trim() })
                }
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowNewDeptForm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
              disabled={!activePoleId}
              onClick={() => setShowNewDeptForm(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Department
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {poleDepartments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              {activePoleId
                ? "No departments in this pole yet — add one above."
                : "Create a pole first, then add its departments."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Shift UTL Nurse</TableHead>
                  <TableHead>ERT Role Designation</TableHead>
                  <TableHead>Shift Readiness Check</TableHead>
                  <TableHead>UTL Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poleDepartments.map((dept) => {
                  const rosterEntry = shiftRosters?.find((r) => r.departmentId === dept.id);
                  const assignedStaff = staffMembers?.find((s) => s.userId === rosterEntry?.utlUserId || s.id === rosterEntry?.utlUserId);
                  const isErtl = dept.id === ertlDepartmentId;

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
                          <Badge className="bg-amber-600 text-white font-bold gap-1">
                            <Star className="w-3 h-3" />
                            ERTL (Team Leader)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-medium">ERT Primary Responder</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rosterEntry?.readinessSignOffAt ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">
                              Sign-Off Complete
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Pending Check-in
                              </Badge>
                              {rosterEntry && rosterEntry.status !== "absent" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() =>
                                    signOffMutation.mutate({
                                      institutionId,
                                      rosterId: rosterEntry.id,
                                    })
                                  }
                                  disabled={signOffMutation.isPending}
                                >
                                  Check In
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rosterEntry ? (
                          <Select
                            value={rosterEntry.status}
                            onValueChange={(statusVal: "active" | "absent" | "completed") => {
                              if (activePoleId) {
                                submitRosterMutation.mutate({
                                  institutionId,
                                  poleId: activePoleId,
                                  departmentId: dept.id,
                                  shiftDate: selectedDate,
                                  shiftType: selectedShift,
                                  utlUserId: rosterEntry.utlUserId,
                                  isShiftErtl: isErtl,
                                  status: statusVal,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          onValueChange={(staffUserId) =>
                            activePoleId &&
                            submitRosterMutation.mutate({
                              institutionId,
                              poleId: activePoleId,
                              departmentId: dept.id,
                              shiftDate: selectedDate,
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
