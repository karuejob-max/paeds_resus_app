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
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Clock, ExternalLink, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CpdClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendeeId: number;
  eventId: number;
  eventName: string;
  cpdCode: string;
  userEmail: string;
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
}: CpdClaimDialogProps) {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logRevealMutation = trpc.cne.logCpdCodeReveal.useMutation({
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
      setTimeLeft(60);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [open]);

  const handleReveal = () => {
    logRevealMutation.mutate({ attendeeId, eventId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Claim NCK CPD Points</DialogTitle>
          <DialogDescription className="font-medium text-slate-700">
            {eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instructions */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-600">
            <h4 className="font-semibold text-slate-800 mb-2">Instructions to Claim Points:</h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>
                Log into the{" "}
                <a
                  href="https://osp.nckenya.com/"
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
