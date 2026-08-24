import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ArrowLeft, Camera, CheckCircle2, QrCode, RefreshCcw } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function extractCaseToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, window.location.origin);
    return url.searchParams.get("caseToken") ?? trimmed;
  } catch {
    return trimmed;
  }
}

export default function ProviderActivationQrScanner() {
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const joinByCaseQr = trpc.iers.joinByCaseQr.useMutation({
    onSuccess: (result) => {
      controlsRef.current?.stop();
      setScanning(false);
      toast.success("Case joined. Your arrival has been recorded.");
      setLocation(`/resus?activationId=${result.activationEventId}`);
    },
    onError: (error) => {
      setCameraError(error.message || "This QR could not join an activation case.");
    },
  });

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    const start = async () => {
      if (!videoRef.current) return;
      try {
        controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (cancelled || joinByCaseQr.isPending || !result) return;
          const token = extractCaseToken(result.getText());
          if (token) joinByCaseQr.mutate({ caseToken: token });
        });
      } catch (error) {
        if (!cancelled) {
          setCameraError(error instanceof Error ? error.message : "Camera scanning is unavailable. Use the manual case token below.");
          setScanning(false);
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, []);

  const submitManual = () => {
    const token = extractCaseToken(manualToken);
    if (!token) {
      setCameraError("Paste or enter the case QR link or token first.");
      return;
    }
    joinByCaseQr.mutate({ caseToken: token });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 pb-20 sm:py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => setLocation("/my-shift?tab=respond")}>
          <ArrowLeft className="h-4 w-4" /> Back to My Shift
        </Button>
        <Card className="overflow-hidden border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-100">
            <CardTitle className="flex items-center gap-2 text-red-950"><QrCode className="h-5 w-5" /> Join active resuscitation</CardTitle>
            <CardDescription className="text-red-900/75">Scan the case QR shown in ResusGPS on the phone of the first responding provider. This links your arrival to the same activation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="overflow-hidden rounded-xl bg-slate-950 aspect-square">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label="Activation case QR camera" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {scanning ? <><Camera className="h-4 w-4 text-red-600" /> Point the camera at the case QR.</> : <><RefreshCcw className="h-4 w-4" /> Camera is not scanning.</>}
            </div>
            {cameraError ? <Alert variant="destructive"><AlertDescription>{cameraError}</AlertDescription></Alert> : null}
            {joinByCaseQr.isSuccess ? <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Case joined successfully. Opening ResusGPS…</AlertDescription></Alert> : null}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Camera unavailable?</p>
              <Input value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="Paste the case QR link or token" autoComplete="off" />
              <Button type="button" className="w-full" onClick={submitManual} disabled={joinByCaseQr.isPending}>
                {joinByCaseQr.isPending ? "Joining case…" : "Join with case link"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-500">Only an authenticated, active member assigned to the activation can join its case QR.</p>
      </div>
    </div>
  );
}
