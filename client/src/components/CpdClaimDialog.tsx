import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Check, Clock, Copy, ExternalLink, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CpdClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendeeId: number;
  eventId: number;
  eventName: string;
  cpdCode: string;
  userEmail: string;
  approvingCouncil?: string | null;
  cpdPoints?: string | number | null;
}

interface CpdCanvasProps {
  code: string;
  userEmail: string;
}

export function CpdCodeCanvas({ code, userEmail }: CpdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background texture to resist OCR
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0"; // slate-200
    ctx.lineWidth = 1;
    for (let x = 10; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 5, canvas.height);
      ctx.stroke();
    }
    for (let y = 10; y < canvas.height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y + (Math.random() - 0.5) * 5);
      ctx.stroke();
    }

    // Draw faint user watermark diagonally
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 15); // subtle rotation
    ctx.font = "italic bold 9px sans-serif";
    ctx.fillStyle = "rgba(100, 116, 139, 0.15)"; // faint slate-500
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const dateStr = new Date().toLocaleDateString("en-KE");
    const watermarkText = `Matched: ${userEmail} | ${dateStr}`;
    ctx.fillText(watermarkText, 0, -22);
    ctx.fillText(watermarkText, 0, 0);
    ctx.fillText(watermarkText, 0, 22);
    ctx.restore();

    // Draw NCK CPD Code with bold/security font style
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw text shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillText(code, canvas.width / 2, canvas.height / 2);
  }, [code, userEmail]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={80}
      className="mx-auto block border border-slate-200 rounded bg-slate-50 shadow-inner select-none pointer-events-none"
      style={{ userSelect: "none", pointerEvents: "none" }}
    />
  );
}

export default function CpdClaimDialog({
  open,
  onOpenChange,
  attendeeId,
  eventId,
  eventName,
  cpdCode,
  userEmail,
  approvingCouncil,
  cpdPoints,
}: CpdClaimDialogProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logRevealMutation = trpc.cpd.logCpdCodeReveal.useMutation({
    onSuccess: () => {
      setRevealed(true);
      setTimeLeft(60);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reveal code. Please try again.");
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (revealed && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setRevealed(false);
      setCopied(false);
      setTimeLeft(60);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [revealed, timeLeft]);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setRevealed(false);
      setCopied(false);
      setTimeLeft(60);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [open]);

  const handleReveal = () => {
    logRevealMutation.mutate({ attendeeId, eventId });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cpdCode);
      setCopied(true);
      toast.success("CPD Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code to clipboard.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Claim CPD Points</DialogTitle>
          <DialogDescription className="font-medium text-slate-700">
            {eventName}
          </DialogDescription>
          {cpdPoints && (
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 bg-cyan-50/20 text-xs py-0.5">
                {approvingCouncil ? `${approvingCouncil} Approved` : "CPD Approved"}: {cpdPoints} Points
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instructions */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-600">
            <h4 className="font-semibold text-slate-800 mb-2">Instructions to Claim Points:</h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>
                Log into the{" "}
                <a
                  href="https://osp.nckenya.go.ke/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center font-semibold"
                >
                  NCK OSP Portal <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                Click on <span className="font-semibold text-slate-800">&quot;Login to view courses&quot;</span> to access the Education Portal.
              </li>
              <li>
                Select <span className="font-semibold text-slate-800">&quot;Add Live Event&quot;</span>.
              </li>
              <li>
                Reveal the secret code below and enter it in the portal.
              </li>
              <li>
                Click <span className="font-semibold text-slate-800">&quot;Submit&quot;</span> to validate your CPD points.
              </li>
            </ol>
          </div>

          <details className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 text-sm text-slate-700">
            <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
              How to claim CPD points for a live event or webinar through the NCK Portal
            </summary>
            <div className="mt-3 space-y-4">
              <p className="text-xs text-slate-600">
                Use this workflow when claiming points for a live Paeds Resus event or webinar through the NCK Online Services Portal and WCEA education portal.
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed">
                <li>Open Google Chrome and go to <a href="https://osp.nckenya.go.ke/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">osp.nckenya.go.ke <ExternalLink className="inline h-3 w-3" /></a>, the NCK Online Services Portal.</li>
                <li>Select the NCK Portal and sign in with your NCK username and password.</li>
                <li>Click the red <span className="font-semibold">View Courses</span> icon to open the WCEA portal. If you see the NCK logo after signing in, click that logo.</li>
                <li>Open the menu using the three horizontal lines at the top right, then select <span className="font-semibold">Live events</span>.</li>
                <li>Enter the four-character secret code provided during the webinar or sent to your personal email, select <span className="font-semibold">Validate</span>, and then select <span className="font-semibold">Save</span>.</li>
                <li>Complete the evaluation form that appears before claiming the CPD points.</li>
                <li>Open the menu, select <span className="font-semibold">Certificates</span>, and export your CPD summary report.</li>
                <li>Return to the initial NCK page and open <span className="font-semibold">CPD</span> to access the downloads.</li>
                <li>Select the blue <span className="font-semibold">Self-Reporting Tool</span>, then select the green <span className="font-semibold">Self-Reporting</span> button.</li>
                <li>Under <span className="font-semibold">Event Category</span>, select <span className="font-semibold">Accredited online CPD activities/programs</span> (the second-last option).</li>
                <li>Under <span className="font-semibold">Event attended</span>, select <span className="font-semibold">Online or Webinar or Conference</span>.</li>
                <li>Enter the event location, such as <span className="font-semibold">KNH</span> or <span className="font-semibold">Virtual</span>, and enter the date you attended the online CME.</li>
                <li>Upload the CPD summary report exported earlier as evidence, then select <span className="font-semibold">Submit for verification</span>.</li>
                <li>After successful submission, the application should show <span className="font-semibold">Application created successfully</span> and <span className="font-semibold">CPD claim submitted successfully</span>. The event will appear in your Education Tracker through the WCEA menu.</li>
              </ol>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                NCK processing may take up to 48 working hours before the CPD points appear.
              </div>
            </div>
          </details>

          {/* Reveal Code Panel */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[140px]">
            {!revealed ? (
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500 max-w-sm">
                  To prevent unauthorized sharing, the CPD code is rendered securely and will hide after 60 seconds.
                </p>
                <Button onClick={handleReveal} disabled={logRevealMutation.isPending} size="sm">
                  {logRevealMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revealing...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Reveal CPD Code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <CpdCodeCanvas code={cpdCode} userEmail={userEmail} />
                
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs flex items-center gap-1.5"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  Code will hide in {timeLeft} seconds
                </div>

                <Alert variant="destructive" className="bg-amber-50/50 border-amber-200 text-amber-800 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-xs font-semibold text-amber-900 leading-tight">Security Alert</AlertTitle>
                  <AlertDescription className="text-[11px] text-amber-700 leading-normal">
                    This code is registered to your email. Sharing it is monitored by Consolata Hospital Mathari and NCK. Watermarked screenshots identify leaks.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-slate-500"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => window.open("https://osp.nckenya.com/", "_blank")}
            className="w-full sm:w-auto"
          >
            Go to NCK OSP Portal
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
