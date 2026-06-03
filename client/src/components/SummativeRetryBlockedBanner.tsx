import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  buildSummativeRetryBlockedCopy,
  EXAM_POLICY_LEARNER_PATH,
} from "@shared/summative-retry-display";
import type { SummativeBlockKind } from "@shared/microcourse-exam-policy";

type Props = {
  attempts: number;
  maxAttempts: number;
  blockKind: SummativeBlockKind;
  retryAvailableAt: string | null;
  className?: string;
};

/** Shown when summative retry is blocked (cooldown or max attempts). */
export function SummativeRetryBlockedBanner({
  attempts,
  maxAttempts,
  blockKind,
  retryAvailableAt,
  className,
}: Props) {
  const copy = buildSummativeRetryBlockedCopy({
    attempts,
    maxAttempts,
    blockKind,
    retryAvailableAt,
  });
  if (!copy) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        {copy.lines.map((line) => (
          <p key={line.slice(0, 48)}>{line}</p>
        ))}
        <p>
          <Link
            href={EXAM_POLICY_LEARNER_PATH}
            className="font-medium underline underline-offset-2"
          >
            View assessment policy
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  );
}
