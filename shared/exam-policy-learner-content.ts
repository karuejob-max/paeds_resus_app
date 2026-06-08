/**
 * Learner-facing assessment policy copy (Fellowship micro-courses vs AHA cognitive courses).
 * Canonical internal mirror: docs/EXAM_POLICY_LEARNER.md
 */

export const EXAM_POLICY_PAGE = {
  path: "/learning/exam-policy",
  title: "How assessments work",
    description:
    "Diagnostic, formative, capstone simulations, and summative exams — pass marks, attempt limits, and retries for Fellowship micro-courses and AHA courses (BLS, ACLS, PALS, NRP, Heartsaver).",
} as const;

/** Deep-link anchors for Fellowship vs AHA sections on the learner policy page. */
export const EXAM_POLICY_ANCHOR_FELLOWSHIP = "fellowship-microcourses";
export const EXAM_POLICY_ANCHOR_AHA = "aha-courses";

export type ExamPolicyTrack = "fellowship" | "aha";

export function examPolicyHref(track?: ExamPolicyTrack): string {
  if (track === "fellowship") return `${EXAM_POLICY_PAGE.path}#${EXAM_POLICY_ANCHOR_FELLOWSHIP}`;
  if (track === "aha") return `${EXAM_POLICY_PAGE.path}#${EXAM_POLICY_ANCHOR_AHA}`;
  return EXAM_POLICY_PAGE.path;
}

export type ExamPolicyTrackIntro = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export const EXAM_POLICY_TRACK_INTROS: ExamPolicyTrackIntro[] = [
  {
    id: EXAM_POLICY_ANCHOR_FELLOWSHIP,
    title: "Fellowship micro-courses",
    paragraphs: [
      "Each condition-focused micro-course in the Paeds Resus Fellowship uses the same three-step assessment flow: diagnostic baseline, per-module formatives, and a final summative exam.",
      "Completing the summative issues a Fellowship certificate for that course and counts toward Pillar A when all catalog courses are done.",
    ],
    bullets: [
      "Foundational before Advanced sequencing — prerequisites apply per condition pair.",
      "Diagnostic once at start (no pass mark); modules unlock after diagnostic.",
      "Summative: 80% pass, up to 3 attempts, 24 hours between retries.",
      "Not AHA certification — separate from BLS/ACLS/PALS.",
    ],
  },
  {
    id: EXAM_POLICY_ANCHOR_AHA,
    title: "AHA courses (BLS, ACLS, PALS, NRP, Heartsaver)",
    paragraphs: [
      "AHA cognitive courses follow a diagnostic → modules → capstone simulation → summative flow. Passing both the simulation and the summative exam completes the online portion and issues a gatepass certificate.",
      "Full AHA certification still requires practical skills sign-off with an instructor at a hands-on session.",
    ],
    bullets: [
      "Diagnostic once at start (no pass mark); modules unlock after diagnostic.",
      "Per-module knowledge checks per course structure.",
      "Capstone Simulation: Practical scenario (Module 10) requiring a 50% pass mark.",
      "Summative: 80% pass, up to 3 attempts, 24 hours between retries.",
      "Separate track — does not count toward Fellowship Pillar A.",
    ],
  },
];

