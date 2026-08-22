export {
  GLOBAL_DEPARTMENTS,
  CANONICAL_CLINICAL_DEPARTMENTS,
  CLINICAL_DEPARTMENT_NAMES,
  DEPARTMENT_ALIASES,
  isCanonicalDepartment,
  parseDepartmentString,
  formatDepartmentString,
  findMatchingCanonicalDepartments,
  normalizeDepartmentString,
} from "@shared/clinical-departments";

export type {
  ParentDepartmentOption,
  ClinicalDepartmentOption,
  ParsedDepartment,
  DepartmentMatch,
} from "@shared/clinical-departments";

export * from "@shared/clinical-departments";
