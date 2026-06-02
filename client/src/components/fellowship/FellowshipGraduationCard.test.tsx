import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FellowshipGraduationCard } from "./FellowshipGraduationCard";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    fellowship: {
      claimGraduation: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false }),
      },
    },
    certificates: {
      download: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({
      fellowship: { getProgress: { invalidate: vi.fn() } },
      certificates: { getMyCertificates: { invalidate: vi.fn() } },
    }),
  },
}));

const basePillars = {
  coursesPillar: { percentage: 100, completed: 29, required: 29 },
  resusGPSPillar: {
    percentage: 100,
    conditionsWithThreshold: 10,
    totalConditionsTaught: 10,
  },
  careSignalPillar: { percentage: 100, streak: 24 },
};

describe("FellowshipGraduationCard", () => {
  afterEach(() => cleanup());

  it("shows claim button when qualified and fellowTitleEnabled", () => {
    render(
      <FellowshipGraduationCard
        isQualified
        fellowTitleEnabled
        canDisplayFellowTitle={false}
        {...basePillars}
      />
    );
    expect(screen.getByRole("button", { name: /Claim Paeds Resus Fellow/i })).toBeTruthy();
  });

  it("shows review message when qualified but fellowTitleEnabled false", () => {
    render(
      <FellowshipGraduationCard
        isQualified
        fellowTitleEnabled={false}
        canDisplayFellowTitle={false}
        {...basePillars}
      />
    );
    expect(screen.getAllByText(/final review/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Claim Paeds Resus Fellow/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Learn what Fellow means/i })).toHaveAttribute(
      "href",
      "/fellowship/about"
    );
  });

  it("shows pillar breakdown when not qualified", () => {
    render(
      <FellowshipGraduationCard
        isQualified={false}
        fellowTitleEnabled={false}
        canDisplayFellowTitle={false}
        coursesPillar={{ percentage: 50, completed: 14, required: 29 }}
        resusGPSPillar={{
          percentage: 20,
          conditionsWithThreshold: 2,
          totalConditionsTaught: 10,
        }}
        careSignalPillar={{ percentage: 0, streak: 0 }}
      />
    );
    expect(screen.getByText(/14 of 29/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Fellowship guide/i })).toHaveAttribute(
      "href",
      "/fellowship/about"
    );
  });
});
