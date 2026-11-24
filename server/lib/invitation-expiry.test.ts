import { describe, expect, it } from "vitest";
import {
  INVITATION_TTL_DAYS,
  RECOVERY_INVITATION_TTL_DAYS,
  invitationExpiresAt,
  invitationTtlDays,
  isInvitationExpired,
  updateMatchedNoRows,
} from "./invitation-expiry";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-30T00:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY);

describe("invitation expiry", () => {
  it("is live inside the window and expired at or after it", () => {
    expect(isInvitationExpired(ago(INVITATION_TTL_DAYS - 1), INVITATION_TTL_DAYS, now)).toBe(false);
    expect(isInvitationExpired(ago(INVITATION_TTL_DAYS), INVITATION_TTL_DAYS, now)).toBe(true);
    expect(isInvitationExpired(ago(INVITATION_TTL_DAYS + 5), INVITATION_TTL_DAYS, now)).toBe(true);
  });

  it("fails closed when the send time is missing", () => {
    expect(isInvitationExpired(null)).toBe(true);
    expect(isInvitationExpired(undefined)).toBe(true);
  });

  it("recovery grants get the longer window", () => {
    expect(invitationTtlDays("recovery_approval")).toBe(RECOVERY_INVITATION_TTL_DAYS);
    expect(invitationTtlDays("admin_invite")).toBe(INVITATION_TTL_DAYS);
    expect(isInvitationExpired(ago(20), invitationTtlDays("recovery_approval"), now)).toBe(false);
    expect(isInvitationExpired(ago(20), invitationTtlDays("admin_invite"), now)).toBe(true);
  });

  it("re-sending resets the clock", () => {
    const sent = ago(30);
    expect(isInvitationExpired(sent, INVITATION_TTL_DAYS, now)).toBe(true);
    expect(isInvitationExpired(now, INVITATION_TTL_DAYS, now)).toBe(false);
    expect(invitationExpiresAt(now).getTime() - now.getTime()).toBe(INVITATION_TTL_DAYS * DAY);
  });

  it("detects an UPDATE that matched no rows", () => {
    expect(updateMatchedNoRows([{ affectedRows: 0 }, undefined])).toBe(true);
    expect(updateMatchedNoRows([{ affectedRows: 1 }, undefined])).toBe(false);
    expect(updateMatchedNoRows(undefined)).toBe(false);
  });
});
