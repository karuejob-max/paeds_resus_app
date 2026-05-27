import { describe, expect, it } from "vitest";
import {
  isValidActionLogStatusTransition,
  requiresSystemChangeOnResolve,
  isPendingAutoDraftSystemChange,
} from "./institutional-action-log-status";

describe("isValidActionLogStatusTransition", () => {
  it("allows open → in_progress and open → completed", () => {
    expect(isValidActionLogStatusTransition("open", "in_progress")).toBe(true);
    expect(isValidActionLogStatusTransition("open", "completed")).toBe(true);
  });

  it("allows in_progress → completed and reopen to open", () => {
    expect(isValidActionLogStatusTransition("in_progress", "completed")).toBe(true);
    expect(isValidActionLogStatusTransition("in_progress", "open")).toBe(true);
  });

  it("blocks changes from completed", () => {
    expect(isValidActionLogStatusTransition("completed", "open")).toBe(false);
    expect(isValidActionLogStatusTransition("completed", "in_progress")).toBe(false);
  });
});

describe("requiresSystemChangeOnResolve", () => {
  it("requires real system change when completing auto draft", () => {
    expect(
      requiresSystemChangeOnResolve(
        "Pending — hospital admin to document the system change committed after reviewing this Care Signal report.",
        "completed"
      )
    ).toBe(true);
  });

  it("allows completion when system change is provided", () => {
    expect(
      requiresSystemChangeOnResolve(
        "Pending — hospital admin to document the system change.",
        "completed",
        "Added paediatric giving set to crash cart; weekly charge nurse sign-off."
      )
    ).toBe(false);
  });
});

describe("isPendingAutoDraftSystemChange", () => {
  it("detects auto-created placeholder text", () => {
    expect(isPendingAutoDraftSystemChange("Pending — review needed")).toBe(true);
    expect(isPendingAutoDraftSystemChange("Added equipment to tray")).toBe(false);
  });
});
