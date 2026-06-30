import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Eraser } from "lucide-react";

interface SignaturePadProps {
  /** Existing saved signature (base64 PNG data URL) to preview, if any. */
  initialDataUrl?: string | null;
  /** Called with the trimmed/normalized base64 PNG data URL when the user saves. */
  onSave: (dataUrl: string) => void;
  /** Called when the user clears a previously saved signature (pass null to backend). */
  onClear?: () => void;
  /** Disable buttons while a save mutation is in flight. */
  saving?: boolean;
  width?: number;
  height?: number;
}

/**
 * Lightweight HTML5 canvas signature pad — no external libraries. Supports mouse
 * and touch/pen input, exports a base64 PNG data URL via onSave. Designed for the
 * CNE Coordinator to draw the signature embedded on certificates.
 */
export default function SignaturePad({
  initialDataUrl,
  onSave,
  onClear,
  saving = false,
  width = 460,
  height = 160,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [showingSaved, setShowingSaved] = useState(Boolean(initialDataUrl));

  // Set up the canvas backing store at device-pixel resolution for crisp lines.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0B2447"; // brand navy
  }, [width, height]);

  // Render the previously-saved signature into the canvas as a preview.
  const drawSavedImage = useCallback(
    (dataUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = dataUrl;
    },
    [width, height]
  );

  useEffect(() => {
    setupCanvas();
    if (initialDataUrl) {
      drawSavedImage(initialDataUrl);
      setShowingSaved(true);
    }
    // Re-run only on mount / size change; initialDataUrl handled explicitly below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupCanvas]);

  // If the saved signature arrives/changes after mount, render it (when canvas is empty).
  useEffect(() => {
    if (initialDataUrl && !hasStrokes) {
      drawSavedImage(initialDataUrl);
      setShowingSaved(true);
    }
  }, [initialDataUrl, hasStrokes, drawSavedImage]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    // First stroke after showing a saved image clears the preview to start fresh.
    if (showingSaved) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, width, height);
      setShowingSaved(false);
    }
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointerPos(e);
    setHasStrokes(true);
  };

  const moveStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const p = pointerPos(e);
    const last = lastPointRef.current ?? p;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    ctx?.clearRect(0, 0, width, height);
    setHasStrokes(false);
    setShowingSaved(false);
    onClear?.();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export as PNG (preserves transparency so it sits cleanly above the cert line).
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  const nothingToSave = !hasStrokes && !showingSaved;

  return (
    <div className="space-y-3">
      <div className="inline-block rounded-lg border bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          className="touch-none rounded-lg"
          style={{ width, height, cursor: "crosshair" }}
          onPointerDown={startStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Draw the coordinator&apos;s signature above using a mouse, finger, or stylus. This image is
        embedded on every certificate your institution issues.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={saving}>
          <Eraser className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving || nothingToSave}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save signature
        </Button>
      </div>
    </div>
  );
}
