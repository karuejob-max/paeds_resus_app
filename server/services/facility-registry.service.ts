/**
 * Canonical facility registry — search, resolve merges, sync institutions, geographic rollups.
 */
import { and, desc, eq, gte, inArray, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  careFacilities,
  careSignalEvents,
  providerProfiles,
  institutionalAccounts,
  accreditedFacilities,
  facilities,
  users,
  institutionalStaffMembers,
  institutionMemberships,
  facilityDepartments,
  cpdAttendees,
} from "../../drizzle/schema";
import { inferDesignationFromCadre } from "../../shared/cadre-designation-mapping";
import { isRegisteredRnProfile } from "../lib/iers-provider-eligibility";
import { DEFAULT_FACILITY_COUNTRY } from "../../shared/kenya-counties";
import { canonicalizeDepartmentLabel, departmentLabelsMatch } from "../../shared/clinical-departments";

export type FacilitySearchResult = {
  id: number;
  name: string;
  county: string | null;
  country: string;
  badge: string;
  /**
   * Enrichment from the unified `facilities` table (migration 0059 + 0060
   * backfill), joined via legacy_care_facility_id. Null until that facility
   * has been bridged (see scripts/apply-0060-facilities-backfill.mjs) — most
   * commonly because its country isn't yet ISO2-mapped, or Phase 2/3 syncs
   * (healthsites.io / KMHFL) haven't run. Never guessed; genuinely unknown
   * until then.
   */
  facilityOwnership: "GOVERNMENT" | "FAITH_BASED" | "PRIVATE_FOR_PROFIT" | "PRIVATE_NOT_FOR_PROFIT" | "MILITARY" | "OTHER" | null;
  countryCode: string | null;
  facilityLevelWho: string | null;
  /**
   * Locality-level geography (sub-county / district / area), per the CEO's
   * "global from day 1" instruction (gap-analysis #11, 2026-07-16). Sourced
   * from careFacilities.subCounty where the unified `facilities` bridge
   * hasn't populated adminLevel2 yet — prefer facilities.adminLevel2 when
   * present since it's the more consistently-maintained, country-agnostic
   * field going forward.
   */
  adminLevel2: string | null;
};

const OUTREACH_SLUG = "outreach-mobile";

/** Follow merge chain to canonical facility id. */
export async function resolveCanonicalFacilityId(facilityId: number): Promise<number> {
  const db = await getDb();
  if (!db) return facilityId;

  let current = facilityId;
  for (let i = 0; i < 10; i++) {
    const [row] = await db
      .select({ mergedIntoId: careFacilities.mergedIntoId })
      .from(careFacilities)
      .where(eq(careFacilities.id, current))
      .limit(1);
    if (!row?.mergedIntoId) return current;
    current = row.mergedIntoId;
  }
  return current;
}

export async function getFacilityById(facilityId: number) {
  const db = await getDb();
  if (!db) return null;
  const canonicalId = await resolveCanonicalFacilityId(facilityId);
  const [row] = await db
    .select({
      id: careFacilities.id,
      name: careFacilities.name,
      county: careFacilities.county,
      country: careFacilities.country,
      subCounty: careFacilities.subCounty,
      facilityType: careFacilities.facilityType,
      institutionalAccountId: careFacilities.institutionalAccountId,
      isSystem: careFacilities.isSystem,
      systemSlug: careFacilities.systemSlug,
      facilityOwnership: facilities.facilityOwnership,
      countryCode: facilities.countryCode,
      facilityLevelWho: facilities.facilityLevelWho,
      adminLevel2: facilities.adminLevel2,
    })
    .from(careFacilities)
    .leftJoin(facilities, eq(facilities.legacyCareFacilityId, careFacilities.id))
    .where(eq(careFacilities.id, canonicalId))
    .limit(1);
  return row ? { ...row, adminLevel2: row.adminLevel2 ?? row.subCounty ?? null } : null;
}

