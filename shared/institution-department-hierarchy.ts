export type DepartmentHierarchyRow = {
  id: number;
  departmentName: string;
  parentDepartmentId?: number | null;
  isActive?: boolean | null;
};

export type CanonicalDepartmentOption = DepartmentHierarchyRow & {
  label: string;
  path: number[];
};

/**
 * Builds stable parent -> child labels from institution-owned department IDs.
 * Cycles and missing parents fail closed to the local department name rather
 * than inventing a hierarchy or selecting another department by label.
 */
export function buildCanonicalDepartmentOptions(
  rows: readonly DepartmentHierarchyRow[],
): CanonicalDepartmentOption[] {
  const byId = new Map(rows.map(row => [row.id, row]));
  const labelCache = new Map<number, { label: string; path: number[] }>();

  const resolve = (id: number, trail: number[] = []): { label: string; path: number[] } => {
    const cached = labelCache.get(id);
    if (cached) return cached;
    const row = byId.get(id);
    if (!row) return { label: "Unknown department", path: [] };
    if (trail.includes(id) || row.parentDepartmentId == null) {
      const local = { label: row.departmentName, path: [id] };
      labelCache.set(id, local);
      return local;
    }
    const parent = resolve(row.parentDepartmentId, [...trail, id]);
    if (parent.path.includes(id)) {
      const immediateParent = byId.get(row.parentDepartmentId);
      const local = immediateParent
        ? {
            label: `${immediateParent.departmentName} → ${row.departmentName}`,
            path: [immediateParent.id, id],
          }
        : { label: row.departmentName, path: [id] };
      labelCache.set(id, local);
      return local;
    }
    const resolved = {
      label: parent.path.length ? `${parent.label} → ${row.departmentName}` : row.departmentName,
      path: [...parent.path, id],
    };
    labelCache.set(id, resolved);
    return resolved;
  };

  return rows
    .filter(row => row.isActive !== false)
    .map(row => {
      const resolved = resolve(row.id);
      return { ...row, label: resolved.label, path: resolved.path };
    })
    .sort((a, b) => a.label.localeCompare(b.label) || a.id - b.id);
}

export function findCanonicalDepartmentOption(
  options: readonly CanonicalDepartmentOption[],
  departmentId: number | null | undefined,
): CanonicalDepartmentOption | null {
  if (!departmentId) return null;
  return options.find(option => option.id === departmentId) ?? null;
}
