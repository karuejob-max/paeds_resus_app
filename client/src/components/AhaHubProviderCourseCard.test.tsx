/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: "Continue coursework" })).toBeTruthy();
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

  it("keeps IERP coursework on the hub and offers the IERP portal as a secondary route", () => {
    const onContinue = vi.fn();
    const onOpenPathway = vi.fn();
    render(
      <AhaHubProviderCourseCard
        programType="bls"
        accessDecision={{ allowed: true, pathway: "ierp", message: "Access granted through IERP." }}
        enrollment={{ id: 9, programType: "bls", cognitiveModulesComplete: false, practicalSkillsSignedOff: false }}
        onContinue={onContinue}
        onEnroll={noop}
        onViewCertificates={noop}
        onOpenPathway={onOpenPathway}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue coursework" }));
    expect(onContinue).toHaveBeenCalledWith("bls", 9);
    fireEvent.click(screen.getByRole("button", { name: "Open IERP programme portal" }));
    expect(onOpenPathway).toHaveBeenCalledWith("ierp");
  });

  it("keeps review access visible after the full certificate is issued", () => {
    const onContinue = vi.fn();
    render(
      <AhaHubProviderCourseCard
        programType="bls"
        accessDecision={{ allowed: true, pathway: "independent", message: "Access granted." }}
        enrollment={{ id: 10, programType: "bls", cognitiveModulesComplete: true, practicalSkillsSignedOff: true }}
        onContinue={onContinue}
        onEnroll={noop}
        onViewCertificates={noop}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Review coursework" }));
    expect(onContinue).toHaveBeenCalledWith("bls", 10);
  });

  it("shows dual duration lines on hub cards", () => {
    render(
      <AhaHubProviderCourseCard
        programType="pals"
        onContinue={noop}
        onEnroll={noop}
        onViewCertificates={noop}
      />
    );

    expect(screen.getByText("Total time (AHA recommendation): 16 hours")).toBeTruthy();
    expect(screen.getByText("Cognitive coursework: 10 modules • ~10 hours online")).toBeTruthy();
  });
});
