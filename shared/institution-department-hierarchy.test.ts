import { describe, expect, it } from "vitest";
import { buildCanonicalDepartmentOptions, findCanonicalDepartmentOption } from "./institution-department-hierarchy";

describe("institution department hierarchy", () => {
  it("renders canonical parent-child labels and stable ordering", () => {
    const options = buildCanonicalDepartmentOptions([
      { id: 2, departmentName: "Theatre", parentDepartmentId: 1 },
      { id: 1, departmentName: "Surgery", parentDepartmentId: null },
      { id: 3, departmentName: "Paediatrics", parentDepartmentId: null },
    ]);

    expect(options.map(option => option.label)).toEqual([
      "Paediatrics",
      "Surgery",
      "Surgery → Theatre",
    ]);
    expect(findCanonicalDepartmentOption(options, 2)?.path).toEqual([1, 2]);
  });

  it("fails closed for missing parents and cycles without inventing another department", () => {
    const options = buildCanonicalDepartmentOptions([
      { id: 4, departmentName: "Ward", parentDepartmentId: 99 },
      { id: 5, departmentName: "A", parentDepartmentId: 6 },
      { id: 6, departmentName: "B", parentDepartmentId: 5 },
      { id: 7, departmentName: "Inactive", isActive: false },
    ]);

    expect(options.find(option => option.id === 4)?.label).toBe("Ward");
    expect(options.find(option => option.id === 5)?.label).toBe("B → A");
    expect(options.find(option => option.id === 6)?.label).toBe("A → B");
    expect(options.some(option => option.id === 7)).toBe(false);
  });
});