export type ExamPolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const EXAM_POLICY_SECTIONS: ExamPolicySection[] = [
  {
    id: "overview",
    title: "Overview",
    paragraphs: [
      "Paeds Resus uses four assessment types on cognitive courses: a diagnostic baseline at course start, module knowledge checks (formative), practical capstone simulations (AHA tracks), and a final summative exam. AHA courses (BLS, ACLS, PALS, NRP, Heartsaver) follow the full flow: diagnostic → modules → capstone simulation → summative.",
      "Scores for summative exams are calculated on the server — your result is based on stored correct answers, not self-reported marks.",
    ],
  },
  {
    id: "diagnostic",
    title: "Diagnostic baseline",
    paragraphs: [
      "Taken once at the start of a Fellowship micro-course or AHA cognitive course (BLS, ACLS, PALS, NRP). There is no pass mark — it records your baseline before you study.",
    ],
    bullets: [
      "One attempt only — you cannot retake the diagnostic.",
      "Fixed question bank (not shuffled across retakes — retakes are not allowed).",
      "Complete the diagnostic before module content unlocks beyond module 1.",
    ],
  },
  {
    id: "formative",
    title: "Formative knowledge checks",
    paragraphs: [
      "Short quizzes after each module. Questions cover only what was taught in that module.",
    ],
    bullets: [
      "Fellowship: typically at least three items per module when the course is fully seeded.",
      "AHA: module checks follow the course structure; pass marks may differ per quiz.",
      "You can usually retry formatives until you pass (unless your course player says otherwise).",
    ],
  },
  {
    id: "summative",
    title: "Summative (final) exam",
    paragraphs: [
      "Taken after you complete all modules. The same question bank is used each time, but question and answer order are shuffled.",
    ],
    bullets: [
      "Pass mark: 80%.",
      "Up to 3 attempts in total (first try plus 2 retries).",
      "At least 24 hours between attempts after your first summative try.",
      "Required to complete the course and issue your certificate (Fellowship micro-course or AHA cognitive gatepass).",
    ],
  },
  {
    id: "when-retry",
    title: "When can I retry?",
    paragraphs: [
      "If you fail the summative exam, you may retry when both rules allow it: you still have attempts left, and the 24-hour cooldown since your last summative attempt has passed.",
      "Example: you fail PALS summative on Monday 10:00 EAT (attempt 1 of 3). Your next retry opens Tuesday 10:00 EAT or later, until you pass or use all 3 attempts.",
      "If you see “Maximum summative attempts reached,” you have used all 3 attempts without reaching 80%. Further retries require support or an admin reset — the timer does not reset attempt count.",
    ],
  },
  {
    id: "certificate-vs-fellow",
    title: "Certificate vs Fellowship",
    paragraphs: [
      "Passing the summative exam completes the cognitive portion of your course and unlocks certificate issuance for that product.",
    ],
    bullets: [
      "Fellowship micro-course: Paeds Resus Fellowship certificate for that condition — counts toward Pillar A when all catalog courses are complete.",
      "AHA course: AHA-aligned cognitive gatepass — separate track; practical sign-off with an instructor is still required for full AHA certification.",
      "BLS, ACLS, and PALS are not required to become a Paeds Resus Fellow.",
    ],
  },
];

export type ExamPolicyCompareRow = {
  rule: string;
  fellowship: string;
  aha: string;
};

export const EXAM_POLICY_COMPARE_ROWS: ExamPolicyCompareRow[] = [
  { rule: "Diagnostic baseline", fellowship: "Yes — once, no pass mark", aha: "Yes — once, no pass mark" },
  { rule: "Per-module formative checks", fellowship: "Yes — taught-before-tested", aha: "Yes — per course structure" },
  { rule: "Summative final exam", fellowship: "Yes — shuffled bank", aha: "Yes — shuffled bank" },
  { rule: "Capstone Simulation (Module 10)", fellowship: "N/A", aha: "Yes — 50% pass mark" },
  { rule: "Summative pass mark", fellowship: "80%", aha: "80%" },
  { rule: "Summative max attempts", fellowship: "3 (1 + 2 retries)", aha: "3 (1 + 2 retries)" },
  { rule: "24h between summative attempts", fellowship: "Yes", aha: "Yes" },
  { rule: "Server-graded summative", fellowship: "Yes", aha: "Yes" },
  { rule: "Foundational / Advanced tracks", fellowship: "Yes", aha: "No — single AHA curriculum" },
  { rule: "Fellowship Pillar A credit", fellowship: "Yes", aha: "No — separate AHA path" },
  { rule: "Practical instructor sign-off", fellowship: "N/A for micro-courses", aha: "Required for full AHA cert" },
];

/** Rules enforced on Fellowship but not on AHA (gap / honest diff). */
export const EXAM_POLICY_AHA_GAPS: string[] = [
  "Fellowship foundational vs advanced sequencing and prerequisites",
  "Minimum native formative bank per module (governance seed rules)",
  "Micro-course completion gate tied to Fellowship catalog (assertMicrocourseCompletionAllowed)",
  "Pillar A progress toward Paeds Resus Fellow",
];

export const EXAM_POLICY_ADMIN_RESET_SECTION = {
  id: "admin-reset",
  title: "Maximum attempts reached — admin reset",
  paragraphs: [
    "If you have used all 3 summative attempts without reaching 80%, the course player blocks further summative retries until an administrator resets your summative progress for that enrollment.",
    "Support verifies your identity and attempt history, then an admin clears the summative attempt counter on your enrollment (scores and attempt count for the final exam only — diagnostic and module progress are not removed).",
  ],
  bullets: [
    "Admins use Platform Admin → Reports → Enrollment ledger (training / AHA rows).",
    "Procedure: adminLearning.resetSummativeAttempts (logged in admin audit trail).",
    "Self-serve reset is not available in v1.",
  ],
} as const;
