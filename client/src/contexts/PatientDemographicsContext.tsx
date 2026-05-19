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

/** Session-scoped only (tab); clears when the tab closes. See docs/SECURITY_BASELINE.md §clinical browser context. */
const SESSION_STORAGE_KEY = 'paeds_resus_session_demographics_v1';
/** Legacy key — migrated once into session storage (Codex audit: reduce long-lived clinical-ish data in localStorage). */
const LEGACY_LOCALSTORAGE_KEY = 'patientDemographics';

export function PatientDemographicsProvider({ children }: { children: ReactNode }) {
  const [demographics, setDemographicsState] = useState<PatientDemographics>({
    age: '',
    weight: ''
  });

  useEffect(() => {
    try {
      const fromSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (fromSession) {
        setDemographicsState(JSON.parse(fromSession));
        return;
      }
      const legacy = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        setDemographicsState(parsed);
        sessionStorage.setItem(SESSION_STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
      }
    } catch (error) {
      console.error('[PatientDemographics] Failed to restore demographics:', error);
    }
  }, []);

  const setDemographics = (newDemographics: PatientDemographics) => {
    const updated = {
      ...newDemographics,
      timestamp: new Date().toISOString()
    };
    setDemographicsState(updated);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // sessionStorage may be unavailable (private mode)
    }
  };

  const clearDemographics = () => {
    setDemographicsState({ age: '', weight: '' });
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
    } catch {
      // ignore
    }
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