/** Seed outreach row + import institutions and accredited facilities (idempotent). */
export async function ensureFacilityRegistrySeeded() {
  const db = await getDb();
  if (!db) return;

  const [outreach] = await db
    .select({ id: careFacilities.id })
    .from(careFacilities)
    .where(eq(careFacilities.systemSlug, OUTREACH_SLUG))
    .limit(1);

  if (!outreach) {
    await db.insert(careFacilities).values({
      name: "Outreach / mobile / multiple sites",
      country: DEFAULT_FACILITY_COUNTRY,
      isSystem: true,
      systemSlug: OUTREACH_SLUG,
    });
  }

  const institutions = await db
    .select({
      id: institutionalAccounts.id,
      companyName: institutionalAccounts.companyName,
    })
    .from(institutionalAccounts);

  for (const inst of institutions) {
    const name = inst.companyName?.trim();
    if (!name) continue;
    const [existing] = await db
      .select({ id: careFacilities.id })
      .from(careFacilities)
      .where(
        and(
          eq(careFacilities.institutionalAccountId, inst.id),
          isNull(careFacilities.mergedIntoId)
        )
      )
      .limit(1);
    if (existing) continue;

    const [byName] = await db
      .select({ id: careFacilities.id })
      .from(careFacilities)
      .where(and(eq(careFacilities.name, name), isNull(careFacilities.mergedIntoId)))
      .limit(1);

    if (byName) {
      await db
        .update(careFacilities)
        .set({ institutionalAccountId: inst.id })
        .where(eq(careFacilities.id, byName.id));
    } else {
      await db.insert(careFacilities).values({
        name,
        country: DEFAULT_FACILITY_COUNTRY,
        institutionalAccountId: inst.id,
      });
    }
  }

  const accredited = await db.select().from(accreditedFacilities);
  for (const a of accredited) {
    const name = a.facilityName?.trim();
    if (!name) continue;
    const [exists] = await db
      .select({ id: careFacilities.id })
      .from(careFacilities)
      .where(and(eq(careFacilities.name, name), isNull(careFacilities.mergedIntoId)))
      .limit(1);
    if (exists) {
      if (a.county) {
        await db
          .update(careFacilities)
          .set({ county: a.county })
          .where(and(eq(careFacilities.id, exists.id), isNull(careFacilities.county)));
      }
      continue;
    }
    await db.insert(careFacilities).values({
      name,
      county: a.county ?? null,
      country: DEFAULT_FACILITY_COUNTRY,
    });
  }
}

export async function searchCareFacilities(input: {
  query: string;
  country?: string;
  limit?: number;
}): Promise<{ results: FacilitySearchResult[] }> {
  await ensureFacilityRegistrySeeded();
  const db = await getDb();
  if (!db) return { results: [] };

  const q = input.query.trim();
  const limit = input.limit ?? 12;
  if (q.length < 1) return { results: [] };

  const pattern = `%${q}%`;
  const filters = [
    isNull(careFacilities.mergedIntoId),
    like(careFacilities.name, pattern),
  ];
  if (input.country?.trim()) {
    filters.push(eq(careFacilities.country, input.country.trim()));
  }

  const rows = await db
    .select({
      id: careFacilities.id,
      name: careFacilities.name,
      county: careFacilities.county,
      country: careFacilities.country,
      subCounty: careFacilities.subCounty,
      institutionalAccountId: careFacilities.institutionalAccountId,
      isSystem: careFacilities.isSystem,
      facilityOwnership: facilities.facilityOwnership,
      countryCode: facilities.countryCode,
      facilityLevelWho: facilities.facilityLevelWho,
      adminLevel2: facilities.adminLevel2,
    })
    .from(careFacilities)
    .leftJoin(facilities, eq(facilities.legacyCareFacilityId, careFacilities.id))
    .where(and(...filters))
    .orderBy(desc(careFacilities.id))
    .limit(limit);

  return {
    results: rows.map((r) => ({
      id: r.id,
      name: r.name,
      county: r.county,
      country: r.country,
      badge: r.isSystem
        ? "System"
        : r.institutionalAccountId
          ? "Registered hospital"
          : "Community",
      facilityOwnership: r.facilityOwnership,
      countryCode: r.countryCode,
      facilityLevelWho: r.facilityLevelWho,
      adminLevel2: r.adminLevel2 ?? r.subCounty ?? null,
    })),
  };
}

