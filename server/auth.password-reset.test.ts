import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as emailService from "./email-service";
import { randomBytes } from "crypto";

// Mock dependencies
vi.mock("./db");
vi.mock("./email-service");

describe("Password Reset Flow", () => {
  const mockUser = {
    id: 1,
    openId: "email:test@example.com",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "$2a$10$mockHashedPassword",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "email",
    userType: "individual" as const,
    phone: null,
    institutionalRole: null,
    providerType: null,
    instructorApprovedAt: null,
    instructorNumber: null,
    instructorCertifiedAt: null,
    resusGpsAccessExpiresAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should request password reset and send email", async () => {
    const mockCtx = {
      user: null,
      req: { ip: "127.0.0.1" },
      res: {},
    };

    vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(db.createPasswordResetToken).mockResolvedValue(undefined);
    vi.mocked(emailService.sendEmail).mockResolvedValue({ success: true, messageId: "msg-123" });

    const caller = appRouter.createCaller(mockCtx);
    const result = await caller.auth.requestPasswordReset({ email: "test@example.com" });

    expect(result.success).toBe(true);
    expect(db.createPasswordResetToken).toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "passwordReset",
      expect.objectContaining({
        userName: "Test User",
        resetLink: expect.stringContaining("/reset-password?token="),
      })
    );
  });

  it("should not leak user existence on password reset request", async () => {
    const mockCtx = {
      user: null,
      req: { ip: "127.0.0.1" },
      res: {},
    };

    vi.mocked(db.getUserByEmail).mockResolvedValue(null);

    const caller = appRouter.createCaller(mockCtx);
    const result = await caller.auth.requestPasswordReset({ email: "nonexistent@example.com" });

    // Should return success even if user doesn't exist (security best practice)
    expect(result.success).toBe(true);
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it("should reset password with valid token", async () => {
    const mockCtx = {
      user: null,
      req: { ip: "127.0.0.1" },
      res: {},
    };

    const mockToken = randomBytes(32).toString("hex");
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    vi.mocked(db.getPasswordResetTokenByToken).mockResolvedValue({
      userId: mockUser.id,
      token: mockToken,
      expiresAt: futureDate,
      createdAt: new Date(),
    });
    vi.mocked(db.updateUserPasswordById).mockResolvedValue(undefined);
    vi.mocked(db.deletePasswordResetToken).mockResolvedValue(undefined);
    vi.mocked(db.createAuditLog).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(mockCtx);
    const result = await caller.auth.resetPassword({
      token: mockToken,
      newPassword: "NewPassword123",
    });

    expect(result.success).toBe(true);
    expect(db.updateUserPasswordById).toHaveBeenCalledWith(mockUser.id, expect.any(String));
    expect(db.deletePasswordResetToken).toHaveBeenCalledWith(mockToken);
  });

  it("should reject expired reset token", async () => {
    const mockCtx = {
      user: null,
      req: { ip: "127.0.0.1" },
      res: {},
    };

    const mockToken = randomBytes(32).toString("hex");
    const pastDate = new Date(Date.now() - 1000); // Expired 1 second ago

    vi.mocked(db.getPasswordResetTokenByToken).mockResolvedValue({
      userId: mockUser.id,
      token: mockToken,
      expiresAt: pastDate,
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    vi.mocked(db.deletePasswordResetToken).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(mockCtx);

    await expect(
      caller.auth.resetPassword({
        token: mockToken,
        newPassword: "NewPassword123",
      })
    ).rejects.toThrow("Reset link has expired");

    expect(db.deletePasswordResetToken).toHaveBeenCalledWith(mockToken);
  });

  it("should reject invalid reset token", async () => {
    const mockCtx = {
      user: null,
      req: { ip: "127.0.0.1" },
      res: {},
    };

    vi.mocked(db.getPasswordResetTokenByToken).mockResolvedValue(null);

    const caller = appRouter.createCaller(mockCtx);

    await expect(
      caller.auth.resetPassword({
        token: "invalid-token",
        newPassword: "NewPassword123",
      })
    ).rejects.toThrow("Invalid or expired reset link");
  });

  it("should validate password strength on reset", async () => {
    const mockCtx = {
      user: null,
      req: { ip: "127.0.0.1" },
      res: {},
    };

    const caller = appRouter.createCaller(mockCtx);

    // Password too short
    await expect(
      caller.auth.resetPassword({
        token: "valid-token",
        newPassword: "short1",
      })
    ).rejects.toThrow();

    // Password without number
    await expect(
      caller.auth.resetPassword({
        token: "valid-token",
        newPassword: "OnlyLetters",
      })
    ).rejects.toThrow();

    // Password without letter
    await expect(
      caller.auth.resetPassword({
        token: "valid-token",
        newPassword: "12345678",
      })
    ).rejects.toThrow();
  });
});
