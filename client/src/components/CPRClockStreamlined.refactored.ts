/**
 * REFACTORED KEY FUNCTIONS FOR CPRClockStreamlined.tsx
 * These functions integrate cpr-engine logic for clinical consistency.
 * Replace the corresponding functions in CPRClockStreamlined.tsx with these.
 */

// Handle rhythm check using cpr-engine
const handleRhythmCheck = (type: RhythmType) => {
  setRhythmType(type);
  setShowRhythmCheck(false);
  
  // Use pure engine logic to determine next phase
  const engineState: CprEngineState = {
    shockCount,
    epiDoses,
    lastEpiTime,
    antiarrhythmicDoses,
    rhythmType: type,
    phase: 'rhythm_check',
  };
  
  const rhythmResult = evaluateRhythmTransition(type, engineState);
  const isShockable = type === 'vf_pvt';
  const medResult = evaluateMedicationEligibility(arrestDuration, engineState, isShockable);
  
  // Apply phase transition
  setPhase(rhythmResult.nextPhase as ArrestPhase);
  addEvent(`${type.toUpperCase()} detected`, rhythmResult.message);
  speak(rhythmResult.message);
  
  if (rhythmResult.shockRequired) {
    // Shockable rhythm: charge defib
    setDefibCharging(true);
    const energy = calculateShockEnergy(patientWeight, shockCount);
    speak(`Shockable rhythm. Charging to ${energy} joules. Clear the patient.`);
    
    // Simulate charging time (3 seconds)
    setTimeout(() => {
      setPhase('shock_ready');
      setDefibCharging(false);
      speak('Defibrillator ready. Clear and shock.');
    }, 3000);
  } else {
    // Non-shockable: resume compressions
    setPhase('compressions');
    speak('Non-shockable rhythm. Resume CPR immediately.');
    
    // Check medication eligibility
    if (medResult.epiEligible && medResult.recommendation) {
      speak(medResult.recommendation);
    }
  }
};

// Deliver shock using cpr-engine
const deliverShock = () => {
  triggerHaptic('critical'); // Haptic feedback for shock
  const newShockCount = shockCount + 1;
  setShockCount(newShockCount);
  setPhase('post_shock');
  
  // Use engine to calculate energy
  const energy = calculateShockEnergy(patientWeight, newShockCount - 1);
  addEvent(`Shock ${newShockCount} delivered`, `${energy} J`);
  speak(`Shock delivered. Resume CPR immediately.`);
  
  // Resume compressions
  setTimeout(() => {
    setPhase('compressions');
  }, 1000);
  
  // Check medication eligibility using engine
  const engineState: CprEngineState = {
    shockCount: newShockCount,
    epiDoses,
    lastEpiTime,
    antiarrhythmicDoses,
    rhythmType: rhythmType || 'unknown',
    phase: 'post_shock',
  };
  
  const medResult = evaluateMedicationEligibility(arrestDuration, engineState, true);
  
  if (medResult.epiEligible && medResult.recommendation) {
    speak(medResult.recommendation);
  }
  
  if (medResult.antiarrhythmicEligible && medResult.recommendation) {
    setShowAntiarrhythmicChoice(true);
    speak('Consider antiarrhythmic. Choose amiodarone or lidocaine.');
  }
};

// Give epinephrine using cpr-engine
const giveEpinephrine = () => {
  triggerHaptic('critical'); // Haptic feedback for epinephrine
  const newEpiDoses = epiDoses + 1;
  setEpiDoses(newEpiDoses);
  setLastEpiTime(arrestDuration);
  
  // Use engine to calculate dose
  const doseMeta = calculateCprMedicationDose('epinephrine', patientWeight);
  addEvent(
    `Epinephrine dose ${newEpiDoses}`, 
    `${doseMeta.dose} ${doseMeta.unit}${doseMeta.preparation ? ` (${doseMeta.preparation})` : ''}`
  );
  speak(`Give epinephrine ${doseMeta.dose} milligrams.`);
};

// Give antiarrhythmic using cpr-engine
const giveAntiarrhythmic = (choice: AntiarrhythmicChoice) => {
  if (!choice) return;
  
  triggerHaptic('critical'); // Haptic feedback for antiarrhythmic
  const newAntiarrhythmicDoses = antiarrhythmicDoses + 1;
  setAntiarrhythmicDoses(newAntiarrhythmicDoses);
  setAntiarrhythmic(choice);
  setShowAntiarrhythmicChoice(false);
  
  // Use engine to calculate dose
  const doseMeta = calculateCprMedicationDose(choice, patientWeight);
  const medicationName = choice === 'amiodarone' ? 'Amiodarone' : 'Lidocaine';
  
  addEvent(
    `${medicationName} dose ${newAntiarrhythmicDoses}`,
    `${doseMeta.dose} ${doseMeta.unit}`
  );
  speak(`Give ${medicationName} ${doseMeta.dose} milligrams.`);
};
