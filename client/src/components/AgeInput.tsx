/**
 * Age Input Component
 * 
 * Structured age picker with years/months/weeks spinners.
 * Auto-calculates weight and shows age-based drug restrictions.
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  StructuredAge,
  estimateWeightFromAge,
  getAgeCategory,
  formatAge,
  AGE_PRESETS,
} from '@/lib/resus/age-calculator';

interface AgeInputProps {
  age: StructuredAge;
  onAgeChange: (age: StructuredAge) => void;
  showWeightEstimate?: boolean;
  showCategory?: boolean;
}

export function AgeInput({
  age,
  onAgeChange,
  showWeightEstimate = true,
  showCategory = true,
}: AgeInputProps) {
  const weight = estimateWeightFromAge(age);
  const ageInfo = getAgeCategory(age);

  const handleYearsChange = (delta: number) => {
    const newYears = Math.max(0, age.years + delta);
    onAgeChange({ ...age, years: newYears });
  };

  const handleMonthsChange = (delta: number) => {
    let newMonths = age.months + delta;
    let newYears = age.years;

    if (newMonths >= 12) {
      newYears += Math.floor(newMonths / 12);
      newMonths = newMonths % 12;
    } else if (newMonths < 0) {
      newYears = Math.max(0, newYears - 1);
      newMonths = 12 + newMonths;
    }

    onAgeChange({ years: newYears, months: newMonths, weeks: age.weeks });
  };

  const handleWeeksChange = (delta: number) => {
    const newWeeks = Math.max(0, age.weeks + delta);
    onAgeChange({ ...age, weeks: newWeeks });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Patient Age</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Age Spinners */}
        <div className="grid grid-cols-3 gap-2">
          {/* Years */}
          <div className="flex flex-col items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full"
              onClick={() => handleYearsChange(1)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <div className="text-center py-2 px-2 bg-muted rounded min-h-8 flex items-center justify-center">
              <span className="font-mono font-bold text-lg">{age.years}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full"
              onClick={() => handleYearsChange(-1)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-medium">Years</span>
          </div>

          {/* Months */}
          <div className="flex flex-col items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full"
              onClick={() => handleMonthsChange(1)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <div className="text-center py-2 px-2 bg-muted rounded min-h-8 flex items-center justify-center">
              <span className="font-mono font-bold text-lg">{age.months}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full"
              onClick={() => handleMonthsChange(-1)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-medium">Months</span>
          </div>

          {/* Weeks (for neonates) */}
          <div className="flex flex-col items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full"
              onClick={() => handleWeeksChange(1)}
              disabled={age.years > 0 || age.months > 0}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <div className="text-center py-2 px-2 bg-muted rounded min-h-8 flex items-center justify-center">
              <span className="font-mono font-bold text-lg">{age.weeks}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full"
              onClick={() => handleWeeksChange(-1)}
              disabled={age.years > 0 || age.months > 0}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-medium">Weeks</span>
          </div>
        </div>

        {/* Age Display */}
        <div className="text-center py-2 px-3 bg-blue-500/10 border border-blue-500/30 rounded">
          <p className="text-xs text-muted-foreground">Age</p>
          <p className="font-medium">{formatAge(age)}</p>
        </div>

        {/* Weight Estimate */}
        {showWeightEstimate && (
          <div className="text-center py-2 px-3 bg-green-500/10 border border-green-500/30 rounded">
            <p className="text-xs text-muted-foreground">Estimated Weight</p>
            <p className="font-mono font-bold text-lg">~{weight.toFixed(1)} kg</p>
            <p className="text-[10px] text-muted-foreground">
              (Verify with actual weight if available)
            </p>
          </div>
        )}

        {/* Age Category */}
        {showCategory && (
          <div className="text-center py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="font-medium">{ageInfo.description}</p>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick Presets</p>
          <div className="grid grid-cols-3 gap-1">
            {AGE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => onAgeChange(preset.age)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
