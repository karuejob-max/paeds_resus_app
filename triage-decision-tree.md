# Patient-First Triage Decision Tree
## ResusGPS Intelligent Protocol Routing System

**Design Principle:** Remove all diagnostic burden from provider. Ask only observable facts, route intelligently.

---

## Level 1: Patient Type Selection

```
┌─────────────────────────────────────────────────┐
│  Who is your patient?                           │
├─────────────────────────────────────────────────┤
│  👶 Neonate (0-28 days old)                    │
│  🧒 Child (29 days - 18 years)                 │
│  🤰 Pregnant/Postpartum Mother                  │
│  👤 Adult (Non-pregnant, >18 years)            │
└─────────────────────────────────────────────────┘
```

---

## Level 2: Clinical Presentation (Symptom-Based)

### For 🤰 **Pregnant/Postpartum Mother**

```
What are you seeing? (Select one)

🩸 Heavy Bleeding (Postpartum Hemorrhage)
⚡ Seizure/Convulsion
💔 Unresponsive / No Pulse
🫁 Can't Breathe / Respiratory Distress
🤒 Fever / Infection / Looks Septic
🧠 Severe Headache / Vision Changes
📊 Other Medical Emergency
```

#### Routing Logic:

**🩸 Heavy Bleeding:**
- → **Postpartum Hemorrhage Protocol** (direct, no questions)

**⚡ Seizure/Convulsion:**
- Ask Level 3 questions → Route to Eclampsia OR Status Epilepticus (pregnancy-safe)

**💔 Unresponsive / No Pulse:**
- → **Maternal Cardiac Arrest Protocol** (direct, includes left uterine displacement, perimortem C-section timing)

**🫁 Can't Breathe:**
- Ask: "Is this related to bleeding?" 
  - Yes → Postpartum Hemorrhage Protocol (hemorrhagic shock)
  - No → Respiratory Distress Protocol (pregnancy-modified)

**🤒 Fever / Infection:**
- → **Sepsis Protocol** (pregnancy-safe antibiotics, source control)

**🧠 Severe Headache / Vision Changes:**
- Ask Level 3 questions → Route to Eclampsia OR Stroke

**📊 Other Medical Emergency:**
- Show list: DKA, Anaphylaxis, Stroke, Pulmonary Embolism, etc.

---

### For 🧒 **Child (29 days - 18 years)**

```
What are you seeing? (Select one)

💔 Unresponsive / No Pulse
⚡ Seizure/Convulsion
🫁 Can't Breathe / Respiratory Distress
🩸 Bleeding / Trauma / Injury
🤒 Fever / Looks Septic / Shock
😵 Severe Allergic Reaction
🧠 Altered Mental Status / Unconscious
📊 Other Medical Emergency
```

#### Routing Logic:

**💔 Unresponsive / No Pulse:**
- → **Pediatric Cardiac Arrest Protocol** (age-appropriate)

**⚡ Seizure/Convulsion:**
- Ask: "How long has the seizure lasted?"
  - <5 minutes → Status Epilepticus Protocol (early intervention)
  - ≥5 minutes → Status Epilepticus Protocol (escalated dosing)
  - Stopped but not waking up → Post-ictal management

**🫁 Can't Breathe:**
- Ask Level 3 questions → Route to Asthma, Anaphylaxis, Foreign Body, or Respiratory Failure

**🩸 Bleeding / Trauma:**
- → **Pediatric Trauma Protocol** (ABCDE approach, hemorrhage control)

**🤒 Fever / Septic / Shock:**
- Ask: "Is the child in shock?" (cold hands, weak pulse, altered mental status)
  - Yes → Septic Shock Protocol (fluid resuscitation, antibiotics)
  - No → Febrile Illness Assessment

**😵 Severe Allergic Reaction:**
- → **Anaphylaxis Protocol** (epinephrine, airway management)

**🧠 Altered Mental Status:**
- Ask Level 3 questions → Route to Hypoglycemia, Seizure, Trauma, or Toxicology

---

### For 👶 **Neonate (0-28 days)**

```
What are you seeing? (Select one)

💔 Not Breathing at Birth / No Pulse
🫁 Breathing Problems / Grunting / Blue
🤒 Fever / Looks Septic / Not Feeding
😴 Floppy / Lethargic / Won't Wake
⚡ Seizure / Jerking Movements
🟡 Very Yellow (Jaundice)
📊 Other Neonatal Emergency
```

