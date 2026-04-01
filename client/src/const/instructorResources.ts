/**
 * Curated links for Paeds Resus instructors (portal Resources section).
 * Add facilitator PDFs / slide decks here as they are published.
 */
export type InstructorResourceLink = {
  title: string;
  description: string;
  href: string;
  /** If true, opens in a new tab */
  external?: boolean;
};

export const instructorResources: InstructorResourceLink[] = [
  {
    title: "Instructor portal",
    description: "Assignments, certification status, and teaching readiness.",
    href: "/instructor-portal",
  },
  {
    title: "Learner dashboard",
    description: "Enroll in courses, open modules, and download certificates.",
    href: "/learner-dashboard",
  },
  {
    title: "Enroll — Instructor Course",
    description: "Train-the-trainer pathway and instructor number.",
    href: "/enroll#course-instructor",
  },
  {
    title: "Provider hub",
    description: "ResusGPS and quick links for clinical work.",
    href: "/home",
  },
  {
    title: "Help & support",
    description: "FAQs and how to reach the team.",
    href: "/help",
  },
];
