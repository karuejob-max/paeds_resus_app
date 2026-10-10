export type ProfessionalReportType = "monthly" | "quarterly" | "annual" | "custom";

export type ProfessionalReportPeriod = {
  start: string;
  end: string;
};

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current calendar reporting period for a standard interval.
 * Dates are formatted in local time so providers in East Africa do not see
 * the previous day after UTC conversion.
 */
export function getAutomaticProfessionalReportPeriod(
  reportType: Exclude<ProfessionalReportType, "custom">,
  now = new Date(),
): ProfessionalReportPeriod {
  const year = now.getFullYear();
  const month = now.getMonth();
  const startMonth =
    reportType === "annual"
      ? 0
      : reportType === "quarterly"
        ? Math.floor(month / 3) * 3
        : month;

  return {
    start: dateKey(new Date(year, startMonth, 1)),
    end: dateKey(now),
  };
}

export function getDefaultProfessionalReportPeriod(now = new Date()): ProfessionalReportPeriod {
  return getAutomaticProfessionalReportPeriod("monthly", now);
}
