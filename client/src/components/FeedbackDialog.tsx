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

  FEEDBACK_ISSUE_TYPES,

  FEEDBACK_ISSUE_TYPE_LABELS,

  FEEDBACK_SEVERITIES,

  FEEDBACK_SEVERITY_LABELS,

  defaultIssueTypeForCategory,

  defaultSeverityForCategory,

  type FeedbackCategory,

  type FeedbackContextJson,

  type FeedbackIssueType,

  type FeedbackSeverity,

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

  const [issueType, setIssueType] = useState<FeedbackIssueType>(defaultIssueTypeForCategory(defaultCategory));

  const [severity, setSeverity] = useState<FeedbackSeverity>(defaultSeverityForCategory(defaultCategory));

  const [message, setMessage] = useState("");

  const [submittedRef, setSubmittedRef] = useState<number | null>(null);



  const resolvedContext: FeedbackContextJson = {

    pageUrl:

      contextJson?.pageUrl ??

      (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"),

    userAgent: contextJson?.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : undefined),

    ...contextJson,

  };



  useEffect(() => {

    if (open) {

      setCategory(defaultCategory);

      setIssueType(defaultIssueTypeForCategory(defaultCategory));

      setSeverity(defaultSeverityForCategory(defaultCategory));

      setSubmittedRef(null);

    }

  }, [open, defaultCategory]);



  useEffect(() => {
    setIssueType(defaultIssueTypeForCategory(category));
    if (category === "safety_concern") setSeverity("high");
  }, [category]);



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

          <DialogDescription>Report bugs, content gaps, UX issues, billing, or clinical safety concerns.</DialogDescription>

        </DialogHeader>

        {submittedRef ? (

          <div className="py-4 text-center">

            <p className="font-medium">Thank you — reference #{submittedRef}</p>

            <Button variant="outline" size="sm" className="mt-2" onClick={() => setOpen(false)}>Close</Button>

          </div>

        ) : (

          <>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-2">

                  <Label>Source</Label>

                  <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>

                    <SelectTrigger><SelectValue /></SelectTrigger>

                    <SelectContent>

                      {FEEDBACK_CATEGORIES.map((c) => (

                        <SelectItem key={c} value={c}>{FEEDBACK_CATEGORY_LABELS[c]}</SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                </div>

                <div className="space-y-2">

                  <Label>Issue type</Label>

                  <Select value={issueType} onValueChange={(v) => setIssueType(v as FeedbackIssueType)}>

                    <SelectTrigger><SelectValue /></SelectTrigger>

                    <SelectContent>

                      {FEEDBACK_ISSUE_TYPES.map((t) => (

                        <SelectItem key={t} value={t}>{FEEDBACK_ISSUE_TYPE_LABELS[t]}</SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                </div>

              </div>

              <div className="space-y-2">

                <Label>Severity</Label>

                <Select value={severity} onValueChange={(v) => setSeverity(v as FeedbackSeverity)}>

                  <SelectTrigger><SelectValue /></SelectTrigger>

                  <SelectContent>

                    {FEEDBACK_SEVERITIES.map((s) => (

                      <SelectItem key={s} value={s}>{FEEDBACK_SEVERITY_LABELS[s]}</SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue…" />

              <p className="text-[11px] text-muted-foreground">Page and browser context are captured automatically.</p>

            </div>

            <DialogFooter>

              <Button

                disabled={message.trim().length < 10 || submitMutation.isPending}

                onClick={() =>

                  submitMutation.mutate({

                    category,

                    issueType,

                    severity,

                    message: message.trim(),

                    contextJson: resolvedContext,

                  })

                }

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

