import { describe, expect, it } from "vitest";
import { PUBLIC_RESOURCES } from "./publicResources";

describe("ACLS public authority resource", () => {
  it("contains approved pricing, Kenya intent, and practical-session boundaries", () => {
    const resource = PUBLIC_RESOURCES.find((item) => item.slug === "acls-course-cost-kenya");
    expect(resource).toBeDefined();

    const text = [
      resource?.title,
      resource?.summary,
      resource?.question,
      ...(resource?.body ?? []),
    ].join(" ");

    expect(text).toContain("ACLS training in Kenya");
    expect(text).toContain("KES 20,000 per person");
    expect(text).toContain("KES 17,500 per person for cohorts of 7 or more");
    expect(text).toContain("practical megacode session");
    expect(text).not.toContain("Consolata Hospital Mathari");
  });
});
