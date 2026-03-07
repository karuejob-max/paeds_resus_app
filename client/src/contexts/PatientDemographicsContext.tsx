/**
 * Patient Demographics Context
 * 
 * Provides patient age and weight across all emergency protocols
 * for accurate drug dosing and age-appropriate protocol selection.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PatientDemographics {
  age: string;
  weight: string;
  ageYears?: number;      // Structured: years
  ageMonths?: number;     // Structured: months (0-11)
  ageDays?: number;       // Structured: days (0-30)
  gestationWeeks?: number; // Structured: gestation weeks (for neonates)
  timestamp?: string;
}

export interface AgeInput {
  type: 'years' | 'months' | 'days' | 'gestation';
  value: number;
}

interface PatientDemographicsContextType {
  demographics: PatientDemographics;
  setDemographics: (demographics: PatientDemographics) => void;
  clearDemographics: () => void;
  getWeightInKg: () => number | null;
  getAgeInYears: () => number | null;
  setStructuredAge: (ageInput: AgeInput) => void;
  estimateWeightFromAge: (ageYears: number) => number | null;
  getStructuredAge: () => AgeInput | null;
}

const PatientDemographicsContext = createContext<PatientDemographicsContextType | undefined>(undefined);

export function PatientDemographicsProvider({ children }: { children: ReactNode }) {
  const [demographics, setDemographicsState] = useState<PatientDemographics>({
    age: '',
    weight: ''
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('patientDemographics');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDemographicsState(parsed);
      } catch (error) {
        console.error('[PatientDemographics] Failed to parse stored demographics:', error);
      }
    }
  }, []);

  const setDemographics = (newDemographics: PatientDemographics) => {
    const updated = {
      ...newDemographics,
      timestamp: new Date().toISOString()
    };
    setDemographicsState(updated);
    localStorage.setItem('patientDemographics', JSON.stringify(updated));
  };

  const clearDemographics = () => {
    setDemographicsState({ age: '', weight: '' });
    localStorage.removeItem('patientDemographics');
  };

  // Parse weight to number (handles kg input)
  const getWeightInKg = (): number | null => {
    if (!demographics.weight) return null;
    const weight = parseFloat(demographics.weight);
    return isNaN(weight) ? null : weight;
  };

  // Parse age to years (handles various formats)
  const getAgeInYears = (): number | null => {
    if (!demographics.age) return null;
    
    const age = demographics.age.toLowerCase();
    
    // Extract numbers
    const numbers = age.match(/\d+(\.\d+)?/g);
    if (!numbers || numbers.length === 0) return null;
    
    const value = parseFloat(numbers[0]);
    
    // Determine unit
    if (age.includes('year') || age.includes('yr') || age.includes('y')) {
      return value;
    } else if (age.includes('month') || age.includes('mo') || age.includes('m')) {
      return value / 12;
    } else if (age.includes('week') || age.includes('wk') || age.includes('w')) {
      return value / 52;
    } else if (age.includes('day') || age.includes('d')) {
      return value / 365;
    }
    
    // Default to years if no unit specified
    return value;
  };

  return (
    <PatientDemographicsContext.Provider
      value={{
        demographics,
        setDemographics,
        clearDemographics,
        getWeightInKg,
        getAgeInYears,
        setStructuredAge,
        estimateWeightFromAge,
        getStructuredAge
      }}
    >
      {children}
    </PatientDemographicsContext.Provider>
  );
}

export function usePatientDemographics() {
  const context = useContext(PatientDemographicsContext);
  if (context === undefined) {
    throw new Error('usePatientDemographics must be used within a PatientDemographicsProvider');
  }
  return context;
}

  // Set structured age (years/months/days/gestation)
  const setStructuredAge = (ageInput: AgeInput) => {
    let ageYears = 0;
    let ageMonths = 0;
    let ageDays = 0;
    let gestationWeeks = 0;
    let ageString = '';

    switch (ageInput.type) {
      case 'years':
        ageYears = ageInput.value;
        ageString = `${ageInput.value} years`;
        break;
      case 'months':
        ageMonths = ageInput.value;
        ageYears = ageInput.value / 12;
        ageString = `${ageInput.value} months`;
        break;
      case 'days':
        ageDays = ageInput.value;
        ageYears = ageInput.value / 365;
        ageString = `${ageInput.value} days`;
        break;
      case 'gestation':
        gestationWeeks = ageInput.value;
        ageYears = ageInput.value / 52;
        ageString = `${ageInput.value} weeks gestation`;
        break;
    }

    const updated: PatientDemographics = {
      ...demographics,
      age: ageString,
      ageYears,
      ageMonths,
      ageDays,
      gestationWeeks,
      timestamp: new Date().toISOString()
    };

    setDemographicsState(updated);
    localStorage.setItem('patientDemographics', JSON.stringify(updated));
  };

  // Get structured age
  const getStructuredAge = (): AgeInput | null => {
    if (demographics.ageYears !== undefined && demographics.ageYears > 0) {
      return { type: 'years', value: demographics.ageYears };
    } else if (demographics.ageMonths !== undefined && demographics.ageMonths > 0) {
      return { type: 'months', value: demographics.ageMonths };
    } else if (demographics.ageDays !== undefined && demographics.ageDays > 0) {
      return { type: 'days', value: demographics.ageDays };
    } else if (demographics.gestationWeeks !== undefined && demographics.gestationWeeks > 0) {
      return { type: 'gestation', value: demographics.gestationWeeks };
    }
    return null;
  };

  // Estimate weight from age using Broselow tape approximation
  // Based on: Length (cm) = 50 + 4 * age(years) for children 1-10 years
  // Weight (kg) ≈ (age + 4) * 2 for children 1-10 years
  const estimateWeightFromAge = (ageYears: number): number | null => {
    if (ageYears < 0) return null;

    // Neonates (< 1 month)
    if (ageYears < 1 / 12) return 3.5;
    // 1-3 months
    if (ageYears < 3 / 12) return 5;
    // 3-6 months
    if (ageYears < 6 / 12) return 7;
    // 6-12 months
    if (ageYears < 1) return 9;
    // 1-2 years
    if (ageYears < 2) return (ageYears + 4) * 2;
    // 2-10 years: Broselow formula
    if (ageYears <= 10) return (ageYears + 4) * 2;
    // 10-15 years: transition to adult
    if (ageYears <= 15) return 30 + (ageYears - 10) * 5;
    // Adults: assume 70 kg
    return 70;
  };
