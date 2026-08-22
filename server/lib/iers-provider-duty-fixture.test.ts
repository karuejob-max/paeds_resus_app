import { describe, expect, it } from "vitest";
import {
  createDisposableProviderDutyFixture,
  type ExpectedFixtureOutcome,
} from "./iers-provider-duty-fixture";

function outcome(result: { allowed: boolean; code?: string }) {
  return result.allowed ? "allowed" : result.code;
}

describe("disposable IERS provider-duty authorization matrix", () => {
  it("passes the complete denial and revocation matrix without a database", () => {
    const fixture = createDisposableProviderDutyFixture();
    const cases: Array<{ name: string; expected: ExpectedFixtureOutcome; actual: ExpectedFixtureOutcome }> = [];
    const record = (name: string, expected: ExpectedFixtureOutcome, result: { allowed: boolean; code?: string }) => {
      cases.push({ name, expected, actual: outcome(result) as ExpectedFixtureOutcome });
    };

    record(
      "assigned provider can read own active ERCo duty",
      "allowed",
      fixture.authorize({ action: "read_assignment", assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 101 }),
    );
    record(
      "non-assignee cannot read another provider duty",
      "NOT_FOUND",
      fixture.authorize({ action: "read_assignment", assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 102 }),
    );
    record(
      "cross-tenant provider cannot read a duty",
      "NOT_FOUND",
      fixture.authorize({ action: "read_assignment", assignmentId: 2001, requestedInstitutionId: 1, requestingUserId: 201 }),
    );
    record(
      "assigned provider cannot accept an ended duty",
      "BAD_REQUEST",
      fixture.respond({ assignmentId: 1005, requestedInstitutionId: 1, requestingUserId: 101, response: "accept" }),
    );
    record(
      "declining a duty without a reason is rejected",
      "BAD_REQUEST",
      fixture.respond({ assignmentId: 1003, requestedInstitutionId: 1, requestingUserId: 101, response: "decline" }),
    );
    record(
      "declining a duty with a reason is allowed",
      "allowed",
      fixture.respond({ assignmentId: 1003, requestedInstitutionId: 1, requestingUserId: 101, response: "decline", declineReason: "Rostered elsewhere" }),
    );
    record(
      "accepted active UTL can sign off readiness",
      "allowed",
      fixture.signOffReadiness({ assignmentId: 1004, requestedInstitutionId: 1, requestingUserId: 101 }),
    );
    record(
      "pending acceptance cannot sign off readiness",
      "BAD_REQUEST",
      fixture.signOffReadiness({ assignmentId: 1003, requestedInstitutionId: 1, requestingUserId: 101 }),
    );

    fixture.revokeMembership(1, 101);
    record(
      "revoked membership cannot read a previously visible duty",
      "FORBIDDEN",
      fixture.authorize({ action: "read_assignment", assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 101 }),
    );
    record(
      "revoked membership cannot accept or decline an old duty",
      "FORBIDDEN",
      fixture.respond({ assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 101, response: "accept" }),
    );

    const roleRevocationFixture = createDisposableProviderDutyFixture();
    roleRevocationFixture.revokeIersRole(1, 101);
    record(
      "revoked IERS role cannot read provider readiness",
      "FORBIDDEN",
      roleRevocationFixture.authorize({ action: "read_readiness", assignmentId: 1004, requestedInstitutionId: 1, requestingUserId: 101 }),
    );
    record(
      "revoked IERS role cannot sign off readiness",
      "FORBIDDEN",
      roleRevocationFixture.signOffReadiness({ assignmentId: 1004, requestedInstitutionId: 1, requestingUserId: 101 }),
    );

    const reassignmentFixture = createDisposableProviderDutyFixture();
    reassignmentFixture.resetDutyAcceptance(1001, 102);
    record(
      "reassignment resets acceptance before the new provider responds",
      "BAD_REQUEST",
      reassignmentFixture.signOffReadiness({ assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 102 }),
    );
    record(
      "new assignee can accept after reassignment",
      "allowed",
      reassignmentFixture.respond({ assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 102, response: "accept" }),
    );

    expect(cases).toHaveLength(14);
    expect(cases.filter((testCase) => testCase.actual !== testCase.expected)).toEqual([]);
  });

  it("is resettable and cannot leak state between tenant scenarios", () => {
    const first = createDisposableProviderDutyFixture();
    first.revokeMembership(1, 101);
    const second = createDisposableProviderDutyFixture();

    expect(first.memberships.find((membership) => membership.institutionId === 1 && membership.userId === 101)?.membershipStatus).toBe("ended");
    expect(second.memberships.find((membership) => membership.institutionId === 1 && membership.userId === 101)?.membershipStatus).toBe("active");
    expect(second.authorize({ action: "read_assignment", assignmentId: 1001, requestedInstitutionId: 1, requestingUserId: 101 })).toMatchObject({ allowed: true, assignmentId: 1001 });
  });
});
