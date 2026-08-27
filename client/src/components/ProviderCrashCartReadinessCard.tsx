import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertOctagon, CheckCircle2, ClipboardCheck, WifiOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  enqueueOfflineCommand,
  getOfflineCommand,
  removeOfflineCommand,
  updateOfflineCommand,
  getOfflineSnapshot,
  offlineStoreKeys,
  saveOfflineSnapshot,
} from "@/lib/offline/platformOfflineStore";

type ReadinessShift = {
  id: number;
  institutionId: number;
  departmentName: string;
  poleName: string;
  shiftDate: Date | string;
  shiftType: string;
  isShiftErtl?: boolean | null;
  readinessSignOffAt?: Date | string | null;
};

type CrashCartPayload = {
  institutionId: number;
  shiftRosterId: number;
  department: string;
  auditType: "daily_seal_check";
  cartSealIntact: boolean;
  hasPaedsAirways: boolean;
  hasPaedsBvm: boolean;
  hasIoNeedles: boolean;
  hasPaedsDefibPads: boolean;
  hasPaedsSuction: boolean;
  deficitsFound?: string;
};

function draftId(shiftRosterId: number) {
  return `provider-crash-cart-${shiftRosterId}`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

export default function ProviderCrashCartReadinessCard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [offlineShifts, setOfflineShifts] = useState<ReadinessShift[] | null>(null);
  const [offlineDraft, setOfflineDraft] = useState<CrashCartPayload | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [cartSealIntact, setCartSealIntact] = useState(true);
  const [hasPaedsAirways, setHasPaedsAirways] = useState(true);
  const [hasPaedsBvm, setHasPaedsBvm] = useState(true);
  const [hasIoNeedles, setHasIoNeedles] = useState(true);
  const [hasPaedsDefibPads, setHasPaedsDefibPads] = useState(true);
  const [hasPaedsSuction, setHasPaedsSuction] = useState(true);
  const [deficitsFound, setDeficitsFound] = useState("");

  const readinessQuery = trpc.iers.getMyShiftReadiness.useQuery(undefined, {
    staleTime: 30_000,
    retry: 1,
  });
  const submitAuditMutation = trpc.institution.submitEquipmentAuditLog.useMutation({
    onSuccess: async () => {
      toast.success("Crash-cart check submitted and recorded.");
      if (selectedShiftId) await removeOfflineCommand(draftId(selectedShiftId));
      setOfflineDraft(null);
      setDeficitsFound("");
    },
    onError: (error) => toast.error(error.message || "Could not submit the crash-cart check."),
  });

  const shifts = (readinessQuery.data ?? offlineShifts ?? []) as ReadinessShift[];
  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId) ?? shifts[0] ?? null;

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
    if (!user?.id || !readinessQuery.data) return;
    const savedAt = Date.now();
    void saveOfflineSnapshot({
      key: offlineStoreKeys.providerReadiness(user.id),
      kind: "iers_shift_snapshot",
      aggregateId: String(user.id),
      actorId: user.id,
      version: savedAt.toString(),
      payload: readinessQuery.data,
      savedAt,
      lastServerSyncAt: savedAt,
    });
  }, [readinessQuery.data, user?.id]);

  useEffect(() => {
    if (!user?.id || readinessQuery.data) return;
    let cancelled = false;
    void getOfflineSnapshot<ReadinessShift[]>(offlineStoreKeys.providerReadiness(user.id)).then((snapshot) => {
      if (cancelled || !snapshot?.payload) return;
      setOfflineShifts(snapshot.payload);
    });
    return () => {
      cancelled = true;
    };
  }, [readinessQuery.data, user?.id]);

  useEffect(() => {
    if (!selectedShift) return;
    setSelectedShiftId((current) => current ?? selectedShift.id);
    let cancelled = false;
    void getOfflineCommand<CrashCartPayload>(draftId(selectedShift.id)).then((command) => {
      if (cancelled || !command || command.status === "acknowledged") return;
      setOfflineDraft(command.payload);
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
  }, [selectedShift]);

  const payload = useMemo<CrashCartPayload | null>(() => {
    if (!selectedShift) return null;
    return {
      institutionId: selectedShift.institutionId,
      shiftRosterId: selectedShift.id,
      department: selectedShift.departmentName,
      auditType: "daily_seal_check",
      cartSealIntact,
      hasPaedsAirways,
      hasPaedsBvm,
      hasIoNeedles,
      hasPaedsDefibPads,
      hasPaedsSuction,
      deficitsFound: deficitsFound.trim() || undefined,
    };
  }, [cartSealIntact, deficitsFound, hasIoNeedles, hasPaedsAirways, hasPaedsBvm, hasPaedsDefibPads, hasPaedsSuction, selectedShift]);

  if (!readinessQuery.isLoading && !readinessQuery.isError && shifts.length === 0) return null;
  if (!selectedShift || !payload) return null;

  const saveOffline = async () => {
    try {
      await enqueueOfflineCommand({
        localEventId: draftId(selectedShift.id),
        aggregateType: "crash_cart_check",
        aggregateId: String(selectedShift.id),
        tenantId: selectedShift.institutionId,
        actorId: user?.id,
        actionType: "review_and_submit_daily_seal_check",
        payload,
        baseVersion: String(selectedShift.readinessSignOffAt ?? selectedShift.shiftDate),
        clientCreatedAt: Date.now(),
      });
      await updateOfflineCommand(draftId(selectedShift.id), {
        status: "requires_review",
        lastError: "Offline draft requires an online review and explicit submission.",
      });
      setOfflineDraft(payload);
      toast.success("Crash-cart check saved locally. It is not yet an official audit.");
    } catch {
      toast.error("This device could not save the crash-cart check.");
    }
  };

  const submit = () => {
    if (!isOnline) {
      void saveOffline();
      return;
    }
    submitAuditMutation.mutate(payload);
  };

  return (
    <Card className="border-amber-200 overflow-hidden">
      <CardHeader className="bg-amber-50 border-b border-amber-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-950 text-base"><ClipboardCheck className="h-5 w-5" />Crash-cart readiness check</CardTitle>
        <CardDescription className="text-amber-900/75">For your assigned UTL/ERTL shift. Check what is physically present before confirming readiness; a missing item remains a visible gap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white p-3 text-sm">
          <div><p className="font-semibold text-slate-900">{selectedShift.departmentName} · {selectedShift.poleName}</p><p className="text-xs text-slate-600">{formatDate(selectedShift.shiftDate)} · {selectedShift.shiftType}{selectedShift.isShiftErtl ? " · ERTL" : " · UTL"}</p></div>
          <Badge variant="outline" className="border-amber-300 text-amber-800">Daily seal check</Badge>
        </div>
        {!isOnline && <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><WifiOff className="mt-0.5 h-4 w-4 shrink-0" /><span>Offline draft only. No ERCo/QI notification or official readiness status is created until an online submission is accepted.</span></div>}
        {offlineDraft && <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900"><AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" /><span>There is a local draft for this shift. Review the checklist before submitting it when connected.</span></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Check label="Crash cart seal numbered and intact" checked={cartSealIntact} onChange={setCartSealIntact} />
          <Check label="Paediatric airways and ETT range" checked={hasPaedsAirways} onChange={setHasPaedsAirways} />
          <Check label="Infant and paediatric BVM with reservoir" checked={hasPaedsBvm} onChange={setHasPaedsBvm} />
          <Check label="IO needles and driver" checked={hasIoNeedles} onChange={setHasIoNeedles} />
          <Check label="Paediatric defibrillator pads and cables" checked={hasPaedsDefibPads} onChange={setHasPaedsDefibPads} />
          <Check label="Yankauer and paediatric suction catheters" checked={hasPaedsSuction} onChange={setHasPaedsSuction} />
        </div>
        <div className="space-y-2"><Label htmlFor={`provider-deficits-${selectedShift.id}`}>Gaps or restock notes</Label><Textarea id={`provider-deficits-${selectedShift.id}`} value={deficitsFound} onChange={(event) => setDeficitsFound(event.target.value)} placeholder="Record missing, damaged, or expired items. Do not enter patient identifiers." rows={2} /></div>
        <Button type="button" onClick={submit} disabled={submitAuditMutation.isPending} className="bg-amber-700 text-white hover:bg-amber-800">{isOnline ? <><CheckCircle2 className="mr-2 h-4 w-4" />Submit checked readiness</> : "Save check offline"}</Button>
        <p className="text-xs text-muted-foreground">This check is separate from the shift readiness sign-off. Only the server-confirmed audit can trigger the institutional action/QI pathway.</p>
      </CardContent>
    </Card>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = `crash-cart-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className="flex items-center gap-2"><Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} /><Label htmlFor={id} className="cursor-pointer text-xs text-slate-800">{label}</Label></div>;
}
