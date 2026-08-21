import { describe, expect, it } from "vitest";
import { hasUsableModuleContent, moduleSectionsStale, splitModuleHtmlIntoSections } from "./split-module-html-sections";

describe("module content health", () => {
  it("recognizes section content when the module-level HTML is empty", () => {
    expect(hasUsableModuleContent(null, [{ content: "<p>Lesson content</p>" }])).toBe(true);
  });

  it("recognizes the production failure shape as unusable", () => {
    expect(hasUsableModuleContent(null, [])).toBe(false);
    expect(hasUsableModuleContent("", [{ content: "   " }])).toBe(false);
  });

  it("keeps the legacy HTML fallback behavior intact", () => {
    const sections = splitModuleHtmlIntoSections("<h3>Recognition</h3><p>Act early.</p>");
    expect(sections).toHaveLength(1);
    expect(moduleSectionsStale("<h3>Recognition</h3><p>Act early.</p>", [])).toBe(false);
  });
});
