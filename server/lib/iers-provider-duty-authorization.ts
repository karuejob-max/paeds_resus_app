export type ProviderDutyResponse = "accept" | "decline";

export type ProviderDutyAuthorizationAction =
  | "read_assignment"
  | "respond_to_assignment"
  | "read_readiness"
  | "sign_off_readiness";

export type ProviderDutyAuthorizationCode = "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST";

export type ProviderDutyAuthorizationInput = {
  action: ProviderDutyAuthorizationAction;
  requestedInstitutionId: number;
  assignmentInstitutionId: number;
  requestingUserId: number;
  assignedUserId: number | null;
  membershipStatus?: string | null;
  iersRoleStatus?: string | null;
  assignmentStatus?: string | null;
  response?: ProviderDutyResponse;
  declineReason?: string | null;
  shiftStatus?: string | null;
  acceptedAt?: Date | string | null;
};

export type ProviderDutyAuthorizationDecision =
  | { allowed: true }
  | {
      allowed: false;
      code: ProviderDutyAuthorizationCode;
      reason: string;
    };

function deny(code: ProviderDutyAuthorizationCode, reason: string): ProviderDutyAuthorizationDecision {
  return { allowed: false, code, reason };
}

/**
 * Shared provider-duty policy used by the institution duty response surface and
 * the provider-owned readiness surface.
 *
 * A dated duty is not a substitute for tenant scope or active membership. The
 * duty itself remains distinct from the standing IERS product-role record: an
 * assigned provider may accept or decline a duty while their IERS product role
 * is being managed, but readiness and operational provider actions still
 * require an active IERS role.
 */
export function evaluateProviderDutyAuthorization(
  input: ProviderDutyAuthorizationInput,
): ProviderDutyAuthorizationDecision {
  if (input.assignmentInstitutionId !== input.requestedInstitutionId) {
    return deny("NOT_FOUND", "This provider duty is not available in the requested institution context.");
  }

  if (input.assignedUserId !== input.requestingUserId) {
    return deny("NOT_FOUND", "This provider duty is not assigned to the requesting provider.");
  }

  if (input.membershipStatus !== "active") {
    return deny("FORBIDDEN", "The provider must have an active institution membership.");
  }

  if (
    (input.action === "read_readiness" || input.action === "sign_off_readiness") &&
    input.iersRoleStatus !== "active"
  ) {
    return deny("FORBIDDEN", "Provider readiness operations require an active IERS responsibility role.");
  }

  if (
    (input.action === "respond_to_assignment" || input.action === "sign_off_readiness") &&
    input.assignmentStatus === "ended"
  ) {
    return deny("BAD_REQUEST", "This provider duty has ended.");
  }

  if (input.action === "respond_to_assignment" && input.response === "decline" && !input.declineReason?.trim()) {
    return deny("BAD_REQUEST", "A decline reason is required so the institution can arrange cover.");
  }

  if (input.action === "sign_off_readiness") {
    if (input.shiftStatus !== "active" || input.assignmentStatus !== "active" || !input.acceptedAt) {
      return deny("BAD_REQUEST", "Readiness requires an active shift assignment explicitly accepted by the provider.");
    }
  }

  return { allowed: true };
}
