export type InstitutionalInvoiceState =
  | "draft"
  | "issued"
  | "payment_pending"
  | "payment_received"
  | "settlement_confirmed"
  | "reconciled"
  | "paid"
  | "disputed"
  | "refunded"
  | "void"
  | "overdue"
  | "cancelled";

export type InstitutionalPaymentAttemptState = "created" | "pending" | "succeeded" | "settled" | "failed" | "refunded" | "disputed";

const invoiceTransitions: Record<InstitutionalInvoiceState, InstitutionalInvoiceState[]> = {
  draft: ["issued", "cancelled"],
  issued: ["payment_pending", "overdue", "void", "cancelled"],
  payment_pending: ["payment_received", "disputed", "overdue", "cancelled"],
  payment_received: ["settlement_confirmed", "reconciled", "disputed", "refunded"],
  settlement_confirmed: ["reconciled", "disputed", "refunded"],
  reconciled: ["refunded"],
  paid: ["refunded"],
  disputed: ["payment_received", "reconciled", "refunded", "cancelled"],
  refunded: [],
  void: [],
  overdue: ["payment_pending", "cancelled"],
  cancelled: [],
};

export function canTransitionInstitutionalInvoice(current: InstitutionalInvoiceState, next: InstitutionalInvoiceState): boolean {
  return invoiceTransitions[current]?.includes(next) ?? false;
}

export function assertInstitutionalInvoiceTransition(current: InstitutionalInvoiceState, next: InstitutionalInvoiceState): void {
  if (!canTransitionInstitutionalInvoice(current, next)) {
    throw new Error(`Invalid institutional invoice transition: ${current} -> ${next}`);
  }
}

export function canCloseQiReport(review: { outcome: string; followUpRequired: boolean } | null | undefined): boolean {
  return Boolean(review && (review.outcome === "effective" || review.outcome === "partially_effective") && !review.followUpRequired);
}

export function institutionalLedgerDegradedState(reason: string) {
  return {
    state: "degraded" as const,
    accessDecision: "not_made" as const,
    reason,
  };
}
