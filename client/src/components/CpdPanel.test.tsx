import { describe, expect, it } from "vitest";
import { getCurrentOpenCpdEvent } from "./CpdPanel";

describe("CPD registration session target", () => {
  it("selects the newest open session for the public QR/link", () => {
    const result = getCurrentOpenCpdEvent([
      { id: 18, isOpen: true, name: "Older session" },
      { id: 21, isOpen: false, name: "Closed session" },
      { id: 24, isOpen: true, name: "New session" },
    ]);

    expect(result?.id).toBe(24);
    expect(result?.name).toBe("New session");
  });

  it("returns no registration target when every session is closed", () => {
    expect(
      getCurrentOpenCpdEvent([{ id: 18, isOpen: false, name: "Closed session" }]),
    ).toBeNull();
  });
});
