/** Google Ads conversion thank-you path (www.paedsresus.com). */
export const PAYMENT_SUCCESS_PATH = "/payment/success";

export type PaymentSuccessParams = {
  enrollmentId: number;
  courseId?: string;
  programType?: string;
};

/** Enrollment rows with confirmed payment (M-Pesa webhook / admin verify). */
export function isPaidEnrollmentStatus(status: string | null | undefined): boolean {
  return status === "completed";
}

export function buildPaymentSuccessUrl(params: PaymentSuccessParams): string {
  const search = new URLSearchParams();
  search.set("enrollmentId", String(params.enrollmentId));
  if (params.courseId) search.set("courseId", params.courseId);
  if (params.programType) search.set("programType", params.programType);
  return `${PAYMENT_SUCCESS_PATH}?${search.toString()}`;
}

/** Parse wouter search string or raw query (with or without leading `?`). */
export function parsePaymentSuccessSearch(search: string): PaymentSuccessParams | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const q = new URLSearchParams(raw);
  const id = parseInt(q.get("enrollmentId") ?? "", 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  const courseId = q.get("courseId")?.trim();
  const programType = q.get("programType")?.trim();
  return {
    enrollmentId: id,
    ...(courseId ? { courseId } : {}),
    ...(programType ? { programType } : {}),
  };
}
