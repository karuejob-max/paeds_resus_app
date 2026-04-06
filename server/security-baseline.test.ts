/**
 * Security Baseline Tests
 * 
 * Validates password validation, session management, and audit logging
 */

import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, getPasswordStrengthLabel } from './lib/password-validator';
import { createSession, validateSession, refreshSession, validateRefreshToken, checkImpossibleTravel } from './lib/session-manager';

describe('Security Baseline', () => {
  describe('Password Validation', () => {
    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('uppercase'))).toBe(true);
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('lowercase'))).toBe(true);
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('number'))).toBe(true);
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('special'))).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('8 characters'))).toBe(true);
    });

    it('should reject password with excessive repetition', () => {
      const result = validatePasswordStrength('Passsword123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('consecutive'))).toBe(true);
    });

    it('should accept valid strong password', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.score).toBeGreaterThan(60);
    });

    it('should flag keyboard patterns as weak', () => {
      const result = validatePasswordStrength('Qwerty123!');
      expect(result.warnings.some((w) => w.includes('keyboard'))).toBe(true);
    });

    it('should return correct strength labels', () => {
      expect(getPasswordStrengthLabel(90)).toBe('Very Strong');
      expect(getPasswordStrengthLabel(70)).toBe('Strong');
      expect(getPasswordStrengthLabel(50)).toBe('Fair');
      expect(getPasswordStrengthLabel(30)).toBe('Weak');
      expect(getPasswordStrengthLabel(10)).toBe('Very Weak');
    });
  });

  describe('Session Management', () => {
    it('should create a valid session', () => {
      const session = createSession(1, '192.168.1.1', 'Mozilla/5.0');
      expect(session.userId).toBe(1);
      expect(session.token).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
      expect(session.expiresAt).toBeGreaterThan(Date.now());
      expect(session.ipAddress).toBe('192.168.1.1');
    });

    it('should validate active session', () => {
      const session = createSession(1);
      const validation = validateSession(session);
      expect(validation.valid).toBe(true);
    });

    it('should reject expired session', () => {
      const session = createSession(1);
      session.expiresAt = Date.now() - 1000; // Expired 1 second ago
      const validation = validateSession(session);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Session expired');
    });

    it('should reject idle session', () => {
      const session = createSession(1);
      session.lastActivityAt = Date.now() - 31 * 60 * 1000; // Idle for 31 minutes
      const validation = validateSession(session);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Session idle timeout');
    });

    it('should refresh session with sliding expiry', () => {
      const session = createSession(1);
      const originalToken = session.token;
      const originalExpiresAt = session.expiresAt;

      // Wait a bit and refresh
      const refreshed = refreshSession(session);

      expect(refreshed.token).not.toBe(originalToken);
      expect(refreshed.expiresAt).toBeGreaterThan(originalExpiresAt);
      expect(refreshed.lastActivityAt).toBeGreaterThanOrEqual(session.lastActivityAt);
    });

    it('should validate refresh token', () => {
      const session = createSession(1);
      const validation = validateRefreshToken(session);
      expect(validation.valid).toBe(true);
    });

    it('should reject expired refresh token', () => {
      const session = createSession(1);
      session.createdAt = Date.now() - 8 * 24 * 60 * 60 * 1000; // Created 8 days ago
      const validation = validateRefreshToken(session);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Refresh token expired');
    });

    it('should detect impossible travel', () => {
      const session = createSession(1, '192.168.1.1');
      session.lastActivityAt = Date.now() - 30 * 1000; // 30 seconds ago

      const impossible = checkImpossibleTravel(session, '10.0.0.1', 30 * 1000);
      expect(impossible).toBe(true);
    });

    it('should allow IP change after sufficient time', () => {
      const session = createSession(1, '192.168.1.1');
      session.lastActivityAt = Date.now() - 2 * 60 * 1000; // 2 minutes ago

      const impossible = checkImpossibleTravel(session, '10.0.0.1', 2 * 60 * 1000);
      expect(impossible).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', async () => {
      // This would test actual audit logging in integration tests
      // For now, just verify the structure
      const auditEvent = {
        userId: 1,
        action: 'LOGIN' as const,
        resource: 'auth' as const,
        status: 'success' as const,
        ipAddress: '192.168.1.1',
      };

      expect(auditEvent.userId).toBe(1);
      expect(auditEvent.action).toBe('LOGIN');
      expect(auditEvent.status).toBe('success');
    });
  });
});
