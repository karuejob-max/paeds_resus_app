/**
 * Learner-facing Fellowship copy — source of truth for in-app pages and docs/FELLOWSHIP_LEARNER_GUIDE.md.
 * Mission: Eliminating Preventable Childhood Deaths.
 */

export const FELLOWSHIP_MISSION_TAGLINE = "Eliminating Preventable Childhood Deaths";

export const CERTIFICATE_COMPETENCE_DISCLAIMER_SHORT =
  "Certificates attest platform pathway completion only — not clinical competence, licensure, or hospital privileging.";

export type FellowshipLearnerSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const FELLOWSHIP_ABOUT_SECTIONS: FellowshipLearnerSection[] = [
  {
    id: "what",
    title: "What the Paeds Resus Fellowship is",
    paragraphs: [
      "The Paeds Resus Fellowship is a single learning pathway on the Paeds Resus platform. It combines structured micro-courses, bedside practice with ResusGPS, and monthly Care Signal reporting so clinicians build habits that support safer paediatric emergency care — especially where children are most vulnerable.",
      "Completing all three pillars earns the title Paeds Resus Fellow when platform launch readiness is enabled. Your progress is tracked automatically.",
    ],
  },
  {
    id: "not",
    title: "What it is not",
    paragraphs: [
      "The Fellowship is not an AHA BLS, ACLS, or PALS certification. Those are separate offerings from Paeds Resus Limited with their own credentials.",
      "It is not a government medical licence, nursing council registration, or hospital privileging document.",
      "It does not replace your facility's protocols, clinical leadership, or local standard of care.",
    ],
  },
  {
    id: "pillars",
    title: "Three pillars (plain language)",
    paragraphs: [],
    bullets: [
      "Courses — Complete every fellowship pillar micro-course in the catalog (Foundational and Advanced tracks per condition). Summative exams confirm knowledge; ward checklists and LMIC callouts help you adapt teaching to your setting.",
      "ResusGPS practice — Log real cases in ResusGPS for each taught condition (at least three per condition). This ties learning to bedside steps you actually took.",
      "Care Signal consistency — Submit at least one qualifying staff incident or near-miss report each calendar month (East Africa Time), with grace and catch-up rules, until you reach 24 consecutive qualifying months.",
    ],
  },
  {
    id: "structure",
    title: "Foundational and Advanced courses",
    paragraphs: [
      "Most clinical topics have a Foundational micro-course first (core assessment, first-hour actions, safety essentials) and an Advanced track for complications, escalation, and ICU-level decisions.",
      "Complete the Foundational course in a condition pair before the Advanced track unlocks. BLS, ACLS, and PALS on the platform are optional and not required for Fellowship progress.",
    ],
  },
  {
    id: "progress",
    title: "How to progress and what “complete” means",
    paragraphs: [
      "Your Fellowship dashboard shows progress on all three pillars. “Complete” for the pathway means 100% on Courses, ResusGPS, and Care Signal — not passing a single exam or buying a bundle.",
    ],
    bullets: [
      "Diagnostic exams — orientation and gap-finding at course start.",
      "Formative quizzes — practice during modules; feedback helps learning.",
      "Summative exams — end-of-course knowledge checks; must pass to complete a micro-course.",
      "Paeds Resus Fellow — unlocks when all three pillars reach 100% and the platform enables Fellow credentials (see below).",
    ],
  },
  {
    id: "fellow-title",
    title: "Paeds Resus Fellow title",
    paragraphs: [
      "Paeds Resus Fellow attests that you completed the automated three-pillar pathway on this platform. It does not certify that you are safe at the bedside or competent for independent practice.",
      CERTIFICATE_COMPETENCE_DISCLAIMER_SHORT,
      "When all pillars are at 100%, you may claim the Fellow title and diploma (when enabled). Until then, your progress is saved on your dashboard.",
    ],
  },
  {
    id: "bedside",
    title: "Using learning at the bedside",
    paragraphs: [
      "Open ResusGPS during real emergencies for ABCDE flows, drug calculators, and protocols aligned to course teaching. Mark resources unavailable when your ward lacks equipment or drugs — the platform records LMIC-adapted choices.",
      "Use ward action checklists from courses during shifts. Report incidents and near misses through Care Signal to build QI discipline, not to satisfy a checkbox alone.",
    ],
  },
  {
    id: "safety",
    title: "Report unsafe or incorrect content",
    paragraphs: [
      "If you see guidance that could harm a child, use “Report unsafe content” in the course player or ResusGPS footer. Clinical reviewers investigate reports; do not rely on the platform alone for time-critical decisions.",
    ],
  },
];

export type FellowshipQaItem = {
  question: string;
  answer: string;
};

export const FELLOWSHIP_PRACTITIONER_QA: FellowshipQaItem[] = [
  {
    question: "Does passing summative exams make me a safe clinician?",
    answer:
      "No. Summative exams check knowledge on the platform — they are not skills tests, OSCEs, or supervised bedside assessments. Safe practice depends on repetition, team training, equipment, mentorship, and your hospital's governance. Treat exam passes as necessary but not sufficient.",
  },
  {
    question: "What does Paeds Resus Fellow mean for my patients?",
    answer:
      "It means you finished the platform's three-pillar pathway: courses, ResusGPS case logging, and Care Signal monthly discipline. It tells patients and employers you invested in structured learning — not that outcomes improved or that you are licensed beyond your existing credentials.",
  },
  {
    question: "How do I turn course work into lives saved?",
    answer:
      "Complete Foundational courses, practice the same conditions in ResusGPS on real cases, use ward checklists during shifts, debrief with your team after events, and report honestly in Care Signal. Adapt drug and fluid choices when your facility lacks resources — the courses include LMIC callouts for this reason.",
  },
  {
    question: "What is Care Signal really measuring?",
    answer:
      "Care Signal measures consistent monthly reporting behaviour and structured incident/near-miss capture — a proxy for safety culture discipline. It does not measure mortality, complication rates, or whether your hospital is safer than another.",
  },
  {
    question: "What if my hospital lacks drugs or equipment taught in courses?",
    answer:
      "Mark unavailable resources in ResusGPS and follow LMIC alternatives in course content. Fellowship progress still counts when you document real care within your constraints. Do not perform interventions your facility has not authorised or equipped you to deliver.",
  },
];
