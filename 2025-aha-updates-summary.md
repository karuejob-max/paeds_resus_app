# 2025 AHA ECC CPR Guidelines — Platform Update Summary

**Date Applied:** May 2, 2026  
**Commit:** `16d7d4c`  
**Courses Updated:** BLS (ID 1), ACLS (ID 2), PALS (ID 3), Heartsaver (ID 30)

---

## Summary of Changes

### BLS — Basic Life Support

| Change | Previous (2020) | Updated (2025) | Clinical Impact |
|--------|----------------|----------------|-----------------|
| Infant compression technique | 2-finger technique OR 2 thumb-encircling | 2-finger technique **ELIMINATED**; 2 thumb-encircling preferred; heel of 1 hand if chest cannot be encircled | Ensures adequate compression depth in infants |
| Infant compression depth | At least 4 cm | At least 4 cm (~1/3 AP chest diameter) | AP diameter reference added for clarity |
| Infant FBAO | Back blows + chest thrusts | Back blows + chest thrusts (explicitly NOT abdominal thrusts) | Prevents abdominal organ injury in infants |
| AED in children | Use paediatric pads; adult pads if unavailable | Use paediatric attenuator if available; adult pads if not — **do not delay** | Prevents defibrillation delay |
| Lone rescuer — child arrest | Ambiguous | Unwitnessed: 2 min CPR first, then call EMS | Prioritises early CPR for asphyxial arrest |

**Sections updated:** 541 (Infant CPR Under 1 Year)  
**Questions updated:** Q1494, Q1495, Q1500, Q1483, Q1485

---

### Heartsaver — Community CPR

| Change | Previous (2020) | Updated (2025) | Clinical Impact |
|--------|----------------|----------------|-----------------|
| Infant compression technique | 2-finger technique included | 2-finger technique eliminated | Consistent with BLS update |
| AED in children | Paediatric pads preferred | Adult pads acceptable if paediatric unavailable — no delay | Prevents defibrillation delay |
| Infant FBAO | Back blows + chest thrusts | Explicitly NOT abdominal thrusts for infants | Prevents abdominal organ injury |

**Sections updated:** 611 (Paediatric CPR Overview)  
**Questions updated:** Q1486, Q1483, Q1485

---

### ACLS — Advanced Cardiovascular Life Support

| Change | Previous (2020) | Updated (2025) | Clinical Impact |
|--------|----------------|----------------|-----------------|
| Post-arrest TTM | 32–36°C for 24h | **32–37.5°C for ≥24h; prevent fever >37.5°C for 72h** | Broader range; fever prevention is now mandatory for 72h |
| Post-ROSC BP target | Avoid hypotension | **MAP ≥65 mmHg adults; MAP ≥50th percentile children** | Explicit targets reduce post-arrest brain injury |
| Polymorphic VT | Synchronised or unsynchronised | **Always unsynchronised defibrillation** | Prevents dangerous synchronisation failure |
| AF/flutter cardioversion | 120–200 J biphasic | **≥200 J biphasic first shock** | Higher energy improves first-shock success |
| ETCO₂ and TOR | Low ETCO₂ supports TOR | **ETCO₂ must NOT be used in isolation for TOR** | Prevents premature termination of resuscitation |
| DSD (Double Sequential Defibrillation) | Emerging practice | **Not recommended as routine** | Prevents unproven technique adoption |
| Head-up CPR | Emerging practice | **Discouraged outside clinical trials** | Prevents unproven technique adoption |

**Sections updated:** 555 (VF/pVT Overview), 572 (Post-Cardiac Arrest Care — TTM)  
**Section restored:** 571 (Acute Stroke — was overwritten, now restored)  
**Questions updated:** Q1534, Q1542, Q1438, Q1437, Q1436

---

### PALS — Paediatric Advanced Life Support

| Change | Previous (2020) | Updated (2025) | Clinical Impact |
|--------|----------------|----------------|-----------------|
| Infant compression technique | 2-finger technique included | **2-finger technique eliminated; 2 thumb-encircling preferred** | Ensures adequate compression depth |
| Ventilation rate (advanced airway) | 8–10/min (adult rate used) | **20–30 breaths/min for infants and children** | Reflects asphyxial nature of paediatric arrest |
| Cuffed ETT | Uncuffed preferred in young children | **Cuffed ETTs recommended for all ages including neonates** | Reduces tube changes; improves ventilation control |
| Septic shock fluid bolus | 20 mL/kg isotonic crystalloid | **10 mL/kg isotonic crystalloid; reassess after each bolus** | FEAST trial evidence; prevents fluid overload mortality |
| Post-arrest TTM | 32–36°C | **32–37.5°C for ≥24h; prevent fever >37.5°C for 72h** | Consistent with ACLS update |
| Post-ROSC BP | Avoid hypotension | **MAP ≥50th percentile for age** | Explicit paediatric target |

**Sections updated:** 579 (Respiratory Failure Overview — ventilation rates), 583 (Shock Overview — fluid resuscitation)  
**Questions updated:** Q1537, Q1523, Q1530, Q1534

---

## Validation

| Check | Status |
|-------|--------|
| BLS update script ran | ✅ All 10 updates confirmed |
| ACLS/PALS update script ran | ✅ All 13 updates confirmed |
| Section fix script ran | ✅ Stroke section 571 restored; post-arrest section 572 updated; PALS airway section 579 updated |
| `npm run build` | ✅ Zero errors; 6.73s |
| Git commit | ✅ `16d7d4c` pushed to `main` |
| Render auto-deploy | ⏳ Triggered — check Render dashboard |

---

## Risks

1. **Section 579 (PALS Respiratory Overview)** was updated with ventilation content but this section is titled "Overview: Respiratory Failure in Children" — the ventilation rate update is clinically appropriate here but the section may need a title update to reflect the 2025 ventilation guidance more prominently.

2. **PALS Module 4 (Cardiac Arrest algorithms)** — the cuffed ETT recommendation is mentioned in the ventilation section but the cardiac arrest algorithm sections have not been individually reviewed for 2025 alignment. A follow-up audit of sections 584–590 is recommended.

3. **ACLS Module 4 (Bradycardia/Tachycardia)** — the AF cardioversion energy update was applied to Q1437 but the corresponding module section text has not been verified to contain the ≥200 J biphasic recommendation. Manual review recommended.

4. **Live environment testing** — end-to-end BLS and PALS course journeys have not been tested on the live Render environment since these updates. Recommend testing: enrol → all modules → final assessment → certificate download.

---

## Next Best Step

**Run end-to-end test on the live Render environment:**
1. Open BLS course → complete all modules → pass final assessment → download cognitive certificate
2. Open PALS course → verify septic shock section shows 10 mL/kg bolus
3. Open ACLS course → verify post-arrest section shows 32–37.5°C TTM range
4. Verify dark/light mode on course player

**Then:** Review ACLS Module 4 section text for AF cardioversion energy and PALS Module 4 sections for cuffed ETT guidance.
