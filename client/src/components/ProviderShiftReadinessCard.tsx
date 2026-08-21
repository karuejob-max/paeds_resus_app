import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProviderShiftReadinessCard() {
  const utils = trpc.useUtils();
  const [notesByShift, setNotesByShift] = useState<Record<number, string>>({});
  const shiftQuery = trpc.iers.getMyShiftReadiness.useQuery(undefined, { staleTime: 30_000, retry: 1 });
  const signOff = trpc.iers.signOffShiftReadiness.useMutation({
    onSuccess: async () => {
      toast.success("Shift readiness sign-off recorded.");
      await utils.iers.getMyShiftReadiness.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not record shift readiness."),
  });

  if (shiftQuery.isLoading || shiftQuery.isError || !shiftQuery.data?.length) return null;

  return (
    <Card className="border-blue-200 overflow-hidden">
      <CardHeader className="bg-blue-50 border-b border-blue-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
          <ClipboardCheck className="h-5 w-5" />
          My Shift Readiness
        </CardTitle>
        <CardDescription className="text-blue-800/80">
          If you are the assigned UTL/ERTL, confirm your shift’s people, equipment, escalation route, and handover before accepting readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {shiftQuery.data.map((shift) => {
          const signedOff = Boolean(shift.readinessSignOffAt);
          return (
            <div key={shift.id} className="rounded-lg border border-blue-100 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{shift.departmentName}</p>
                  <p className="text-xs text-slate-600 mt-1">{shift.poleName} · {new Date(shift.shiftDate).toLocaleDateString()} · {label(shift.shiftType)}</p>
                  {shift.isShiftErtl && <p className="text-xs text-blue-700 mt-1">You are also the shift ERTL.</p>}
                </div>
                <Badge variant="outline" className={signedOff ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}>
                  {signedOff ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock3 className="h-3 w-3 mr-1" />}
                  {signedOff ? "Signed off" : "Pending"}
                </Badge>
              </div>
              {!signedOff && (
                <>
                  <Textarea
                    value={notesByShift[shift.id] ?? ""}
                    onChange={(event) => setNotesByShift((current) => ({ ...current, [shift.id]: event.target.value }))}
                    rows={2}
                    placeholder="Optional: note any gap, backup arrangement, or handover detail"
                  />
                  <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-md p-2">
                    <ShieldAlert className="h-4 w-4 text-blue-700 shrink-0" />
                    <span>Only sign off what you have actually checked. If a critical item is missing, record the gap instead of confirming readiness.</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    disabled={signOff.isPending}
                    onClick={() => signOff.mutate({ shiftRosterId: shift.id, note: notesByShift[shift.id]?.trim() || undefined })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm shift readiness
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
