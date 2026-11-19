export type StkOutcome = "completed" | "cancelled" | "failed" | "pending";

/** Only actual provider ResultCode values describe terminal payment outcomes. */
export function classifyStkResult(stk: { resultCode?: unknown; resultDesc?: unknown }): StkOutcome {
  const code = String(stk.resultCode ?? "");
  if (code === "0") return "completed";
  if (code === "1032") return "cancelled";
  // Provider failures: balance, SIM/delivery timeout, wrong PIN, expired, subscriber busy.
  if (["1", "1037", "2001", "1019", "1001", "1025", "9999"].includes(code)) return "failed";
  // 2031 / no ResultCode / transport / configuration errors are not payment failures.
  return "pending";
}

export const STK_RETRY_WAIT_MS = 2 * 60 * 1000;
export function canStartNewStkAttempt(input: {
  outcome: StkOutcome;
  explicitRetry: boolean;
  updatedAt: Date | string | null;
  now?: number;
}): boolean {
  if (input.outcome === "completed") return false;
  if (input.outcome === "cancelled" || input.outcome === "failed") return true;
  const timestamp = input.updatedAt ? new Date(input.updatedAt).getTime() : NaN;
  return input.explicitRetry && Number.isFinite(timestamp) && (input.now ?? Date.now()) - timestamp >= STK_RETRY_WAIT_MS;
}

export function describeStkResult(stk: { resultCode?: unknown; resultDesc?: unknown }): string {
  if (stk.resultDesc) return String(stk.resultDesc);
  switch (String(stk.resultCode ?? "")) {
    case "1032": return "Payment request cancelled. You may retry.";
    case "1037": return "Safaricom could not reach the phone or the prompt timed out. Check the SIM/network and retry.";
    case "1": return "M-Pesa could not complete the payment. Check your balance.";
    default: return "Payment is not yet confirmed. Check your M-Pesa SMS before retrying.";
  }
}
