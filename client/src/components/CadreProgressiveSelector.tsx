import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CadreProgressiveSelectorProps {
  value: string;
  onChange: (val: string) => void;
  cadreOtherValue: string;
  onCadreOtherChange: (val: string) => void;
  subSpecialtyValue: string;
  onSubSpecialtyChange: (val: string) => void;
}

export function getTaxonomyFromCadre(cadreVal: string) {
  let category = "";
  let role = "";
  let rnLevel = "";
  let rnSub = "";

  if (!cadreVal) return { category, role, rnLevel, rnSub };

  const isStudent =
    cadreVal.endsWith("Student") ||
    ["Nursing Student", "Clinical Officer Student", "MBChB Student"].includes(cadreVal);
  const isIntern = ["MOI", "NOI", "COI", "Other Intern"].includes(cadreVal);

  if (isIntern) {
    category = "Intern";
    role = cadreVal;
  } else if (isStudent) {
    category = "Student";
    if (
      [
        "Nursing Student",
        "Clinical Officer Student",
        "MBChB Student",
        "Other Student",
        "Consultant Physician Student",
        "MO Student",
        "RCO Student",
      ].includes(cadreVal)
    ) {
      role = cadreVal;
    } else {
      role = "RN Student";
      if (cadreVal.startsWith("MSN")) rnLevel = "MSN";
      else if (cadreVal.startsWith("HND")) rnLevel = "HND";
      else if (cadreVal.startsWith("ERN")) rnLevel = "ERN";
      else if (["BSN Student", "BSM Student"].includes(cadreVal)) {
        rnLevel = "Undergraduate";
        rnSub = cadreVal;
      } else if (
        ["KRCHN Student", "KRNM Student", "KRN Student", "KRM Student"].includes(cadreVal)
      ) {
        rnLevel = "Diploma";
        rnSub = cadreVal;
      }
    }
  } else {
    category = "Staff";
    if (["Consultant Physician", "MO", "RCO", "Other Staff"].includes(cadreVal)) {
      role = cadreVal;
    } else {
      role = "RN";
      if (cadreVal === "MSN") rnLevel = "MSN";
      else if (cadreVal === "HND") rnLevel = "HND";
      else if (cadreVal === "ERN") rnLevel = "ERN";
      else if (["BSN", "BSM"].includes(cadreVal)) {
        rnLevel = "Undergraduate";
        rnSub = cadreVal;
      } else if (["KRCHN", "KRNM", "KRN", "KRM"].includes(cadreVal)) {
        rnLevel = "Diploma";
        rnSub = cadreVal;
      }
    }
  }

  return { category, role, rnLevel, rnSub };
}

