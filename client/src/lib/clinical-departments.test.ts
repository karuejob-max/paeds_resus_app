import { describe, expect, it } from "vitest";
import { findMatchingCanonicalDepartments, normalizeDepartmentString } from "./clinical-departments";

describe("clinical-departments matching and normalization", () => {
  describe("findMatchingCanonicalDepartments", () => {
    it("should find matching departments for 'Surgical Ward Staff'", () => {
      const matches = findMatchingCanonicalDepartments("Surgical Ward Staff");
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      
      const hasMaleSurgical = matches.some(m => m.parent === "Surgery" && m.sub === "Male Surgical");
      const hasFemaleSurgical = matches.some(m => m.parent === "Surgery" && m.sub === "Female Surgical");
      
      expect(hasMaleSurgical || hasFemaleSurgical).toBe(true);
    });

    it("should find matching departments for 'pediatric ward'", () => {
      const matches = findMatchingCanonicalDepartments("pediatric ward");
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      
      const hasPediatricWard = matches.some(m => m.parent === "Paediatrics and Child Health" && m.sub === "Paediatric Ward");
      expect(hasPediatricWard).toBe(true);
    });

    it("should find matching departments for 'icu'", () => {
      const matches = findMatchingCanonicalDepartments("icu");
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      
      const hasIcu = matches.some(m => m.parent === "Critical Care" && m.sub === "ICU");
      expect(hasIcu).toBe(true);
    });

    it("should return empty array for completely unrelated query", () => {
      const matches = findMatchingCanonicalDepartments("xyz123abc");
      expect(matches).toEqual([]);
    });
  });

  describe("normalizeDepartmentString", () => {
    it("should normalize 'Surgical Ward Staff' to a canonical Surgery department", () => {
      const normalized = normalizeDepartmentString("Surgical Ward Staff");
      // Should match one of the surgery sub-departments
      expect(normalized.startsWith("Surgery:")).toBe(true);
    });

    it("should normalize 'pediatric ward' to 'Paediatrics and Child Health: Paediatric Ward'", () => {
      const normalized = normalizeDepartmentString("pediatric ward");
      expect(normalized).toBe("Paediatrics and Child Health: Paediatric Ward");
    });

    it("should leave already canonical format alone", () => {
      const canonical = "Critical Care: ICU";
      const normalized = normalizeDepartmentString(canonical);
      expect(normalized).toBe(canonical);
    });

    it("should fallback to original string if no match found", () => {
      const unrelated = "Some Custom Department 123";
      const normalized = normalizeDepartmentString(unrelated);
      expect(normalized).toBe(unrelated);
    });
  });
});
