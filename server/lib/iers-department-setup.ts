import { facilityDepartments } from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { canonicalizeDepartmentLabel } from "../../shared/clinical-departments";

export async function insertCanonicalFacilityDepartments(
  db: AppDb,
  input: { institutionId: number; departmentNames: string[]; confirmedByUserId: number },
) {
  const names = Array.from(new Set(input.departmentNames
    .map((name) => canonicalizeDepartmentLabel(name))
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => name.toLowerCase())))
    .map((normalizedName) => input.departmentNames
      .map((name) => canonicalizeDepartmentLabel(name).trim())
      .find((name) => name.toLowerCase() === normalizedName) ?? normalizedName);
  if (names.length === 0) return 0;

  const enrichedValues = names.map((departmentName) => ({
    institutionId: input.institutionId,
    departmentName,
    poleId: null,
    isActive: true,
    confirmedAt: new Date(),
    confirmedByUserId: input.confirmedByUserId,
  }));

  try {
    await db.insert(facilityDepartments).values(enrichedValues);
  } catch (error) {
    const candidate = error as { code?: string; message?: string };
    if (candidate?.code !== "ER_BAD_FIELD_ERROR" && !candidate?.message?.includes("Unknown column")) throw error;
    await db.insert(facilityDepartments).values(names.map((departmentName) => ({
      institutionId: input.institutionId,
      departmentName,
      poleId: null,
    })));
  }
  return names.length;
}
