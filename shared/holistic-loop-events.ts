/**
 * Analytics event builders for the ResusGPS → Care Signal → learning closed loop.
 * Used by integration tests and documents the expected event sequence (MATURITY_ROADMAP Issue #1).
 */

export type HolisticLoopAnalyticsRow = {
  eventType: string | null;
  eventName: string | null;
  userId: number | null;
  eventData: string | null;
};

export type HolisticLoopStep =
  | "resus_session_completed"
  | "care_signal_prompt_shown"
  | "care_signal_prompt_accepted"
  | "care_signal_prompt_dismissed"
  | "septic_shock_micro_course_clicked"
  | "care_signal_submitted";

export type SimulateHolisticLoopOptions = {
  userId: number;
  diagnosis?: string;
  steps?: HolisticLoopStep[];
  includeSepticCourseClick?: boolean;
};

const DEFAULT_SEPTIC_STEPS: HolisticLoopStep[] = [
  "resus_session_completed",
  "care_signal_prompt_shown",
  "care_signal_prompt_accepted",
  "care_signal_submitted",
];

/** Build analytics rows for a septic shock holistic loop journey. */
export function simulateHolisticLoopEvents(options: SimulateHolisticLoopOptions): HolisticLoopAnalyticsRow[] {
  const {
    userId,
    diagnosis = "septic_shock",
    steps = DEFAULT_SEPTIC_STEPS,
    includeSepticCourseClick = false,
  } = options;

  const rows: HolisticLoopAnalyticsRow[] = [];
  const loopMeta = {
    diagnosis,
    mappedEventType: "septic_shock",
    source: "resusgps_post_case",
  };

  for (const step of steps) {
    switch (step) {
      case "resus_session_completed":
        rows.push({
          eventType: "resus_session",
          eventName: "ResusGPS workspace entered",
          userId,
          eventData: JSON.stringify({ primaryDiagnosis: diagnosis }),
        });
        break;
      case "care_signal_prompt_shown":
        rows.push({
          eventType: "holistic_loop",
          eventName: "care_signal_prompt_shown",
          userId,
          eventData: JSON.stringify(loopMeta),
        });
        break;
      case "care_signal_prompt_accepted":
        rows.push({
          eventType: "holistic_loop",
          eventName: "care_signal_prompt_accepted",
          userId,
          eventData: JSON.stringify({ ...loopMeta, destination: "/care-signal" }),
        });
        break;
      case "care_signal_prompt_dismissed":
        rows.push({
          eventType: "holistic_loop",
          eventName: "care_signal_prompt_dismissed",
          userId,
          eventData: JSON.stringify(loopMeta),
        });
        break;
      case "septic_shock_micro_course_clicked":
        rows.push({
          eventType: "holistic_loop",
          eventName: "septic_shock_micro_course_clicked",
          userId,
          eventData: JSON.stringify({
            ...loopMeta,
            destination: "/micro-course/septic-shock-i",
          }),
        });
        break;
      case "care_signal_submitted":
        rows.push({
          eventType: "care_signal_submission_created",
          eventName: "Care Signal submission",
          userId,
          eventData: JSON.stringify({
            eventType: "shock_sepsis",
            source: "resusgps",
            prefillSource: "resusgps",
            submissionVersion: "v2",
          }),
        });
        break;
      default:
        break;
    }
  }

  if (includeSepticCourseClick && !steps.includes("septic_shock_micro_course_clicked")) {
    rows.push({
      eventType: "holistic_loop",
      eventName: "septic_shock_micro_course_clicked",
      userId,
      eventData: JSON.stringify({
        ...loopMeta,
        destination: "/micro-course/septic-shock-i",
      }),
    });
  }

  return rows;
}
