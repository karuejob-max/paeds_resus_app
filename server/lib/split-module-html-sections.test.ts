import { describe, expect, it } from "vitest";
import {
  moduleSectionsStale,
  splitModuleHtmlIntoSections,
} from "../../shared/split-module-html-sections";

describe("splitModuleHtmlIntoSections", () => {
  it("splits h3 blocks into ordered sections", () => {
    const html =
      "<p>Intro</p><h3>Severity</h3><ul><li>Mild</li></ul><h3>Treatment</h3><p>SABA</p>";
    const sections = splitModuleHtmlIntoSections(html);
    expect(sections).toHaveLength(3);
    expect(sections[0]?.title).toBe("Overview");
    expect(sections[1]?.title).toBe("Severity");
    expect(sections[2]?.title).toBe("Treatment");
  });
});

describe("moduleSectionsStale", () => {
  it("flags legacy thin sections hiding fresher module HTML", () => {
    const moduleHtml = `<p>Intro</p>${"<h3>Section</h3><p>body</p>".repeat(5)}`;
    const sections = [{ content: "legacy overview only" }];
    expect(moduleSectionsStale(moduleHtml, sections)).toBe(true);
  });

  it("passes when section count and body length match module HTML", () => {
    const moduleHtml =
      "<p>Intro paragraph with enough depth for the ward.</p><h3>A</h3><p>First section body.</p><h3>B</h3><p>Second section body.</p>";
    const sections = [
      { content: "<p>Intro paragraph with enough depth for the ward.</p>" },
      { content: "<p>First section body.</p>" },
      { content: "<p>Second section body.</p>" },
    ];
    expect(moduleSectionsStale(moduleHtml, sections)).toBe(false);
  });
});
