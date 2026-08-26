export const LEARNING_PROGRAM_TYPES = [
  "bls",
  "acls",
  "pals",
  "nrp",
  "heartsaver",
  "instructor",
] as const;
export type LearningProgramType = (typeof LEARNING_PROGRAM_TYPES)[number];

export const LEARNING_METRIC_KEYS = [
  "cpd_sessions",
  "cpd_attendance_rate",
  "cne_sessions",
  "clinical_cpd_sessions",
  "m_and_m_sessions",
  "life_support_completed",
  "course_phase_completion",
] as const;
export type LearningMetricKey = (typeof LEARNING_METRIC_KEYS)[number];

export const LEARNING_PHASES = [
  "cognitive",
  "phase_2",
  "phase_3",
  "completed",
] as const;
export type LearningPhase = (typeof LEARNING_PHASES)[number];

export type LearningPeriod = {
  periodType: "monthly" | "quarterly" | "annual";
  periodStart: string;
  periodEnd: string;
};

type LearningAttendanceStatus =
  | "strong"
  | "on_track"
  | "needs_support"
  | "no_data";
type LearningTargetStatus = "met" | "in_progress" | "needs_support" | "no_data";

function attendanceStatus(
  eligible: number,
  attendanceRate: number
): LearningAttendanceStatus {
  if (eligible === 0) return "no_data";
  if (attendanceRate >= 75) return "strong";
  if (attendanceRate >= 50) return "on_track";
  return "needs_support";
}

function targetStatus(
  targetValue: number,
  actualValue: number
): LearningTargetStatus {
  if (targetValue <= 0) return "no_data";
  if (actualValue >= targetValue) return "met";
  if (actualValue > 0) return "in_progress";
  return "needs_support";
}

type EventRow = {
  id: number;
  name: string;
  eventDate: string;
  eventDateAt: Date | string | null;
  createdAt: Date | string;
  eventType: string;
  audienceScope: string;
  audienceLabel: string | null;
  facilityDepartmentId: number | null;
  cpdPoints: string | number | null;
};

type AttendeeRow = {
  id: number;
  cpdEventId: number;
  email: string;
  fullName: string;
  department: string;
  facilityDepartmentId: number | null;
  submittedAt: Date | string;
};

type StaffRow = {
  id: number;
  userId: number | null;
  fullName: string;
  email: string;
  staffRole: string;
  department: string | null;
  facilityDepartmentId: number | null;
  assignedCourses: string | null;
  phaseStatus: string | null;
};

type DepartmentRow = { id: number; departmentName: string };

type EnrollmentRow = {
  userId: number;
  programType: string;
  cognitiveModulesComplete: boolean;
  practicalSkillsSignedOff: boolean;
  createdAt: Date | string;
};

type TargetRow = {
  id: number;
  targetScope: "facility" | "department" | "individual";
  departmentId: number | null;
  userId: number | null;
  metricKey: string;
  periodType: "monthly" | "quarterly" | "annual";
  periodStart: string;
  periodEnd: string;
  targetValue: string | number;
  courseProgramType: string | null;
  coursePhase: string | null;
};

function normalizedEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOnly(value: Date | string | null | undefined): string | null {
  const date = asDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function eventDate(event: EventRow): string | null {
  return dateOnly(event.eventDateAt) ?? dateOnly(event.createdAt);
}

function inPeriod(value: string | null, period: LearningPeriod): boolean {
  return (
    value != null && value >= period.periodStart && value <= period.periodEnd
  );
}

function parseAssignedCourses(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.map(String).map(item => item.toLowerCase());
  } catch {
    // Older rows sometimes contain a simple comma-separated value.
  }
  return value
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function staffIsClinical(staff: StaffRow): boolean {
  return !["support_staff"].includes(staff.staffRole);
}

function eventAppliesToStaff(event: EventRow, staff: StaffRow): boolean {
  if (
    event.facilityDepartmentId != null &&
    event.facilityDepartmentId !== staff.facilityDepartmentId
  )
    return false;
  if (event.audienceScope === "nursing_wide")
    return staff.staffRole === "nurse";
  if (event.audienceScope === "clinical" || event.audienceScope === "m_and_m")
    return staffIsClinical(staff);
  if (event.audienceScope === "other_cadre") {
    const label = (event.audienceLabel ?? "").toLowerCase();
    if (!label) return true;
    return `${staff.staffRole} ${staff.department ?? ""}`
      .toLowerCase()
      .includes(label);
  }
  return true;
}

function phaseForStaffCourse(
  staff: StaffRow,
  enrollment: EnrollmentRow | undefined
): {
  cognitiveComplete: boolean;
  phase2Status: "not_started" | "in_progress" | "completed";
  phase3Status: "not_started" | "completed";
  completed: boolean;
  stage: LearningPhase | "not_started";
} {
  const cognitiveComplete = enrollment?.cognitiveModulesComplete === true;
  const phase2Status =
    staff.phaseStatus === "phase_2"
      ? "in_progress"
      : staff.phaseStatus === "phase_3" || staff.phaseStatus === "completed"
        ? "completed"
        : "not_started";
  const phase3Status =
    enrollment?.practicalSkillsSignedOff === true ? "completed" : "not_started";
  const completed = cognitiveComplete && phase3Status === "completed";
  const stage: LearningPhase | "not_started" = completed
    ? "completed"
    : phase3Status === "completed"
      ? "phase_3"
      : phase2Status !== "not_started"
        ? "phase_2"
        : cognitiveComplete
          ? "cognitive"
          : "not_started";
  return { cognitiveComplete, phase2Status, phase3Status, completed, stage };
}

export function computeInstitutionLearningAnalytics(input: {
  period: LearningPeriod;
  events: EventRow[];
  attendees: AttendeeRow[];
  staff: StaffRow[];
  departments: DepartmentRow[];
  enrollments: EnrollmentRow[];
  targets: TargetRow[];
}): {
  period: LearningPeriod;
  summary: {
    totalSessions: number;
    totalAttendanceRecords: number;
    peopleAttended: number;
    expectedAttendanceSeats: number;
    attendanceRate: number;
    sessionsByAudience: Array<{
      audienceScope: string;
      label: string;
      count: number;
    }>;
    sessionsByType: Array<{ eventType: string; count: number }>;
  };
  departments: Array<{
    departmentId: number;
    department: string;
    sessionsAvailable: number;
    expectedSeats: number;
    attendedSeats: number;
    attendanceRate: number;
    peopleAttended: number;
    status: "strong" | "on_track" | "needs_support" | "no_data";
  }>;
  individuals: Array<{
    staffId: number;
    userId: number | null;
    fullName: string;
    email: string;
    department: string;
    staffRole: string;
    eligibleSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    cneAttended: number;
    clinicalAttended: number;
    status: "strong" | "on_track" | "needs_support" | "no_data";
  }>;
  courses: Array<{
    staffId: number;
    userId: number | null;
    fullName: string;
    email: string;
    department: string;
    programType: LearningProgramType;
    hasEnrollment: boolean;
    cognitiveComplete: boolean;
    phase2Status: "not_started" | "in_progress" | "completed";
    phase3Status: "not_started" | "completed";
    completed: boolean;
    stage: LearningPhase | "not_started";
  }>;
  targets: Array<{
    id: number;
    scope: string;
    scopeLabel: string;
    metricKey: string;
    targetValue: number;
    actualValue: number;
    progressPercent: number;
    status: "met" | "in_progress" | "needs_support" | "no_data";
    periodStart: string;
    periodEnd: string;
    courseProgramType: string | null;
    coursePhase: string | null;
  }>;
  narrative: string;
} {
  const events = input.events.filter(event =>
    inPeriod(eventDate(event), input.period)
  );
  const eventIds = new Set(events.map(event => event.id));
  const attendees = input.attendees.filter(attendee =>
    eventIds.has(attendee.cpdEventId)
  );
  const departmentById = new Map(
    input.departments.map(department => [
      department.id,
      department.departmentName,
    ])
  );
  const attendeesByEvent = new Map<number, Set<string>>();
  for (const attendee of attendees) {
    const emails =
      attendeesByEvent.get(attendee.cpdEventId) ?? new Set<string>();
    emails.add(normalizedEmail(attendee.email));
    attendeesByEvent.set(attendee.cpdEventId, emails);
  }
  const staffByEmail = new Map(
    input.staff.map(staff => [normalizedEmail(staff.email), staff])
  );
  const staffSessions = new Map<
    number,
    { eligible: number; attended: number; cne: number; clinical: number }
  >();
  for (const staff of input.staff) {
    staffSessions.set(staff.id, {
      eligible: 0,
      attended: 0,
      cne: 0,
      clinical: 0,
    });
  }

  const sessionsByAudience = new Map<string, number>();
  const sessionsByType = new Map<string, number>();
  let expectedAttendanceSeats = 0;
  let attendedSeats = 0;
  const departmentSeats = new Map<
    number,
    {
      sessions: Set<number>;
      expected: number;
      attended: number;
      people: Set<string>;
    }
  >();
  for (const department of input.departments) {
    departmentSeats.set(department.id, {
      sessions: new Set(),
      expected: 0,
      attended: 0,
      people: new Set(),
    });
  }

  for (const event of events) {
    sessionsByAudience.set(
      event.audienceScope,
      (sessionsByAudience.get(event.audienceScope) ?? 0) + 1
    );
    sessionsByType.set(
      event.eventType,
      (sessionsByType.get(event.eventType) ?? 0) + 1
    );
    const eventAttendees = attendeesByEvent.get(event.id) ?? new Set<string>();
    for (const staff of input.staff) {
      if (!eventAppliesToStaff(event, staff)) continue;
      const stats = staffSessions.get(staff.id);
      if (!stats) continue;
      stats.eligible++;
      expectedAttendanceSeats++;
      const email = normalizedEmail(staff.email);
      if (eventAttendees.has(email)) {
        stats.attended++;
        attendedSeats++;
        if (event.eventType === "cne") stats.cne++;
        if (
          event.audienceScope === "clinical" ||
          event.audienceScope === "m_and_m"
        )
          stats.clinical++;
        if (staff.facilityDepartmentId != null) {
          const dept = departmentSeats.get(staff.facilityDepartmentId);
          if (dept) {
            dept.sessions.add(event.id);
            dept.expected++;
            dept.attended++;
            dept.people.add(email);
          }
        }
      } else if (staff.facilityDepartmentId != null) {
        const dept = departmentSeats.get(staff.facilityDepartmentId);
        if (dept) {
          dept.sessions.add(event.id);
          dept.expected++;
        }
      }
    }
  }

  const courseEnrollmentByUserProgram = new Map<string, EnrollmentRow>();
  for (const enrollment of input.enrollments) {
    if (
      !LEARNING_PROGRAM_TYPES.includes(
        enrollment.programType as LearningProgramType
      )
    )
      continue;
    const key = `${enrollment.userId}:${enrollment.programType}`;
    const existing = courseEnrollmentByUserProgram.get(key);
    if (
      !existing ||
      new Date(enrollment.createdAt).getTime() >
        new Date(existing.createdAt).getTime()
    ) {
      courseEnrollmentByUserProgram.set(key, enrollment);
    }
  }
  const courses = input.staff.flatMap(staff => {
    const assigned = parseAssignedCourses(staff.assignedCourses);
    return LEARNING_PROGRAM_TYPES.filter(
      programType =>
        assigned.includes(programType) ||
        courseEnrollmentByUserProgram.has(`${staff.userId}:${programType}`)
    ).map(programType => {
      const enrollment =
        staff.userId == null
          ? undefined
          : courseEnrollmentByUserProgram.get(`${staff.userId}:${programType}`);
      const phase = phaseForStaffCourse(staff, enrollment);
      return {
        staffId: staff.id,
        userId: staff.userId,
        fullName: staff.fullName,
        email: staff.email,
        department:
          staff.facilityDepartmentId != null
            ? (departmentById.get(staff.facilityDepartmentId) ??
              staff.department ??
              "Unassigned")
            : (staff.department ?? "Unassigned"),
        programType,
        hasEnrollment: enrollment != null,
        ...phase,
      };
    });
  });

  const individuals = input.staff.map(staff => {
    const stats = staffSessions.get(staff.id) ?? {
      eligible: 0,
      attended: 0,
      cne: 0,
      clinical: 0,
    };
    const attendanceRate =
      stats.eligible > 0
        ? Math.round((stats.attended / stats.eligible) * 100)
        : 0;
    return {
      staffId: staff.id,
      userId: staff.userId,
      fullName: staff.fullName,
      email: staff.email,
      department:
        staff.facilityDepartmentId != null
          ? (departmentById.get(staff.facilityDepartmentId) ??
            staff.department ??
            "Unassigned")
          : (staff.department ?? "Unassigned"),
      staffRole: staff.staffRole,
      eligibleSessions: stats.eligible,
      attendedSessions: stats.attended,
      attendanceRate,
      cneAttended: stats.cne,
      clinicalAttended: stats.clinical,
      status: attendanceStatus(stats.eligible, attendanceRate),
    };
  });

  const departments = input.departments.map(department => {
    const stats = departmentSeats.get(department.id) ?? {
      sessions: new Set<number>(),
      expected: 0,
      attended: 0,
      people: new Set<string>(),
    };
    const attendanceRate =
      stats.expected > 0
        ? Math.round((stats.attended / stats.expected) * 100)
        : 0;
    return {
      departmentId: department.id,
      department: department.departmentName,
      sessionsAvailable: stats.sessions.size,
      expectedSeats: stats.expected,
      attendedSeats: stats.attended,
      attendanceRate,
      peopleAttended: stats.people.size,
      status: attendanceStatus(stats.expected, attendanceRate),
    };
  });

  const actualForTarget = (target: TargetRow): number => {
    const selectedDepartment =
      target.departmentId == null
        ? null
        : departments.find(
            department => department.departmentId === target.departmentId
          );
    const selectedIndividual =
      target.userId == null
        ? null
        : individuals.find(individual => individual.userId === target.userId);
    const relevantEvents =
      target.targetScope === "facility"
        ? events
        : target.targetScope === "department"
          ? events.filter(
              event =>
                event.facilityDepartmentId == null ||
                event.facilityDepartmentId === target.departmentId
            )
          : events.filter(event => {
              const staff = selectedIndividual
                ? input.staff.find(
                    row => row.userId === selectedIndividual.userId
                  )
                : undefined;
              return staff ? eventAppliesToStaff(event, staff) : false;
            });
    if (target.metricKey === "cpd_sessions")
      return target.targetScope === "individual"
        ? (selectedIndividual?.attendedSessions ?? 0)
        : relevantEvents.length;
    if (target.metricKey === "cpd_attendance_rate")
      return target.targetScope === "facility"
        ? expectedAttendanceSeats > 0
          ? Math.round((attendedSeats / expectedAttendanceSeats) * 100)
          : 0
        : target.targetScope === "department"
          ? (selectedDepartment?.attendanceRate ?? 0)
          : (selectedIndividual?.attendanceRate ?? 0);
    if (target.metricKey === "cne_sessions")
      return relevantEvents.filter(event => event.eventType === "cne").length;
    if (target.metricKey === "clinical_cpd_sessions")
      return relevantEvents.filter(event => event.audienceScope === "clinical")
        .length;
    if (target.metricKey === "m_and_m_sessions")
      return relevantEvents.filter(
        event =>
          event.eventType === "m_and_m" || event.audienceScope === "m_and_m"
      ).length;
    if (
      target.metricKey === "life_support_completed" ||
      target.metricKey === "course_phase_completion"
    ) {
      return courses.filter(course => {
        if (
          target.courseProgramType &&
          course.programType !== target.courseProgramType
        )
          return false;
        if (
          target.targetScope === "department" &&
          course.department !== selectedDepartment?.department
        )
          return false;
        if (
          target.targetScope === "individual" &&
          course.userId !== selectedIndividual?.userId
        )
          return false;
        if (target.metricKey === "life_support_completed")
          return course.completed;
        if (target.coursePhase === "cognitive") return course.cognitiveComplete;
        if (target.coursePhase === "phase_2")
          return course.phase2Status === "completed";
        if (target.coursePhase === "phase_3")
          return course.phase3Status === "completed";
        return course.completed;
      }).length;
    }
    return 0;
  };

  const targets = input.targets.map(target => {
    const targetValue = Number(target.targetValue) || 0;
    const actualValue = actualForTarget(target);
    const progressPercent =
      targetValue > 0
        ? Math.min(100, Math.round((actualValue / targetValue) * 100))
        : 0;
    return {
      id: target.id,
      scope: target.targetScope,
      scopeLabel:
        target.targetScope === "facility"
          ? "Facility"
          : target.targetScope === "department"
            ? (departmentById.get(target.departmentId ?? 0) ?? "Department")
            : (individuals.find(
                individual => individual.userId === target.userId
              )?.fullName ?? "Individual"),
      metricKey: target.metricKey,
      targetValue,
      actualValue,
      progressPercent,
      status: targetStatus(targetValue, actualValue),
      periodStart: target.periodStart,
      periodEnd: target.periodEnd,
      courseProgramType: target.courseProgramType,
      coursePhase: target.coursePhase,
    };
  });

  const attendanceRate =
    expectedAttendanceSeats > 0
      ? Math.round((attendedSeats / expectedAttendanceSeats) * 100)
      : 0;
  const peopleAttended = new Set(
    attendees.map(attendee => normalizedEmail(attendee.email))
  ).size;
  const narrative =
    events.length === 0
      ? `No CPD sessions were recorded between ${input.period.periodStart} and ${input.period.periodEnd}. Use the target and coordinator tools to plan the next learning cycle.`
      : `${events.length} learning session${events.length === 1 ? " was" : "s were"} recorded between ${input.period.periodStart} and ${input.period.periodEnd}. ${peopleAttended} people appear in attendance records, with ${attendanceRate}% roster-seat coverage where a staff roster was available. ${departments.filter(department => department.status === "needs_support").length} department${departments.filter(department => department.status === "needs_support").length === 1 ? " needs" : "s need"} follow-up. Attendance and course completion are learning administration signals, not proof of bedside competence or accreditation.`;

  return {
    period: input.period,
    summary: {
      totalSessions: events.length,
      totalAttendanceRecords: attendees.length,
      peopleAttended,
      expectedAttendanceSeats,
      attendanceRate,
      sessionsByAudience: Array.from(
        sessionsByAudience,
        ([audienceScope, count]) => ({
          audienceScope,
          label: audienceScope.replaceAll("_", " "),
          count,
        })
      ).sort((a, b) => b.count - a.count),
      sessionsByType: Array.from(sessionsByType, ([eventType, count]) => ({
        eventType,
        count,
      })).sort((a, b) => b.count - a.count),
    },
    departments,
    individuals: individuals.sort(
      (a, b) => b.attendanceRate - a.attendanceRate
    ),
    courses,
    targets,
    narrative,
  };
}

export function buildLearningReportCsv(
  report: ReturnType<typeof computeInstitutionLearningAnalytics>
): string {
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const lines = [
    [
      "Learning report",
      `${report.period.periodStart} to ${report.period.periodEnd}`,
    ],
    ["Narrative", report.narrative],
    [],
    [
      "Department",
      "Sessions available",
      "Expected seats",
      "Attended seats",
      "Attendance rate",
      "Status",
    ],
    ...report.departments.map(row => [
      row.department,
      row.sessionsAvailable,
      row.expectedSeats,
      row.attendedSeats,
      `${row.attendanceRate}%`,
      row.status,
    ]),
    [],
    [
      "Individual",
      "Email",
      "Department",
      "Eligible sessions",
      "Attended sessions",
      "Attendance rate",
      "Status",
    ],
    ...report.individuals.map(row => [
      row.fullName,
      row.email,
      row.department,
      row.eligibleSessions,
      row.attendedSessions,
      `${row.attendanceRate}%`,
      row.status,
    ]),
    [],
    [
      "Course learner",
      "Email",
      "Department",
      "Course",
      "Cognitive",
      "Phase 2",
      "Phase 3",
      "Completed",
    ],
    ...report.courses.map(row => [
      row.fullName,
      row.email,
      row.department,
      row.programType.toUpperCase(),
      row.cognitiveComplete ? "Complete" : "Not complete",
      row.phase2Status,
      row.phase3Status,
      row.completed ? "Yes" : "No",
    ]),
    [],
    [
      "Target scope",
      "Scope label",
      "Metric",
      "Target",
      "Actual",
      "Progress",
      "Status",
    ],
    ...report.targets.map(row => [
      row.scope,
      row.scopeLabel,
      row.metricKey,
      row.targetValue,
      row.actualValue,
      `${row.progressPercent}%`,
      row.status,
    ]),
  ];
  return lines.map(line => line.map(escape).join(",")).join("\r\n");
}
