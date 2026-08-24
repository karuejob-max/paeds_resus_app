import { useMemo, useState } from "react";
import { MapPin, PackageCheck, QrCode, ScanLine, Siren } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import ProviderIersTargetedReportCard from "@/components/ProviderIersTargetedReportCard";
import { toast } from "sonner";

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProviderIersActivationCaseContext({ activationEventId }: { activationEventId: number }) {
  const [, setLocation] = useLocation();
  const [witnessProviderId, setWitnessProviderId] = useState("");
  const utils = trpc.useUtils();
  const caseQuery = trpc.iers.getMyActivationCase.useQuery({ activationEventId }, { refetchInterval: 5_000, retry: 1 });
  const generateQr = trpc.iers.generateCaseQr.useMutation({
    onSuccess: async () => {
      toast.success("Case QR ready. Show it to arriving ERT members.");
      await utils.iers.getMyActivationCase.invalidate({ activationEventId });
    },
    onError: (error) => toast.error(error.message || "The case QR could not be generated."),
  });
  const recordArrival = trpc.iers.recordActivationArrival.useMutation({
    onSuccess: async () => {
      toast.success("Team-member arrival recorded.");
      setWitnessProviderId("");
      await utils.iers.getMyActivationCase.invalidate({ activationEventId });
    },
    onError: (error) => toast.error(error.message || "The team-member arrival could not be recorded."),
  });
  const markResourceArrived = trpc.iers.markActivationResourceArrived.useMutation({
    onSuccess: async () => {
      toast.success("Resource arrival recorded.");
      await utils.iers.getMyActivationCase.invalidate({ activationEventId });
    },
    onError: (error) => toast.error(error.message || "The resource arrival could not be recorded."),
  });
  const claimResource = trpc.iers.claimActivationResource.useMutation({
    onSuccess: async () => {
      toast.success("Resource claim recorded.");
      await utils.iers.getMyActivationCase.invalidate({ activationEventId });
    },
    onError: (error) => toast.error(error.message || "The resource could not be claimed."),
  });

  const caseData = caseQuery.data;
  const arrivedProviderIds = new Set(caseData?.arrivals.map((arrival) => arrival.providerUserId) ?? []);
  const canWitnessArrival = Boolean(caseData?.myAtSceneAt) || ["utl", "ertl"].includes(caseData?.myRoleScope ?? "");
  const qrValue = useMemo(() => caseData?.caseToken ? `${window.location.origin}/resus?caseToken=${encodeURIComponent(caseData.caseToken)}&activationId=${activationEventId}` : null, [activationEventId, caseData?.caseToken]);
  if (caseQuery.isLoading || caseQuery.isError || !caseData) return null;

  return (
    <Card className="border-red-300 bg-red-50/40 shadow-sm">
      <CardHeader className="border-b border-red-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-red-950"><Siren className="h-5 w-5 text-red-700" />Active resuscitation case</CardTitle>
        <CardDescription className="text-red-900/75">This case links the ERT arrival record and targeted role reports to the same activation. Do not enter patient identifiers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="rounded-lg border border-red-100 bg-white p-3 text-sm">
          <p className="font-semibold text-slate-950">{statusLabel(caseData.activationType)} · {statusLabel(caseData.status)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600"><MapPin className="h-3 w-3" />{caseData.location}{caseData.bedNumber ? ` · Bed ${caseData.bedNumber}` : ""}{caseData.department ? ` · ${caseData.department}` : ""}</p>
        </div>
        {qrValue ? (
          <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="mx-auto rounded-lg bg-white p-3"><QRCodeSVG value={qrValue} size={190} includeMargin aria-label="Activation case QR" /></div>
            <div className="space-y-2 text-sm"><p className="font-semibold text-slate-950">Case QR ready</p><p className="text-xs text-slate-600">Show this code to each arriving ERT member. They should scan it from their signed-in account; scanning records their arrival against this case.</p><Button type="button" variant="outline" className="w-full" onClick={() => setLocation("/activation-scan")}><ScanLine className="mr-2 h-4 w-4" />Open scanner</Button></div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-red-200 bg-white p-4 text-center"><QrCode className="mx-auto h-7 w-7 text-red-700" /><p className="mt-2 text-sm font-semibold text-slate-950">{caseData.caseQrAvailable ? "Case QR is active" : "Case QR not generated yet"}</p><p className="mt-1 text-xs text-slate-600">{caseData.caseQrAvailable ? "Use Scan case QR to join this resuscitation and record your arrival." : "The first provider who has started responding can create the case QR from ResusGPS."}</p>{caseData.caseQrAvailable ? <Button type="button" className="mt-3 bg-red-600 text-white hover:bg-red-700" onClick={() => setLocation("/activation-scan")}>Scan case QR</Button> : <Button type="button" className="mt-3 bg-red-600 text-white hover:bg-red-700" onClick={() => generateQr.mutate({ activationEventId })} disabled={generateQr.isPending}>{generateQr.isPending ? "Preparing QR…" : "Generate case QR"}</Button>}</div>
        )}
        {caseData.resources.length > 0 && (
          <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-950">Resources needed</p><Badge variant="outline" className="border-red-200 text-red-800">Keep visible until arrived</Badge></div>{caseData.resources.map((resource) => <div key={resource.id} className="flex items-center justify-between gap-3 rounded-md border bg-white p-3"><div className="min-w-0"><p className="text-sm font-medium text-slate-900">{resource.label} <span className="text-xs text-slate-500">×{resource.quantity}</span></p><p className="text-xs text-slate-500">{statusLabel(resource.status)}{resource.note ? ` · ${resource.note}` : ""}</p></div>{resource.status === "needed" && <Button type="button" size="sm" onClick={() => claimResource.mutate({ resourceId: resource.id })} disabled={claimResource.isPending}><PackageCheck className="mr-1 h-4 w-4" />I’ll bring this</Button>}{resource.status === "claimed" && (resource.claimedByMe || ["utl", "ertl"].includes(caseData.myRoleScope ?? "")) && <Button type="button" size="sm" variant="outline" onClick={() => markResourceArrived.mutate({ resourceId: resource.id })} disabled={markResourceArrived.isPending}>Mark arrived</Button>}</div>)}</div>
        )}
        {caseData.caseLinked && canWitnessArrival && caseData.teamMembers.some((member) => !arrivedProviderIds.has(member.providerUserId)) ? <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"><p className="text-sm font-semibold text-slate-950">Record another ERT member at scene</p><p className="text-xs text-slate-600">Use this only when you have personally received the member at the resuscitation location.</p><div className="flex flex-col gap-2 sm:flex-row"><select className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" value={witnessProviderId} onChange={(event) => setWitnessProviderId(event.target.value)}><option value="">Choose arriving member</option>{caseData.teamMembers.filter((member) => !arrivedProviderIds.has(member.providerUserId)).map((member) => <option key={member.providerUserId} value={member.providerUserId}>{member.providerName} · {member.roleKey}</option>)}</select><Button type="button" size="sm" disabled={!witnessProviderId || recordArrival.isPending} onClick={() => recordArrival.mutate({ activationEventId, providerUserId: Number(witnessProviderId), arrivalType: "witnessed" })}>Record arrival</Button></div></div> : null}
        {caseData.caseLinked && caseData.teamId && caseData.assignmentId ? <ProviderIersTargetedReportCard teamId={caseData.teamId} assignmentId={caseData.assignmentId} /> : null}
      </CardContent>
    </Card>
  );
}