export async function createCareFacility(input: {
  name: string;
  county?: string | null;
  country: string;
  facilityType?:
    | "primary_health_center"
    | "health_post"
    | "district_hospital"
    | "private_clinic"
    | "ngo_clinic"
    | "other"
    | null;
  createdByUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const name = input.name.trim();
  if (name.length < 2) throw new Error("Facility name is too short");

  const [dup] = await db
    .select({ id: careFacilities.id })
    .from(careFacilities)
    .where(and(eq(careFacilities.name, name), isNull(careFacilities.mergedIntoId)))
    .limit(1);

  if (dup) return { id: dup.id, created: false as const };

  const insertResult = await db.insert(careFacilities).values({
    name,
    county: input.county?.trim() || null,
    country: input.country.trim() || DEFAULT_FACILITY_COUNTRY,
    facilityType: input.facilityType ?? null,
  });

  const id = (insertResult as unknown as { insertId: number }).insertId;
  return { id, created: true as const };
}

export type InstitutionalStaffSyncInput = {
  institutionalAccountId: number;
  userId: number;
  staffName: string;
  staffEmail: string;
  staffPhone?: string | null;
  providerType?: string | null;
  cadre?: string | null;
  cadreOther?: string | null;
  department?: string | null;
  facilityDepartmentId?: number | null;
  enrollmentStatus?: "pending" | "enrolled" | "in_progress" | "completed" | "dropped";
};

type InstitutionalStaffRole = "nurse" | "doctor" | "paramedic" | "midwife" | "lab_tech" | "respiratory_therapist" | "support_staff" | "other";

function staffRoleFromRegisteredProfile(input: Pick<InstitutionalStaffSyncInput, "providerType" | "cadre" | "cadreOther">): InstitutionalStaffRole {
  if (isRegisteredRnProfile({ providerType: input.providerType, cadre: input.cadre, cadreOther: input.cadreOther })) return "nurse";
  if (input.providerType === "doctor") return "doctor";
  if (input.providerType === "paramedic") return "paramedic";
  if (input.providerType === "midwife") return "midwife";
  if (input.providerType === "lab_tech") return "lab_tech";
  if (input.providerType === "respiratory_therapist") return "respiratory_therapist";
  if (input.providerType === "support_staff") return "support_staff";
  return "other";
}

/**
 * Reconcile a registered provider into one institution-scoped operational staff row.
 * CPD attendance may subsequently activate the facility membership; this helper
 * never grants IERS product roles or dated emergency duties.
 */
export async function reconcileInstitutionalStaffMember(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: InstitutionalStaffSyncInput,
) {
  const email = input.staffEmail.trim().toLowerCase();
  const [membership] = await db
    .select({ membershipStatus: institutionMemberships.membershipStatus })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, input.institutionalAccountId),
      or(eq(institutionMemberships.userId, input.userId), eq(institutionMemberships.invitedEmail, email)),
    ))
    .orderBy(desc(institutionMemberships.id))
    .limit(1);

  let [existing] = await db
    .select()
    .from(institutionalStaffMembers)
    .where(and(
      eq(institutionalStaffMembers.institutionalAccountId, input.institutionalAccountId),
      eq(institutionalStaffMembers.userId, input.userId),
    ))
    .orderBy(desc(institutionalStaffMembers.id))
    .limit(1);
  if (!existing) {
    [existing] = await db
      .select()
      .from(institutionalStaffMembers)
      .where(and(
        eq(institutionalStaffMembers.institutionalAccountId, input.institutionalAccountId),
        eq(institutionalStaffMembers.staffEmail, email),
      ))
      .orderBy(desc(institutionalStaffMembers.id))
      .limit(1);
  }

  const facilityLinkStatus = membership?.membershipStatus === "active"
    ? "linked" as const
    : existing?.facilityLinkStatus === "rejected"
      ? "rejected" as const
      : "pending" as const;
  if (existing?.removedAt) {
    return { staffMemberId: existing.id, facilityLinkStatus: "rejected" as const, membershipStatus: membership?.membershipStatus ?? null };
  }
  const departmentConflict = Boolean(
    existing
    && existing.facilityDepartmentId != null
    && input.facilityDepartmentId != null
    && existing.facilityDepartmentId !== input.facilityDepartmentId,
  );
  const values = {
    institutionalAccountId: input.institutionalAccountId,
    userId: input.userId,
    staffName: input.staffName.trim() || "Provider",
    staffEmail: email,
    staffPhone: input.staffPhone?.trim() || null,
    staffRole: staffRoleFromRegisteredProfile(input),
    designation: inferDesignationFromCadre(input.cadre) ?? existing?.designation ?? "other" as const,
    department: departmentConflict ? existing?.department ?? null : input.department?.trim() || null,
    facilityDepartmentId: departmentConflict ? existing?.facilityDepartmentId ?? null : input.facilityDepartmentId ?? null,
    facilityLinkStatus,
    enrollmentStatus: existing?.enrollmentStatus ?? input.enrollmentStatus ?? "pending" as const,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(institutionalStaffMembers).set(values).where(eq(institutionalStaffMembers.id, existing.id));
    return { staffMemberId: existing.id, facilityLinkStatus, membershipStatus: membership?.membershipStatus ?? null };
  }
  const result = await db.insert(institutionalStaffMembers).values(values);
  return { staffMemberId: Number((result as unknown as { insertId: number }).insertId), facilityLinkStatus, membershipStatus: membership?.membershipStatus ?? null };
}

