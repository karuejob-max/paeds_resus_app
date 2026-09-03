import { useMemo, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    [
      "Nursing Student",
      "Clinical Officer Student",
      "MBChB Student",
      "Pharmacy Student",
      "Dental Surgery Student",
      "Other Medical Student",
      "Diploma in Clinical Medicine Student",
      "BSc Clinical Medicine Student",
      "Other Clinical Officer Student",
      "BSN Student",
      "BSM Student",
      "KRCHN Student",
      "KRNM Student",
      "KRN Student",
      "KRM Student",
      "KECHN Student",
      "Other Certificate Nursing Student",
      "Other Diploma Nursing Student",
      "Other Nursing Student",
      "Consultant Physician Student",
      "Other Student",
    ].includes(cadreVal);
  const isIntern = ["MOI", "NOI", "COI", "Other Intern"].includes(cadreVal);

  if (isIntern) {
    category = "Intern";
    role = cadreVal;
  } else if (isStudent) {
    category = "Student";
    if (["Consultant Physician Student", "Other Student"].includes(cadreVal)) {
      role = cadreVal;
    } else if (
      [
        "MBChB Student",
        "Pharmacy Student",
        "Dental Surgery Student",
        "Other Medical Student",
      ].includes(cadreVal)
    ) {
      role = "Medical Student";
    } else if (
      [
        "Diploma in Clinical Medicine Student",
        "BSc Clinical Medicine Student",
        "Other Clinical Officer Student",
      ].includes(cadreVal)
    ) {
      role = "Clinical Officer Student";
    } else {
      role = "Nursing Student";
      if (["BSN Student", "BSM Student", "Other BSN Student"].includes(cadreVal)) {
        rnLevel = "BSN Student";
        rnSub = cadreVal;
      } else if (
        [
          "KRCHN Student",
          "KRNM Student",
          "KRN Student",
          "KRM Student",
          "Other Diploma Nursing Student",
        ].includes(cadreVal)
      ) {
        rnLevel = "Diploma Student";
        rnSub = cadreVal;
      } else if (["KECHN Student", "Other Certificate Nursing Student"].includes(cadreVal)) {
        rnLevel = "Certificate Student";
        rnSub = cadreVal;
      } else {
        rnLevel = "Other Nursing Student";
      }
    }
  } else {
    category = "Staff";
    if (["Consultant Physician", "MO", "Other Staff"].includes(cadreVal)) {
      role = cadreVal;
    } else if (["RCO", "RCO HND", "BSc. Clin. Med", "Dip Clin. Med", "Other RCO"].includes(cadreVal)) {
      role = "RCO";
      if (cadreVal === "RCO HND") rnLevel = "HND";
      else if (cadreVal === "BSc. Clin. Med") rnLevel = "BSc. Clin. Med";
      else if (cadreVal === "Dip Clin. Med") rnLevel = "Dip Clin. Med";
      else if (cadreVal === "Other RCO") rnLevel = "Other RCO";
    } else {
      role = "RN";
      if (cadreVal === "MSN") rnLevel = "MSN";
      else if (cadreVal === "HND") rnLevel = "HND";
      else if (["BSN", "BSM", "Other Undergraduate"].includes(cadreVal)) {
        rnLevel = "Undergraduate";
        rnSub = cadreVal;
      } else if (["KRCHN", "KRNM", "KRN", "KRM", "Other Diploma RN"].includes(cadreVal)) {
        rnLevel = "Diploma";
        rnSub = cadreVal;
      } else if (["KECHN", "Other Certificate RN"].includes(cadreVal)) {
        rnLevel = "Certificate";
        rnSub = cadreVal;
      } else {
        rnLevel = "Other RN";
      }
    }
  }

  return { category, role, rnLevel, rnSub };
}

