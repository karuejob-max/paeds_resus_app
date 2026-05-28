/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AhaHubProviderCourseCard } from "./AhaHubProviderCourseCard";

const noop = () => {};

describe("AhaHubProviderCourseCard", () => {
  afterEach(() => cleanup());

  it("shows certification path on PALS hub card when not enrolled", () => {
    render(
      <AhaHubProviderCourseCard
        programType="pals"
        onContinue={noop}
        onEnroll={noop}
        onViewCertificates={noop}
      />
    );

    expect(screen.getByText("Certification path")).toBeTruthy();
    expect(screen.getByText("Complete all cognitive modules")).toBeTruthy();
    expect(screen.getByText("Practical skills — awaiting instructor sign-off")).toBeTruthy();
    expect(
      screen.getByText(
        "Complete all cognitive modules to receive your gatepass certificate for the hands-on practical session."
      )
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start enrollment" })).toBeTruthy();
  });

  it("shows certification path on PALS hub card when enrolled", () => {
    render(
      <AhaHubProviderCourseCard
        programType="pals"
        enrollment={{
          id: 1,
          programType: "pals",
          cognitiveModulesComplete: false,
          practicalSkillsSignedOff: false,
        }}
        onContinue={noop}
        onEnroll={noop}
        onViewCertificates={noop}
      />
    );

    expect(screen.getByText("Certification path")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start course" })).toBeTruthy();
  });

  it("hides certification path while enrollment is pending", () => {
    render(
      <AhaHubProviderCourseCard
        programType="pals"
        enrollmentPending
        onContinue={noop}
        onEnroll={noop}
        onViewCertificates={noop}
      />
    );

    expect(screen.queryByText("Certification path")).toBeNull();
  });

  it("shows certification path on BLS hub card when not enrolled", () => {
    render(
      <AhaHubProviderCourseCard
        programType="bls"
        onContinue={vi.fn()}
        onEnroll={vi.fn()}
        onViewCertificates={vi.fn()}
      />
    );

    expect(screen.getByText("Certification path")).toBeTruthy();
  });
});