export type CpdFacilityRelationship = "permanent_facility" | "locum_outreach";

export type CpdFacilityLinkResult = {
  relationship: CpdFacilityRelationship;
  status: "linked" | "admin_review_required";
  membershipId: number | null;
  membershipStatus: "active" | "invited" | "suspended" | "ended" | null;
  staffMemberId: number | null;
};

/**
 * Apply an authenticated CPD attendee's explicit facility relationship.
 *
 * A signed-in CPD attendee's explicit facility relationship links the attendee to
 * the host facility. Both permanent and locum/outreach selections create or accept
 * only a general-staff facility membership; neither creates an IERS product role or
 * dated emergency duty. Permanent updates the provider's primary facility, while
 * locum/outreach remains a secondary facility history. Suspended, ended, rejected,
 * or removed relationships remain administrator-controlled.
 */
export async function applyCpdFacilityRelationship(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: {
    institutionalAccountId: number;
    userId: number;
    staffName: string;
    staffEmail: string;
    staffPhone?: string | null;
    providerType?: string | null;
    cadre?: string | null;
    cadreOther?: string | null;
    department?: string | null;
    facilityDepartmentId?: number | null;
    relationship: CpdFacilityRelationship;
  },
): Promise<CpdFacilityLinkResult> {
  const email = input.staffEmail.trim().toLowerCase();
  const reconciled = await reconcileInstitutionalStaffMember(db, {
    institutionalAccountId: input.institutionalAccountId,
    userId: input.userId,
    staffName: input.staffName,
    staffEmail: email,
    staffPhone: input.staffPhone,
    providerType: input.providerType,
    cadre: input.cadre,
    cadreOther: input.cadreOther,
    department: input.department,
    facilityDepartmentId: input.facilityDepartmentId,
    enrollmentStatus: "enrolled",
  });

  const [staff] = await db
    .select({
      id: institutionalStaffMembers.id,
      facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
      removedAt: institutionalStaffMembers.removedAt,
    })
    .from(institutionalStaffMembers)
    .where(eq(institutionalStaffMembers.id, reconciled.staffMemberId))
    .limit(1);

  const [membership] = await db
    .select({
      id: institutionMemberships.id,
      userId: institutionMemberships.userId,
      membershipStatus: institutionMemberships.membershipStatus,
      staffMemberId: institutionMemberships.staffMemberId,
    })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, input.institutionalAccountId),
      or(eq(institutionMemberships.userId, input.userId), eq(institutionMemberships.invitedEmail, email)),
    ))
    .orderBy(desc(institutionMemberships.id))
    .limit(1);

  const needsAdminReview = staff?.facilityLinkStatus === "rejected"
    || Boolean(staff?.removedAt)
    || membership?.membershipStatus === "suspended"
    || membership?.membershipStatus === "ended";

  if (needsAdminReview) {
    return {
      relationship: input.relationship,
      status: "admin_review_required",
      membershipId: membership?.id ?? null,
      membershipStatus: membership?.membershipStatus ?? null,
      staffMemberId: reconciled.staffMemberId,
    };
  }

  const now = new Date();
  let membershipId = membership?.id ?? null;
  if (membership?.id) {
    if (membership.membershipStatus === "invited") {
      await db
        .update(institutionMemberships)
        .set({
          userId: input.userId,
          staffMemberId: reconciled.staffMemberId,
          membershipStatus: "active",
          acceptedAt: now,
          updatedAt: now,
        })
        .where(eq(institutionMemberships.id, membership.id));
    } else if (membership.membershipStatus !== "active") {
      return {
        relationship: input.relationship,
        status: "admin_review_required",
        membershipId: membership.id,
        membershipStatus: membership.membershipStatus,
        staffMemberId: reconciled.staffMemberId,
      };
    }
  } else {
    const inserted = await db.insert(institutionMemberships).values({
      institutionalAccountId: input.institutionalAccountId,
      userId: input.userId,
      invitedEmail: email,
      staffMemberId: reconciled.staffMemberId,
      membershipStatus: "active",
      responsibilityRole: "general_staff",
      invitedByUserId: null,
      acceptedAt: now,
    });
    membershipId = Number((inserted as unknown as { insertId: number }).insertId);
  }

  await db
    .update(institutionalStaffMembers)
    .set({
      userId: input.userId,
      facilityLinkStatus: "linked",
      updatedAt: now,
    })
    .where(eq(institutionalStaffMembers.id, reconciled.staffMemberId));

  const [facility] = await db
    .select({ id: careFacilities.id, name: careFacilities.name, county: careFacilities.county, country: careFacilities.country })
    .from(careFacilities)
    .where(and(
      eq(careFacilities.institutionalAccountId, input.institutionalAccountId),
      isNull(careFacilities.mergedIntoId),
    ))
    .orderBy(desc(careFacilities.id))
    .limit(1);
  if (facility && input.relationship === "permanent_facility") {
    await db
      .update(providerProfiles)
      .set({
        facilityId: facility.id,
        facilityName: facility.name,
        facilityRegion: facility.county ?? null,
        facilityCountry: facility.country,
        updatedAt: now,
      })
      .where(eq(providerProfiles.userId, input.userId));
  }

  return {
    relationship: input.relationship,
    status: "linked",
    membershipId,
    membershipStatus: "active",
    staffMemberId: reconciled.staffMemberId,
  };
}