function getLeafValue(category: string, role: string, rnLevel: string, rnSub: string): string {
  if (category === "Intern") {
    return role;
  }
  if (category === "Student") {
    if (role === "Medical Student") {
      return rnLevel;
    }
    if (role === "Clinical Officer Student") {
      return rnLevel;
    }
    if (role === "Nursing Student") {
      if (rnLevel === "BSN Student") {
        return rnSub;
      }
      if (rnLevel === "Diploma Student") {
        return rnSub;
      }
      if (rnLevel === "Certificate Student") {
        return rnSub;
      }
      if (rnLevel === "Other Nursing Student") {
        return "Other Nursing Student";
      }
      return "";
    }
    return role;
  }
  if (category === "Staff") {
    if (role === "RN") {
      if (rnLevel === "MSN") return "MSN";
      if (rnLevel === "HND") return "HND";
      if (rnLevel === "Undergraduate") return rnSub;
      if (rnLevel === "Diploma") return rnSub;
      if (rnLevel === "Certificate") return rnSub;
      if (rnLevel === "Other RN") return "Other RN";
      return "";
    }
    if (role === "RCO") {
      if (rnLevel === "HND") return "RCO HND";
      if (rnLevel === "BSc. Clin. Med") return "BSc. Clin. Med";
      if (rnLevel === "Dip Clin. Med") return "Dip Clin. Med";
      if (rnLevel === "Other RCO") return "Other RCO";
      return "RCO";
    }
    return role;
  }
  return "";
}

