# Adult ACLS Intervention-Effect Matrix V1

**Status:** Clinical review required. **Training approval:** not granted. **Assessment:** prohibited.

This matrix defines engine semantics, not prescribing guidance. Medication dose, route, timing, and contraindication values remain `REQUIRED_AT_CLINICAL_APPROVAL` until a named clinical owner records the governing guideline version.

| Intervention | Preconditions | Primary hidden effect | Observable consequence | Safety rule |
|---|---|---|---|---|
| Assess | Any active state | Advances assessment time only | New permitted observations | Reasonable assessment is not scored as negligence |
| Reassess | After meaningful intervention or deterioration | Updates evidence and trajectory | Rhythm, pulse, BP, breathing, mental status | Reassessment is a required loop, not a completion click |
| Oxygen | Oxygen available; respiratory indication | Improves inspired oxygen/oxygenation only | SpO₂ may improve while ventilation remains inadequate | Never creates adequate ventilation or ROSC alone |
| Assisted ventilation | Airway/ventilation role; device and airway conditions | Improves alveolar ventilation, CO₂ clearance, and oxygenation according to technique | Breathing/ETCO₂/mental status may improve | BVM/device selection does not guarantee perfect ventilation |
| CPR | Cardiac arrest; compressor/team role | Supports coronary/cerebral perfusion, slows oxygen debt, improves ROSC probability | Pulse remains absent; ETCO₂/perfusion trend may change | CPR is not normal circulation |
| Defibrillation | Cardiac arrest + VF or pulseless VT + charged defibrillator | Probabilistic rhythm effect | Persistent VF/pVT, organised rhythm, transient conversion, or ROSC | Not permitted as therapeutic treatment for PEA/asystole; never automatic ROSC |
| Synchronized cardioversion | Pulse present, appropriate tachyarrhythmia, synchronisation on | Rhythm conversion probability with time cost | Rhythm may convert; perfusion may improve or worsen | Separate from unsynchronized defibrillation |
| Transcutaneous pacing | Indicated bradycardia; pacing device available | Electrical pacing and possible mechanical capture | Spikes may appear without adequate pulse; mechanical capture must be observed | Electrical capture ≠ mechanical capture |
| Epinephrine | Indication validated by current state and protocol version | Vascular tone and coronary/systemic haemodynamic support | BP/perfusion/ROSC probability may change | Never automatic ROSC; dose metadata requires clinical approval |
| Amiodarone/lidocaine | Valid refractory ventricular-arrhythmia context | Modifies refractory arrhythmia pathway | Persistent, transiently converted, or recurrent ventricular rhythm | Not a universal anti-arrhythmia success action |
| Adenosine | Rhythm and stability support appropriate use | Rhythm-dependent transient conduction effect | Conversion, transient pause, or no conversion | Never generic “SVT solved” |
| Atropine | Appropriate symptomatic bradycardia context | Rhythm/perfusion support probability | Improvement, inadequate response, or deterioration | Not universal for all bradycardia |
| Treat reversible cause | Evidence supports cause and resource available | Corrects selected causal variable | Cause-specific improvement over time | Cause treatment must be specific, not a generic heal action |
| Delegate/communicate | Team role and active team | Changes team task state and latency | Acknowledgement, execution, clarification, closed-loop evidence | Team action cannot bypass clinical validation |

## Medication metadata contract

Each medication record must include: indication, contraindications, dose, route, timing, onset, duration, physiological effect, rhythm effect, adverse effects, reassessment requirement, guideline version, clinical owner, and review state. Missing approval metadata must fail closed for training exposure.
