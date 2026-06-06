import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
  type FeedbackContextJson,
} from "@shared/platform-feedback";

export function FeedbackDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultCategory = "other",
  contextJson,
  trigger,
  triggerClassName,
  hideTrigger,
  compact,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultCategory?: FeedbackCategory;
  contextJson?: FeedbackContextJson;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  hideTrigger?: boolean;
  compact?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [message, setMessage] = useState("");
  const [submittedRef, setSubmittedRef] = useState<number | null>(null);

  const resolvedContext: FeedbackContextJson = {
    pageUrl:
      contextJson?.pageUrl ??
      (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"),
    ...contextJson,
  };

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setSubmittedRef(null);
    }
  }, [open, defaultCategory]);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        setSubmittedRef(res.ticketId);
        setMessage("");
        toast.success(`Thank you — reference #${res.ticketId}`);
      } else toast.error(res.error ?? "Could not submit feedback");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="link" size="sm" className={cn("text-xs h-auto p-0", triggerClassName, compact && "text-[11px]")}>
              <MessageSquarePlus className="w-3 h-3 mr-1 inline" />
              Send feedback
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>Courses, ResusGPS, Care Signal, payments, or safety concerns.</DialogDescription>
        </DialogHeader>
        {submittedRef ? (
          <div className="py-4 text-center">
            <p className="font-medium">Thank you — reference #{submittedRef}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{FEEDBACK_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message…" />
            </div>
            <DialogFooter>
              <Button
                disabled={message.trim().length < 10 || submitMutation.isPending}
                onClick={() => submitMutation.mutate({ category, message: message.trim(), contextJson: resolvedContext })}
              >
                {submitMutation.isPending ? "Sending…" : "Submit feedback"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