interface SearchableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Keep a type-ahead field visible alongside the scrollable option list. */
  searchAlwaysVisible?: boolean;
  /** Allow the selected value to be removed with Backspace/Delete or a clear button. */
  clearable?: boolean;
  /** Notify callers as the user types in the dropdown search field. */
  onSearchChange?: (query: string) => void;
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search option...",
  emptyText = "No option found.",
  searchAlwaysVisible = false,
  clearable = false,
  onSearchChange,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      option =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  const setQuery = (query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const selectOption = (optionValue: string) => {
    onChange(value === optionValue ? "" : optionValue);
    setQuery("");
    setOpen(false);
  };

  const optionList = (
    <Command
      shouldFilter={searchAlwaysVisible ? false : undefined}
      {...(!searchAlwaysVisible
        ? { value: searchQuery, onValueChange: setQuery }
        : {})}
    >
      {!searchAlwaysVisible ? <CommandInput placeholder={searchPlaceholder} /> : null}
      <CommandList className="max-h-[250px]">
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {filteredOptions.map(opt => (
            <CommandItem
              key={opt.value}
              value={opt.label}
              onSelect={() => selectOption(opt.value)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === opt.value ? "opacity-100" : "opacity-0"
                )}
              />
              {opt.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <div className={cn(
      "space-y-2",
      searchAlwaysVisible && "rounded-md border border-input bg-background p-2",
    )}>
      {searchAlwaysVisible ? (
        <Input
          value={searchQuery}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onFocus={() => setOpen(true)}
          onKeyDown={event => {
            if (clearable && value && !searchQuery && (event.key === "Backspace" || event.key === "Delete")) {
              event.preventDefault();
              onChange("");
              setQuery("");
              setOpen(false);
            }
          }}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
      ) : null}
      <div className="flex min-w-0 gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              onKeyDown={event => {
                if (clearable && value && (event.key === "Backspace" || event.key === "Delete")) {
                  event.preventDefault();
                  onChange("");
                  setSearchQuery("");
                  setOpen(false);
                }
              }}
              className="min-w-0 flex-1 justify-between font-normal bg-background border-input hover:bg-accent hover:text-accent-foreground text-left"
            >
              <span className="min-w-0 truncate">{selectedOption ? selectedOption.label : placeholder}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0"
            align="start"
          >
            {optionList}
          </PopoverContent>
        </Popover>
        {clearable && value ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Clear selection"
            title="Clear selection"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {searchAlwaysVisible ? (
        <p className="text-xs text-muted-foreground">
          Type a few letters to narrow the list, or open the selector and scroll.
        </p>
      ) : null}
    </div>
  );
}

const CONSULTANT_SPECIALTIES = [
  { value: "General Paediatrician", label: "General Paediatrician" },
  { value: "Paediatric Cardiologist", label: "Paediatric Cardiologist" },
  { value: "Paediatric Nephrologist", label: "Paediatric Nephrologist" },
  { value: "Paediatric Oncologist / Haematologist", label: "Paediatric Oncologist / Haematologist" },
  { value: "Paediatric Neurologist", label: "Paediatric Neurologist" },
  { value: "Paediatric Endocrinologist", label: "Paediatric Endocrinologist" },
  { value: "Paediatric Pulmonologist / Respirologist", label: "Paediatric Pulmonologist / Respirologist" },
  { value: "Paediatric Gastroenterologist", label: "Paediatric Gastroenterologist" },
  { value: "Neonatologist", label: "Neonatologist" },
  { value: "Paediatric Critical Care Specialist", label: "Paediatric Critical Care Specialist" },
  { value: "Paediatric Emergency Medicine Specialist", label: "Paediatric Emergency Medicine Specialist" },
  { value: "Paediatric Infectious Disease Specialist", label: "Paediatric Infectious Disease Specialist" },
  { value: "Paediatric Rheumatologist", label: "Paediatric Rheumatologist" },
  { value: "Paediatric Allergist / Immunologist", label: "Paediatric Allergist / Immunologist" },
  { value: "Other Specialist", label: "Other Specialist" },
  { value: "Other", label: "Other" },
];

const MSN_SPECIALTIES = [
  { value: "Paediatric Critical Care Nursing", label: "Paediatric Critical Care Nursing" },
  { value: "Neonatal Nursing", label: "Neonatal Nursing" },
  { value: "Midwifery / Reproductive Health Nursing", label: "Midwifery / Reproductive Health Nursing" },
  { value: "Nephrology / Renal Nursing", label: "Nephrology / Renal Nursing" },
  { value: "Oncology and Palliative Care Nursing", label: "Oncology and Palliative Care Nursing" },
  { value: "Critical Care Nursing (Intensive Care)", label: "Critical Care Nursing (Intensive Care)" },
  { value: "Trauma & Emergency Nursing", label: "Trauma & Emergency Nursing" },
  { value: "Medical Surgical Nursing", label: "Medical Surgical Nursing" },
  { value: "Nursing Education / Leadership", label: "Nursing Education / Leadership" },
  { value: "Community Health Nursing", label: "Community Health Nursing" },
  { value: "Mental Health and Psychiatric Nursing", label: "Mental Health and Psychiatric Nursing" },
  { value: "Other", label: "Other" },
];

const HND_SPECIALTIES = [
  { value: "Paediatric Critical Care Nursing", label: "Paediatric Critical Care Nursing" },
  { value: "Critical Care Nursing (Intensive Care)", label: "Critical Care Nursing (Intensive Care)" },
  { value: "Trauma & Emergency Nursing (Accident & Emergency)", label: "Trauma & Emergency Nursing (Accident & Emergency)" },
  { value: "Nurse Anaesthesia Nursing (KRNA)", label: "Nurse Anaesthesia Nursing (KRNA)" },
  { value: "Peri-Operative Nursing (Theatre Nursing)", label: "Peri-Operative Nursing (Theatre Nursing)" },
  { value: "Stoma and Wound Care Nursing", label: "Stoma and Wound Care Nursing" },
  { value: "Infection Prevention and Control Nursing", label: "Infection Prevention and Control Nursing" },
  { value: "Nephrology Nursing (Renal)", label: "Nephrology Nursing (Renal)" },
  { value: "Cardiovascular / Cardiac Nursing", label: "Cardiovascular / Cardiac Nursing" },
  { value: "Oncology Nursing", label: "Oncology Nursing" },
  { value: "Pediatric Oncology Nursing", label: "Pediatric Oncology Nursing" },
  { value: "Diabetes Nursing", label: "Diabetes Nursing" },
  { value: "Ophthalmic Nursing (Eye Care)", label: "Ophthalmic Nursing (Eye Care)" },
  { value: "Ear, Nose, and Throat (ENT) Nursing", label: "Ear, Nose, and Throat (ENT) Nursing" },
  { value: "Neonatal Nursing", label: "Neonatal Nursing" },
  { value: "Paediatric Nursing", label: "Paediatric Nursing" },
  { value: "Midwifery / Reproductive Health Nursing", label: "Midwifery / Reproductive Health Nursing" },
  { value: "Psychiatric / Mental Health Nursing", label: "Psychiatric / Mental Health Nursing" },
  { value: "Geriatric Nursing (Aged Care)", label: "Geriatric Nursing (Aged Care)" },
  { value: "Community Health / Public Health Nursing", label: "Community Health / Public Health Nursing" },
  { value: "Family Health Nursing", label: "Family Health Nursing" },
  { value: "Palliative Care Nursing", label: "Palliative Care Nursing" },
  { value: "Other", label: "Other" },
];

const CLINICAL_MED_SPECIALTIES = [
  { value: "Anaesthesia", label: "Anaesthesia" },
  { value: "Paediatrics", label: "Paediatrics" },
  { value: "Ophthalmology / Cataract Surgery", label: "Ophthalmology / Cataract Surgery" },
  { value: "Orthopaedics", label: "Orthopaedics" },
  { value: "ENT / Audiology", label: "ENT / Audiology" },
  { value: "Reproductive Health / Medicine", label: "Reproductive Health / Medicine" },
  { value: "Dermatology", label: "Dermatology" },
  { value: "Oncology", label: "Oncology" },
  { value: "Chest / Pulmonology Medicine", label: "Chest / Pulmonology Medicine" },
  { value: "Emergency Medicine / Critical Care", label: "Emergency Medicine / Critical Care" },
  { value: "Other", label: "Other" },
];

export default function CadreProgressiveSelector({
  value,
  onChange,
  cadreOtherValue,
  onCadreOtherChange,
  subSpecialtyValue,
  onSubSpecialtyChange,
}: CadreProgressiveSelectorProps) {
  const [localCategory, setLocalCategory] = useState("");
  const [localRole, setLocalRole] = useState("");
  const [localRnLevel, setLocalRnLevel] = useState("");
  const [localRnSub, setLocalRnSub] = useState("");

  // Sync from parent value
  useEffect(() => {
    if (value) {
      if (value !== getLeafValue(localCategory, localRole, localRnLevel, localRnSub)) {
        const { category, role, rnLevel, rnSub } = getTaxonomyFromCadre(value);
        setLocalCategory(category);
        setLocalRole(role);
        setLocalRnLevel(rnLevel);
        setLocalRnSub(rnSub);
      }
    } else {
      if (getLeafValue(localCategory, localRole, localRnLevel, localRnSub) !== "") {
        setLocalCategory("");
        setLocalRole("");
        setLocalRnLevel("");
        setLocalRnSub("");
      }
    }
  }, [value]);

  const handleCategoryChange = (newCat: string) => {
    setLocalCategory(newCat);
    setLocalRole("");
    setLocalRnLevel("");
    setLocalRnSub("");
    onChange("");
    onSubSpecialtyChange("");
    onCadreOtherChange("");
  };

  const handleRoleChange = (newRole: string) => {
    setLocalRole(newRole);
    setLocalRnLevel("");
    setLocalRnSub("");

    if (
      ["Consultant Physician", "Consultant Physician Student", "MSN", "HND", "MSN Student", "HND Student", "RCO HND"].includes(
        newRole
      )
    ) {
      onSubSpecialtyChange("");
    }

    onCadreOtherChange("");

    const leaf = getLeafValue(localCategory, newRole, "", "");
    onChange(leaf);
  };

  const handleLevelChange = (newLevel: string) => {
    setLocalRnLevel(newLevel);
    setLocalRnSub("");
    onSubSpecialtyChange("");
    onCadreOtherChange("");

    const leaf = getLeafValue(localCategory, localRole, newLevel, "");
    onChange(leaf);
  };

  const handleSubChange = (newSub: string) => {
    setLocalRnSub(newSub);
    onCadreOtherChange("");

    const leaf = getLeafValue(localCategory, localRole, localRnLevel, newSub);
    onChange(leaf);
  };

  const showPhysicianSpecialty =
    localRole === "Consultant Physician" || localRole === "Consultant Physician Student";
  const showNurseSpecialty = (localRole === "RN" && (localRnLevel === "MSN" || localRnLevel === "HND"));
  const showClinicalMedSpecialty = (localRole === "RCO" && localRnLevel === "HND");

  const showFreeTextDetails =
    ["Other Staff", "Other Intern", "Other Student"].includes(localRole) ||
    ["Other Medical Student", "Other Clinical Officer Student", "Other Nursing Student", "Other BSN Student", "Other Diploma Student", "Other Certificate Student", "Other Diploma Nursing Student", "Other Certificate Nursing Student", "Other RN", "Other Diploma RN", "Other Certificate RN", "Other RCO"].includes(localRnSub) ||
    ["Other Medical Student", "Other Clinical Officer Student", "Other Nursing Student", "Other RCO"].includes(localRnLevel) ||
    subSpecialtyValue === "Other";

  // Option lists
  const categoryOptions = [
    { value: "Staff", label: "Staff" },
    { value: "Intern", label: "Intern" },
    { value: "Student", label: "Student" },
  ];

  const getRoleOptions = () => {
    if (localCategory === "Staff") {
      return [
        { value: "Consultant Physician", label: "Doctor / Consultant Physician" },
        { value: "MO", label: "MO (Medical Officer)" },
        { value: "RCO", label: "RCO (Clinical Officer)" },
        { value: "RN", label: "RN (Registered Nurse)" },
        { value: "Other Staff", label: "Other Staff" },
      ];
    }
    if (localCategory === "Intern") {
      return [
        { value: "MOI", label: "MOI (Medical Officer Intern)" },
        { value: "NOI", label: "NOI (Nursing Officer Intern)" },
        { value: "COI", label: "COI (Clinical Officer Intern)" },
        { value: "Other Intern", label: "Other Intern" },
      ];
    }
    if (localCategory === "Student") {
      return [
        { value: "Medical Student", label: "Medical Student" },
        { value: "Nursing Student", label: "Nursing Student" },
        { value: "Clinical Officer Student", label: "Clinical Officer Student" },
        { value: "Consultant Physician Student", label: "Medical Student - Specialist Track" },
        { value: "Other Student", label: "Other Student" },
      ];
    }
    return [];
  };

  const getLevelOptions = () => {
    if (localRole === "RN") {
      return [
        { value: "MSN", label: "MSN" },
        { value: "HND", label: "HND" },
        { value: "Undergraduate", label: "Undergraduate" },
        { value: "Diploma", label: "Diploma" },
        { value: "Certificate", label: "Certificate" },
        { value: "Other RN", label: "Other RN" },
      ];
    }
    if (localRole === "RCO") {
      return [
        { value: "HND", label: "HND" },
        { value: "BSc. Clin. Med", label: "BSc. Clin. Med" },
        { value: "Dip Clin. Med", label: "Dip Clin. Med" },
        { value: "Other RCO", label: "Other RCO" },
      ];
    }
    if (localRole === "Medical Student") {
      return [
        { value: "MBChB Student", label: "MBChB Student" },
        { value: "Pharmacy Student", label: "Pharmacy Student" },
        { value: "Dental Surgery Student", label: "Dental and Surgery Student" },
        { value: "Other Medical Student", label: "Other Medical Student" },
      ];
    }
    if (localRole === "Clinical Officer Student") {
      return [
        { value: "BSc Clinical Medicine Student", label: "BSc Clinical Medicine Student" },
        { value: "Diploma in Clinical Medicine Student", label: "Diploma in Clinical Medicine Student" },
        { value: "Other Clinical Officer Student", label: "Other Clinical Officer Student" },
      ];
    }
    if (localRole === "Nursing Student") {
      return [
        { value: "BSN Student", label: "BSN Student" },
        { value: "Diploma Student", label: "Diploma Student" },
        { value: "Certificate Student", label: "Certificate Student" },
        { value: "Other Nursing Student", label: "Other Nursing Student" },
      ];
    }
    return [];
  };

  const getSubOptions = () => {
    if (localRnLevel === "Undergraduate") {
      return [
        { value: "BSN", label: "BSN" },
        { value: "BSM", label: "BSM" },
        { value: "Other Undergraduate", label: "Other Undergraduate" },
      ];
    }
    if (localRnLevel === "Diploma") {
      return [
        { value: "KRCHN", label: "KRCHN" },
        { value: "KRNM", label: "KRNM" },
        { value: "KRN", label: "KRN" },
        { value: "KRM", label: "KRM" },
        { value: "Other Diploma RN", label: "Other Diploma RN" },
      ];
    }
    if (localRnLevel === "Certificate") {
      return [
        { value: "KECHN", label: "KECHN" },
        { value: "Other Certificate RN", label: "Other Certificate RN" },
      ];
    }
    if (localRnLevel === "BSN Student") {
      return [
        { value: "BSN Student", label: "BSN Student" },
        { value: "BSM Student", label: "BSM Student" },
        { value: "Other BSN Student", label: "Other BSN Student" },
      ];
    }
    if (localRnLevel === "Diploma Student") {
      return [
        { value: "KRCHN Student", label: "KRCHN Student" },
        { value: "KRNM Student", label: "KRNM Student" },
        { value: "KRN Student", label: "KRN Student" },
        { value: "KRM Student", label: "KRM Student" },
        { value: "Other Diploma Nursing Student", label: "Other Diploma Nursing Student" },
      ];
    }
    if (localRnLevel === "Certificate Student") {
      return [
        { value: "KECHN Student", label: "KECHN Student" },
        { value: "Other Certificate Nursing Student", label: "Other Certificate Nursing Student" },
      ];
    }
    return [];
  };

  return (
    <div className="space-y-4">
      {/* T1: Category selection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Category *</Label>
        <SearchableDropdown
          value={localCategory}
          onChange={handleCategoryChange}
          options={categoryOptions}
          placeholder="Select Category (Staff, Intern, Student)"
          searchPlaceholder="Search category..."
          clearable
        />
      </div>

      {/* T2: Role / Profession Selection */}
      {localCategory && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">
            {localCategory === "Staff"
              ? "Staff Role *"
              : localCategory === "Intern"
                ? "Intern Role *"
                : "Student Path *"}
          </Label>
          <SearchableDropdown
            value={localRole}
            onChange={handleRoleChange}
            options={getRoleOptions()}
            placeholder={
              localCategory === "Staff"
                ? "Select Role"
                : localCategory === "Intern"
                  ? "Select Intern Path"
                  : "Select Student Path"
            }
            searchPlaceholder="Search role..."
            clearable
          />
        </div>
      )}

      {/* T3: Level (RN / RCO / Student Level Selection / Specialty level) */}
      {(localRole === "RN" ||
        localRole === "RCO" ||
        localRole === "Medical Student" ||
        localRole === "Clinical Officer Student" ||
        localRole === "Nursing Student") && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">
            {localRole === "RN"
              ? "Nurse Qualification Level *"
              : localRole === "RCO"
                ? "Clinical Officer Level *"
                : localRole === "Medical Student"
                  ? "Medical Program *"
                  : localRole === "Clinical Officer Student"
                    ? "Clinical Officer Program *"
                    : "Nursing Path *"}
          </Label>
          <SearchableDropdown
            value={localRnLevel}
            onChange={handleLevelChange}
            options={getLevelOptions()}
            placeholder="Select option"
            searchPlaceholder="Search..."
            clearable
          />
        </div>
      )}

      {/* T4: Sub-Qualification Level */}
      {(localRnLevel === "Undergraduate" ||
        localRnLevel === "Diploma" ||
        localRnLevel === "Certificate" ||
        localRnLevel === "BSN Student" ||
        localRnLevel === "Diploma Student" ||
        localRnLevel === "Certificate Student") && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Specific Cadre *</Label>
          <SearchableDropdown
            value={localRnSub}
            onChange={handleSubChange}
            options={getSubOptions()}
            placeholder="Select specific cadre"
            searchPlaceholder="Search specific cadre..."
          />
        </div>
      )}

      {/* T5: Consultant Physician Specialty Dropdown */}
      {showPhysicianSpecialty && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Specialty / Highest Qualification *</Label>
          <SearchableDropdown
            value={subSpecialtyValue}
            onChange={(val) => {
              onSubSpecialtyChange(val);
              if (val !== "Other") {
                onCadreOtherChange("");
              }
            }}
            options={CONSULTANT_SPECIALTIES}
            placeholder="Select specialty"
            searchPlaceholder="Search specialty..."
            clearable
          />
        </div>
      )}

      {/* T5: MSN Subspecialty Dropdown */}
      {localRole === "RN" && localRnLevel === "MSN" && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Subspecialty / Highest Qualification *</Label>
          <SearchableDropdown
            value={subSpecialtyValue}
            onChange={(val) => {
              onSubSpecialtyChange(val);
              if (val !== "Other") {
                onCadreOtherChange("");
              }
            }}
            options={MSN_SPECIALTIES}
            placeholder="Select subspecialty"
            searchPlaceholder="Search subspecialty..."
          />
        </div>
      )}

      {/* T5: HND Subspecialty Dropdown */}
      {localRole === "RN" && localRnLevel === "HND" && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Subspecialty / Highest Qualification *</Label>
          <SearchableDropdown
            value={subSpecialtyValue}
            onChange={(val) => {
              onSubSpecialtyChange(val);
              if (val !== "Other") {
                onCadreOtherChange("");
              }
            }}
            options={HND_SPECIALTIES}
            placeholder="Select subspecialty"
            searchPlaceholder="Search subspecialty..."
          />
        </div>
      )}

      {/* T5: Clinical Officer HND Subspecialty Dropdown */}
      {showClinicalMedSpecialty && (
        <div className="space-y-1.5 transition-all duration-300 ease-in-out">
          <Label className="text-sm font-medium">Clinical Med Subspecialty *</Label>
          <SearchableDropdown
            value={subSpecialtyValue}
            onChange={(val) => {
              onSubSpecialtyChange(val);
              if (val !== "Other") {
                onCadreOtherChange("");
              }
            }}
            options={CLINICAL_MED_SPECIALTIES}
            placeholder="Select subspecialty"
            searchPlaceholder="Search subspecialty..."
          />
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
