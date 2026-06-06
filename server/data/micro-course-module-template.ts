/**
 * International-standard fellowship module HTML builders (AHA parity).
 * Used in seed authoring and enhanceFellowshipModuleContent injection.
 */

export type ModuleSection = {
  heading: string;
  bodyHtml: string;
};

/** Learning objectives block — matches PALS module opener pattern. */
export function moduleLearningObjectives(objectives: string[]): string {
  if (objectives.length === 0) return "";
  const items = objectives.map((o) => `<li>${o}</li>`).join("\n");
  return `<section class="learning-objectives border-l-4 border-sky-600 pl-4 my-4">
<h3>Learning objectives</h3>
<p class="text-sm text-muted-foreground">After this module you should be able to:</p>
<ul class="list-disc pl-5 space-y-1">${items}</ul>
</section>`;
}

/** Structured section with h3 heading. */
export function moduleSection(heading: string, bodyHtml: string): string {
  return `<h3>${heading}</h3>\n${bodyHtml}`;
}

/** Key takeaway callout (PALS-style clinical-note). */
export function moduleKeyTakeaway(html: string): string {
  return `<div class="clinical-note border-l-4 border-emerald-600 pl-3 my-4"><h4>Key takeaway</h4>${html}</div>`;
}

/** Bedside action steps for ward use. */
export function moduleBedsideActions(steps: string[]): string {
  const items = steps.map((s) => `<li>${s}</li>`).join("\n");
  return `<section class="bedside-actions my-4"><h3>Bedside actions</h3><ol class="list-decimal pl-5 space-y-1">${items}</ol></section>`;
}

/** Compose a full international-standard module body. */
export function buildInternationalModuleHtml(opts: {
  overview?: string;
  objectives: string[];
  sections: ModuleSection[];
  keyTakeaway?: string;
  bedsideActions?: string[];
}): string {
  const parts: string[] = [];
  if (opts.overview) {
    parts.push(`<p>${opts.overview}</p>`);
  }
  parts.push(moduleLearningObjectives(opts.objectives));
  for (const s of opts.sections) {
    parts.push(moduleSection(s.heading, s.bodyHtml));
  }
  if (opts.keyTakeaway) {
    parts.push(moduleKeyTakeaway(opts.keyTakeaway));
  }
  if (opts.bedsideActions?.length) {
    parts.push(moduleBedsideActions(opts.bedsideActions));
  }
  return parts.join("\n");
}

/** Normalize React-style className to HTML class in seeded content. */
export function normalizeModuleHtmlClasses(html: string): string {
  return html.replace(/\bclassName=/g, "class=");
}

/** Prepend objectives if not already present in module HTML. */
export function injectLearningObjectivesIfMissing(
  html: string,
  objectives: string[]
): string {
  const normalized = normalizeModuleHtmlClasses(html);
  if (objectives.length === 0) return normalized;
  if (/learning-objectives|Learning objectives/i.test(normalized)) return normalized;
  const block = moduleLearningObjectives(objectives);
  const h2 = normalized.match(/<h2[^>]*>/);
  if (h2 && h2.index != null) {
    return (
      normalized.slice(0, h2.index + h2[0].length) +
      "\n" +
      block +
      normalized.slice(h2.index + h2[0].length)
    );
  }
  return block + "\n" + normalized;
}
