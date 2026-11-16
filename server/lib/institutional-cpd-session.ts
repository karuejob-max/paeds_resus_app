import { cpdEventAuditEvents, cpdEventCoPresenters, cpdEvents } from "../../drizzle/schema";

export type ResolvedInstitutionalPresenter = {
  userId: number;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  cadre: string | null;
  department: string | null;
  isInstitutionMember: boolean;
};

export type CreateInstitutionalCpdSessionInput = {
  institutionId: number;
  actorUserId: number;
  name: string;
  eventDate: string;
  eventDateAt?: string | null;
  eventType: "cne" | "cme" | "cpd_general" | "grand_rounds" | "journal_club" | "workshop" | "m_and_m" | "other_cadre";
  audienceScope: "facility_wide" | "nursing_wide" | "clinical" | "m_and_m" | "other_cadre";
  audienceLabel?: string | null;
  facilityDepartmentId?: number | null;
  approvingCouncil?: string | null;
  cpdPoints?: number | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  presenter: ResolvedInstitutionalPresenter;
  coPresenters?: ResolvedInstitutionalPresenter[];
};

/**
 * The single persistence path for institutional CPD sessions.
 * Validation and identity resolution happen in the caller's authorization context;
 * this helper owns the event, audit, and co-presenter writes so legacy adapters
 * cannot drift from the department-aware institutional learning path.
 */
export async function createInstitutionalCpdSession(
  db: any,
  input: CreateInstitutionalCpdSessionInput,
): Promise<{ eventId: number }> {
  const now = new Date();
  const [result] = await db.insert(cpdEvents).values({
    institutionalAccountId: input.institutionId,
    name: input.name,
    eventDate: input.eventDate,
    eventDateAt: input.eventDateAt ? new Date(`${input.eventDateAt}T00:00:00.000Z`) : null,
    isOpen: true,
    lifecycleStatus: "open",
    openedAt: now,
    eventType: input.eventType,
    audienceScope: input.audienceScope,
    audienceLabel: input.audienceLabel ?? null,
    facilityDepartmentId: input.facilityDepartmentId ?? null,
    presenterUserId: input.presenter.userId,
    presenterName: input.presenter.staffName,
    presenterCadre: input.presenter.cadre ?? input.presenter.staffRole,
    presenterDepartment: input.presenter.department,
    cpdPoints: input.cpdPoints == null ? null : String(input.cpdPoints),
    approvingCouncil: input.approvingCouncil ?? null,
    scheduledStartTime: input.scheduledStartTime ?? null,
    scheduledEndTime: input.scheduledEndTime ?? null,
  });
  const eventId = Number((result as unknown as { insertId: number }).insertId);

  await db.insert(cpdEventAuditEvents).values({
    institutionalAccountId: input.institutionId,
    cpdEventId: eventId,
    action: "created",
    previousStatus: null,
    nextStatus: "open",
    reason: "CPD session created",
    changedFields: JSON.stringify(["name", "eventDate", "presenter", "audience", "cpdPoints"]),
    actorUserId: input.actorUserId,
  });

  if (input.coPresenters?.length) {
    await db.insert(cpdEventCoPresenters).values(
      input.coPresenters.map((presenter) => ({
        cpdEventId: eventId,
        institutionalAccountId: input.institutionId,
        userId: presenter.userId,
        participantType: presenter.isInstitutionMember ? "institution_member" as const : "guest" as const,
        fullName: presenter.staffName,
        email: presenter.staffEmail || null,
        cadre: presenter.cadre ?? presenter.staffRole,
        department: presenter.department,
        addedByUserId: input.actorUserId,
      })),
    );
  }

  return { eventId };
}
