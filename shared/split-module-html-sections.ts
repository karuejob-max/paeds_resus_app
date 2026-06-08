export type ParsedModuleSection = {
  title: string;
  content: string;
  order: number;
};

/** Split fellowship module HTML into player sections (one row per h3 block). */
export function splitModuleHtmlIntoSections(html: string): ParsedModuleSection[] {
  const rawContent = html.trim();
  if (!rawContent) return [];

  const sectionParts = rawContent.split(/<h3>/i).filter((part) => part.trim() !== "");

  if (sectionParts.length === 0) {
    return [{ title: "Overview", content: rawContent, order: 1 }];
  }

  const startsWithH3 = /^<h3>/i.test(rawContent);

  return sectionParts.map((part, index) => {
    const trimmed = part.trim();
    let title = "Overview";
    let content = trimmed;

    if (trimmed.includes("</h3>")) {
      const titleEnd = trimmed.indexOf("</h3>");
      title = trimmed.substring(0, titleEnd).replace(/<[^>]*>/g, "").trim();
      content = trimmed.substring(titleEnd + 5).trim();
    }

    if (index === 0 && !startsWithH3) {
      return {
        title: title || "Overview",
        content: trimmed,
        order: 1,
      };
    }

    return {
      title: title || `Section ${index + 1}`,
      content,
      order: index + 1,
    };
  });
}

/** True when legacy moduleSections rows would hide fresher modules.content in the player. */
export function moduleSectionsStale(
  moduleContent: string,
  sections: { content?: string | null }[]
): boolean {
  const moduleHtml = (moduleContent ?? "").trim();
  if (moduleHtml.length === 0) return false;
  if (sections.length === 0) return false;

  const h3Count = (moduleHtml.match(/<h3\b/gi) || []).length;
  if (h3Count > 0 && sections.length < h3Count) return true;

  const sectionsLen = sections.reduce((sum, row) => sum + (row.content ?? "").trim().length, 0);
  return sectionsLen < moduleHtml.length * 0.75;
}
