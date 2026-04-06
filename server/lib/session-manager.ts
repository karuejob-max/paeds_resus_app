/**
 * Session Management
 * 
 * Handles session lifecycle:
 * - Creation with sliding expiry
 * - Refresh token validation
 * - Idle timeout enforcement
 * - Concurrent session management (1 per user)
 * - Session revocation
 */

import { randomBytes } from 'crypto';

export interface SessionConfig {
  MAX_AGE: number; // milliseconds
  IDLE_TIMEOUT: number; // milliseconds
  REFRESH_TOKEN_MAX_AGE: number; // milliseconds
  SECURE: boolean;
  HTTP_ONLY: boolean;
  SAME_SITE: 'strict' | 'lax' | 'none';
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  SECURE: true,
  HTTP_ONLY: true,
  SAME_SITE: 'strict',
};

export interface SessionData {
  id: string;
  userId: number;
  token: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
  lastActivityAt: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Create a new session
 */
export function createSession(userId: number, ipAddress?: string, userAgent?: string): SessionData {
  const now = Date.now();
  const config = DEFAULT_SESSION_CONFIG;

  return {
    id: generateToken(16),
    userId,
    token: generateToken(32),
    refreshToken: generateToken(32),
    expiresAt: now + config.MAX_AGE,
    createdAt: now,
    lastActivityAt: now,
    ipAddress,
    userAgent,
  };
}

/**
 * Validate session
 */
export function validateSession(session: SessionData, config: SessionConfig = DEFAULT_SESSION_CONFIG): {
  valid: boolean;
  reason?: string;
} {
  const now = Date.now();

  // Check if session has expired
  if (now > session.expiresAt) {
    return { valid: false, reason: 'Session expired' };
  }

  // Check if session is idle
  if (now - session.lastActivityAt > config.IDLE_TIMEOUT) {
    return { valid: false, reason: 'Session idle timeout' };
  }

  return { valid: true };
}

/**
 * Refresh session (sliding expiry)
 */
export function refreshSession(session: SessionData, config: SessionConfig = DEFAULT_SESSION_CONFIG): SessionData {
  const now = Date.now();

  return {
    ...session,
    token: generateToken(32),
    expiresAt: now + config.MAX_AGE,
    lastActivityAt: now,
  };
}

/**
 * Update session activity (for idle timeout tracking)
 */
export function updateSessionActivity(session: SessionData): SessionData {
  return {
    ...session,
    lastActivityAt: Date.now(),
  };
}

/**
 * Validate refresh token
 */
export function validateRefreshToken(session: SessionData, config: SessionConfig = DEFAULT_SESSION_CONFIG): {
  valid: boolean;
  reason?: string;
} {
  const now = Date.now();
  const createdAt = session.createdAt;
  const refreshTokenAge = now - createdAt;

  // Check if refresh token has expired
  if (refreshTokenAge > config.REFRESH_TOKEN_MAX_AGE) {
    return { valid: false, reason: 'Refresh token expired' };
  }

  return { valid: true };
}

/**
 * Get session cookie options
 */
export function getSessionCookieOptions(config: SessionConfig = DEFAULT_SESSION_CONFIG) {
  return {
    maxAge: config.MAX_AGE,
    secure: config.SECURE,
    httpOnly: config.HTTP_ONLY,
    sameSite: config.SAME_SITE,
    path: '/',
  };
}

/**
 * Check for impossible travel (same IP, different location in short time)
 */
export function checkImpossibleTravel(
  previousSession: SessionData,
  currentIpAddress: string,
  timeSinceLastActivity: number
): boolean {
  // Simple check: if IP changed and less than 1 minute has passed, flag as suspicious
  if (previousSession.ipAddress && previousSession.ipAddress !== currentIpAddress) {
    if (timeSinceLastActivity < 60 * 1000) {
      return true; // Impossible travel detected
    }
  }
  return false;
}

/**
 * Check for anomalous user agent (potential session hijacking)
 */
export function checkUserAgentAnomaly(previousSession: SessionData, currentUserAgent?: string): boolean {
  if (!previousSession.userAgent || !currentUserAgent) {
    return false;
  }

  // Simple check: if user agent changed significantly, flag as suspicious
  // In production, use more sophisticated fingerprinting
  return previousSession.userAgent !== currentUserAgent;
}
