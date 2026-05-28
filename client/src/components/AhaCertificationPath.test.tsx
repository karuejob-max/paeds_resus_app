/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AhaCertificationPath } from "./AhaCertificationPath";

describe("AhaCertificationPath", () => {
  it("always renders certification path copy for PALS-style default state", () => {
    render(
      <AhaCertificationPath
        cognitiveComplete={false}
        practicalSignedOff={false}
        certificateIssued={false}
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
  });

  it("shows gatepass-ready copy when cognitive modules are complete", () => {
    render(
      <AhaCertificationPath
        cognitiveComplete={true}
        practicalSignedOff={false}
        certificateIssued={false}
      />
    );

    expect(screen.getByText(/gatepass certificate is ready/i)).toBeTruthy();
  });
});
