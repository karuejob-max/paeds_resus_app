export type ExecutiveDepartment = {
  id: number;
  name: string;
  activeStaff: number;
  lifeSupportCurrentOrExpiring: number | null;
  lifeSupportMissing: number | null;
  credentialsExpired: number | null;
  credentialsExpiringWithin90Days: number | null;
  cpdVerifiedAttendance: number | null;
  cpdAttendanceDenominator: number | null;
  qiOverdueActions: number | null;
  smallGroup: boolean;
};

export type ExecutiveMetric = { numerator: number | null; denominator: number | null; value: number | null };
export type ExecutiveFinding = { text: string; ruleId: string; metric: ExecutiveMetric; departmentId?: number };
export type ExecutiveFindings = {
  headline: ExecutiveFinding[];
  needsSupport: ExecutiveFinding[];
  doingWell: ExecutiveFinding[];
  decisions: ExecutiveFinding[];
  comparison: ExecutiveFinding;
};
export type ExecutiveRulesConfig = { minimumStaff: number; lifeSupportFloor: number; cpdAttendanceFloor: number };

const metric = (numerator: number | null, denominator: number | null): ExecutiveMetric => ({
  numerator,
  denominator,
  value: numerator == null || denominator == null || denominator === 0 ? null : numerator / denominator,
});

export function buildExecutiveFindings(
  departments: ExecutiveDepartment[] | undefined,
  config: ExecutiveRulesConfig,
  priorSnapshotAvailable = false,
): ExecutiveFindings {
  const rows = departments ?? [];
  const eligible = rows.filter(row => !row.smallGroup && row.activeStaff >= config.minimumStaff);
  const support = rows.flatMap(row => {
    const findings: ExecutiveFinding[] = [];
    const lifeMetric = metric(row.lifeSupportCurrentOrExpiring, row.activeStaff);
    if (lifeMetric.value != null && lifeMetric.value < config.lifeSupportFloor) findings.push({ text: `${row.name} has ${row.lifeSupportCurrentOrExpiring}/${row.activeStaff} active staff with current or non-expired Life Support evidence; review support against the configured ${Math.round(config.lifeSupportFloor * 100)}% floor.`, ruleId: "NEEDS_SUPPORT_LIFE_SUPPORT_FLOOR", metric: lifeMetric, departmentId: row.id });
    if (row.credentialsExpired != null && row.credentialsExpired > 0) findings.push({ text: `${row.name} has ${row.credentialsExpired} expired credential record(s) among ${row.activeStaff} active staff; route renewal evidence review.`, ruleId: "NEEDS_SUPPORT_EXPIRED_CREDENTIALS", metric: metric(row.credentialsExpired, row.activeStaff), departmentId: row.id });
    if (row.lifeSupportMissing != null && row.lifeSupportMissing > 0) findings.push({ text: `${row.name} has ${row.lifeSupportMissing}/${row.activeStaff} active staff without current Life Support evidence in the stored records.`, ruleId: "NEEDS_SUPPORT_MISSING_LIFE_SUPPORT", metric: metric(row.lifeSupportMissing, row.activeStaff), departmentId: row.id });
    if (row.qiOverdueActions != null && row.qiOverdueActions > 0) findings.push({ text: `${row.name} has ${row.qiOverdueActions} overdue QI action(s) at capture time; assign follow-through review.`, ruleId: "NEEDS_SUPPORT_OVERDUE_QI", metric: metric(row.qiOverdueActions, row.qiOverdueActions), departmentId: row.id });
    const cpdMetric = metric(row.cpdVerifiedAttendance, row.cpdAttendanceDenominator);
    if (cpdMetric.value != null && cpdMetric.value < config.cpdAttendanceFloor) findings.push({ text: `${row.name} has ${row.cpdVerifiedAttendance}/${row.cpdAttendanceDenominator} recorded verified CPD attendance records against CPD events; review participation under the configured ${Math.round(config.cpdAttendanceFloor * 100)}% floor.`, ruleId: "NEEDS_SUPPORT_CPD_ACTIVITY_FLOOR", metric: cpdMetric, departmentId: row.id });
    return findings;
  });
  const headline: ExecutiveFinding[] = rows.length === 0
    ? [{ text: "No department rows are available for an executive comparison; no support conclusion is made.", ruleId: "HEADLINE_NO_DEPARTMENTS", metric: metric(null, null) }]
    : [{ text: `${support.length ? new Set(support.map(item => item.departmentId)).size : 0} of ${rows.length} department(s) triggered at least one configured support rule; this is an administrative signal, not a competence score.`, ruleId: "HEADLINE_DEPARTMENTS_NEED_SUPPORT", metric: metric(support.length ? new Set(support.map(item => item.departmentId)).size : 0, rows.length) }];
  const doingWell: ExecutiveFinding[] = [];
  const measures: Array<[string, (row: ExecutiveDepartment) => number | null, string]> = [
    ["Life Support evidence", row => metric(row.lifeSupportCurrentOrExpiring, row.activeStaff).value, "DOING_WELL_LIFE_SUPPORT_MAX"],
    ["CPD activity", row => metric(row.cpdVerifiedAttendance, row.cpdAttendanceDenominator).value, "DOING_WELL_CPD_ACTIVITY_MAX"],
  ];
  for (const [label, getValue, ruleId] of measures) {
    const scored = eligible.map(row => ({ row, value: getValue(row) })).filter(item => item.value != null) as Array<{ row: ExecutiveDepartment; value: number }>;
    if (!scored.length) continue;
    const best = Math.max(...scored.map(item => item.value));
    const winners = scored.filter(item => item.value === best);
    for (const winner of winners) {
      const numerator = label === "Life Support evidence" ? winner.row.lifeSupportCurrentOrExpiring : winner.row.cpdVerifiedAttendance;
      const denominator = label === "Life Support evidence" ? winner.row.activeStaff : winner.row.cpdAttendanceDenominator;
      doingWell.push({ text: `${winner.row.name} has the strongest eligible ${label} signal at ${numerator}/${denominator}; invite the department to share its approach.`, ruleId, metric: metric(numerator, denominator), departmentId: winner.row.id });
    }
  }
  const decisions = support.slice(0, 3).map(item => ({ ...item, text: `Decision: assign an accountable review for ${item.text.replace(/;.*$/, "")}` }));
  const comparison: ExecutiveFinding = priorSnapshotAvailable
    ? { text: "A comparable prior snapshot is available; calculate change only after matching period, scope, version, and contiguous-period safeguards.", ruleId: "COMPARISON_SAFE_PRIOR_AVAILABLE", metric: metric(null, null) }
    : { text: "No comparable prior snapshot is available for this scope and version; no trend conclusion is made.", ruleId: "COMPARISON_NO_PRIOR_SNAPSHOT", metric: metric(null, null) };
  return { headline, needsSupport: support, doingWell, decisions, comparison };
}
