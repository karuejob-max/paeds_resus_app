import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GLOBAL_DEPARTMENTS, parseDepartmentString, formatDepartmentString } from "@/lib/clinical-departments";

interface DepartmentSelectorsProps {
  value: string;
  onChange: (value: string) => void;
  labelSize?: "xs" | "sm" | "base";
  className?: string;
}

export function DepartmentSelectors({
  value,
  onChange,
  labelSize = "sm",
  className = ""
}: DepartmentSelectorsProps) {
  const parsed = parseDepartmentString(value);

  // Derive Parent Dropdown Value
  const parent = parsed.isCustomParent ? "Other" : (parsed.parent || "");

  // Derive Sub Dropdown Value
  let sub = "";
  if (parsed.sub === "Other" || parsed.isCustomSub) {
    sub = "Other";
  } else if (parsed.sub) {
    sub = parsed.sub;
  }

  // Derive Custom Text Values
  const customParent = parsed.isCustomParent ? parsed.parent : "";
  const customSub = parsed.isCustomSub ? parsed.sub : "";

  // Handle Parent Dropdown change
  const handleParentChange = (newParent: string) => {
    if (newParent === "Other") {
      onChange(formatDepartmentString(customParent || "Other", "Other"));
    } else if (newParent === "") {
      onChange("");
    } else {
      const match = GLOBAL_DEPARTMENTS.find(d => d.name === newParent);
      const defaultSub = match && match.subs.length > 0 ? match.subs[0] : "General";
      onChange(formatDepartmentString(newParent, defaultSub));
    }
  };

  // Handle Sub Dropdown change
  const handleSubChange = (newSub: string) => {
    if (newSub === "Other") {
      onChange(formatDepartmentString(parent === "Other" ? (customParent || "Other") : parent, customSub || "Other"));
    } else if (newSub === "") {
      onChange(formatDepartmentString(parent === "Other" ? (customParent || "Other") : parent, ""));
    } else {
      onChange(formatDepartmentString(parent === "Other" ? (customParent || "Other") : parent, newSub));
    }
  };

  // Handle Custom Parent Text input change
  const handleCustomParentChange = (newCustomParent: string) => {
    onChange(formatDepartmentString(newCustomParent || "Other", sub === "Other" ? (customSub || "Other") : sub));
  };

  // Handle Custom Sub Text input change
  const handleCustomSubChange = (newCustomSub: string) => {
    onChange(formatDepartmentString(parent === "Other" ? (customParent || "Other") : parent, newCustomSub || "Other"));
  };

  const selectedParentMatch = GLOBAL_DEPARTMENTS.find(d => d.name === parent);
  const subOptions = selectedParentMatch ? [...selectedParentMatch.subs, "Other"] : ["Other"];

  const labelClass = labelSize === "xs" ? "text-xs" : labelSize === "base" ? "text-sm font-medium" : "text-sm font-medium";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className={labelClass}>Overlying Department</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={parent}
            onChange={(e) => handleParentChange(e.target.value)}
          >
            <option value="">Select Overlying Department</option>
            {GLOBAL_DEPARTMENTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
            <option value="Other">Other (Please specify)</option>
          </select>
        </div>

        {parent && (
          <div className="space-y-1">
            <Label className={labelClass}>Sub Department</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={sub}
              onChange={(e) => handleSubChange(e.target.value)}
            >
              <option value="">Select Sub Department</option>
              {subOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {parent === "Other" && (
        <div className="space-y-1">
          <Label className={labelClass}>Specify Custom Overlying Department</Label>
          <Input
            placeholder="e.g. Intensive Care Medicine"
            value={customParent}
            onChange={(e) => handleCustomParentChange(e.target.value)}
          />
        </div>
      )}

      {sub === "Other" && (
        <div className="space-y-1">
          <Label className={labelClass}>Specify Custom Sub Department</Label>
          <Input
            placeholder="e.g. Special Care Baby Unit (SCBU)"
            value={customSub}
            onChange={(e) => handleCustomSubChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