#### Routing Logic:

**💔 Not Breathing at Birth:**
- → **Neonatal Resuscitation Protocol (NRP)** (direct)

**🫁 Breathing Problems:**
- → **Neonatal Respiratory Distress Protocol** (CPAP, surfactant, ventilation)

**🤒 Fever / Septic:**
- → **Neonatal Sepsis Protocol** (antibiotics within 1 hour, blood cultures)

**😴 Floppy / Lethargic:**
- Ask Level 3 questions → Route to Hypoglycemia, Sepsis, or Neurological Emergency

**⚡ Seizure:**
- → **Neonatal Seizure Protocol** (glucose check, anticonvulsants, sepsis workup)

**🟡 Very Yellow:**
- Ask: "Is the baby dehydrated?" (poor feeding, dry mouth, sunken fontanelle)
  - Yes → Hyperbilirubinemia + Hypernatremic Dehydration Protocol
  - No → Hyperbilirubinemia Protocol (phototherapy, exchange transfusion)

---

### For 👤 **Adult (Non-pregnant, >18 years)**

```
What are you seeing? (Select one)

💔 Unresponsive / No Pulse
🫁 Can't Breathe / Respiratory Arrest
🩸 Bleeding / Trauma / Injury
🧠 Stroke Symptoms / Facial Droop / Weakness
⚡ Seizure/Convulsion
🤒 Fever / Looks Septic / Shock
💥 Chest Pain / Heart Attack
📊 Other Medical Emergency
```

#### Routing Logic:

**💔 Unresponsive / No Pulse:**
- → **Adult Cardiac Arrest Protocol (ACLS)** (standard CPR, no pregnancy modifications)

**🫁 Can't Breathe:**
- Ask: "Does the patient have a history of lung disease?"
  - COPD → COPD Exacerbation Protocol (avoid hyperventilation)
  - Asthma → Asthma Emergency Protocol
  - Unknown → Respiratory Failure Protocol

**🩸 Bleeding / Trauma:**
- → **Adult Trauma Protocol** (hemorrhage control, FAST exam)

**🧠 Stroke Symptoms:**
- → **Stroke Protocol** (FAST assessment, time-critical thrombolysis)

**⚡ Seizure:**
- → **Status Epilepticus Protocol** (adult dosing, no pregnancy restrictions)

**🤒 Fever / Septic:**
- → **Septic Shock Protocol** (Surviving Sepsis Campaign guidelines)

**💥 Chest Pain:**
- → **Acute Coronary Syndrome Protocol** (STEMI vs NSTEMI, PCI timing)

---

## Level 3: Clinical Questions (Observable Facts Only)

### For Seizure in Pregnant/Postpartum Mother

```
┌─────────────────────────────────────────────────┐
│  Quick Assessment (check all that apply):       │
├─────────────────────────────────────────────────┤
│  □ Blood pressure is high (>140/90)             │
│  □ Severe headache or vision changes            │
│  □ Swelling in hands, face, or feet             │
│  □ Patient has known epilepsy/seizure disorder  │
│  □ Seizure has stopped                          │
│  □ Not sure / Don't know                        │
│                                                 │
│  [Continue →]                                   │
└─────────────────────────────────────────────────┘
```

**Routing Logic:**
```
IF (high_bp OR headache OR swelling) AND NOT known_epilepsy:
  → Eclampsia Protocol
  
ELSE IF known_epilepsy:
  → Status Epilepticus Protocol (Pregnancy-Safe Mode)
  → Auto-exclude: Valproate, Phenytoin (teratogenic)
  → Suggest: Levetiracetam, Lorazepam, Magnesium
  
ELSE IF "not sure":
  → Eclampsia Protocol (safer default)
  → Show banner: "⚠️ If patient has known epilepsy, tap here to switch"
```

---

### For Can't Breathe in Child

```
┌─────────────────────────────────────────────────┐
│  Quick Assessment (check all that apply):       │
├─────────────────────────────────────────────────┤
│  □ Wheezing sound when breathing                │
│  □ Swelling of face, lips, or tongue            │
│  □ Recent exposure to allergen (food, bee)      │
│  □ Choking episode / something stuck            │
│  □ Fever present                                │
│  □ Known asthma history                         │
│                                                 │
│  [Continue →]                                   │
└─────────────────────────────────────────────────┘
```

