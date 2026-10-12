import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.qa", override: false });

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";

import {
  facilityDepartments,
  facilityPoles,
  institutionMemberships,
  institutionProductEntitlements,
  institutionProductRoles,
  institutionalProductCapabilities,
  institutionalAccountAdmins,
  institutionalAccounts,
  institutionalProducts,
  institutionProductSubscriptions,
  institutionalStaffMembers,
  professionalCredentials,
  shiftUtlRosters,
  users,
} from "../drizzle/schema";
import { getDb } from "../server/db";

const QA_INSTITUTION_NAME = "Paeds Resus QA Test Institution";
const PRIMARY_ADMIN_EMAIL = (
  process.env.QA_PRIMARY_ADMIN_EMAIL ?? "karuejob@gmail.com"
)
  .trim()
  .toLowerCase();
const SECOND_ADMIN_EMAIL = (
  process.env.QA_SECOND_ADMIN_EMAIL ?? "paedsresus254@gmail.com"
)
  .trim()
  .toLowerCase();
const QA_PASSWORD = process.env.QA_TEST_PASSWORD;

const SAMPLE_ACCOUNTS = [
  {
    key: "coordinator",
    email: "qa.iers.coordinator@paedsresus.test",
    name: "QA IERS Coordinator",
    providerType: "nurse" as const,
  },
  {
    key: "nurse",
    email: "qa.duty.nurse@paedsresus.test",
    name: "QA Duty Nurse",
    providerType: "nurse" as const,
  },
  {
    key: "doctor",
    email: "qa.doctor@paedsresus.test",
    name: "QA Doctor",
    providerType: "doctor" as const,
  },
  {
    key: "reviewer",
    email: "qa.reviewer@paedsresus.test",
    name: "QA IERS Reviewer",
    providerType: "nurse" as const,
  },
];

function requirePassword() {
  if (
    !QA_PASSWORD ||
    QA_PASSWORD.length < 8 ||
    !/[a-zA-Z]/.test(QA_PASSWORD) ||
    !/\d/.test(QA_PASSWORD)
  ) {
    throw new Error(
      "QA_TEST_PASSWORD is required and must be at least 8 characters with a letter and a number. It is intentionally not stored in the repository."
    );
  }
  return QA_PASSWORD;
}

