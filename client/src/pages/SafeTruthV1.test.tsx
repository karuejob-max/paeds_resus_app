/** @vitest-environment jsdom */
/**
 * Tests for SafeTruthV1.tsx — the no-auth Safe-Truth form
 * (gap-analysis queue item #11 Phase B).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup, within } from "@testing-library/react";
import { trpc } from "@/lib/trpc";
import SafeTruthV1 from "./SafeTruthV1";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    safeTruthV1: {
      acknowledgeDisclaimer: { useMutation: vi.fn() },
      getGeoLabels: { useQuery: vi.fn() },
      submit: { useMutation: vi.fn() },
    },
  },
}));

function setup() {
  vi.mocked(trpc.safeTruthV1.acknowledgeDisclaimer.useMutation).mockReturnValue({
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof trpc.safeTruthV1.acknowledgeDisclaimer.useMutation>);

  vi.mocked(trpc.safeTruthV1.getGeoLabels.useQuery).mockReturnValue({
    data: {
      isoCode: "KE",
      adminLevel1Label: "County",
      adminLevel2Label: "Sub-county / area",
      adminLevel1Options: ["Nyeri", "Nairobi"],
    },
  } as unknown as ReturnType<typeof trpc.safeTruthV1.getGeoLabels.useQuery>);

  vi.mocked(trpc.safeTruthV1.submit.useMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof trpc.safeTruthV1.submit.useMutation>);
}

describe("SafeTruthV1", () => {
  beforeEach(() => {
    localStorage.clear();
    setup();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the emergency disclaimer first when not previously acknowledged", () => {
    const { container } = render(<SafeTruthV1 />);
    const screen = within(container);
    expect(screen.getByText(/Before we begin/i)).toBeTruthy();
    expect(screen.getByText(/call your local emergency number/i)).toBeTruthy();
  });

  it("moves to the narrative step after accepting the disclaimer, and records the acknowledgment", () => {
    const mutate = vi.fn();
    vi.mocked(trpc.safeTruthV1.acknowledgeDisclaimer.useMutation).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof trpc.safeTruthV1.acknowledgeDisclaimer.useMutation>);

    const { container } = render(<SafeTruthV1 />);
    const screen = within(container);
    fireEvent.click(screen.getByText(/I understand — continue/i));

    expect(screen.getByRole("heading", { name: /Tell us what happened/i })).toBeTruthy();
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ deviceSessionId: expect.any(String) }));
    expect(localStorage.getItem("paeds_resus_safe_truth_disclaimer_acked_v1")).toBe("true");
  });

  it("skips the disclaimer on a return visit (already acknowledged on this device)", () => {
    localStorage.setItem("paeds_resus_safe_truth_disclaimer_acked_v1", "true");
    const { container } = render(<SafeTruthV1 />);
    const screen = within(container);
    expect(screen.getByRole("heading", { name: /Tell us what happened/i })).toBeTruthy();
    expect(screen.queryByText(/Before we begin/i)).toBeFalsy();
  });

  it("blocks continuing past the narrative step with too little detail", () => {
    localStorage.setItem("paeds_resus_safe_truth_disclaimer_acked_v1", "true");
    const { container } = render(<SafeTruthV1 />);
    const screen = within(container);

    const textarea = screen.getByPlaceholderText(/Start wherever feels right/i);
    fireEvent.change(textarea, { target: { value: "Too short." } });
    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByText(/share a little more detail/i)).toBeTruthy();
    // Still on the narrative step, not advanced to "basics".
    expect(screen.getByRole("heading", { name: /Tell us what happened/i })).toBeTruthy();
  });

  it("advances to the next step once the narrative has enough detail", () => {
    localStorage.setItem("paeds_resus_safe_truth_disclaimer_acked_v1", "true");
    const { container } = render(<SafeTruthV1 />);
    const screen = within(container);

    const textarea = screen.getByPlaceholderText(/Start wherever feels right/i);
    fireEvent.change(textarea, {
      target: { value: "My child had a high fever and became very sleepy, so we rushed to hospital." },
    });
    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByRole("heading", { name: /A few basic details/i })).toBeTruthy();
  });

  it("renders a honeypot field that is hidden from view", () => {
    localStorage.setItem("paeds_resus_safe_truth_disclaimer_acked_v1", "true");
    const { container } = render(<SafeTruthV1 />);
    const honeypot = container.querySelector('input[aria-hidden="true"]') as HTMLElement | null;
    expect(honeypot).toBeTruthy();
    expect(honeypot?.style.opacity).toBe("0");
  });
});