export default function CadreProgressiveSelector({
  value,
  onChange,
  cadreOtherValue,
  onCadreOtherChange,
  subSpecialtyValue,
  onSubSpecialtyChange,
}: CadreProgressiveSelectorProps) {
  const { category, role, rnLevel, rnSub } = getTaxonomyFromCadre(value);

  const handleCategoryChange = (newCat: string) => {
    onChange("");
    onSubSpecialtyChange("");
    onCadreOtherChange("");
  };

  const handleRoleChange = (newRole: string) => {
    if (
      ["Consultant Physician", "Consultant Physician Student", "MSN", "HND", "MSN Student", "HND Student"].includes(
        newRole
      )
    ) {
      onSubSpecialtyChange("");
    }
    if (
      category === "Intern" ||
      ["MO", "RCO", "Other Staff", "Nursing Student", "Clinical Officer Student", "MBChB Student", "Other Student", "Consultant Physician Student", "MO Student", "RCO Student"].includes(
        newRole
      )
    ) {
      onChange(newRole);
    } else {
      onChange("");
    }
    onCadreOtherChange("");
  };

  const handleLevelChange = (newLevel: string) => {
    if (["MSN", "HND", "ERN"].includes(newLevel)) {
      const finalVal = category === "Student" ? `${newLevel} Student` : newLevel;
      onChange(finalVal);
    } else {
      onChange("");
    }
    onSubSpecialtyChange("");
    onCadreOtherChange("");
  };

  const handleSubChange = (newSub: string) => {
    onChange(newSub);
    onCadreOtherChange("");
  };

  // Determine specialty prompt details
  const showPhysicianSpecialty =
    value === "Consultant Physician" || value === "Consultant Physician Student";
  const showNurseSpecialty = ["MSN", "HND", "MSN Student", "HND Student"].includes(value);

  // Determine free text details prompt
  const showFreeTextDetails =
    ["Other Staff", "Other Intern", "Other Student"].includes(value) ||
    subSpecialtyValue === "Other";

  return (
    <div className="space-y-4">
      {/* Category selection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Category *</Label>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Category (Staff, Intern, Student)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Staff">Staff</SelectItem>
            <SelectItem value="Intern">Intern</SelectItem>
            <SelectItem value="Student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Role / Profession Selection */}
      {category && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">
            {category === "Staff"
              ? "Staff Role *"
              : category === "Intern"
                ? "Intern Role *"
                : "Student Path *"}
          </Label>
          <Select value={role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  category === "Staff"
                    ? "Select Role"
                    : category === "Intern"
                      ? "Select Intern Path"
                      : "Select Student Path"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {category === "Staff" && (
                <>
                  <SelectItem value="Consultant Physician">Doctor / Consultant Physician</SelectItem>
                  <SelectItem value="MO">MO (Medical Officer)</SelectItem>
                  <SelectItem value="RCO">RCO (Clinical Officer)</SelectItem>
                  <SelectItem value="RN">RN (Registered Nurse)</SelectItem>
                  <SelectItem value="Other Staff">Other Staff</SelectItem>
                </>
              )}
              {category === "Intern" && (
                <>
                  <SelectItem value="MOI">MOI (Medical Officer Intern)</SelectItem>
                  <SelectItem value="NOI">NOI (Nursing Officer Intern)</SelectItem>
                  <SelectItem value="COI">COI (Clinical Officer Intern)</SelectItem>
                  <SelectItem value="Other Intern">Other Intern</SelectItem>
                </>
              )}
              {category === "Student" && (
                <>
                  <SelectItem value="Consultant Physician Student">
                    Medical Student - Specialist Track
                  </SelectItem>
                  <SelectItem value="MO Student">Medical Student - MBChB</SelectItem>
                  <SelectItem value="RCO Student">Clinical Officer Student</SelectItem>
                  <SelectItem value="RN Student">Nursing Student - RN Track</SelectItem>
                  <SelectItem value="Nursing Student">Nursing Student - General</SelectItem>
                  <SelectItem value="Clinical Officer Student">Clinical Officer Student - General</SelectItem>
                  <SelectItem value="MBChB Student">Medical Student - Undergraduate</SelectItem>
                  <SelectItem value="Other Student">Other Student</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* T3: Level (RN / RN Student Level Selection) */}
      {(role === "RN" || role === "RN Student") && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Nurse Qualification Level *</Label>
          <Select value={rnLevel} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Nurse Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MSN">MSN</SelectItem>
              <SelectItem value="HND">HND</SelectItem>
              <SelectItem value="Undergraduate">Undergraduate</SelectItem>
              <SelectItem value="Diploma">Diploma</SelectItem>
              <SelectItem value="ERN">ERN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* T4: Sub-Qualification Level (for Undergraduate / Diploma) */}
      {(rnLevel === "Undergraduate" || rnLevel === "Diploma") && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">
            {rnLevel === "Undergraduate" ? "Degree Type *" : "Diploma Type *"}
          </Label>
          <Select value={rnSub} onValueChange={handleSubChange}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={rnLevel === "Undergraduate" ? "Select Degree" : "Select Diploma Type"}
              />
            </SelectTrigger>
            <SelectContent>
              {rnLevel === "Undergraduate" ? (
                category === "Student" ? (
                  <>
                    <SelectItem value="BSN Student">BSN Student</SelectItem>
                    <SelectItem value="BSM Student">BSM Student</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="BSN">BSN</SelectItem>
                    <SelectItem value="BSM">BSM</SelectItem>
                  </>
                )
              ) : category === "Student" ? (
                <>
                  <SelectItem value="KRCHN Student">KRCHN Student</SelectItem>
                  <SelectItem value="KRNM Student">KRNM Student</SelectItem>
                  <SelectItem value="KRN Student">KRN Student</SelectItem>
                  <SelectItem value="KRM Student">KRM Student</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="KRCHN">KRCHN</SelectItem>
                  <SelectItem value="KRNM">KRNM</SelectItem>
                  <SelectItem value="KRN">KRN</SelectItem>
                  <SelectItem value="KRM">KRM</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* T5: Consultant Physician Specialty Dropdown */}
      {showPhysicianSpecialty && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Specialty / Highest Qualification *</Label>
          <Select
            value={subSpecialtyValue}
            onValueChange={(val) => {
              onSubSpecialtyChange(val);
              if (val !== "Other") {
                onCadreOtherChange("");
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paediatrician">Paediatrician</SelectItem>
              <SelectItem value="Other Specialist">Other Specialist</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* T5: MSN or HND Subspecialty Dropdown */}
      {showNurseSpecialty && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Subspecialty / Highest Qualification *</Label>
          <Select
            value={subSpecialtyValue}
            onValueChange={(val) => {
              onSubSpecialtyChange(val);
              if (val !== "Other") {
                onCadreOtherChange("");
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select subspecialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paediatric Critical Care">Paediatric Critical Care</SelectItem>
              <SelectItem value="Neonatology">Neonatology</SelectItem>
              <SelectItem value="Emergency Nursing">Emergency Nursing</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* T6: Custom specialty free-text details input */}
      {showFreeTextDetails && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Please specify details *</Label>
          <Input
            placeholder="e.g. Paediatric Nephrologist / Clinical Officer Anaesthetist"
            value={cadreOtherValue}
            onChange={(e) => onCadreOtherChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
