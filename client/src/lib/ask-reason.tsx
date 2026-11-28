import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Request = {
  question: string;
  title?: string;
  confirmLabel?: string;
  minLength: number;
  resolve: (value: string | null) => void;
};

let listener: ((request: Request) => void) | null = null;

/**
 * In-page replacement for window.prompt. Resolves with the trimmed reason, or
 * null when the person cancels. Browser prompts are blocked in some in-app
 * browsers and are unusable on phones, so reasons are collected in a dialog.
 * Falls back to window.prompt only if the dialog host is not mounted.
 */
export function askReason(
  question: string,
  options: { title?: string; confirmLabel?: string; minLength?: number } = {}
): Promise<string | null> {
  const minLength = options.minLength ?? 3;
  if (!listener) {
    const value = window.prompt(question)?.trim() ?? "";
    return Promise.resolve(value.length >= minLength ? value : null);
  }
  return new Promise(resolve => listener?.({ question, minLength, resolve, title: options.title, confirmLabel: options.confirmLabel }));
}

/** Confirmation counterpart to window.confirm. */
export function askConfirm(message: string, options: { title?: string; confirmLabel?: string } = {}): Promise<boolean> {
  if (!listener) return Promise.resolve(window.confirm(message));
  return new Promise(resolve =>
    listener?.({ question: message, minLength: -1, resolve: value => resolve(value !== null), title: options.title, confirmLabel: options.confirmLabel })
  );
}

export function ReasonDialogHost() {
  const [request, setRequest] = useState<Request | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    listener = next => {
      setValue("");
      setRequest(next);
    };
    return () => {
      listener = null;
    };
  }, []);

  const close = (result: string | null) => {
    request?.resolve(result);
    setRequest(null);
  };
  const isConfirm = request?.minLength === -1;
  const tooShort = !isConfirm && value.trim().length < (request?.minLength ?? 3);

  return (
    <Dialog open={request !== null} onOpenChange={open => { if (!open) close(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request?.title ?? (isConfirm ? "Please confirm" : "Add a reason")}</DialogTitle>
          <DialogDescription>{request?.question}</DialogDescription>
        </DialogHeader>
        {isConfirm ? null : (
          <Textarea
            autoFocus
            value={value}
            onChange={event => setValue(event.target.value)}
            rows={3}
            placeholder="Type your reason"
            aria-label="Reason"
          />
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => close(null)}>Cancel</Button>
          <Button type="button" disabled={tooShort} onClick={() => close(isConfirm ? "ok" : value.trim())}>
            {request?.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
