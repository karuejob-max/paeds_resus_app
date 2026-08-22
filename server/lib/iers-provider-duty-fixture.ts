import {
  evaluateProviderDutyAuthorization,
  type ProviderDutyAuthorizationAction,
  type ProviderDutyAuthorizationCode,
  type ProviderDutyAuthorizationDecision,
  type ProviderDutyResponse,
} from "./iers-provider-duty-authorization";

type FixtureMembershipStatus = "active" | "suspended" | "ended";
type FixtureRoleStatus = "active" | "suspended" | "ended";
type FixtureAssignmentStatus = "pending_acceptance" | "active" | "declined" | "ended";

type FixtureUser = {
  id: number;
  name: string;
};

type FixtureMembership = {
  institutionId: number;
  userId: number;
  membershipStatus: FixtureMembershipStatus;
  iersRoleStatus: FixtureRoleStatus;
};

export type DisposableProviderDutyKind = "erco" | "backup" | "ertl" | "utl";

export type DisposableProviderDuty = {
  id: number;
  kind: DisposableProviderDutyKind;
  institutionId: number;
  assignedUserId: number;
  assignmentStatus: FixtureAssignmentStatus;
  shiftStatus: "active" | "completed";
  acceptedAt: Date | null;
};

export type FixtureAuthorizationRequest = {
  action: ProviderDutyAuthorizationAction;
  assignmentId: number;
  requestedInstitutionId: number;
  requestingUserId: number;
  response?: ProviderDutyResponse;
  declineReason?: string | null;
};

export type FixtureAuthorizationResult = ProviderDutyAuthorizationDecision & {
  assignmentId: number;
};

const ACCEPTED_AT = new Date("2026-08-22T08:00:00.000Z");

/**
 * A production-shaped but entirely in-memory IERS authorization fixture.
 *
 * It deliberately uses two tenant IDs and two providers so every provider read
 * and write can be exercised without creating database rows or using a real
 * institution. The fixture is suitable for local CI and can be reset by
 * creating a new instance.
 */
export function createDisposableProviderDutyFixture() {
  const users: FixtureUser[] = [
    { id: 101, name: "Fixture Assigned Provider" },
    { id: 102, name: "Fixture Unrelated Provider" },
    { id: 201, name: "Fixture Other-Tenant Provider" },
  ];

  const memberships: FixtureMembership[] = [
    { institutionId: 1, userId: 101, membershipStatus: "active", iersRoleStatus: "active" },
    { institutionId: 1, userId: 102, membershipStatus: "active", iersRoleStatus: "active" },
    { institutionId: 2, userId: 201, membershipStatus: "active", iersRoleStatus: "active" },
  ];

  const duties: DisposableProviderDuty[] = [
    { id: 1001, kind: "erco", institutionId: 1, assignedUserId: 101, assignmentStatus: "active", shiftStatus: "active", acceptedAt: ACCEPTED_AT },
    { id: 1002, kind: "backup", institutionId: 1, assignedUserId: 101, assignmentStatus: "active", shiftStatus: "active", acceptedAt: ACCEPTED_AT },
    { id: 1003, kind: "ertl", institutionId: 1, assignedUserId: 101, assignmentStatus: "pending_acceptance", shiftStatus: "active", acceptedAt: null },
    { id: 1004, kind: "utl", institutionId: 1, assignedUserId: 101, assignmentStatus: "active", shiftStatus: "active", acceptedAt: ACCEPTED_AT },
    { id: 1005, kind: "utl", institutionId: 1, assignedUserId: 101, assignmentStatus: "ended", shiftStatus: "completed", acceptedAt: ACCEPTED_AT },
    { id: 2001, kind: "utl", institutionId: 2, assignedUserId: 201, assignmentStatus: "active", shiftStatus: "active", acceptedAt: ACCEPTED_AT },
  ];

  function getDuty(assignmentId: number) {
    return duties.find((duty) => duty.id === assignmentId) ?? null;
  }

  function getMembership(institutionId: number, userId: number) {
    return memberships.find(
      (membership) => membership.institutionId === institutionId && membership.userId === userId,
    ) ?? null;
  }

  function authorize(request: FixtureAuthorizationRequest): FixtureAuthorizationResult {
    const duty = getDuty(request.assignmentId);
    if (!duty) {
      return {
        assignmentId: request.assignmentId,
        allowed: false,
        code: "NOT_FOUND",
        reason: "This provider duty does not exist in the disposable fixture.",
      };
    }

    const membership = getMembership(duty.institutionId, request.requestingUserId);
    const decision = evaluateProviderDutyAuthorization({
      action: request.action,
      requestedInstitutionId: request.requestedInstitutionId,
      assignmentInstitutionId: duty.institutionId,
      requestingUserId: request.requestingUserId,
      assignedUserId: duty.assignedUserId,
      membershipStatus: membership?.membershipStatus,
      iersRoleStatus: membership?.iersRoleStatus,
      assignmentStatus: duty.assignmentStatus,
      response: request.response,
      declineReason: request.declineReason,
      shiftStatus: duty.shiftStatus,
      acceptedAt: duty.acceptedAt,
    });

    return { ...decision, assignmentId: request.assignmentId };
  }

  function respond(request: Omit<FixtureAuthorizationRequest, "action">): FixtureAuthorizationResult {
    const result = authorize({ ...request, action: "respond_to_assignment" });
    if (result.allowed) {
      const duty = getDuty(request.assignmentId);
      if (duty) {
        duty.assignmentStatus = request.response === "accept" ? "active" : "declined";
        duty.acceptedAt = request.response === "accept" ? new Date(ACCEPTED_AT) : null;
      }
    }
    return result;
  }

  function signOffReadiness(request: Omit<FixtureAuthorizationRequest, "action">): FixtureAuthorizationResult {
    return authorize({ ...request, action: "sign_off_readiness" });
  }

  function revokeMembership(institutionId: number, userId: number, membershipStatus: FixtureMembershipStatus = "ended") {
    const membership = getMembership(institutionId, userId);
    if (!membership) throw new Error("Fixture membership not found.");
    membership.membershipStatus = membershipStatus;
  }

  function revokeIersRole(institutionId: number, userId: number, roleStatus: FixtureRoleStatus = "ended") {
    const membership = getMembership(institutionId, userId);
    if (!membership) throw new Error("Fixture membership not found.");
    membership.iersRoleStatus = roleStatus;
  }

  function endDuty(assignmentId: number) {
    const duty = getDuty(assignmentId);
    if (!duty) throw new Error("Fixture duty not found.");
    duty.assignmentStatus = "ended";
    duty.shiftStatus = "completed";
  }

  function resetDutyAcceptance(assignmentId: number, assignedUserId: number) {
    const duty = getDuty(assignmentId);
    if (!duty) throw new Error("Fixture duty not found.");
    duty.assignedUserId = assignedUserId;
    duty.assignmentStatus = "pending_acceptance";
    duty.acceptedAt = null;
  }

  return {
    institutions: [
      { id: 1, name: "Fixture Hospital Alpha" },
      { id: 2, name: "Fixture Hospital Bravo" },
    ],
    users,
    memberships,
    duties,
    authorize,
    respond,
    signOffReadiness,
    revokeMembership,
    revokeIersRole,
    endDuty,
    resetDutyAcceptance,
  };
}

export function formatFixtureDecision(result: FixtureAuthorizationResult) {
  return result.allowed ? "allowed" : `${result.code}: ${result.reason}`;
}

export type ExpectedFixtureOutcome = "allowed" | ProviderDutyAuthorizationCode;
