# Security Baseline Implementation (PSoT Priority 2)

## Overview

This document outlines the implementation of security baseline features required for production-ready deployment of Paeds Resus GPS.

**Status:** In Progress - Manus  
**Target:** Production-ready security posture  
**Impact:** Enables safe deployment to production

---

## 1. Password Complexity Requirements

### Specification
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)
- No more than 3 consecutive identical characters
- Cannot reuse last 5 passwords

### Implementation

#### Backend: Password Validation (server/lib/password-validator.ts)
```typescript
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
  if (/(.)\1{2,}/.test(password)) errors.push('Password cannot have 3+ consecutive identical characters');
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### Database: Password History (drizzle/schema.ts)
```typescript
export const passwordHistory = sqliteTable('password_history', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});
```

#### tRPC Procedure: Update Password with Validation
- Validate new password meets complexity requirements
- Check against last 5 passwords (prevent reuse)
- Hash with bcrypt (cost: 12)
- Store in password_history
- Invalidate all sessions (force re-login)

---

## 2. Session Management & Max Age

### Specification
- Session max age: 24 hours (sliding expiry)
- Refresh token: 7 days
- Idle timeout: 30 minutes
- Session invalidation on logout: immediate
- Concurrent sessions: 1 per user (logout other sessions on new login)

### Implementation

#### Backend: Session Configuration (server/_core/auth.ts)
```typescript
export const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  SECURE: true,
  HTTP_ONLY: true,
  SAME_SITE: 'strict',
};
```

#### Database: Session Tracking (drizzle/schema.ts)
```typescript
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  token: text('token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
  lastActivityAt: integer('last_activity_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});
```

#### tRPC Procedures
- `auth.refreshSession` — Validate refresh token, issue new session
- `auth.validateSession` — Check session validity, update last_activity_at
- `auth.revokeAllSessions` — Logout all sessions for user (password change, logout)
- `auth.revokeOtherSessions` — Logout other sessions (new login)

---

## 3. Audit Logging System

### Specification
- Log all admin actions (create, update, delete, export)
- Log all auth events (login, logout, password change, session refresh)
- Log all sensitive data access (Care Signal, Safe-Truth reports)
- Retention: 1 year
- Immutable: cannot be deleted, only archived
- Real-time alerts for critical actions

### Implementation

#### Database: Audit Log (drizzle/schema.ts)
```typescript
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
  resource: text('resource').notNull(), // 'user', 'course', 'care_signal', etc.
  resourceId: integer('resource_id'),
  changes: text('changes'), // JSON diff of before/after
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').notNull(), // 'success', 'failure'
  errorMessage: text('error_message'),
  createdAt: integer('created_at').notNull(),
  archivedAt: integer('archived_at'), // NULL = active, set when archived
});
```

#### Backend: Audit Logger (server/lib/audit-logger.ts)
```typescript
export async function logAudit({
  userId,
  action,
  resource,
  resourceId,
  changes,
  ipAddress,
  userAgent,
  status,
  errorMessage,
}: AuditLogInput): Promise<void> {
  await db.insert(auditLogs).values({
    userId,
    action,
    resource,
    resourceId,
    changes: JSON.stringify(changes),
    ipAddress,
    userAgent,
    status,
    errorMessage,
    createdAt: Date.now(),
  });
}
```

#### tRPC Procedures
- `admin.getAuditLogs` — Query audit logs with filtering (date range, action, resource, user)
- `admin.exportAuditLogs` — Export as CSV for compliance
- `admin.archiveAuditLogs` — Archive logs older than 1 year

#### Middleware: Auto-Logging
- Wrap all admin procedures with audit logging
- Capture request/response, errors, IP, user agent
- Log auth events (login, logout, password change)
- Log sensitive data access

---

## 4. Production Hardening Checklist

### Environment Variables
- [ ] `SESSION_SECRET` — 32-byte random string (rotate quarterly)
- [ ] `PASSWORD_SALT_ROUNDS` — 12 (bcrypt cost factor)
- [ ] `AUDIT_LOG_RETENTION_DAYS` — 365
- [ ] `MAX_LOGIN_ATTEMPTS` — 5 (lock account for 15 min after)
- [ ] `RATE_LIMIT_WINDOW` — 15 minutes
- [ ] `RATE_LIMIT_MAX_REQUESTS` — 100 per window

### Security Headers
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `Content-Security-Policy: default-src 'self'`

### Database Security
- [ ] Enable SSL for database connections
- [ ] Encrypt sensitive fields (PHI) at rest
- [ ] Implement row-level security (RLS) for multi-tenant data
- [ ] Regular backups with encryption

### API Security
- [ ] Rate limiting on all endpoints
- [ ] CORS configuration (whitelist domains)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] CSRF protection on state-changing operations

---

## 5. Testing & Validation

### Unit Tests (vitest)
- [ ] Password complexity validator (valid/invalid cases)
- [ ] Session creation, refresh, expiry
- [ ] Audit logger (correct action logging)
- [ ] Password history (prevent reuse)

### Integration Tests
- [ ] Full auth flow (signup → login → session refresh → logout)
- [ ] Session invalidation (max age, idle timeout)
- [ ] Concurrent session handling (logout other sessions)
- [ ] Audit log creation for all admin actions
- [ ] Rate limiting (block after N attempts)

### Security Tests
- [ ] Weak password rejection
- [ ] Session hijacking prevention (IP/user agent validation)
- [ ] SQL injection attempts blocked
- [ ] XSS payload handling
- [ ] CSRF token validation

---

## 6. Deployment Checklist

- [ ] All environment variables configured
- [ ] Security headers enabled in Render
- [ ] Database SSL enabled
- [ ] Audit logs table created
- [ ] Password history table created
- [ ] Sessions table created
- [ ] All tests passing
- [ ] Audit log export working
- [ ] Rate limiting verified
- [ ] Session refresh working
- [ ] Password change flow tested

---

## 7. Monitoring & Alerts

### Real-Time Alerts
- [ ] Multiple failed login attempts (>5 in 15 min)
- [ ] Unusual admin actions (bulk delete, export)
- [ ] Session anomalies (impossible travel, new IP)
- [ ] Audit log access attempts

### Dashboards
- [ ] Admin audit log viewer
- [ ] Session management dashboard
- [ ] Security event timeline
- [ ] Failed login attempts heatmap

---

## Timeline

- **Phase 1:** Password validation + history (2 days)
- **Phase 2:** Session management + refresh tokens (2 days)
- **Phase 3:** Audit logging system (2 days)
- **Phase 4:** Testing + hardening (2 days)
- **Phase 5:** Deployment + monitoring (1 day)

**Total: ~9 days to production-ready security baseline**

---

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- CWE Top 25: https://cwe.mitre.org/top25/
