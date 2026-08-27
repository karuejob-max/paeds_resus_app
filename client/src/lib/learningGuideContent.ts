export type GuideAudience = "individual" | "institution";

export type LearningGuideStep = {
  number: string;
  title: string;
  detail: string;
};

export type LearningDestination = {
  title: string;
  description: string;
  route: string;
  action: string;
};

/** Keep this label visible so copy can be reviewed when the product surface changes. */
export const LEARNING_GUIDE_VERSION = "Current platform guide · August 2026";

export const LEARNING_BOUNDARIES = [
  {
    title: "Learn",
    owner: "Individual portal · /learn",
    description:
      "Fellowship micro-courses and standalone AHA life-support learning. Work through the course player, quizzes, progress, and the next learning action.",
  },
  {
    title: "Practice",
    owner: "ResusGPS · /resus",
    description:
      "Structured paediatric emergency guidance for trained providers. Use local policy, senior review, and professional judgement alongside it.",
  },
  {
    title: "Readiness",
    owner: "IERS · My Shift or Institution → Readiness",
    description:
      "Dated duties, acceptance, start-of-shift checks, equipment gaps, drills, evidence, actions, and institutional response operations.",
  },
  {
    title: "Records",
    owner: "My Records · /records",
    description:
      "CPD attendance, certificates, facility relationships, and profile/account records. A record is not automatically proof of current readiness.",
  },
] as const;

export const INDIVIDUAL_LEARNING_STEPS: LearningGuideStep[] = [
  {
    number: "1",
    title: "Start with Today",
    detail:
      "Open /home and clear any urgent activation, duty, or readiness task before general learning. The individual portal keeps emergency work ahead of courses and historical metrics.",
  },
  {
    number: "2",
    title: "Choose the right learning track",
    detail:
      "Open Learn and choose the Paeds Resus Fellowship journey or a separate AHA life-support course. Fellowship and AHA certifications are distinct; BLS, ACLS, and PALS are not Fellowship requirements.",
  },
  {
    number: "3",
    title: "Complete the linear course flow",
    detail:
      "Work through module content, take the module quiz, review the immediate score, retry when needed, and continue to the next module after passing. After the final pass, follow the certificate action.",
  },
  {
    number: "4",
    title: "Connect learning to practice",
    detail:
      "Use the relevant ResusGPS pathway for bedside guidance. Use My Shift for accepted IERS duties, readiness checks, debriefs, evidence, and assigned actions. Use Care Signal for provider incident or near-miss learning without patient identifiers.",
  },
  {
    number: "5",
    title: "Review progress and records",
    detail:
      "Use Learn for the next course action and My Records for certificates and CPD history. Completion, attendance, or a certificate does not by itself prove bedside competence, current shift readiness, or emergency-dispatch authority.",
  },
];

export const INDIVIDUAL_DESTINATIONS: LearningDestination[] = [
  {
    title: "Open Learn",
    description: "Continue a course or choose Fellowship versus AHA learning.",
    route: "/learn",
    action: "Open Learn",
  },
  {
    title: "Open Fellowship",
    description:
      "Follow the condition-focused micro-course journey and progress view.",
    route: "/fellowship",
    action: "Open Fellowship",
  },
  {
    title: "Open AHA courses",
    description:
      "Access standalone BLS, ACLS, PALS, NRP, Heartsaver, and instructor tracks.",
    route: "/aha-courses",
    action: "Open AHA courses",
  },
  {
    title: "Open My Records",
    description:
      "Review certificates, CPD, facility relationships, and profile records.",
    route: "/records",
    action: "Open My Records",
  },
];

export const INSTITUTION_LEARNING_STEPS: LearningGuideStep[] = [
  {
    number: "1",
    title: "Confirm the workspace",
    detail:
      "Open /institution, confirm the correct facility, and check whether IERS and CPD Portal access are active. A product that is not active can remain visible with history preserved, but new operations may be blocked.",
  },
  {
    number: "2",
    title: "Use Learning overview",
    detail:
      "Use the institutional journey in order: Need → Enrol → Train → Verify → Improve. Start with the gap, enrol the right staff, then follow through to evidence and improvement rather than stopping at registration.",
  },
  {
    number: "3",
    title: "Run cohorts and competency",
    detail:
      "Use Cohorts & competency for staff enrolment, scheduled institutional competency, attendance, readiness-related proof review, and cohort progress. Keep attendance and course completion distinct from operational readiness.",
  },
  {
    number: "4",
    title: "Run the CPD Portal",
    detail:
      "Use CPD Portal for professional-development sessions, attendance, certificates, and staff-development records. These records support workforce learning but do not replace an IERS duty acceptance or readiness check.",
  },
  {
    number: "5",
    title: "Use intelligence and governance",
    detail:
      "Use Intelligence & reports to compare departments and people with learning targets and to prepare stakeholder reports. Use Coordinators & targets to assign ownership and define facility, department, or individual expectations.",
  },
  {
    number: "6",
    title: "Hand off to the right portal",
    detail:
      "Providers complete their personal learning in the Individual portal. The institution manages cohorts and evidence in the institutional portal; it must not sign a provider’s readiness statement on the provider’s behalf.",
  },
];

export const INSTITUTION_LEARNING_TABS = [
  {
    title: "Learning overview",
    description:
      "The institutional Need → Enrol → Train → Verify → Improve journey.",
  },
  {
    title: "Cohorts & competency",
    description:
      "Bulk enrolment, schedules, attendance, competency evidence, and proof review.",
  },
  {
    title: "CPD Portal",
    description:
      "Professional-development sessions, attendance, certificates, and staff records.",
  },
  {
    title: "Intelligence & reports",
    description:
      "Targets, comparisons, stakeholder reports, and a route back to Readiness review.",
  },
  {
    title: "Coordinators & targets",
    description:
      "Department coordinators and facility, department, or individual expectations.",
  },
] as const;

export const INSTITUTION_DESTINATIONS: LearningDestination[] = [
  {
    title: "Open institutional Learning",
    description:
      "Return to the institution workspace with the Learning lane selected.",
    route: "/institution?section=learning",
    action: "Open Learning",
  },
  {
    title: "Open Readiness",
    description:
      "Use IERS for command, evidence, drills, teams, equipment, plans, and snapshots.",
    route: "/institution?section=iers",
    action: "Open Readiness",
  },
  {
    title: "Open Administration",
    description:
      "Manage people, roles, access, subscriptions, renewal, and recovery.",
    route: "/institution?section=administration",
    action: "Open Administration",
  },
];

export const LEARNING_GUIDE_SAFETY_NOTE =
  "Learning content supports professional development. It does not replace local policy, trained clinical judgement, senior review, emergency services, or the separate IERS Readiness workflow. Never enter patient identifiers into learning, drill, evidence, action, or Care Signal records.";
