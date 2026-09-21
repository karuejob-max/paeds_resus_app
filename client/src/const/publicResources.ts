export type PublicResource = {
  slug: string;
  title: string;
  summary: string;
  audience: "Providers" | "Institutions";
  question: string;
  publishedAt: string;
  body: string[];
};

export const PUBLIC_RESOURCES: PublicResource[] = [
  {
    slug: "bls-certification-cost-kenya",
    title: "What to check before choosing BLS certification in Kenya",
    summary:
      "A practical guide to comparing BLS course delivery, assessment, evidence, and renewal expectations before you book.",
    audience: "Providers",
    question: "What should I compare when choosing BLS certification in Kenya?",
    publishedAt: "2026-09-04",
    body: [
      "Start by checking what the fee includes. A credible BLS pathway should make the learning format, practical assessment, completion evidence, and certificate pathway clear before payment.",
      "Next, check whether the course fits your role and current requirement. AHA BLS is an individual foundation pathway; institutional cohort delivery belongs in ILSP when an organisation needs managed scheduling and completion evidence.",
      "Finally, confirm how renewal and records are handled. Keep your certificate and completion evidence accessible, and use the provider pathway that matches the next shift, posting, or credential requirement.",
    ],
  },
  {
    slug: "acls-course-cost-kenya",
    title: "What to check before choosing ACLS training in Kenya",
    summary:
      "A practical guide to comparing ACLS course scope, blended delivery, practical megacode assessment, pricing, and renewal expectations before you book.",
    audience: "Providers",
    question: "What should I compare when choosing ACLS training in Kenya?",
    publishedAt: "2026-09-14",
    body: [
      "Start by confirming who the ACLS pathway is designed for. ACLS supports healthcare providers who respond to adult cardiac arrest, peri-arrest arrhythmias, acute coronary syndromes, stroke, and organised resuscitation-team events. Paediatric teams should also check whether they need PALS for child-specific emergencies and whether their employer requires both tracks.",
      "Then check the delivery sequence. A credible blended pathway should distinguish online cognitive learning from the instructor-led practical megacode session. Ask what must be completed before the practical assessment, what evidence is issued at each stage, how the final certificate is described, and how you can verify the record later.",
      "Paeds Resus lists ACLS at KES 20,000 per person, with KES 17,500 per person for cohorts of 7 or more. Confirm the practical-session date and location during booking, because the online modules are not a substitute for hands-on sign-off.",
      "Finally, check the pathway against your employer, licensing body, facility protocol, and renewal requirements. Course content supports readiness; it does not replace local clinical governance, senior supervision, or emergency-care protocols.",
    ],
  },
  {
    slug: "hospital-emergency-readiness-checklist",
    title: "A hospital emergency-readiness checklist for leadership teams",
    summary:
      "A starting checklist for making response roles, activation, evidence, drills, and corrective actions visible across a facility.",
    audience: "Institutions",
    question:
      "What should a hospital include in an emergency-readiness checklist?",
    publishedAt: "2026-09-04",
    body: [
      "Begin with the response system rather than a single course: who activates the response, who leads, where the team assembles, and how the event is documented.",
      "Then test readiness in practice. Review role clarity, equipment and medication gaps, escalation routes, drills, and open corrective actions. Evidence should describe what was checked and what changed, without inventing outcome claims.",
      "Use ILSP when the immediate need is managed life-support training for staff cohorts. Use IERS when the need is hospital-wide emergency readiness with ResusGPS bedside guidance and Care Signal improvement workflows.",
    ],
  },
  {
    slug: "paediatric-shock-recognition-first-actions",
    title: "Paediatric shock recognition: why the first actions need a system",
    summary:
      "A safety-oriented overview of recognition, escalation, role clarity, and reassessment in paediatric emergency response.",
    audience: "Providers",
    question:
      "Why do paediatric shock responses need structured reassessment and role clarity?",
    publishedAt: "2026-09-04",
    body: [
      "Early recognition is only one part of a safe response. Teams also need a shared first-action sequence, explicit role allocation, and a prompt to reassess after each intervention.",
      "In low-resource settings, the system must also capture what was unavailable or delayed. That turns a difficult event into a learning signal for the next response rather than leaving the team with memory alone.",
      "This article is educational and does not replace local protocols, senior clinical judgement, emergency referral pathways, or formal training.",
    ],
  },
];

export function getPublicResource(slug: string) {
  return PUBLIC_RESOURCES.find(resource => resource.slug === slug);
}