/**
 * Reconcile all prior CPD host facilities for the signed-in account. This is
 * intentionally idempotent and skips guest-external attendance. It may create
 * only general-staff facility membership; administrator removal/suspension and
 * all IERS responsibility assignment remain separate controls.
 */
export async function autoLinkCpdFacilitiesForUser(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: { userId: number; email: string },
) {
  const email = input.email.trim().toLowerCase();
  if (!email) return [];

  const [user] = await db
    .select({ name: users.name, email: users.email, phone: users.phone, providerType: users.providerType, cadre: users.cadre, cadreOther: users.cadreOther })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user?.email) return [];

  const attendeeRows = await db
    .select({
      institutionalAccountId: cpdAttendees.institutionalAccountId,
      fullName: cpdAttendees.fullName,
      email: cpdAttendees.email,
      phone: cpdAttendees.phone,
      cadre: cpdAttendees.cadre,
      cadreOther: cpdAttendees.cadreOther,
      department: cpdAttendees.department,
      facilityDepartmentId: cpdAttendees.facilityDepartmentId,
      attendanceType: cpdAttendees.attendanceType,
    })
    .from(cpdAttendees)
    .where(sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`)
    .orderBy(desc(cpdAttendees.id));

  const latestByInstitution = new Map<number, (typeof attendeeRows)[number]>();
  for (const row of attendeeRows) {
    if (!latestByInstitution.has(row.institutionalAccountId)) latestByInstitution.set(row.institutionalAccountId, row);
  }

  const results = [];
  for (const attendee of latestByInstitution.values()) {
    if (attendee.attendanceType === "guest_external") continue;
    results.push(await applyCpdFacilityRelationship(db, {
      institutionalAccountId: attendee.institutionalAccountId,
      userId: input.userId,
      staffName: user.name?.trim() || attendee.fullName,
      staffEmail: user.email,
      staffPhone: user.phone ?? attendee.phone,
      providerType: user.providerType,
      cadre: user.cadre ?? attendee.cadre,
      cadreOther: user.cadreOther ?? attendee.cadreOther,
      department: attendee.department,
      facilityDepartmentId: attendee.facilityDepartmentId,
      relationship: attendee.attendanceType === "locum_outreach" ? "locum_outreach" : "permanent_facility",
    }));
  }
  return results;
}

export async function autoLinkCpdFacilitiesForInstitution(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  institutionalAccountId: number,
) {
  const attendeeRows = await db
    .select({
      userId: users.id,
      fullName: cpdAttendees.fullName,
      email: cpdAttendees.email,
      phone: cpdAttendees.phone,
      providerType: users.providerType,
      userCadre: users.cadre,
      userCadreOther: users.cadreOther,
      cadre: cpdAttendees.cadre,
      cadreOther: cpdAttendees.cadreOther,
      department: cpdAttendees.department,
      facilityDepartmentId: cpdAttendees.facilityDepartmentId,
      attendanceType: cpdAttendees.attendanceType,
    })
    .from(cpdAttendees)
    .innerJoin(users, sql`LOWER(TRIM(${users.email})) = LOWER(TRIM(${cpdAttendees.email}))`)
    .where(and(
      eq(cpdAttendees.institutionalAccountId, institutionalAccountId),
      sql`${cpdAttendees.attendanceType} <> 'guest_external'`,
    ))
    .orderBy(desc(cpdAttendees.id));

  const latestByUser = new Map<number, (typeof attendeeRows)[number]>();
  for (const row of attendeeRows) {
    if (!latestByUser.has(row.userId)) latestByUser.set(row.userId, row);
  }

  const results = [];
  for (const attendee of latestByUser.values()) {
    results.push(await applyCpdFacilityRelationship(db, {
      institutionalAccountId,
      userId: attendee.userId,
      staffName: attendee.fullName,
      staffEmail: attendee.email,
      staffPhone: attendee.phone,
      providerType: attendee.providerType,
      cadre: attendee.userCadre ?? attendee.cadre,
      cadreOther: attendee.userCadreOther ?? attendee.cadreOther,
      department: attendee.department,
      facilityDepartmentId: attendee.facilityDepartmentId,
      relationship: attendee.attendanceType === "locum_outreach" ? "locum_outreach" : "permanent_facility",
    }));
  }
  return results;
}

export async function syncProviderProfileFacility(
  userId: number,
  facilityId: number,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const canonicalId = await resolveCanonicalFacilityId(facilityId);
  const facility = await getFacilityById(canonicalId);
  if (!facility) return;

  await db
    .update(providerProfiles)
    .set({
      facilityId: canonicalId,
      facilityName: facility.name,
      facilityRegion: facility.county ?? null,
      facilityAdminLevel2: facility.adminLevel2 ?? null,
      facilityCountry: facility.country,
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.userId, userId));

  const [providerProfile] = await db
    .select({ department: providerProfiles.department })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  let canonicalDepartmentId: number | null = null;
  const normalizedProviderDepartment = providerProfile?.department?.trim()
    ? canonicalizeDepartmentLabel(providerProfile.department)
    : null;
  if (facility.institutionalAccountId && normalizedProviderDepartment) {
    const departments = await db
      .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
      .from(facilityDepartments)
      .where(and(
        eq(facilityDepartments.institutionId, facility.institutionalAccountId),
        eq(facilityDepartments.isActive, true),
      ));
    canonicalDepartmentId = departments.find((department) => departmentLabelsMatch(department.departmentName, normalizedProviderDepartment))?.id ?? null;
  }

  if (facility.institutionalAccountId) {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, providerType: users.providerType, cadre: users.cadre, cadreOther: users.cadreOther })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (user?.email) {
      await reconcileInstitutionalStaffMember(db, {
        institutionalAccountId: facility.institutionalAccountId,
        userId,
        staffName: user.name || "Provider",
        staffEmail: user.email,
        staffPhone: user.phone,
        providerType: user.providerType,
        cadre: user.cadre,
        cadreOther: user.cadreOther,
        department: normalizedProviderDepartment,
        facilityDepartmentId: canonicalDepartmentId,
      });
    }
  } else {
    const existingSelfServiceRow = await db
      .select({ id: institutionalStaffMembers.id })
      .from(institutionalStaffMembers)
      .where(and(eq(institutionalStaffMembers.userId, userId), isNull(institutionalStaffMembers.institutionalAccountId)))
      .limit(1);

    if (existingSelfServiceRow.length === 0) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        let staffRole: "nurse" | "doctor" | "paramedic" | "midwife" | "lab_tech" | "respiratory_therapist" | "support_staff" | "other" = "other";
        if (user.providerType === "nurse") staffRole = "nurse";
        else if (user.providerType === "doctor") staffRole = "doctor";
        else if (user.providerType === "paramedic") staffRole = "paramedic";
        else if (user.providerType === "midwife") staffRole = "midwife";
        else if (user.providerType === "lab_tech") staffRole = "lab_tech";
        else if (user.providerType === "respiratory_therapist") staffRole = "respiratory_therapist";

        await db.insert(institutionalStaffMembers).values({
          institutionalAccountId: null,
          userId: userId,
          staffName: user.name || "Provider",
          staffEmail: user.email || "",
          staffPhone: user.phone || null,
          staffRole: staffRole,
          designation: inferDesignationFromCadre((user as any).cadre) ?? "other",
          facilityLinkStatus: "linked",
          enrollmentStatus: "pending",
        });
      }
    }
  }
}

export async function mergeCareFacilities(input: {
  sourceFacilityId: number;
  targetFacilityId: number;
  adminUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const sourceId = await resolveCanonicalFacilityId(input.sourceFacilityId);
  const targetId = await resolveCanonicalFacilityId(input.targetFacilityId);

  if (sourceId === targetId) {
    return { ok: true, movedEvents: 0, movedProfiles: 0 };
  }

  const [target] = await db
    .select()
    .from(careFacilities)
    .where(eq(careFacilities.id, targetId))
    .limit(1);
  if (!target) throw new Error("Target facility not found");

  await db
    .update(careFacilities)
    .set({ mergedIntoId: targetId, updatedAt: new Date() })
    .where(eq(careFacilities.id, sourceId));

  const eventsUpdated = await db
    .update(careSignalEvents)
    .set({ facilityId: targetId })
    .where(eq(careSignalEvents.facilityId, sourceId));

  const profilesUpdated = await db
    .update(providerProfiles)
    .set({
      facilityId: targetId,
      facilityName: target.name,
      facilityRegion: target.county,
      facilityCountry: target.country,
      updatedAt: new Date(),
    })
    .where(eq(providerProfiles.facilityId, sourceId));

  const children = await db
    .select({ id: careFacilities.id })
    .from(careFacilities)
    .where(eq(careFacilities.mergedIntoId, sourceId));

  for (const child of children) {
    await db
      .update(careFacilities)
      .set({ mergedIntoId: targetId, updatedAt: new Date() })
      .where(eq(careFacilities.id, child.id));
  }

  return {
    ok: true,
    sourceFacilityId: sourceId,
    targetFacilityId: targetId,
    movedEvents: (eventsUpdated as unknown as { rowsAffected?: number }).rowsAffected ?? 0,
    movedProfiles: (profilesUpdated as unknown as { rowsAffected?: number }).rowsAffected ?? 0,
    adminUserId: input.adminUserId,
  };
}

export async function listFacilitiesForAdminMerge(input: { search?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return { facilities: [] as Array<typeof careFacilities.$inferSelect> };

  const limit = input.limit ?? 100;
  const filters = [isNull(careFacilities.mergedIntoId)];
  if (input.search?.trim()) {
    filters.push(like(careFacilities.name, `%${input.search.trim()}%`));
  }

  const facilities = await db
    .select()
    .from(careFacilities)
    .where(and(...filters))
    .orderBy(careFacilities.name)
    .limit(limit);

  return { facilities };
}

/** Aggregate Care Signal metrics by county or country using facilityId. */
export async function getGeographicCareSignalDashboard(input: {
  level: "county" | "country";
  name: string;
  lastDays?: number;
}) {
  const db = await getDb();
  const lastDays = input.lastDays ?? 90;
  const since = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);
  const geoName = input.name.trim();

  if (!db || !geoName) {
    return emptyGeoDashboard(input.level, geoName, lastDays);
  }

  const facilityFilter =
    input.level === "county"
      ? eq(careFacilities.county, geoName)
      : eq(careFacilities.country, geoName);

  const facilitiesInGeo = await db
    .select({ id: careFacilities.id, name: careFacilities.name })
    .from(careFacilities)
    .where(and(facilityFilter, isNull(careFacilities.mergedIntoId)));

  const facilityIds = facilitiesInGeo.map((f) => f.id);
  if (facilityIds.length === 0) {
    return {
      ...emptyGeoDashboard(input.level, geoName, lastDays),
      facilitiesInArea: 0,
    };
  }

  const events = await db
    .select({
      id: careSignalEvents.id,
      facilityId: careSignalEvents.facilityId,
      systemGaps: careSignalEvents.systemGaps,
      outcome: careSignalEvents.outcome,
      status: careSignalEvents.status,
      eventDate: careSignalEvents.eventDate,
      createdAt: careSignalEvents.createdAt,
    })
    .from(careSignalEvents)
    .where(
      and(gte(careSignalEvents.createdAt, since), inArray(careSignalEvents.facilityId, facilityIds))
    );

  const gapBreakdown: Record<string, number> = {};
  const outcomeBreakdown: Record<string, number> = {};
  for (const e of events) {
    outcomeBreakdown[e.outcome] = (outcomeBreakdown[e.outcome] ?? 0) + 1;
    try {
      const gaps = JSON.parse(e.systemGaps) as string[];
      for (const g of gaps) gapBreakdown[g] = (gapBreakdown[g] ?? 0) + 1;
    } catch {
      /* skip */
    }
  }

  const topGaps = Object.entries(gapBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([gap, count]) => ({ gap, count }));

  const topFacilities = await db
    .select({
      facilityId: careSignalEvents.facilityId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(careSignalEvents)
    .where(
      and(gte(careSignalEvents.createdAt, since), inArray(careSignalEvents.facilityId, facilityIds))
    )
    .groupBy(careSignalEvents.facilityId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const facilityNameById = new Map(facilitiesInGeo.map((f) => [f.id, f.name]));

  return {
    level: input.level,
    name: geoName,
    lastDays,
    facilitiesInArea: facilityIds.length,
    totalSubmissions: events.length,
    underReviewCount: events.filter((e) => e.status === "under_review").length,
    outcomeBreakdown,
    topGaps,
    topFacilities: topFacilities.map((row) => ({
      facilityId: row.facilityId,
      facilityName: facilityNameById.get(row.facilityId ?? 0) ?? "Unknown",
      count: row.count,
    })),
  };
}

function emptyGeoDashboard(level: "county" | "country", name: string, lastDays: number) {
  return {
    level,
    name,
    lastDays,
    facilitiesInArea: 0,
    totalSubmissions: 0,
    underReviewCount: 0,
    outcomeBreakdown: {} as Record<string, number>,
    topGaps: [] as Array<{ gap: string; count: number }>,
    topFacilities: [] as Array<{ facilityId: number | null; facilityName: string; count: number }>,
  };
}

export async function listGeographicAreas() {
  const db = await getDb();
  if (!db) return { counties: [] as string[], countries: [] as string[] };

  await ensureFacilityRegistrySeeded();

  const countyRows = await db
    .selectDistinct({ county: careFacilities.county })
    .from(careFacilities)
    .where(and(isNull(careFacilities.mergedIntoId), isNotNull(careFacilities.county)));

  const countryRows = await db
    .selectDistinct({ country: careFacilities.country })
    .from(careFacilities)
    .where(isNull(careFacilities.mergedIntoId));

  return {
    counties: countyRows.map((r) => r.county).filter((c): c is string => Boolean(c?.trim())),
    countries: countryRows.map((r) => r.country).filter(Boolean),
  };
}
