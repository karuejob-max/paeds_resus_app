import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateId: number;
  courseLabel: string;
  /** Called after feedback is saved successfully; parent should start PDF download. */
  onFeedbackSaved: () => void;
};

export function CertificateDownloadFeedbackDialog({
  open,
  onOpenChange,
  certificateId,
  courseLabel,
  onFeedbackSaved,
}: Props) {
  const [rating, setRating] = useState(5);
  const [improvements, setImprovements] = useState("");

  const submit = trpc.certificates.submitDownloadFeedback.useMutation({
    onSuccess: (r) => {
      if (r.success) {
        toast.success("Thank you — your feedback helps us improve.");
        setImprovements("");
        onOpenChange(false);
        onFeedbackSaved();
      } else {
        toast.error(r.error ?? "Could not save feedback.");
      }
    },
    onError: (e) => toast.error(e.message || "Could not save feedback."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick feedback before download</DialogTitle>
          <DialogDescription>
            Help us improve <span className="font-medium text-foreground">{courseLabel}</span>. After you submit, your certificate PDF will download.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>How valuable was this course for you? ({rating}/5)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={rating === n ? "default" : "outline"}
                  onClick={() => setRating(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="cert-fb-improve">What should we improve?</Label>
            <Textarea
              id="cert-fb-improve"
              className="mt-1 min-h-[100px]"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Content, pacing, exams, or the app — be specific."
            />
            <p className="text-xs text-muted-foreground mt-1">At least 10 characters.</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submit.isPending || improvements.trim().length < 10}
            onClick={() =>
              submit.mutate({
                certificateId,
                rating,
                improvements: improvements.trim(),
              })
            }
          >
            {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit & download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
