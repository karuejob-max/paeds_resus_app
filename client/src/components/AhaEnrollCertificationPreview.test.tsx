import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AhaEnrollCertificationPreview } from "./AhaEnrollCertificationPreview";

describe("AhaEnrollCertificationPreview", () => {
  afterEach(() => cleanup());

  it("shows certification path for PALS during enrollment", () => {
    render(<AhaEnrollCertificationPreview programType="pals" />);
    expect(screen.getByText("Certification path")).toBeTruthy();
    expect(screen.getByText("Complete all cognitive modules")).toBeTruthy();
    expect(screen.getByText(/hands-on practical session/i)).toBeTruthy();
  });

  it("shows certification path for BLS", () => {
    render(<AhaEnrollCertificationPreview programType="bls" />);
    expect(screen.getByText("Certification path")).toBeTruthy();
  });
});
