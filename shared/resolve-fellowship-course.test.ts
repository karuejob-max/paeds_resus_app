import { describe, expect, it } from "vitest";
import {
  fellowshipTitlePrefix,
  resolveFellowshipCourseFromCandidates,
  type FellowshipCourseCandidate,
} from "./resolve-fellowship-course";

const ASTHMA_CATALOG_TITLE = "Paediatric Asthma: Foundational";

describe("resolve-fellowship-course", () => {
  it("extracts title prefix before colon", () => {
    expect(fellowshipTitlePrefix(ASTHMA_CATALOG_TITLE)).toBe("Paediatric Asthma");
    expect(fellowshipTitlePrefix("")).toBeNull();
  });

  it("prefers exact catalog title over order when duplicate order rows exist", () => {
    const candidates: FellowshipCourseCandidate[] = [
      { id: 66, title: "Paediatric Asthma I (legacy)", order: 1 },
      { id: 6, title: ASTHMA_CATALOG_TITLE, order: 1 },
    ];
    const match = resolveFellowshipCourseFromCandidates(candidates, {
      title: ASTHMA_CATALOG_TITLE,
      order: 1,
    });
    expect(match?.id).toBe(6);
  });

  it("falls back to order when title differs but order matches", () => {
    const candidates: FellowshipCourseCandidate[] = [
      { id: 12, title: "DKA: Foundational", order: 3 },
    ];
    const match = resolveFellowshipCourseFromCandidates(candidates, {
      title: "DKA: Foundational",
      order: 3,
    });
    expect(match?.id).toBe(12);
  });

  it("falls back to title prefix when exact title and order miss", () => {
    const candidates: FellowshipCourseCandidate[] = [
      { id: 47, title: "Paediatric Asthma (old seed)", order: 99 },
    ];
    const match = resolveFellowshipCourseFromCandidates(candidates, {
      title: ASTHMA_CATALOG_TITLE,
      order: 1,
    });
    expect(match?.id).toBe(47);
  });

  it("returns undefined when no candidate matches", () => {
    const match = resolveFellowshipCourseFromCandidates(
      [{ id: 1, title: "Meningitis: Foundational", order: 10 }],
      { title: ASTHMA_CATALOG_TITLE, order: 1 }
    );
    expect(match).toBeUndefined();
  });
});
