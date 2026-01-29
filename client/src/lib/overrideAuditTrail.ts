/**
 * Override Audit Trail Tracking System
 * Maintains complete audit logs for all clinical overrides with timestamps,
 * clinician info, patient context, and outcome tracking
 */

import { OverrideRecord, OverrideReason, OverrideSeverity } from './overrideSystem';

export class OverrideAuditTrail {
  private overrides: OverrideRecord[] = [];
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Record a new override
   */
  recordOverride(override: Omit<OverrideRecord, 'id' | 'timestamp' | 'sessionId'>): OverrideRecord {
    const record: OverrideRecord = {
      ...override,
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.overrides.push(record);
    this.persistToStorage(record);

    return record;
  }

  /**
   * Update override with outcome information
   */
  updateOutcome(
    overrideId: string,
    outcome: 'improved' | 'stable' | 'deteriorated' | 'unknown',
    notes?: string
  ): OverrideRecord | null {
    const override = this.overrides.find((o) => o.id === overrideId);
    if (!override) return null;

    override.patientOutcome = outcome;
    override.outcomeNotes = notes;

    this.persistToStorage(override);
    return override;
  }

  /**
   * Get all overrides for current session
   */
  getSessionOverrides(): OverrideRecord[] {
    return [...this.overrides];
  }

  /**
   * Get overrides by severity
   */
  getOverridesBySeverity(severity: OverrideSeverity): OverrideRecord[] {
    return this.overrides.filter((o) => o.severity === severity);
  }

  /**
   * Get overrides by reason
   */
  getOverridesByReason(reason: OverrideReason): OverrideRecord[] {
    return this.overrides.filter((o) => o.reason === reason);
  }

  /**
   * Get overrides by engine
   */
  getOverridesByEngine(engineId: string): OverrideRecord[] {
    return this.overrides.filter((o) => o.engineId === engineId);
  }

  /**
   * Get overrides by clinician
   */
  getOverridesByClinician(clinicianId: string): OverrideRecord[] {
    return this.overrides.filter((o) => o.clinicianId === clinicianId);
  }

  /**
   * Get critical overrides requiring immediate review
   */
  getCriticalOverrides(): OverrideRecord[] {
    return this.overrides.filter((o) => o.severity === 'critical');
  }

  /**
   * Calculate override statistics
   */
  getStatistics(): {
    totalOverrides: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    improvedOutcomes: number;
    stableOutcomes: number;
    deterioratedOutcomes: number;
    unknownOutcomes: number;
    outcomeImprovement: number;
  } {
    const stats = {
      totalOverrides: this.overrides.length,
      criticalCount: this.overrides.filter((o) => o.severity === 'critical').length,
      highCount: this.overrides.filter((o) => o.severity === 'high').length,
      mediumCount: this.overrides.filter((o) => o.severity === 'medium').length,
      lowCount: this.overrides.filter((o) => o.severity === 'low').length,
      improvedOutcomes: this.overrides.filter((o) => o.patientOutcome === 'improved').length,
      stableOutcomes: this.overrides.filter((o) => o.patientOutcome === 'stable').length,
      deterioratedOutcomes: this.overrides.filter((o) => o.patientOutcome === 'deteriorated').length,
      unknownOutcomes: this.overrides.filter((o) => o.patientOutcome === 'unknown' || !o.patientOutcome).length,
      outcomeImprovement: 0,
    };

    const trackedOutcomes = stats.improvedOutcomes + stats.stableOutcomes + stats.deterioratedOutcomes;
    if (trackedOutcomes > 0) {
      stats.outcomeImprovement = Math.round((stats.improvedOutcomes / trackedOutcomes) * 100);
    }

    return stats;
  }

  /**
   * Generate audit report
   */
  generateAuditReport(): string {
    const stats = this.getStatistics();
    const criticalOverrides = this.getCriticalOverrides();

    let report = `OVERRIDE AUDIT REPORT\n`;
    report += `Session ID: ${this.sessionId}\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `SUMMARY STATISTICS\n`;
    report += `==================\n`;
    report += `Total Overrides: ${stats.totalOverrides}\n`;
    report += `- Critical: ${stats.criticalCount}\n`;
    report += `- High: ${stats.highCount}\n`;
    report += `- Medium: ${stats.mediumCount}\n`;
    report += `- Low: ${stats.lowCount}\n\n`;

    report += `OUTCOME TRACKING\n`;
    report += `================\n`;
    report += `Improved: ${stats.improvedOutcomes}\n`;
    report += `Stable: ${stats.stableOutcomes}\n`;
    report += `Deteriorated: ${stats.deterioratedOutcomes}\n`;
    report += `Unknown: ${stats.unknownOutcomes}\n`;
    report += `Improvement Rate: ${stats.outcomeImprovement}%\n\n`;

    if (criticalOverrides.length > 0) {
      report += `CRITICAL OVERRIDES (REQUIRE REVIEW)\n`;
      report += `===================================\n`;
      criticalOverrides.forEach((override, idx) => {
        report += `\n${idx + 1}. ${override.actionTitle}\n`;
        report += `   Clinician: ${override.clinicianName} (${override.clinicianRole})\n`;
        report += `   Time: ${new Date(override.timestamp).toISOString()}\n`;
        report += `   Reason: ${override.reason}\n`;
        report += `   Details: ${override.reasonDetails}\n`;
        report += `   Alternative: ${override.overriddenAction}\n`;
        report += `   Outcome: ${override.patientOutcome || 'Pending'}\n`;
      });
    }

    return report;
  }

  /**
   * Export overrides as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(
      {
        sessionId: this.sessionId,
        exportDate: new Date().toISOString(),
        statistics: this.getStatistics(),
        overrides: this.overrides,
      },
      null,
      2
    );
  }

  /**
   * Export overrides as CSV
   */
  exportAsCSV(): string {
    const headers = [
      'ID',
      'Timestamp',
      'Clinician',
      'Role',
      'Engine',
      'Action',
      'Reason',
      'Severity',
      'Outcome',
    ];

    const rows = this.overrides.map((o) => [
      o.id,
      new Date(o.timestamp).toISOString(),
      o.clinicianName,
      o.clinicianRole,
      o.engineName,
      o.actionTitle,
      o.reason,
      o.severity,
      o.patientOutcome || 'Pending',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Clear all overrides (for testing)
   */
  clear(): void {
    this.overrides = [];
    this.clearStorage();
  }

  /**
   * Private helper: Generate unique ID
   */
  private generateId(): string {
    return `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private helper: Persist to local storage
   */
  private persistToStorage(override: OverrideRecord): void {
    try {
      const key = `override_${override.id}`;
      localStorage.setItem(key, JSON.stringify(override));

      // Also maintain an index
      const indexKey = `override_index_${this.sessionId}`;
      const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
      if (!index.includes(override.id)) {
        index.push(override.id);
        localStorage.setItem(indexKey, JSON.stringify(index));
      }
    } catch (error) {
      console.error('Failed to persist override to storage:', error);
    }
  }

  /**
   * Private helper: Clear storage
   */
  private clearStorage(): void {
    try {
      const indexKey = `override_index_${this.sessionId}`;
      const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
      index.forEach((id: string) => {
        localStorage.removeItem(`override_${id}`);
      });
      localStorage.removeItem(indexKey);
    } catch (error) {
      console.error('Failed to clear override storage:', error);
    }
  }

  /**
   * Load overrides from storage
   */
  static loadFromStorage(sessionId: string): OverrideAuditTrail {
    const trail = new OverrideAuditTrail(sessionId);

    try {
      const indexKey = `override_index_${sessionId}`;
      const index = JSON.parse(localStorage.getItem(indexKey) || '[]');

      index.forEach((id: string) => {
        const key = `override_${id}`;
        const data = localStorage.getItem(key);
        if (data) {
          trail.overrides.push(JSON.parse(data));
        }
      });
    } catch (error) {
      console.error('Failed to load overrides from storage:', error);
    }

    return trail;
  }
}
