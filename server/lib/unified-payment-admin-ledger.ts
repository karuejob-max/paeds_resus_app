import { and, desc, eq, inArray, like, ne, or } from "drizzle-orm";
import {
  courses,
  enrollments,
  ierpPayments,
  ierpProgramEnrollments,
  ilsCredentialRequests,
  nerpOfferCourses,
  nerpOfferEnrollments,
  payments,
  users,
} from "../../drizzle/schema";
import {
  AHA_PROGRAM_LABELS,
  getIndependentAhaPriceKes,
  isAhaProgramType,
} from "../../shared/aha-pathways";
import { IERP_TOTAL_FEE_KES } from "./ierp-program-state";
import type { UnifiedLedgerProgramKey } from "./unified-payment-ledger";

export type AdminPaymentLedgerRow = {
  ledgerId: string;
  programKey: UnifiedLedgerProgramKey;
  programLabel: string;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  referenceId: number | null;
  totalDueKes: number | null;
  totalPaidKes: number;
  balanceKes: number | null;
  status: string;
  paymentCount: number;
  lastPaymentAt: Date | null;
};

function numberOrZero(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentStatus(totalPaidKes: number, totalDueKes: number | null, sourceStatus?: string | null) {
  if (sourceStatus === "not_required") return "not_required";
  if (sourceStatus === "approved") return "paid_pending_review";
  if (sourceStatus === "rejected" || sourceStatus === "expired" || sourceStatus === "cancelled") return sourceStatus;
  if (totalDueKes !== null && totalPaidKes >= totalDueKes) return "paid_in_full";
  return totalPaidKes > 0 ? "partial" : "pending";
}

function lastDate(rows: Array<{ createdAt?: Date | null; paidAt?: Date | null }>) {
  return rows.reduce<Date | null>((latest, row) => {
    const candidate = row.createdAt ?? row.paidAt ?? null;
    if (!candidate) return latest;
    return !latest || candidate.getTime() > latest.getTime() ? candidate : latest;
  }, null);
}

/** Read-only cross-programme payment summary for authorised Global Admin reporting. */
export async function getAdminPaymentLedger(
  db: any,
  input: { userId?: number; search?: string; programKey?: UnifiedLedgerProgramKey; limit: number; offset: number },
) {
  const parts: any[] = [];
  if (input.userId !== undefined) parts.push(eq(users.id, input.userId));
  const rawSearch = input.search?.trim().replace(/[%_\\]/g, "") ?? "";
  if (rawSearch) {
    const pattern = `%${rawSearch}%`;
    const searchOr = or(like(users.name, pattern), like(users.email, pattern));
    if (searchOr) parts.push(searchOr);
  }
  const userWhere = parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : and(...parts);
  const userQuery = db.select({ id: users.id, name: users.name, email: users.email }).from(users);
  const userRows = await (userWhere ? userQuery.where(userWhere) : userQuery).limit(5000);
  if (userRows.length === 0) return { rows: [], total: 0 };
  const userIds = userRows.map((user: any) => Number(user.id));
  const userMap = new Map(userRows.map((user: any) => [Number(user.id), user]));

  const [offers, ierpPrograms, ilsRequests, genericPayments, learnerEnrollments] = await Promise.all([
    db.select().from(nerpOfferEnrollments).where(inArray(nerpOfferEnrollments.userId, userIds)).orderBy(desc(nerpOfferEnrollments.createdAt)),
    db.select().from(ierpProgramEnrollments).where(inArray(ierpProgramEnrollments.userId, userIds)).orderBy(desc(ierpProgramEnrollments.createdAt)),
    db.select().from(ilsCredentialRequests).where(inArray(ilsCredentialRequests.userId, userIds)).orderBy(desc(ilsCredentialRequests.createdAt)),
    db.select().from(payments).where(inArray(payments.userId, userIds)).orderBy(desc(payments.createdAt)),
    db.select({ enrollment: enrollments, courseTitle: courses.title }).from(enrollments).leftJoin(courses, eq(enrollments.courseId, courses.id)).where(inArray(enrollments.userId, userIds)).orderBy(desc(enrollments.createdAt)),
  ]);

  const rows: AdminPaymentLedgerRow[] = [];
  const paymentsByNerpOffer = new Map<number, any[]>();
  const paymentsByIlsRequest = new Map<number, any[]>();
  const paymentsByEnrollment = new Map<number, any[]>();
  for (const payment of genericPayments as any[]) {
    if (payment.nerpOfferEnrollmentId) {
      const current = paymentsByNerpOffer.get(Number(payment.nerpOfferEnrollmentId)) ?? [];
      current.push(payment);
      paymentsByNerpOffer.set(Number(payment.nerpOfferEnrollmentId), current);
    }
    if (payment.ilsCredentialRequestId) {
      const current = paymentsByIlsRequest.get(Number(payment.ilsCredentialRequestId)) ?? [];
      current.push(payment);
      paymentsByIlsRequest.set(Number(payment.ilsCredentialRequestId), current);
    }
    const enrollmentId = Number(payment.enrollmentId);
    const current = paymentsByEnrollment.get(enrollmentId) ?? [];
    current.push(payment);
    paymentsByEnrollment.set(enrollmentId, current);
  }

  for (const offer of offers as any[]) {
    const offerPayments = paymentsByNerpOffer.get(Number(offer.id)) ?? [];
    const user = userMap.get(Number(offer.userId));
    const totalDueKes = numberOrZero(offer.totalAmountKes);
    const totalPaidKes = numberOrZero(offer.amountPaidKes);
    rows.push({
      ledgerId: `nerp-${offer.id}`,
      programKey: "nerp",
      programLabel: "NERP — BLS + ACLS pathway",
      userId: Number(offer.userId),
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      referenceId: Number(offer.id),
      totalDueKes,
      totalPaidKes,
      balanceKes: Math.max(0, totalDueKes - totalPaidKes),
      status: paymentStatus(totalPaidKes, totalDueKes, offer.status),
      paymentCount: offerPayments.length,
      lastPaymentAt: lastDate(offerPayments),
    });
  }

  const ierpPaymentsByProgram = new Map<number, any[]>();
  const ierpPaymentRows = (ierpPrograms as any[]).length > 0
    ? await db
        .select()
        .from(ierpPayments)
        .where(inArray(ierpPayments.programEnrollmentId, (ierpPrograms as any[]).map((program) => Number(program.id))))
    : [];
  for (const payment of ierpPaymentRows) {
    const current = ierpPaymentsByProgram.get(Number(payment.programEnrollmentId)) ?? [];
    current.push(payment);
    ierpPaymentsByProgram.set(Number(payment.programEnrollmentId), current);
  }
  for (const program of ierpPrograms as any[]) {
    const programPayments = ierpPaymentsByProgram.get(Number(program.id)) ?? [];
    const user = userMap.get(Number(program.userId));
    const totalDueKes = numberOrZero(program.effectiveFeeKes ?? IERP_TOTAL_FEE_KES);
    const totalPaidKes = programPayments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + numberOrZero(payment.amountKsh), 0);
    rows.push({
      ledgerId: `ierp-${program.id}`,
      programKey: "ierp",
      programLabel: "IERP — Intern Emergency Readiness Program",
      userId: Number(program.userId),
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      referenceId: Number(program.id),
      totalDueKes,
      totalPaidKes,
      balanceKes: program.paymentStatus === "not_required" ? 0 : Math.max(0, totalDueKes - totalPaidKes),
      status: paymentStatus(totalPaidKes, totalDueKes, program.paymentStatus),
      paymentCount: programPayments.length,
      lastPaymentAt: lastDate(programPayments),
    });
  }

  for (const request of ilsRequests as any[]) {
    const requestPayments = paymentsByIlsRequest.get(Number(request.id)) ?? [];
    const user = userMap.get(Number(request.userId));
    const totalDueKes = numberOrZero(request.amountKes);
    const totalPaidKes = requestPayments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + numberOrZero(payment.amount) / 100, 0);
    rows.push({
      ledgerId: `ilsp-${request.id}`,
      programKey: "ilsp",
      programLabel: `ILSP — AHA ${String(request.credentialType).toUpperCase()} credentialing`,
      userId: Number(request.userId),
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      referenceId: Number(request.id),
      totalDueKes,
      totalPaidKes,
      balanceKes: Math.max(0, totalDueKes - totalPaidKes),
      status: paymentStatus(totalPaidKes, totalDueKes, request.status),
      paymentCount: requestPayments.length,
      lastPaymentAt: lastDate(requestPayments),
    });
  }

  const nerpEnrollmentIds = new Set<number>();
  if ((offers as any[]).length > 0) {
    const links = await db.select({ enrollmentId: nerpOfferCourses.enrollmentId }).from(nerpOfferCourses).where(inArray(nerpOfferCourses.nerpOfferEnrollmentId, (offers as any[]).map((offer) => Number(offer.id))));
    links.forEach((link: any) => nerpEnrollmentIds.add(Number(link.enrollmentId)));
  }
  const ilspEnrollmentIds = new Set((ilsRequests as any[]).map((request) => Number(request.enrollmentId)));
  const genericSpecialPaymentIds = new Set((genericPayments as any[]).filter((payment) => payment.nerpOfferEnrollmentId || payment.ilsCredentialRequestId).map((payment) => Number(payment.id)));

  for (const item of learnerEnrollments as any[]) {
    const enrollment = item.enrollment;
    const enrollmentId = Number(enrollment.id);
    if (nerpEnrollmentIds.has(enrollmentId) || ilspEnrollmentIds.has(enrollmentId)) continue;
    const relatedPayments = (paymentsByEnrollment.get(enrollmentId) ?? []).filter((payment) => !genericSpecialPaymentIds.has(Number(payment.id)));
    if (relatedPayments.length === 0 && numberOrZero(enrollment.amountPaid) <= 0) continue;
    const programType = String(enrollment.programType ?? "other");
    const independent = isAhaProgramType(programType);
    const totalDueKes = independent ? getIndependentAhaPriceKes(programType) : null;
    const totalPaidKes = relatedPayments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + (independent ? numberOrZero(payment.amount) : numberOrZero(payment.amount) / 100), 0);
    const user = userMap.get(Number(enrollment.userId));
    rows.push({
      ledgerId: `${independent ? "independent" : "other"}-${enrollmentId}`,
      programKey: independent ? "independent" : "other",
      programLabel: independent ? `Independent AHA Pathway — ${AHA_PROGRAM_LABELS[programType as keyof typeof AHA_PROGRAM_LABELS]}` : item.courseTitle ?? `Programme — ${programType}`,
      userId: Number(enrollment.userId),
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      referenceId: enrollmentId,
      totalDueKes,
      totalPaidKes,
      balanceKes: totalDueKes === null ? null : Math.max(0, totalDueKes - totalPaidKes),
      status: paymentStatus(totalPaidKes, totalDueKes, enrollment.paymentStatus),
      paymentCount: relatedPayments.length,
      lastPaymentAt: lastDate(relatedPayments),
    });
  }

  const filtered = input.programKey ? rows.filter((row) => row.programKey === input.programKey) : rows;
  filtered.sort((a, b) => {
    const aTime = a.lastPaymentAt?.getTime() ?? 0;
    const bTime = b.lastPaymentAt?.getTime() ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return `${a.userName ?? ""}-${a.ledgerId}`.localeCompare(`${b.userName ?? ""}-${b.ledgerId}`);
  });
  return {
    rows: filtered.slice(input.offset, input.offset + input.limit),
    total: filtered.length,
  };
}
