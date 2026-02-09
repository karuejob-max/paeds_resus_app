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
  timestamp?: string;
}

interface PatientDemographicsContextType {
  demographics: PatientDemographics;
  setDemographics: (demographics: PatientDemographics) => void;
  clearDemographics: () => void;
  getWeightInKg: () => number | null;
  getAgeInYears: () => number | null;
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
        getAgeInYears
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