**Routing Logic:**
```
IF (swelling OR allergen_exposure):
  → Anaphylaxis Protocol (epinephrine first)
  
ELSE IF choking:
  → Foreign Body Airway Obstruction Protocol (back blows, Heimlich)
  
ELSE IF (wheezing AND known_asthma):
  → Asthma Emergency Protocol (bronchodilators, steroids)
  
ELSE IF fever:
  → Respiratory Infection / Pneumonia Protocol
  
ELSE:
  → General Respiratory Distress Protocol
```

---

### For Floppy/Lethargic Neonate

```
┌─────────────────────────────────────────────────┐
│  Quick Assessment (check all that apply):       │
├─────────────────────────────────────────────────┤
│  □ Baby is cold to touch                        │
│  □ Baby won't feed or is vomiting               │
│  □ Fever present (>38°C / 100.4°F)              │
│  □ Fontanelle (soft spot) is sunken             │
│  □ Seizure or jerking movements                 │
│  □ Breathing is fast or labored                 │
│                                                 │
│  [Continue →]                                   │
└─────────────────────────────────────────────────┘
```

**Routing Logic:**
```
IF (fever OR won't_feed OR fast_breathing):
  → Neonatal Sepsis Protocol (urgent antibiotics)
  
ELSE IF seizure:
  → Neonatal Seizure Protocol
  → Check glucose immediately
  
ELSE IF (cold AND lethargic):
  → Hypoglycemia Protocol
  → Check blood glucose immediately
  
ELSE IF sunken_fontanelle:
  → Dehydration Protocol
  
ELSE:
  → General Neonatal Emergency Assessment
```

---

## Pregnancy-Safe Medication Filtering System

### Automatic Exclusions for Pregnant/Postpartum Patients:

**Anticonvulsants:**
- ❌ Valproate (Category D/X - neural tube defects)
- ❌ Phenytoin (Category D - fetal hydantoin syndrome)
- ✅ Levetiracetam (Category C - safer alternative)
- ✅ Lorazepam (Category D but necessary for status epilepticus)
- ✅ Magnesium sulfate (Category A for eclampsia)

**Antibiotics:**
- ❌ Tetracyclines (Category D - teeth/bone issues)
- ❌ Fluoroquinolones (Category C - cartilage damage)
- ✅ Penicillins (Category B)
- ✅ Cephalosporins (Category B)
- ✅ Azithromycin (Category B)

**Analgesics:**
- ❌ NSAIDs in 3rd trimester (premature ductus arteriosus closure)
- ✅ Acetaminophen (Category B)
- ✅ Morphine (Category C but necessary for severe pain)

### System Behavior:
1. **Auto-filter:** Contraindicated medications never appear in drug list
2. **Warning banner:** If provider manually types contraindicated drug, show: "⚠️ [Drug] is contraindicated in pregnancy. Suggested alternative: [Safe Drug]"
3. **Dosing adjustments:** Automatically adjust doses for pregnancy physiology (increased volume of distribution, renal clearance)

---

## Expert Mode Toggle

For experienced providers who know exactly what they need:

```
┌─────────────────────────────────────────────────┐
│  [Toggle: Guided Mode ⟷ Expert Mode]           │
└─────────────────────────────────────────────────┘

Expert Mode shows:
- Direct protocol list (all 12+ protocols)
- Age/Weight inputs
- Quick Launch button
- No triage questions
```

---

## Persistent Emergency Button

**Always visible at top of screen:**
```
┌─────────────────────────────────────────────────┐
│  🚨 SHOUT FOR HELP                              │
│  Activate crash cart & emergency team           │
└─────────────────────────────────────────────────┘
```

Triggers:
- Audible alarm (if device supports)
- Notification to emergency team (if hospital integration)
- Logs event with timestamp
- Does NOT interrupt current protocol

---

## Protocol Switch Banner

If system routes to wrong protocol, show banner at top:

```
┌─────────────────────────────────────────────────┐
│  ℹ️ Wrong protocol? Tap to switch:              │
│  [Eclampsia] [Status Epilepticus] [Other]      │
└─────────────────────────────────────────────────┘
```

Logs protocol switches for quality improvement.

---

## Testing Scenarios

### Scenario 1: Midwife + Seizing Pregnant Woman (Known Epilepsy)
1. Select: 🤰 Pregnant/Postpartum Mother
2. Select: ⚡ Seizure/Convulsion
3. Check: ☑ Known epilepsy/seizure disorder
4. **Expected:** Status Epilepticus Protocol (Pregnancy-Safe Mode)
5. **Verify:** Valproate not in drug list, Levetiracetam suggested

