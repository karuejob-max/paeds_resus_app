import { and, desc, eq } from "drizzle-orm";
import {
  institutionalAccounts,
  iersReadinessTemplateItems,
  iersReadinessTemplates,
} from "../../drizzle/schema";
import type { DbClient } from "../db";

export const DEFAULT_UTL_READINESS_TEMPLATE_NAME = "Core + age-band emergency readiness";
export const DEFAULT_UTL_READINESS_TEMPLATE_VERSION = "v1";

const DEFAULT_ITEMS = [
  { code: "cart_present_accessible", category: "access", label: "Crash cart present, accessible, and route known", kind: "access", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "cart_seal_or_security", category: "access", label: "Cart seal/security intact or access exception documented", kind: "safety", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "oxygen_source", category: "breathing", label: "Oxygen source, regulator, tubing, and backup route", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: true },
  { code: "suction_function", category: "airway", label: "Suction device, tubing, and collection canister", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: true },
  { code: "defibrillator_self_test", category: "monitoring", label: "Defibrillator/AED available and self-test passed", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: true },
  { code: "adult_defib_pads", category: "monitoring", label: "Adult defibrillation pads/paddles, facility-approved", kind: "equipment", age: "adolescent_adult", urgency: "immediate", critical: true, functionCheck: false },
  { code: "paediatric_defib_pads", category: "monitoring", label: "Paediatric defibrillation pads/paddles, facility-approved", kind: "equipment", age: "infant_child", urgency: "immediate", critical: true, functionCheck: false },
  { code: "neonatal_resuscitation_interface", category: "airway", label: "Neonatal resuscitation interface and approved newborn equipment", kind: "equipment", age: "neonatal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "adult_bvm_masks", category: "breathing", label: "Adult BVM and required mask sizes", kind: "equipment", age: "adolescent_adult", urgency: "immediate", critical: true, functionCheck: false },
  { code: "paediatric_bvm_masks", category: "breathing", label: "Infant/child BVM and required mask sizes", kind: "equipment", age: "infant_child", urgency: "immediate", critical: true, functionCheck: false },
  { code: "neonatal_bvm_masks", category: "breathing", label: "Neonatal BVM and required mask sizes", kind: "equipment", age: "neonatal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "airway_adjuncts", category: "airway", label: "Age-appropriate airway adjuncts, locally approved", kind: "equipment", age: "universal", urgency: "accessible", critical: true, functionCheck: false },
  { code: "vascular_access_supplies", category: "circulation", label: "IV access supplies across required sizes", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "io_access_supplies", category: "circulation", label: "IO access device and approved needle sizes", kind: "equipment", age: "infant_child", urgency: "accessible", critical: true, functionCheck: false },
  { code: "fluids_and_admin_sets", category: "circulation", label: "Facility-approved emergency fluids and administration sets", kind: "equipment", age: "universal", urgency: "accessible", critical: true, functionCheck: false },
  { code: "approved_epinephrine_formulation", category: "medications", label: "Facility-approved adrenaline/epinephrine formulation and expiry checked", kind: "drug", age: "universal", urgency: "immediate", critical: true, expiryCheck: true },
  { code: "approved_glucose_formulation", category: "medications", label: "Facility-approved glucose/dextrose formulation and expiry checked", kind: "drug", age: "universal", urgency: "accessible", critical: true, expiryCheck: true },
  { code: "age_band_emergency_medicines", category: "medications", label: "Age-band emergency medicines approved by local pharmacy and resuscitation governance", kind: "drug", age: "universal", urgency: "accessible", critical: true, expiryCheck: true },
  { code: "ppe_and_sharps", category: "safety", label: "PPE, sharps container, clinical waste bags, and hand hygiene supplies", kind: "safety", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "emergency_algorithms_current", category: "guidance", label: "Current locally approved emergency algorithms and escalation contacts", kind: "document", age: "universal", urgency: "accessible", critical: true, functionCheck: false },
  { code: "neonatal_module", category: "local_module", label: "Neonatal-at-birth module enabled and locally approved where applicable", kind: "document", age: "neonatal", urgency: "accessible", critical: false, functionCheck: false },
  { code: "maternity_module", category: "local_module", label: "Maternity module enabled and locally approved where applicable", kind: "document", age: "maternity", urgency: "accessible", critical: false, functionCheck: false },
  { code: "trauma_module", category: "local_module", label: "Trauma module enabled and locally approved where applicable", kind: "document", age: "trauma", urgency: "accessible", critical: false, functionCheck: false },
] as const;

type EnsureInput = {
  institutionId: number;
  fallbackActorUserId: number;
};

/**
 * Ensure every institution has a usable platform baseline. The baseline is
 * active by default so an accepted UTL can perform the first crash-cart check;
 * it is not a substitute for local policy, pharmacy review, or governance.
 * Institution-specific templates may still supersede it through the existing
 * approval workflow.
 */
export async function ensureDefaultUtlReadinessTemplate(
  db: DbClient,
  input: EnsureInput,
) {
  const [account] = await db
    .select({ userId: institutionalAccounts.userId })
    .from(institutionalAccounts)
    .where(eq(institutionalAccounts.id, input.institutionId))
    .limit(1);
  const baselineApproverUserId = account?.userId ?? input.fallbackActorUserId;
  const now = new Date();

  const [activeTemplate] = await db
    .select()
    .from(iersReadinessTemplates)
    .where(and(
      eq(iersReadinessTemplates.institutionId, input.institutionId),
      eq(iersReadinessTemplates.status, "active"),
    ))
    .orderBy(desc(iersReadinessTemplates.effectiveFrom), desc(iersReadinessTemplates.id))
    .limit(1);

  let template = activeTemplate;
  if (template && (template.templateVersion !== DEFAULT_UTL_READINESS_TEMPLATE_VERSION || template.templateName !== DEFAULT_UTL_READINESS_TEMPLATE_NAME)) {
    return template;
  }
  if (!template) {
    const [defaultTemplate] = await db
      .select()
      .from(iersReadinessTemplates)
      .where(and(
        eq(iersReadinessTemplates.institutionId, input.institutionId),
        eq(iersReadinessTemplates.templateVersion, DEFAULT_UTL_READINESS_TEMPLATE_VERSION),
      ))
      .limit(1);

    if (defaultTemplate) {
      await db
        .update(iersReadinessTemplates)
        .set({
          status: "active",
          approvedByUserId: defaultTemplate.approvedByUserId ?? baselineApproverUserId,
          approvedAt: defaultTemplate.approvedAt ?? now,
          supersededAt: null,
          updatedAt: now,
        })
        .where(eq(iersReadinessTemplates.id, defaultTemplate.id));
      template = {
        ...defaultTemplate,
        status: "active",
        approvedByUserId: defaultTemplate.approvedByUserId ?? baselineApproverUserId,
        approvedAt: defaultTemplate.approvedAt ?? now,
        supersededAt: null,
        updatedAt: now,
      };
    } else {
      try {
        await db.insert(iersReadinessTemplates).values({
          institutionId: input.institutionId,
          templateName: DEFAULT_UTL_READINESS_TEMPLATE_NAME,
          templateVersion: DEFAULT_UTL_READINESS_TEMPLATE_VERSION,
          status: "active",
          approvedByUserId: baselineApproverUserId,
          approvedAt: now,
          effectiveFrom: now,
          createdByUserId: baselineApproverUserId,
        });
      } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
        if (code !== "ER_DUP_ENTRY" && code !== "ER_DUP_KEY") throw error;
      }
      const [created] = await db
        .select()
        .from(iersReadinessTemplates)
        .where(and(
          eq(iersReadinessTemplates.institutionId, input.institutionId),
          eq(iersReadinessTemplates.templateVersion, DEFAULT_UTL_READINESS_TEMPLATE_VERSION),
        ))
        .limit(1);
      if (!created) return null;
      template = created;
    }
  }

  const existingItems = await db
    .select({ itemCode: iersReadinessTemplateItems.itemCode })
    .from(iersReadinessTemplateItems)
    .where(eq(iersReadinessTemplateItems.templateId, template.id));
  const existingCodes = new Set(existingItems.map((item) => item.itemCode));
  for (const [sortOrder, item] of DEFAULT_ITEMS.entries()) {
    if (existingCodes.has(item.code)) continue;
    await db.insert(iersReadinessTemplateItems).values({
      templateId: template.id,
      itemCode: item.code,
      category: item.category,
      itemLabel: item.label,
      itemKind: item.kind,
      ageBand: item.age,
      urgency: item.urgency,
      isCritical: item.critical,
      requiresExpiryCheck: Boolean("expiryCheck" in item && item.expiryCheck),
      requiresFunctionCheck: "functionCheck" in item && Boolean(item.functionCheck),
      sortOrder,
      isActive: true,
    });
  }

  return template;
}

export const defaultUtlReadinessItemCount = DEFAULT_ITEMS.length;
