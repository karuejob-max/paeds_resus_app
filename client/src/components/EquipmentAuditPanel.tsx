import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, AlertOctagon, CheckCircle2, ShieldAlert, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  enqueueOfflineCommand,
  getOfflineCommand,
  removeOfflineCommand,
  updateOfflineCommand,
} from "@/lib/offline/platformOfflineStore";

interface EquipmentAuditPanelProps {
  institutionId: number;
}

type EquipmentAuditPayload = {
  institutionId: number;
  department: string;
  auditType: "daily_seal_check" | "monthly_100_percent";
  cartSealIntact: boolean;
  hasPaedsAirways: boolean;
  hasPaedsBvm: boolean;
  hasIoNeedles: boolean;
  hasPaedsDefibPads: boolean;
  hasPaedsSuction: boolean;
  deficitsFound?: string;
};

function draftId(institutionId: number, department: string, auditType: string) {
  return `crash-cart-audit-${institutionId}-${auditType}-${department}`;
}

export function EquipmentAuditPanel({ institutionId }: EquipmentAuditPanelProps) {
  const utils = trpc.useUtils();
  const [department, setDepartment] = useState("Paediatric Medical Ward");
  const [auditType, setAuditType] = useState<"daily_seal_check" | "monthly_100_percent">("daily_seal_check");
  
  const [cartSealIntact, setCartSealIntact] = useState(true);
  const [hasPaedsAirways, setHasPaedsAirways] = useState(true);
  const [hasPaedsBvm, setHasPaedsBvm] = useState(true);
  const [hasIoNeedles, setHasIoNeedles] = useState(true);
  const [hasPaedsDefibPads, setHasPaedsDefibPads] = useState(true);
  const [hasPaedsSuction, setHasPaedsSuction] = useState(true);
  const [deficitsFound, setDeficitsFound] = useState("");
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [offlineDraft, setOfflineDraft] = useState<EquipmentAuditPayload | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const currentDraftId = draftId(institutionId, department, auditType);

  useEffect(() => {
    const refreshOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", refreshOnline);
    window.addEventListener("offline", refreshOnline);
    return () => {
      window.removeEventListener("online", refreshOnline);
      window.removeEventListener("offline", refreshOnline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getOfflineCommand<EquipmentAuditPayload>(currentDraftId).then((command) => {
      if (cancelled || !command || command.status === "acknowledged") return;
      setOfflineDraft(command.payload);
      setDepartment(command.payload.department);
      setAuditType(command.payload.auditType);
      setCartSealIntact(command.payload.cartSealIntact);
      setHasPaedsAirways(command.payload.hasPaedsAirways);
      setHasPaedsBvm(command.payload.hasPaedsBvm);
      setHasIoNeedles(command.payload.hasIoNeedles);
      setHasPaedsDefibPads(command.payload.hasPaedsDefibPads);
      setHasPaedsSuction(command.payload.hasPaedsSuction);
      setDeficitsFound(command.payload.deficitsFound ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [currentDraftId]);

  const { data: auditLogs, isLoading } = trpc.institution.getEquipmentAuditLogs.useQuery(
    { institutionId, limit: 30 },
    { enabled: !!institutionId }
  );

  const { data: alertSummary } = trpc.institution.getEquipmentDeficitAlerts.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const submitAuditMutation = trpc.institution.submitEquipmentAuditLog.useMutation({
    onSuccess: () => {
      toast.success("Equipment Audit Logged!");
      setDeficitsFound("");
      setOfflineDraft(null);
      void removeOfflineCommand(currentDraftId);
      void utils.institution.getEquipmentAuditLogs.invalidate({ institutionId });
      void utils.institution.getEquipmentDeficitAlerts.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to log equipment audit"),
  });

  const payload: EquipmentAuditPayload = {
    institutionId,
    department,
    auditType,
    cartSealIntact,
    hasPaedsAirways,
    hasPaedsBvm,
    hasIoNeedles,
    hasPaedsDefibPads,
    hasPaedsSuction,
    deficitsFound: deficitsFound.trim() || undefined,
  };

  const saveDraftOffline = async () => {
    setIsSavingDraft(true);
    try {
      await enqueueOfflineCommand({
        localEventId: currentDraftId,
        aggregateType: "crash_cart_check",
        aggregateId: `${institutionId}:${department}:${auditType}`,
        tenantId: institutionId,
        actionType: "review_and_submit_equipment_audit",
        payload,
        clientCreatedAt: Date.now(),
      });
      await updateOfflineCommand(currentDraftId, {
        status: "requires_review",
        lastError: "Offline draft requires an online review and explicit submission.",
      });
      setOfflineDraft(payload);
      toast.success("Crash-cart check saved on this device. Review and submit when online.");
    } catch {
      toast.error("This device could not save the offline crash-cart check.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const submitAudit = () => {
    if (!isOnline) {
      void saveDraftOffline();
      return;
    }
    submitAuditMutation.mutate(payload);
  };

  if (isLoading && isOnline) {
    return <div className="p-6 text-center text-muted-foreground">Loading Equipment Audits...</div>;
  }

  return (
    <div className="space-y-6">
      {!isOnline && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-950">
            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">Offline crash-cart checks remain local</p>
              <p className="mt-1 text-xs text-amber-900/80">You may record what you physically checked. The institution will not be notified and readiness will not be server-confirmed until you are online and submit the reviewed draft.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {offlineDraft && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-blue-950">
            <div>
              <p className="font-semibold">A local crash-cart check is awaiting review</p>
              <p className="mt-1 text-xs text-blue-900/80">It is not yet an official audit and has not triggered an ERCo/QI notification.</p>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={!isOnline || submitAuditMutation.isPending} onClick={submitAudit} className="bg-white">
              {isOnline ? "Review and submit draft" : "Reconnect to submit"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header Deficit Alert Banner if deficits exist */}
      {alertSummary && alertSummary.count > 0 && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-300">
                ACTIVE EQUIPMENT DEFICITS DETECTED ({alertSummary.count} Ward Alerts)
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                Paediatric emergency readiness requires 100% equipment availability across all wards. Missing items automatically create open action items in the QI Action Log.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perform Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Log Ward Physical Readiness & Crash Cart Audit
          </CardTitle>
          <CardDescription>
            Conducted daily by Shift UTLs (cart seal check) and monthly by ER Coordinators (100% paediatric equipment inventory).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Ward / Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paediatric Emergency (Casualty)">Paediatric Emergency (Casualty)</SelectItem>
                  <SelectItem value="Paediatric Medical Ward">Paediatric Medical Ward</SelectItem>
                  <SelectItem value="Newborn Unit (NBU / NICU)">Newborn Unit (NBU / NICU)</SelectItem>
                  <SelectItem value="Maternity / Labour Ward">Maternity / Labour Ward</SelectItem>
                  <SelectItem value="Main Intensive Care (ICU)">Main Intensive Care (ICU)</SelectItem>
                  <SelectItem value="Paediatric Surgical Ward">Paediatric Surgical Ward</SelectItem>
                  <SelectItem value="General Outpatient (OPD)">General Outpatient (OPD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audit Cadence</Label>
              <Select value={auditType} onValueChange={(val: any) => setAuditType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_seal_check">Daily Shift Cart Seal Check</SelectItem>
                  <SelectItem value="monthly_100_percent">Monthly 100% Paediatric Inventory Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="p-4 border rounded-lg space-y-3 bg-secondary/20">
            <p className="font-semibold text-sm">Essential Paediatric Resuscitation Equipment Checklist:</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="seal" checked={cartSealIntact} onCheckedChange={(c) => setCartSealIntact(!!c)} />
                <Label htmlFor="seal" className="text-xs cursor-pointer">Crash Cart Seal Numbered & Intact</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="airways" checked={hasPaedsAirways} onCheckedChange={(c) => setHasPaedsAirways(!!c)} />
                <Label htmlFor="airways" className="text-xs cursor-pointer">ETTs (2.5 - 6.5) & Oral Airways (00-3)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="bvm" checked={hasPaedsBvm} onCheckedChange={(c) => setHasPaedsBvm(!!c)} />
                <Label htmlFor="bvm" className="text-xs cursor-pointer">Infant & Paediatric BVM with Reservoir</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="io" checked={hasIoNeedles} onCheckedChange={(c) => setHasIoNeedles(!!c)} />
                <Label htmlFor="io" className="text-xs cursor-pointer">Intraosseous (IO) Needles & Driver</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="defib" checked={hasPaedsDefibPads} onCheckedChange={(c) => setHasPaedsDefibPads(!!c)} />
                <Label htmlFor="defib" className="text-xs cursor-pointer">Paediatric Defibrillator Pads & Cables</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="suction" checked={hasPaedsSuction} onCheckedChange={(c) => setHasPaedsSuction(!!c)} />
                <Label htmlFor="suction" className="text-xs cursor-pointer">Yankauer & Paediatric Suction Catheters</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deficitsText">Specific Deficits / Restock Notes (Optional)</Label>
            <Textarea
              id="deficitsText"
              value={deficitsFound}
              onChange={(e) => setDeficitsFound(e.target.value)}
              placeholder="Record missing, damaged, or expired items. Do not enter patient identifiers."
              rows={2}
            />
          </div>

          <Button
            onClick={submitAudit}
            disabled={submitAuditMutation.isPending || isSavingDraft}
            className="bg-[#1a4d4d] hover:bg-[#0d3333]"
          >
            {submitAuditMutation.isPending ? "Logging Audit..." : isOnline ? "Log Equipment Audit Record" : "Save Check Offline"}
          </Button>
        </CardContent>
      </Card>

      {/* Audit History Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Equipment Audit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Cadence</TableHead>
                <TableHead>Cart Seal</TableHead>
                <TableHead>Paeds Readiness Status</TableHead>
                <TableHead>Deficits Logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => {
                  const hasDeficit =
                    !log.cartSealIntact ||
                    !log.hasPaedsAirways ||
                    !log.hasPaedsBvm ||
                    !log.hasIoNeedles ||
                    !log.hasPaedsDefibPads ||
                    !log.hasPaedsSuction ||
                    !!log.deficitsFound;

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{new Date(log.auditDate).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">{log.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.auditType === "daily_seal_check" ? "Daily Seal" : "Monthly 100%"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.cartSealIntact ? (
                          <Badge className="bg-emerald-600">Intact</Badge>
                        ) : (
                          <Badge className="bg-red-600">Broken / Missing</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!hasDeficit ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">
                            100% Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
                            Deficit Reported
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                        {log.deficitsFound || (hasDeficit ? "Equipment checklist incomplete" : "None")}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No equipment audit logs submitted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