async function findUser(db: Awaited<ReturnType<typeof getDb>>, email: string) {
  if (!db) throw new Error("Database connection failed");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

async function ensureQaUser(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  account: (typeof SAMPLE_ACCOUNTS)[number],
  passwordHash: string
) {
  const existing = await findUser(db, account.email);
  if (existing) {
    await db
      .update(users)
      .set({
        openId: `email:${account.email}`,
        name: account.name,
        loginMethod: "email",
        passwordHash,
        userType: "individual",
        providerType: account.providerType,
        role: "user",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(users).values({
    openId: `email:${account.email}`,
    email: account.email,
    name: account.name,
    loginMethod: "email",
    passwordHash,
    userType: "individual",
    providerType: account.providerType,
    role: "user",
  });
  void result;
  const created = await findUser(db, account.email);
  if (!created)
    throw new Error(
      `QA user could not be created or read back: ${account.email}`
    );
  return created.id;
}

async function ensureQaLicence(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  institutionId: number,
  userId: number,
  providerType: string,
  verifiedByUserId: number
) {
  const [existing] = await db
    .select({ id: professionalCredentials.id })
    .from(professionalCredentials)
    .where(
      and(
        eq(professionalCredentials.userId, userId),
        eq(professionalCredentials.credentialType, "regulatory_license"),
        eq(professionalCredentials.sourceRecordType, "qa_fixture"),
        eq(professionalCredentials.sourceRecordId, institutionId)
      )
    )
    .limit(1);
  const values = {
    sourceType: "regulatory" as const,
    issuer: "QA fixture regulator (non-clinical test data)",
    jurisdiction: "KE",
    cadre: providerType,
    credentialNumber: `QA-${institutionId}-${userId}`,
    issuedAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt: new Date("2027-12-31T23:59:59.000Z"),
    status: "verified" as const,
    verifiedByUserId,
    verifiedAt: new Date(),
    sourceRecordType: "qa_fixture",
    sourceRecordId: institutionId,
    reviewReason: "QA fixture only; not evidence of real clinical licensure.",
    updatedAt: new Date(),
  };
  if (existing) {
    await db
      .update(professionalCredentials)
      .set(values)
      .where(eq(professionalCredentials.id, existing.id));
  } else {
    await db
      .insert(professionalCredentials)
      .values({ userId, credentialType: "regulatory_license", ...values });
  }
}

async function ensureAdminLink(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  institutionId: number,
  userId: number
) {
  const [existing] = await db
    .select({ id: institutionalAccountAdmins.id })
    .from(institutionalAccountAdmins)
    .where(
      and(
        eq(institutionalAccountAdmins.institutionalAccountId, institutionId),
        eq(institutionalAccountAdmins.userId, userId)
      )
    )
    .limit(1);
  if (!existing) {
    await db.insert(institutionalAccountAdmins).values({
      institutionalAccountId: institutionId,
      userId,
      addedByUserId: null,
    });
  }
}

async function ensureMembership(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  institutionId: number,
  userId: number,
  email: string,
  staffMemberId: number,
  responsibilityRole: "general_staff" | "er_coordinator" | "ert_responder"
) {
  const [existing] = await db
    .select({ id: institutionMemberships.id })
    .from(institutionMemberships)
    .where(
      and(
        eq(institutionMemberships.institutionalAccountId, institutionId),
        eq(institutionMemberships.invitedEmail, email)
      )
    )
    .limit(1);
  if (existing) {
    await db
      .update(institutionMemberships)
      .set({
        userId,
        staffMemberId,
        membershipStatus: "active",
        responsibilityRole,
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(institutionMemberships.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(institutionMemberships).values({
    institutionalAccountId: institutionId,
    userId,
    invitedEmail: email,
    staffMemberId,
    membershipStatus: "active",
    responsibilityRole,
    acceptedAt: new Date(),
  });
  return (result as unknown as { insertId: number }).insertId;
}

async function ensureStaff(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  institutionId: number,
  userId: number,
  email: string,
  name: string,
  staffRole: "nurse" | "doctor",
  departmentId: number
) {
  const [existing] = await db
    .select({ id: institutionalStaffMembers.id })
    .from(institutionalStaffMembers)
    .where(
      and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        eq(institutionalStaffMembers.staffEmail, email)
      )
    )
    .limit(1);
  if (existing) {
    await db
      .update(institutionalStaffMembers)
      .set({
        userId,
        staffName: name,
        staffRole,
        department: "Emergency Department",
        facilityDepartmentId: departmentId,
        facilityLinkStatus: "linked",
        updatedAt: new Date(),
      })
      .where(eq(institutionalStaffMembers.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(institutionalStaffMembers).values({
    institutionalAccountId: institutionId,
    userId,
    staffName: name,
    staffEmail: email,
    staffRole,
    department: "Emergency Department",
    facilityDepartmentId: departmentId,
    governanceRole: "general_staff",
    institutionalRole: "staff_member",
    facilityLinkStatus: "linked",
    enrollmentStatus: "enrolled",
  });
  void result;
  const [created] = await db
    .select({ id: institutionalStaffMembers.id })
    .from(institutionalStaffMembers)
    .where(
      and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        eq(institutionalStaffMembers.staffEmail, email)
      )
    )
    .limit(1);
  if (!created)
    throw new Error(
      `QA staff member could not be created or read back: ${email}`
    );
  return created.id;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const passwordHash = await bcrypt.hash(requirePassword(), 10);

  const primary = await findUser(db, PRIMARY_ADMIN_EMAIL);
  const second = await findUser(db, SECOND_ADMIN_EMAIL);
  if (!primary || !second) {
    throw new Error(
      `Both existing admin accounts are required: ${PRIMARY_ADMIN_EMAIL} and ${SECOND_ADMIN_EMAIL}.`
    );
  }

  let [institution] = await db
    .select()
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.companyName, QA_INSTITUTION_NAME))
    .limit(1);
  if (!institution) {
    const result = await db.insert(institutionalAccounts).values({
      userId: primary.id,
      companyName: QA_INSTITUTION_NAME,
      industry: "healthcare_facility",
      organizationCategory: "healthcare_facility",
      facilityOwnership: "public",
      facilityCareLevel: "primary_level_4",
      staffCount: 4,
      contactName: primary.name?.trim() || PRIMARY_ADMIN_EMAIL,
      contactEmail: PRIMARY_ADMIN_EMAIL,
      contactPhone: "+254700000000",
      registrationNumber: "QA-NOT-FOR-PRODUCTION",
      status: "active",
    });
    void result;
    [institution] = await db
      .select()
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.companyName, QA_INSTITUTION_NAME))
      .limit(1);
  }
  if (!institution)
    throw new Error("QA institution could not be created or read back");

  await ensureAdminLink(db, institution.id, primary.id);
  await ensureAdminLink(db, institution.id, second.id);

  let [pole] = await db
    .select()
    .from(facilityPoles)
    .where(eq(facilityPoles.institutionId, institution.id))
    .limit(1);
  if (!pole) {
    const result = await db.insert(facilityPoles).values({
      institutionId: institution.id,
      poleName: "North Pole",
      poleOrder: 1,
      rotationAnchorDate: "2026-01-05",
    });
    void result;
    [pole] = await db
      .select()
      .from(facilityPoles)
      .where(
        and(
          eq(facilityPoles.institutionId, institution.id),
          eq(facilityPoles.poleName, "North Pole")
        )
      )
      .limit(1);
  }
  if (!pole) throw new Error("QA pole could not be created or read back");

  let [department] = await db
    .select()
    .from(facilityDepartments)
    .where(
      and(
        eq(facilityDepartments.institutionId, institution.id),
        eq(facilityDepartments.departmentName, "Emergency Department")
      )
    )
    .limit(1);
  if (!department) {
    const result = await db.insert(facilityDepartments).values({
      institutionId: institution.id,
      poleId: pole.id,
      departmentName: "Emergency Department",
      isActive: true,
      requiresPole: true,
      poleSequence: 1,
      confirmedAt: new Date(),
      confirmedByUserId: primary.id,
    });
    void result;
    [department] = await db
      .select()
      .from(facilityDepartments)
      .where(
        and(
          eq(facilityDepartments.institutionId, institution.id),
          eq(facilityDepartments.departmentName, "Emergency Department")
        )
      )
      .limit(1);
  }
  if (!department)
    throw new Error("QA department could not be created or read back");

  const sampleUsers = new Map<string, number>();
  for (const account of SAMPLE_ACCOUNTS) {
    sampleUsers.set(account.key, await ensureQaUser(db, account, passwordHash));
  }

  const coordinatorId = sampleUsers.get("coordinator")!;
  const nurseId = sampleUsers.get("nurse")!;
  const doctorId = sampleUsers.get("doctor")!;
  const reviewerId = sampleUsers.get("reviewer")!;
  for (const account of SAMPLE_ACCOUNTS) {
    await ensureQaLicence(
      db,
      institution.id,
      sampleUsers.get(account.key)!,
      account.providerType,
      primary.id
    );
  }
  const coordinatorStaffId = await ensureStaff(
    db,
    institution.id,
    coordinatorId,
    SAMPLE_ACCOUNTS[0].email,
    SAMPLE_ACCOUNTS[0].name,
    "nurse",
    department.id
  );
  const nurseStaffId = await ensureStaff(
    db,
    institution.id,
    nurseId,
    SAMPLE_ACCOUNTS[1].email,
    SAMPLE_ACCOUNTS[1].name,
    "nurse",
    department.id
  );
  const doctorStaffId = await ensureStaff(
    db,
    institution.id,
    doctorId,
    SAMPLE_ACCOUNTS[2].email,
    SAMPLE_ACCOUNTS[2].name,
    "doctor",
    department.id
  );
  const reviewerStaffId = await ensureStaff(
    db,
    institution.id,
    reviewerId,
    SAMPLE_ACCOUNTS[3].email,
    SAMPLE_ACCOUNTS[3].name,
    "nurse",
    department.id
  );

  await ensureMembership(
    db,
    institution.id,
    coordinatorId,
    SAMPLE_ACCOUNTS[0].email,
    coordinatorStaffId,
    "er_coordinator"
  );
  await ensureMembership(
    db,
    institution.id,
    nurseId,
    SAMPLE_ACCOUNTS[1].email,
    nurseStaffId,
    "ert_responder"
  );
  await ensureMembership(
    db,
    institution.id,
    doctorId,
    SAMPLE_ACCOUNTS[2].email,
    doctorStaffId,
    "general_staff"
  );
  await ensureMembership(
    db,
    institution.id,
    reviewerId,
    SAMPLE_ACCOUNTS[3].email,
    reviewerStaffId,
    "general_staff"
  );

  const [iersProduct] = await db
    .select({ id: institutionalProducts.id })
    .from(institutionalProducts)
    .where(eq(institutionalProducts.productKey, "iers"))
    .limit(1);
  if (!iersProduct)
    throw new Error(
      "The institutional IERS product registry entry is missing; run the current migrations/seed first."
    );
  const [existingIersSubscription] = await db
    .select({ id: institutionProductSubscriptions.id })
    .from(institutionProductSubscriptions)
    .where(
      and(
        eq(
          institutionProductSubscriptions.institutionalAccountId,
          institution.id
        ),
        eq(institutionProductSubscriptions.productId, iersProduct.id)
      )
    )
    .limit(1);
  if (existingIersSubscription) {
    await db
      .update(institutionProductSubscriptions)
      .set({
        subscriptionStatus: "active",
        source: "pilot",
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        notes: "Local QA fixture; not a commercial entitlement.",
      })
      .where(
        eq(institutionProductSubscriptions.id, existingIersSubscription.id)
      );
  } else {
    await db.insert(institutionProductSubscriptions).values({
      institutionalAccountId: institution.id,
      productId: iersProduct.id,
      subscriptionStatus: "active",
      source: "pilot",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      pricingTier: "founding_partner",
      dataSharingStatus: "consented",
      notes: "Local QA fixture; not a commercial entitlement.",
    });
  }
  const [qaIersSubscription] = await db
    .select({ id: institutionProductSubscriptions.id })
    .from(institutionProductSubscriptions)
    .where(
      and(
        eq(
          institutionProductSubscriptions.institutionalAccountId,
          institution.id
        ),
        eq(institutionProductSubscriptions.productId, iersProduct.id)
      )
    )
    .limit(1);
  if (!qaIersSubscription)
    throw new Error("The QA IERS subscription could not be read back.");
  const iersCapabilities = await db
    .select({ capabilityKey: institutionalProductCapabilities.capabilityKey })
    .from(institutionalProductCapabilities)
    .where(
      and(
        eq(institutionalProductCapabilities.productId, iersProduct.id),
        eq(institutionalProductCapabilities.status, "active")
      )
    );
  for (const capability of iersCapabilities) {
    const [existingEntitlement] = await db
      .select({ id: institutionProductEntitlements.id })
      .from(institutionProductEntitlements)
      .where(
        and(
          eq(
            institutionProductEntitlements.institutionalAccountId,
            institution.id
          ),
          eq(institutionProductEntitlements.productId, iersProduct.id),
          eq(
            institutionProductEntitlements.capabilityKey,
            capability.capabilityKey
          )
        )
      )
      .limit(1);
    const entitlement = {
      subscriptionId: qaIersSubscription.id,
      entitlementStatus: "active" as const,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date(),
    };
    if (existingEntitlement) {
      await db
        .update(institutionProductEntitlements)
        .set(entitlement)
        .where(eq(institutionProductEntitlements.id, existingEntitlement.id));
    } else {
      await db.insert(institutionProductEntitlements).values({
        institutionalAccountId: institution.id,
        productId: iersProduct.id,
        capabilityKey: capability.capabilityKey,
        ...entitlement,
      });
    }
  }
  const roles = [
    [coordinatorId, SAMPLE_ACCOUNTS[0].email, "iers_coordinator"],
    [nurseId, SAMPLE_ACCOUNTS[1].email, "iers_responder"],
    [reviewerId, SAMPLE_ACCOUNTS[3].email, "iers_reviewer"],
  ] as const;
  for (const [userId, email, roleKey] of roles) {
    const [existingRole] = await db
      .select({ id: institutionProductRoles.id })
      .from(institutionProductRoles)
      .where(
        and(
          eq(institutionProductRoles.institutionalAccountId, institution.id),
          eq(institutionProductRoles.productId, iersProduct.id),
          eq(institutionProductRoles.invitedEmail, email),
          eq(institutionProductRoles.roleKey, roleKey)
        )
      )
      .limit(1);
    if (existingRole) {
      await db
        .update(institutionProductRoles)
        .set({
          userId,
          roleStatus: "active",
          grantedByUserId: primary.id,
          updatedAt: new Date(),
        })
        .where(eq(institutionProductRoles.id, existingRole.id));
    } else {
      await db.insert(institutionProductRoles).values({
        institutionalAccountId: institution.id,
        productId: iersProduct.id,
        userId,
        invitedEmail: email,
        roleKey,
        roleStatus: "active",
        grantedByUserId: primary.id,
      });
    }
  }

  const shiftDate = new Date();
  shiftDate.setDate(shiftDate.getDate() + ((8 - shiftDate.getDay()) % 7 || 7));
  const shiftDateValue = shiftDate.toISOString().slice(0, 10);
  const [existingRoster] = await db
    .select({ id: shiftUtlRosters.id })
    .from(shiftUtlRosters)
    .where(
      and(
        eq(shiftUtlRosters.institutionId, institution.id),
        eq(shiftUtlRosters.poleId, pole.id),
        eq(shiftUtlRosters.departmentId, department.id),
        eq(shiftUtlRosters.shiftDate, shiftDateValue as never),
        eq(shiftUtlRosters.shiftType, "morning")
      )
    )
    .limit(1);
  if (!existingRoster) {
    await db.insert(shiftUtlRosters).values({
      institutionId: institution.id,
      poleId: pole.id,
      departmentId: department.id,
      shiftDate: shiftDateValue,
      shiftType: "morning",
      shiftStartTime: "07:30:00",
      shiftEndTime: "17:30:00",
      shiftEndDayOffset: 0,
      utlUserId: nurseId,
      isShiftErtl: true,
      assignmentStatus: "pending_acceptance",
      status: "active",
    });
  }

  console.log(
    JSON.stringify(
      {
        institutionId: institution.id,
        institutionName: institution.companyName,
        primaryAdmin: PRIMARY_ADMIN_EMAIL,
        secondAdmin: SECOND_ADMIN_EMAIL,
        sampleAccounts: SAMPLE_ACCOUNTS.map(({ key, email, name }) => ({
          key,
          email,
          name,
        })),
        pole: pole.poleName,
        department: department.departmentName,
        seededRotaDate: shiftDateValue,
        passwordSource:
          "QA_TEST_PASSWORD environment variable (not stored in repository)",
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
