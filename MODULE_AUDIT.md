# Module Audit - ClinicalAssessmentGPS

## Module Trigger Map

### Advanced Modules (Overlay System)
| Module | Trigger Type | Trigger Location | Status |
|--------|-------------|------------------|--------|
| **shock** | relatedModule | Circulation questions (JVP, hepatomegaly, heart sounds, perfusion, BP) | ✅ WORKING |
| **asthma** | relatedModule | Breathing questions (wheezing) | ✅ WORKING |
| **ivio** | relatedModule | Shock module → onAccessTimerStart | ✅ WORKING |
| **fluid** | interventionTemplate | fluidBolus intervention → FluidBolusTracker | ✅ WORKING |
| **inotrope** | relatedModule | Fluid overload / escalation from FluidBolusTracker | ✅ WORKING |
| **lab** | relatedModule | Lab collection intervention | ✅ WORKING |
| **arrhythmia** | relatedModule | Heart rate/rhythm questions (SVT, bradycardia, irregular rhythm) | ✅ WORKING |
| **airway** | relatedModule | Airway questions (stridor, unresponsive) | ⚠️ **NOT IMPLEMENTED** |

### Scenario Quick Start (Homepage)
| Scenario | Route | Status |
|----------|-------|--------|
| Cardiac Arrest | `/clinical-assessment?scenario=cardiac_arrest` | ✅ WORKING |
| Neonatal | `/nrp` | ✅ WORKING |
| Trauma | `/trauma` | ✅ WORKING |
| Anaphylaxis | `/clinical-assessment?scenario=anaphylaxis` | ✅ WORKING |
| Seizure | `/clinical-assessment?scenario=seizure` | ✅ WORKING |
| Sepsis | `/clinical-assessment?scenario=septic_shock` | ✅ WORKING |
| Respiratory Failure | `/clinical-assessment?scenario=respiratory_failure` | ✅ WORKING |

## Critical Findings

### 1. **Stridor Module Missing** ⚠️ HIGH PRIORITY
- **Problem**: Questions trigger `relatedModule: 'airway'` but no airway module overlay exists
- **Affected Questions**: 
  - `airway_sounds` → stridor option (line 370-378)
  - `responsiveness` → unresponsive option (line 293)
- **Impact**: Providers see "STRIDOR DETECTED" action card with "Advanced Module" button, but clicking it does nothing
- **Fix Required**: Create `AirwayManagement` component or route stridor to existing component

### 2. **Module Overlay Rendering**
- **Location**: Lines 1989-2120
- **Implemented Modules**: shock, asthma, ivio, fluid, inotrope, lab, arrhythmia
- **Missing**: airway

### 3. **Related Module Triggers**
All `relatedModule` references in question triggers:
- `'airway'` - Lines 293, 377 - **NOT IMPLEMENTED**
- `'shock'` - Lines 585, 610, 637, 648, 658, 683, 796, 844, 871, 882, 908 - ✅ Working
- `'arrhythmia'` - Lines 721, 732, 757, 767 - ✅ Working

## Recommendations

### Immediate Actions
1. **Create AirwayManagement component** for stridor/airway obstruction management
   - Include: Croup score, nebulized epinephrine dosing, dexamethasone dosing
   - Include: Foreign body algorithm (back blows/chest thrusts)
   - Include: Epiglottitis warning (do not examine throat)

2. **Add airway module to overlay rendering** (line ~2120)

3. **Test all scenario quick-start buttons** from homepage

### Future Enhancements
1. Add visual indicator when module has `relatedModule` available
2. Consider consolidating similar modules (e.g., shock + inotrope)
3. Add module completion tracking to prevent duplicate triggers
