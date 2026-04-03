/**
 * Paediatric Septic Shock I — paginated module flow with short formative checks.
 * Goal: after the course, the provider can recognise septic shock and apply first-hour principles per local policy.
 * Content order must match `ensure-paediatric-septic-shock-catalog.ts` section splits on `<h2>`.
 */

export type FormativeQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  rationale: string;
};

export type ModuleStep =
  | { kind: "read"; html: string; index: number; total: number }
  | { kind: "formative"; title: string; focus: string; questions: FormativeQuestion[] };

function splitSections(html: string): string[] {
  const h = html?.trim() ?? "";
  if (!h) return [];
  const parts = h.split(/(?=<h2\b)/i).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [h];
}

type FormativeInsert = {
  /** Show this formative after the learner finishes the section at this index (0-based). */
  afterSectionIndex: number;
  title: string;
  focus: string;
  questions: FormativeQuestion[];
};

const MODULE_FORMATIVES: Partial<Record<number, FormativeInsert[]>> = {
  1: [
    {
      afterSectionIndex: 3,
      title: "Quick check: recognition",
      focus: "Can you spot shock early?",
      questions: [
        {
          prompt:
            "Which pattern best suggests paediatric septic shock in a febrile child, before blood pressure drops?",
          options: [
            "Wait for systolic BP below the 5th centile before starting fluids",
            "Mottled skin, prolonged capillary refill, altered mental status, tachycardia out of proportion to fever",
            "Treat as simple dehydration with oral fluids only",
            "Send home if temperature responds to antipyretics",
          ],
          correctIndex: 1,
          rationale:
            "Hypotension is often late in children. Perfusion, behaviour, and work of breathing usually change first—follow your facility’s thresholds and escalate early.",
        },
        {
          prompt: "In plain terms, “shock” in this context mainly means:",
          options: [
            "The child is allergic to antibiotics",
            "Circulatory failure to deliver enough oxygen to tissues—often infection-related",
            "Only a laboratory diagnosis",
            "Always requires a blood pressure cuff reading",
          ],
          correctIndex: 1,
          rationale:
            "Shock is a clinical syndrome of inadequate perfusion; use your primary survey and facility protocol, not a single number.",
        },
      ],
    },
    {
      afterSectionIndex: 5,
      title: "Quick check: first response",
      focus: "Parallel assessment",
      questions: [
        {
          prompt: "When sepsis is suspected, the safest default approach is usually to:",
          options: [
            "Finish all investigations before any treatment",
            "Use a structured primary survey, treat life threats in parallel, and call senior help early per policy",
            "Ignore breathing until circulation is fixed",
            "Rely on a single observation at triage",
          ],
          correctIndex: 1,
          rationale:
            "International themes stress timely recognition and parallel actions within your local framework—ABCDE and team communication matter.",
        },
      ],
    },
  ],
  2: [
    {
      afterSectionIndex: 2,
      title: "Quick check: fluids",
      focus: "Balanced resuscitation",
      questions: [
        {
          prompt:
            "Which statement best matches common teaching (always follow your hospital protocol)?",
          options: [
            "Colloids are first-line plasma expanders for all septic children",
            "Balanced crystalloids are often preferred; saline can be acceptable if that is what you have; reassess after small boluses",
            "Give large fluid volumes rapidly without reassessment",
            "Ignore signs of fluid overload",
          ],
          correctIndex: 1,
          rationale:
            "Guidelines lean toward balanced solutions where available; FEAST-informed caution means small boluses, frequent reassessment, and stop/escalate if overloaded.",
        },
        {
          prompt: "If the child remains in shock but you see signs of fluid overload, you should typically:",
          options: [
            "Give another bolus to complete a fixed volume target",
            "Stop bolusing and escalate per protocol (e.g. referral, inotropes)",
            "Discharge with oral fluids",
            "Wait 24 hours before reassessment",
          ],
          correctIndex: 1,
          rationale:
            "Fluid refractory shock with overload is an escalation trigger—refer or second-line therapy per local policy.",
        },
      ],
    },
    {
      afterSectionIndex: 4,
      title: "Quick check: antibiotics & reassessment",
      focus: "Time-critical care",
      questions: [
        {
          prompt: "When bacterial sepsis is suspected, antibiotics should generally:",
          options: [
            "Be delayed until all cultures return",
            "Not be delayed solely to complete tests—choose empiric therapy per guideline and likely source",
            "Be avoided in children",
            "Be given only in ICU",
          ],
          correctIndex: 1,
          rationale:
            "Timely antibiotics after cultures when feasible without unsafe delay is a recurring theme in sepsis programmes.",
        },
      ],
    },
  ],
  3: [
    {
      afterSectionIndex: 1,
      title: "Quick check: escalation",
      focus: "When to call for help",
      questions: [
        {
          prompt: "Clear escalation triggers often include:",
          options: [
            "Only when the child is unconscious",
            "Worsening perfusion, rising oxygen need, altered consciousness, or no improvement after initial resuscitation—use structured handover",
            "Waiting for family request",
            "Avoiding documentation",
          ],
          correctIndex: 1,
          rationale:
            "Define triggers with your team; use SBARR or similar so senior support arrives early.",
        },
      ],
    },
    {
      afterSectionIndex: 3,
      title: "Quick check: systems & dignity",
      focus: "Low-resource honesty",
      questions: [
        {
          prompt: "If critical resources were missing, the most constructive next step is usually to:",
          options: [
            "Hide the gap from the record",
            "Document what was done, what was missing, and what would have changed care—feeds quality improvement",
            "Blame individuals",
            "Discharge without follow-up",
          ],
          correctIndex: 1,
          rationale:
            "Systems gaps belong in improvement cycles; your course prepares you to recognise shock and advocate safely.",
        },
      ],
    },
  ],
};

/**
 * Interleave reading sections with formative steps. If no formative config exists, returns read steps only.
 */
export function buildPssModuleSteps(moduleOrder: number, html: string): ModuleStep[] {
  const sections = splitSections(html);
  const inserts = MODULE_FORMATIVES[moduleOrder];
  const steps: ModuleStep[] = [];

  if (!inserts?.length) {
    return sections.map((chunk, i) => ({
      kind: "read" as const,
      html: chunk,
      index: i,
      total: sections.length,
    }));
  }

  for (let i = 0; i < sections.length; i++) {
    steps.push({ kind: "read", html: sections[i], index: i, total: sections.length });
    for (const ins of inserts) {
      if (ins.afterSectionIndex === i) {
        steps.push({
          kind: "formative",
          title: ins.title,
          focus: ins.focus,
          questions: ins.questions,
        });
      }
    }
  }

  return steps;
}
