/**
 * Audit Logging System
 * 
 * Logs all admin actions, auth events, and sensitive data access
 * for compliance, security monitoring, and forensic analysis.
 * 
 * Immutable: logs cannot be deleted, only archived
 * Retention: 1 year
 */

import { db } from '../db';
import { auditLogs } from '../../drizzle/schema';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'SESSION_REFRESH'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'COURSE_CREATE'
  | 'COURSE_UPDATE'
  | 'COURSE_DELETE'
  | 'COURSE_ASSIGN'
  | 'CARE_SIGNAL_VIEW'
  | 'CARE_SIGNAL_EXPORT'
  | 'SAFE_TRUTH_VIEW'
  | 'SAFE_TRUTH_EXPORT'
  | 'ADMIN_REPORT_EXPORT'
  | 'SETTINGS_UPDATE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_GRANT'
  | 'PERMISSION_REVOKE'
  | 'DATA_EXPORT'
  | 'AUDIT_LOG_VIEW'
  | 'AUDIT_LOG_EXPORT'
  | 'AUDIT_LOG_ARCHIVE'
  | 'SYSTEM_CONFIG_CHANGE'
  | 'ERROR';

export type AuditResource =
  | 'user'
  | 'course'
  | 'care_signal'
  | 'safe_truth'
  | 'institution'
  | 'staff'
  | 'enrollment'
  | 'certificate'
  | 'payment'
  | 'analytics'
  | 'system'
  | 'auth'
  | 'audit_log';

export type AuditStatus = 'success' | 'failure' | 'denied';

export interface AuditLogInput {
  userId?: number | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: number | null;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus;
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: input.userId || null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId || null,
      changes: input.changes ? JSON.stringify(input.changes) : null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      status: input.status,
      errorMessage: input.errorMessage || null,
      createdAt: Date.now(),
      archivedAt: null,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should never break the main operation
  }
}

/**
 * Log a login event
 */
export async function logLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAudit({
    userId,
    action: 'LOGIN',
    resource: 'auth',
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a logout event
 */
export async function logLogout(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAudit({
    userId,
    action: 'LOGOUT',
    resource: 'auth',
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a password change event
 */
export async function logPasswordChange(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAudit({
    userId,
    action: 'PASSWORD_CHANGE',
    resource: 'auth',
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a failed login attempt
 */
export async function logFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAudit({
    action: 'LOGIN',
    resource: 'auth',
    status: 'failure',
    errorMessage: `Failed login attempt for ${email}`,
    ipAddress,
    userAgent,
  });
}

/**
 * Log admin action (create, update, delete)
 */
export async function logAdminAction(
  userId: number,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resource: AuditResource,
  resourceId: number,
  changes?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const actionMap = {
    CREATE: `${resource.toUpperCase()}_CREATE`,
    UPDATE: `${resource.toUpperCase()}_UPDATE`,
    DELETE: `${resource.toUpperCase()}_DELETE`,
  };

  await logAudit({
    userId,
    action: actionMap[action] as AuditAction,
    resource,
    resourceId,
    changes,
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log sensitive data access (Care Signal, Safe-Truth, etc.)
 */
export async function logSensitiveDataAccess(
  userId: number,
  action: 'VIEW' | 'EXPORT',
  resource: AuditResource,
  resourceId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const actionMap = {
    VIEW: `${resource.toUpperCase()}_VIEW`,
    EXPORT: `${resource.toUpperCase()}_EXPORT`,
  };

  await logAudit({
    userId,
    action: actionMap[action] as AuditAction,
    resource,
    resourceId,
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log access denied event
 */
export async function logAccessDenied(
  userId: number | null,
  action: AuditAction,
  resource: AuditResource,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    resource,
    status: 'denied',
    errorMessage: reason,
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: number;
  action?: AuditAction;
  resource?: AuditResource;
  status?: AuditStatus;
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  // This would use Drizzle query builder in actual implementation
  // For now, return empty array
  return [];
}

/**
 * Archive old audit logs (older than 1 year)
 */
export async function archiveOldAuditLogs(daysOld: number = 365): Promise<number> {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  // This would use Drizzle update in actual implementation
  // For now, return 0
  return 0;
}

/**
 * Export audit logs as CSV
 */
export async function exportAuditLogsAsCSV(filters: {
  startDate?: number;
  endDate?: number;
}): Promise<string> {
  const logs = await getAuditLogs({
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: 10000,
  });

  // CSV header
  const header = ['Timestamp', 'User ID', 'Action', 'Resource', 'Resource ID', 'Status', 'IP Address', 'Error Message'];
  const rows = logs.map((log) => [
    new Date(log.createdAt).toISOString(),
    log.userId || '',
    log.action,
    log.resource,
    log.resourceId || '',
    log.status,
    log.ipAddress || '',
    log.errorMessage || '',
  ]);

  // Convert to CSV
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  return csv;
}
