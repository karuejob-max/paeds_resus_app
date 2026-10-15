export type InstitutionWorkspaceAccess = {
  hasDepartmentLeadership: boolean;
  hasDepartmentCpd: boolean;
  hasInstitutionCpd: boolean;
  hasInstitutionIers: boolean;
  hasIersRole: boolean;
  hasCpdRole: boolean;
  canOperateIers: boolean;
};

export function deriveInstitutionWorkspaceAccess(
  isInstitutionAdmin: boolean,
  roleKeys: string[],
): InstitutionWorkspaceAccess {
  const hasDepartmentLeadership = roleKeys.some(key => ["department_head", "deputy_department_head"].includes(key));
  const hasDepartmentCpd = roleKeys.some(key => ["cpd_education_coordinator", "deputy_department_cpd_coordinator"].includes(key));
  const hasInstitutionCpd = roleKeys.some(key => ["cpd_coordinator", "institutional_cpd_coordinator"].includes(key));
  const hasInstitutionIers = roleKeys.some(key => ["iers_chair", "iers_coordinator", "iers_governance", "institutional_erco"].includes(key));
  const hasIersRole = isInstitutionAdmin || hasInstitutionIers || roleKeys.some(key => key.startsWith("iers_"));
  const hasCpdRole = isInstitutionAdmin || hasInstitutionCpd || hasDepartmentCpd || roleKeys.some(key => key.startsWith("cpd_"));
  const canOperateIers = isInstitutionAdmin || hasInstitutionIers || roleKeys.some(key => ["iers_chair", "iers_coordinator", "iers_governance"].includes(key));

  return {
    hasDepartmentLeadership,
    hasDepartmentCpd,
    hasInstitutionCpd,
    hasInstitutionIers,
    hasIersRole,
    hasCpdRole,
    canOperateIers,
  };
}
