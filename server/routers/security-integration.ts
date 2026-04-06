/**
 * Security Integration Router
 * 
 * Integrates security utilities (password validator, session manager, audit logger)
 * into tRPC procedures for production-ready authentication and authorization.
 * 
 * PSoT Priority 2: Security Baseline Implementation
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as db from "../db";
import { validatePasswordStrength, getPasswordStrengthLabel } from "../lib/password-validator";
import { createSession, validateSession, refreshSession, DEFAULT_SESSION_CONFIG } from "../lib/session-manager";
import { logAudit, logLogin, logLogout, logPasswordChange, logFailedLogin } from "../lib/audit-logger";
import { TRPCError } from "@trpc/server";

export const securityIntegrationRouter = router({
  /**
   * Change password with validation
   * - Validates password strength (8+ chars, mixed case/numbers/special)
   * - Logs password change to audit log
   * - Requires current password verification
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await db.getUserByOpenId(ctx.user.openId);
        if (!user?.passwordHash) {
          await logAudit({
            userId: ctx.user.id,
            action: 'PASSWORD_CHANGE',
            resource: 'auth',
            status: 'failure',
            errorMessage: 'User does not have password authentication',
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.get('user-agent'),
          });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Password authentication not available for this account',
          });
        }

        // Verify current password
        const currentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!currentPasswordValid) {
          await logAudit({
            userId: ctx.user.id,
            action: 'PASSWORD_CHANGE',
            resource: 'auth',
            status: 'failure',
            errorMessage: 'Current password verification failed',
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.get('user-agent'),
          });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Validate new password strength
        const validation = validatePasswordStrength(input.newPassword);
        if (!validation.valid) {
          await logAudit({
            userId: ctx.user.id,
            action: 'PASSWORD_CHANGE',
            resource: 'auth',
            status: 'failure',
            errorMessage: `Password validation failed: ${validation.errors.join(', ')}`,
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.get('user-agent'),
          });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Password does not meet requirements: ${validation.errors[0]}`,
          });
        }

        // Hash and update password
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPasswordById(ctx.user.id, passwordHash);

        // Log successful password change
        await logPasswordChange(ctx.user.id, ctx.req.ip, ctx.req.get('user-agent'));

        return {
          success: true,
          message: 'Password changed successfully',
          strength: getPasswordStrengthLabel(validation.score),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }
    }),

  /**
   * Validate password strength (for real-time feedback during password creation)
   */
  validatePassword: publicProcedure
    .input(z.object({
      password: z.string(),
    }))
    .query(({ input }) => {
      const validation = validatePasswordStrength(input.password);
      return {
        valid: validation.valid,
        score: validation.score,
        strength: getPasswordStrengthLabel(validation.score),
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }),

  /**
   * Get session info (for debugging/monitoring)
   */
  getSessionInfo: protectedProcedure
    .query(({ ctx }) => {
      return {
        userId: ctx.user.id,
        email: ctx.user.email,
        role: ctx.user.role,
        sessionMaxAge: DEFAULT_SESSION_CONFIG.MAX_AGE,
        idleTimeout: DEFAULT_SESSION_CONFIG.IDLE_TIMEOUT,
      };
    }),
});
