import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchableDropdown } from "./CadreProgressiveSelector";

const OPTIONS = [
  { value: "42", label: "Amina Otieno · Paediatrics · RN · amina@example.com" },
  { value: "43", label: "Brian Kamau · Emergency · MO · brian@example.com" },
];

function Harness() {
  const [value, setValue] = useState("42");
  return (
    <SearchableDropdown
      value={value}
      onChange={setValue}
      options={OPTIONS}
      placeholder="Choose presenter"
      clearable
    />
  );
}

describe("SearchableDropdown clearable selection", () => {
  afterEach(() => cleanup());
  it("clears a selected value with Backspace on the selector", () => {
    render(<Harness />);
    const selector = screen.getByRole("combobox");

    fireEvent.keyDown(selector, { key: "Backspace" });

    expect(selector.textContent).toContain("Choose presenter");
    expect(
      screen.queryByRole("button", { name: "Clear selection" })
    ).toBeNull();
  });

  it("clears a selected value with the clear button", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(screen.getByRole("combobox").textContent).toContain(
      "Choose presenter"
    );
  });
});
