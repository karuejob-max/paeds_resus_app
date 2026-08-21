import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FacilityAutocomplete } from "./FacilityAutocomplete";

const EMPTY_RESULTS: never[] = [];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    institution: {
      searchKmhflFacilities: {
        useQuery: vi.fn(() => ({ data: EMPTY_RESULTS, isLoading: false })),
      },
    },
  },
}));

function Harness() {
  const [name, setName] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(true);

  return (
    <FacilityAutocomplete
      value={name}
      onSelect={vi.fn()}
      onManualEntry={setName}
      isManualEntry={isManualEntry}
      onManualEntryChange={setIsManualEntry}
    />
  );
}

describe("FacilityAutocomplete", () => {
  it("keeps manual facility typing synchronized with the parent value", () => {
    render(<Harness />);

    const input = screen.getByPlaceholderText("Enter your facility name");
    fireEvent.change(input, { target: { value: "AB" } });

    expect((input as HTMLInputElement).value).toBe("AB");
  });
});