### Scenario 2: Nursing Student + Seizing Pregnant Woman (Unknown History)
1. Select: 🤰 Pregnant/Postpartum Mother
2. Select: ⚡ Seizure/Convulsion
3. Check: ☑ Not sure / Don't know
4. **Expected:** Eclampsia Protocol (safer default)
5. **Verify:** Banner shows "If known epilepsy, tap here"

### Scenario 3: Midwife + Adult Trauma Patient (72yo COPD)
1. Select: 👤 Adult (Non-pregnant)
2. Enter age: 72 years
3. Select: 🫁 Can't Breathe / Respiratory Arrest
4. Check: ☑ History of lung disease (COPD)
5. **Expected:** COPD Exacerbation / Respiratory Arrest Protocol
6. **Verify:** Warning about avoiding hyperventilation

### Scenario 4: Nurse + Neonate with Jaundice + Dehydration
1. Select: 👶 Neonate
2. Select: 🟡 Very Yellow (Jaundice)
3. Check: ☑ Baby won't feed, ☑ Fontanelle is sunken
4. **Expected:** Hyperbilirubinemia + Hypernatremic Dehydration Protocol
5. **Verify:** Careful fluid resuscitation guidance (avoid rapid sodium correction)

### Scenario 5: Pediatric Nurse + Child with Wheezing + Allergen Exposure
1. Select: 🧒 Child
2. Select: 🫁 Can't Breathe
3. Check: ☑ Swelling of face/lips, ☑ Recent allergen exposure
4. **Expected:** Anaphylaxis Protocol (epinephrine first)
5. **Verify:** Epinephrine auto-injector dose by weight, not asthma protocol

### Scenario 6: Midwife + Postpartum Hemorrhage
1. Select: 🤰 Pregnant/Postpartum Mother
2. Select: 🩸 Heavy Bleeding
3. **Expected:** Postpartum Hemorrhage Protocol (direct, no questions)
4. **Verify:** Active management of third stage, uterotonic drugs

### Scenario 7: Medical Student + DKA in Pregnant Woman
1. Select: 🤰 Pregnant/Postpartum Mother
2. Select: 📊 Other Medical Emergency
3. Select from list: Diabetic Ketoacidosis (DKA)
4. **Expected:** DKA Protocol (Pregnancy-Modified)
5. **Verify:** Lower bicarbonate threshold for treatment, fetal monitoring

### Scenario 8: Nurse + Neonatal Sepsis
1. Select: 👶 Neonate
2. Select: 🤒 Fever / Looks Septic
3. Check: ☑ Fever, ☑ Won't feed
4. **Expected:** Neonatal Sepsis Protocol
5. **Verify:** Antibiotics within 1 hour, blood cultures before antibiotics

### Scenario 9: Paramedic + Adult Cardiac Arrest
1. Select: 👤 Adult
2. Select: 💔 Unresponsive / No Pulse
3. **Expected:** Adult Cardiac Arrest Protocol (ACLS)
4. **Verify:** Standard CPR, no pregnancy modifications

### Scenario 10: Pediatric Resident + Status Epilepticus (Child)
1. Select: 🧒 Child
2. Select: ⚡ Seizure/Convulsion
3. Check: Seizure lasting >5 minutes
4. **Expected:** Status Epilepticus Protocol (Pediatric)
5. **Verify:** Escalating benzodiazepine doses, second-line agents

---

## Implementation Priority

1. **Phase 1:** Build patient type selector + symptom selectors
2. **Phase 2:** Implement Level 3 clinical questions (checkboxes)
3. **Phase 3:** Build routing logic + pregnancy-safe filtering
4. **Phase 4:** Add Expert Mode toggle + protocol switch banner
5. **Phase 5:** Test all 10 scenarios
6. **Phase 6:** Integrate with existing protocols (no protocol changes needed, just routing)

---

## Success Criteria

✅ First-day nursing student can navigate to correct protocol without diagnostic knowledge
✅ Zero questions require differential diagnosis
✅ Pregnancy-safe filtering automatic and invisible
✅ Expert providers can bypass triage (Expert Mode)
✅ Protocol switches logged for quality improvement
✅ Emergency button always accessible
✅ Mobile-optimized (large touch targets, readable fonts)
✅ <3 taps from home page to protocol launch
