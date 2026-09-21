import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchableDropdown } from "./CadreProgressiveSelector";

const OPTIONS = [
  { value: "42", label: "Amina Otieno · Paediatrics · RN · amina@example.com" },
  { value: "43", label: "Brian Kamau · Emergency · MO · brian@example.com" },
];

function Harness({
  onSearchChange,
  searchAlwaysVisible = false,
}: {
  onSearchChange?: (query: string) => void;
  searchAlwaysVisible?: boolean;
}) {
  const [value, setValue] = useState("42");
  return (
    <SearchableDropdown
      value={value}
      onChange={setValue}
      options={OPTIONS}
      placeholder="Choose presenter"
      clearable
      onSearchChange={onSearchChange}
      searchAlwaysVisible={searchAlwaysVisible}
    />
  );
}

describe("SearchableDropdown clearable selection", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
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

  it("renders and selects multiple remote presenter results in always-visible mode", () => {
    const onSearchChange = vi.fn();
    render(<Harness onSearchChange={onSearchChange} searchAlwaysVisible />);

    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByPlaceholderText("Search option...");
    expect(screen.getByRole("option", { name: /Amina Otieno/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Brian Kamau/ })).toBeTruthy();

    fireEvent.change(searchInput, { target: { value: "Brian" } });
    expect(onSearchChange).toHaveBeenCalledWith("Brian");
    fireEvent.click(screen.getByRole("option", { name: /Brian Kamau/ }));
    expect(screen.getByRole("combobox").textContent).toContain("Brian Kamau");
  });

  it("publishes typed search text and allows selecting a returned presenter", () => {
    const onSearchChange = vi.fn();
    render(<Harness onSearchChange={onSearchChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByPlaceholderText("Search option...");
    fireEvent.change(searchInput, { target: { value: "Brian" } });

    expect(onSearchChange).toHaveBeenCalledWith("Brian");
    fireEvent.click(screen.getByText("Brian Kamau · Emergency · MO · brian@example.com"));
    expect(screen.getByRole("combobox").textContent).toContain("Brian Kamau");
  });
});
