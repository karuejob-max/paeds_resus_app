import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import {
  courses,
  enrollments,
  ierpPayments,
  ierpProgramEnrollments,
  ilsCredentialRequests,
  nerpOfferCourses,
  nerpOfferEnrollments,
  payments,
} from "../../drizzle/schema";
import {
  AHA_PROGRAM_LABELS,
  getIndependentAhaPriceKes,
  isAhaProgramType,
} from "../../shared/aha-pathways";
import { IERP_TOTAL_FEE_KES } from "./ierp-program-state";

export type UnifiedLedgerProgramKey = "nerp" | "ierp" | "ilsp" | "independent" | "other";

export type UnifiedLedgerEntry = {
  id: string;
  status: string;
  amountKes: number;
  paymentMethod: string;
  transactionReference: string | null;
  receiptNumber: string | null;
  installmentNumber: number | null;
  createdAt: Date | null;
};

export type UnifiedLedgerProgram = {
  key: UnifiedLedgerProgramKey;
  label: string;
  referenceId: number | null;
  totalDueKes: number | null;
  totalPaidKes: number;
  balanceKes: number | null;
  status: string;
  entries: UnifiedLedgerEntry[];
};

function numberOrZero(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusForPayment(totalPaidKes: number, totalDueKes: number | null, sourceStatus?: string | null) {
  if (sourceStatus === "not_required") return "not_required";
  if (sourceStatus === "approved") return "paid_pending_review";
  if (sourceStatus === "rejected" || sourceStatus === "expired" || sourceStatus === "cancelled") {
    return sourceStatus;
  }
  if (totalDueKes !== null && totalPaidKes >= totalDueKes) return "paid_in_full";
  if (totalPaidKes > 0) return "partial";
  return "pending";
}

function genericPaymentEntry(
  payment: any,
  amountKes: number,
  idPrefix: string,
  installmentNumber: number | null = null,
): UnifiedLedgerEntry {
  return {
    id: `${idPrefix}-${payment.id}`,
    status: payment.status,
    amountKes,
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionId ?? null,
    receiptNumber: payment.mpesaReceiptNumber ?? null,
    installmentNumber,
    createdAt: payment.createdAt ?? null,
  };
}

/**
 * Read-only learner payment projection. It deliberately reads the existing
 * programme-specific ledgers instead of creating a second payment table.
 */
export async function getUnifiedPaymentLedger(db: any, userId: number) {
  const [offers, ierpPrograms, ilsRequests, genericPayments, learnerEnrollments] = await Promise.all([
    db
      .select()
      .from(nerpOfferEnrollments)
      .where(and(eq(nerpOfferEnrollments.userId, userId), ne(nerpOfferEnrollments.status, "cancelled")))
      .orderBy(desc(nerpOfferEnrollments.createdAt)),
    db
      .select()
      .from(ierpProgramEnrollments)
      .where(eq(ierpProgramEnrollments.userId, userId))
      .orderBy(desc(ierpProgramEnrollments.createdAt)),
    db
      .select()
      .from(ilsCredentialRequests)
      .where(eq(ilsCredentialRequests.userId, userId))
      .orderBy(desc(ilsCredentialRequests.createdAt)),
    db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt)),
    db
      .select({ enrollment: enrollments, courseTitle: courses.title })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.createdAt)),
  ]);

  const programs: UnifiedLedgerProgram[] = [];

  const ierpProgram = ierpPrograms[0];
  if (ierpProgram) {
    const ierpRows = await db
      .select()
      .from(ierpPayments)
      .where(eq(ierpPayments.programEnrollmentId, ierpProgram.id))
      .orderBy(desc(ierpPayments.createdAt));
    const totalDueKes = numberOrZero(ierpProgram.effectiveFeeKes ?? IERP_TOTAL_FEE_KES);
    const totalPaidKes = ierpRows
      .filter((row: any) => row.status === "completed")
      .reduce((sum: number, row: any) => sum + numberOrZero(row.amountKsh), 0);
    programs.push({
      key: "ierp",
      label: "IERP — Intern Emergency Readiness Program",
      referenceId: ierpProgram.id,
      totalDueKes,
      totalPaidKes,
      balanceKes: ierpProgram.paymentStatus === "not_required" ? 0 : Math.max(0, totalDueKes - totalPaidKes),
      status: statusForPayment(totalPaidKes, totalDueKes, ierpProgram.paymentStatus),
      entries: ierpRows.map((row: any) => ({
        id: `ierp-${row.id}`,
        status: row.status,
        amountKes: numberOrZero(row.amountKsh),
        paymentMethod: row.paymentMethod,
        transactionReference: row.providerReference ?? row.checkoutRequestId ?? null,
        receiptNumber: row.mpesaReceiptNumber ?? null,
        installmentNumber: null,
        createdAt: row.createdAt ?? null,
      })),
    });
  }

  for (const offer of offers) {
    const offerRows = genericPayments.filter(
      (row: any) => Number(row.nerpOfferEnrollmentId ?? 0) === Number(offer.id),
    );
    const totalDueKes = numberOrZero(offer.totalAmountKes);
    const totalPaidKes = numberOrZero(offer.amountPaidKes);
    programs.push({
      key: "nerp",
      label: "NERP — BLS + ACLS pathway",
      referenceId: offer.id,
      totalDueKes,
      totalPaidKes,
      balanceKes: Math.max(0, totalDueKes - totalPaidKes),
      status: statusForPayment(totalPaidKes, totalDueKes, offer.status),
      entries: offerRows.map((row: any) =>
        genericPaymentEntry(row, numberOrZero(row.amount), "nerp", row.installmentNumber ?? null),
      ),
    });
  }

  for (const request of ilsRequests) {
    const requestRows = genericPayments.filter(
      (row: any) => Number(row.ilsCredentialRequestId ?? 0) === Number(request.id),
    );
    const totalDueKes = numberOrZero(request.amountKes);
    const totalPaidKes = requestRows
      .filter((row: any) => row.status === "completed")
      .reduce((sum: number, row: any) => sum + numberOrZero(row.amount) / 100, 0);
    programs.push({
      key: "ilsp",
      label: `ILSP — AHA ${String(request.credentialType).toUpperCase()} credentialing`,
      referenceId: request.id,
      totalDueKes,
      totalPaidKes,
      balanceKes: Math.max(0, totalDueKes - totalPaidKes),
      status: statusForPayment(totalPaidKes, totalDueKes, request.status),
      entries: requestRows.map((row: any) =>
        genericPaymentEntry(row, numberOrZero(row.amount) / 100, "ilsp"),
      ),
    });
  }

  const nerpEnrollmentIds = new Set<number>();
  if (offers.length > 0) {
    const links = await db
      .select({ enrollmentId: nerpOfferCourses.enrollmentId })
      .from(nerpOfferCourses)
      .where(inArray(nerpOfferCourses.nerpOfferEnrollmentId, offers.map((offer: any) => offer.id)));
    links.forEach((link: any) => nerpEnrollmentIds.add(Number(link.enrollmentId)));
  }
  const ilspEnrollmentIds = new Set(ilsRequests.map((request: any) => Number(request.enrollmentId)));
  const specialPaymentIds = new Set(
    genericPayments
      .filter((row: any) => row.nerpOfferEnrollmentId || row.ilsCredentialRequestId)
      .map((row: any) => Number(row.id)),
  );

  for (const row of learnerEnrollments) {
    const enrollment = row.enrollment as any;
    const enrollmentId = Number(enrollment.id);
    if (nerpEnrollmentIds.has(enrollmentId) || ilspEnrollmentIds.has(enrollmentId)) continue;
    const relatedPayments = genericPayments.filter(
      (payment: any) => Number(payment.enrollmentId) === enrollmentId && !specialPaymentIds.has(Number(payment.id)),
    );
    if (relatedPayments.length === 0 && numberOrZero(enrollment.amountPaid) <= 0) continue;

    const programType = String(enrollment.programType ?? "other");
    const isIndependentAha = isAhaProgramType(programType);
    const totalDueKes = isIndependentAha ? getIndependentAhaPriceKes(programType) : null;
    const totalPaidKes = relatedPayments
      .filter((payment: any) => payment.status === "completed")
      .reduce((sum: number, payment: any) => {
        // Independent AHA checkout writes KES directly. Legacy general courses
        // retain the payments table's cents convention.
        return sum + (isIndependentAha ? numberOrZero(payment.amount) : numberOrZero(payment.amount) / 100);
      }, 0);
    programs.push({
      key: isIndependentAha ? "independent" : "other",
      label: isIndependentAha
        ? `Independent AHA Pathway — ${AHA_PROGRAM_LABELS[programType as keyof typeof AHA_PROGRAM_LABELS]}`
        : row.courseTitle ?? `Programme — ${programType}`,
      referenceId: enrollmentId,
      totalDueKes,
      totalPaidKes,
      balanceKes: totalDueKes === null ? null : Math.max(0, totalDueKes - totalPaidKes),
      status: statusForPayment(totalPaidKes, totalDueKes, enrollment.paymentStatus),
      entries: relatedPayments.map((payment: any) => genericPaymentEntry(
        payment,
        isIndependentAha ? numberOrZero(payment.amount) : numberOrZero(payment.amount) / 100,
        isIndependentAha ? "independent" : "other",
      )),
    });
  }

  return {
    programs,
    totalPaidKes: programs.reduce((sum, program) => sum + program.totalPaidKes, 0),
    totalOutstandingKes: programs.reduce((sum, program) => sum + (program.balanceKes ?? 0), 0),
  };
}
