/**
 * AHA Final Assessment Seed
 * Adds a comprehensive final knowledge check module for each AHA course.
 * BLS: 15 questions | ACLS: 20 questions | PALS: 20 questions | Heartsaver: 15 questions
 * Aligned with AHA 2020 Guidelines
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const finalAssessments: Record<number, { title: string; questions: any[] }> = {
  // BLS — Course ID 1
  1: {
    title: "BLS Final Knowledge Check",
    questions: [
      { q: "What is the correct compression rate for adult CPR?", opts: ["60–80/min","80–100/min","100–120/min","120–140/min"], ans: "100–120/min", exp: "AHA 2020 guidelines specify a compression rate of 100–120 per minute for adult CPR. Rates below 100 are insufficient; rates above 120 reduce compression depth." },
      { q: "What is the correct compression depth for adult CPR?", opts: ["2–3 cm","At least 5 cm, no more than 6 cm","7–8 cm","1/3 of AP diameter"], ans: "At least 5 cm, no more than 6 cm", exp: "Adult compression depth: at least 5 cm (2 inches), no more than 6 cm (2.4 inches). Insufficient depth fails to generate adequate blood flow." },
      { q: "What is the compression-to-ventilation ratio for 2-rescuer child CPR?", opts: ["30:2","15:2","5:1","3:1"], ans: "15:2", exp: "Two-rescuer child CPR uses a 15:2 ratio. This provides more frequent ventilation than adult CPR (30:2), reflecting the respiratory aetiology of most paediatric arrests." },
      { q: "What is the first step when you find an unresponsive adult?", opts: ["Begin chest compressions","Check for a pulse","Tap shoulders and shout; check for response","Call emergency services"], ans: "Tap shoulders and shout; check for response", exp: "The first step is to check for response: tap the shoulders firmly and shout 'Are you OK?' If no response and no normal breathing, call for help and begin CPR." },
      { q: "When should you use an AED?", opts: ["Only after 5 minutes of CPR","As soon as it is available","Only for adults","Only if the person has no pulse and you have confirmed this with a 10-second check"], ans: "As soon as it is available", exp: "Use an AED as soon as it is available. Every minute without defibrillation reduces survival by 7–10% in VF. Do not delay AED use to complete CPR cycles." },
      { q: "What does full chest recoil mean in CPR?", opts: ["Pushing hard enough to feel the chest move","Allowing the chest to return to its normal position between compressions","Giving compressions at a rate that allows the chest to fully deflate","Alternating compression depth between cycles"], ans: "Allowing the chest to return to its normal position between compressions", exp: "Full chest recoil means allowing the chest to fully return to its natural position between compressions without leaning on it. Incomplete recoil increases intrathoracic pressure and reduces venous return, decreasing cardiac output." },
      { q: "What is the correct infant CPR technique for a single rescuer?", opts: ["Two-thumb encircling technique","Heel of one hand","Two fingers on the lower half of the sternum","Three fingers on the centre of the chest"], ans: "Two fingers on the lower half of the sternum", exp: "Single-rescuer infant CPR: two-finger technique — place 2 fingers on the lower half of the sternum (just below the nipple line). The two-thumb encircling technique is preferred with 2 rescuers." },
      { q: "What is the compression depth for infant CPR?", opts: ["2–3 cm","At least 4 cm (or 1/3 AP diameter)","At least 5 cm","6–7 cm"], ans: "At least 4 cm (or 1/3 AP diameter)", exp: "Infant compression depth: at least 4 cm (approximately 1.5 inches) or 1/3 of the AP chest diameter. This differs from child CPR (at least 5 cm) due to the smaller chest size." },
      { q: "A child collapses in front of you and you are alone. What should you do first?", opts: ["Call emergency services first","Do 2 minutes of CPR, then call","Begin CPR and do not call","Place in recovery position"], ans: "Do 2 minutes of CPR, then call", exp: "For a witnessed child collapse when alone: do 2 minutes of CPR first, then call emergency services. Paediatric arrest is usually respiratory — 2 minutes of CPR (with ventilation) may reverse the arrest. This differs from adult arrest where you call first." },
      { q: "What is agonal breathing?", opts: ["Normal breathing in a sleeping person","Rapid, shallow breathing in respiratory distress","Gasping or irregular breathing that is a sign of cardiac arrest","Deep, slow breathing indicating adequate oxygenation"], ans: "Gasping or irregular breathing that is a sign of cardiac arrest", exp: "Agonal breathing (gasping, snoring, or irregular breathing) is a sign of cardiac arrest — NOT normal breathing. Do not mistake it for normal breathing and delay CPR." },
      { q: "How often should rescuers rotate compressions during team CPR?", opts: ["Every 5 minutes","Every 2 minutes","Every 10 compressions","Only when exhausted"], ans: "Every 2 minutes", exp: "Compression quality deteriorates significantly after 1–2 minutes. Rotate every 2 minutes (every 5 cycles of 30:2) with a switch time of less than 5 seconds." },
      { q: "What is the correct action after delivering an AED shock?", opts: ["Check for a pulse","Resume CPR immediately","Wait for the AED to re-analyse","Check if the person is breathing"], ans: "Resume CPR immediately", exp: "After delivering an AED shock, resume CPR immediately — do not wait to check for a pulse. The AED will re-analyse after 2 minutes of CPR." },
      { q: "For a choking infant with severe obstruction, what is the correct intervention?", opts: ["5 back blows + 5 abdominal thrusts","5 back blows + 5 chest thrusts","Blind finger sweep","Begin CPR immediately"], ans: "5 back blows + 5 chest thrusts", exp: "Choking infant: 5 back blows + 5 chest thrusts (NOT abdominal thrusts). Abdominal thrusts are not used in infants under 1 year because the liver is large and unprotected." },
      { q: "What is the minimum chest compression fraction (CCF) target during CPR?", opts: ["40%","50%","60%","80%"], ans: "60%", exp: "Chest compression fraction (CCF) — the proportion of time spent doing compressions — should be at least 60%. Every interruption reduces coronary perfusion pressure." },
      { q: "When is the recovery position used?", opts: ["For anyone who is unresponsive","For an unresponsive person who is breathing normally","For anyone who has had a cardiac arrest","For anyone who is confused"], ans: "For an unresponsive person who is breathing normally", exp: "The recovery position is for unresponsive people who are breathing normally. It keeps the airway open and prevents aspiration. If not breathing normally, begin CPR." }
    ]
  },
  // ACLS — Course ID 2
  2: {
    title: "ACLS Final Knowledge Check",
    questions: [
      { q: "What is the first-line treatment for ventricular fibrillation?", opts: ["Adrenaline 1 mg IV","Amiodarone 300 mg IV","Defibrillation 200 J (biphasic)","CPR for 2 minutes before any intervention"], ans: "Defibrillation 200 J (biphasic)", exp: "VF is a shockable rhythm. Defibrillation is the definitive treatment. The initial biphasic shock is 200 J. CPR should be resumed immediately after the shock." },
      { q: "What is the dose of adrenaline in adult cardiac arrest?", opts: ["0.1 mg IV every cycle","1 mg IV every 3–5 minutes","2 mg IV every 5 minutes","0.5 mg IM"], ans: "1 mg IV every 3–5 minutes", exp: "Adult adrenaline dose in cardiac arrest: 1 mg IV/IO every 3–5 minutes. In VF/pVT, give after the 3rd shock. In PEA/asystole, give as soon as IV/IO access is established." },
      { q: "What is the dose of amiodarone for refractory VF/pVT?", opts: ["150 mg IV","300 mg IV/IO","5 mg/kg IV","500 mg IV"], ans: "300 mg IV/IO", exp: "Adult amiodarone dose for refractory VF/pVT: 300 mg IV/IO after the 3rd shock. A second dose of 150 mg can be given after the 5th shock." },
      { q: "What are the H's and T's of reversible causes of cardiac arrest?", opts: ["Hypoxia, Hypovolaemia, Hydrogen ion, Hypo/Hyperkalaemia, Hypothermia; Tension pneumothorax, Tamponade, Toxins, Thrombosis (PE), Thrombosis (coronary)","Hypertension, Hyperglycaemia, Hypothyroidism; Trauma, Tachycardia, Toxins","Hypoxia, Hypernatraemia, Hypothermia; Tension pneumothorax, Tachycardia, Trauma","Hypoxia, Hypoglycaemia, Hyponatraemia; Thrombosis, Trauma, Toxins"], ans: "Hypoxia, Hypovolaemia, Hydrogen ion, Hypo/Hyperkalaemia, Hypothermia; Tension pneumothorax, Tamponade, Toxins, Thrombosis (PE), Thrombosis (coronary)", exp: "The H's and T's are the 10 reversible causes of cardiac arrest. Identifying and treating these is critical, especially in PEA where there is no shockable rhythm." },
      { q: "What is the treatment for symptomatic bradycardia with haemodynamic compromise?", opts: ["Amiodarone 300 mg IV","Atropine 0.5 mg IV (first-line)","Adenosine 6 mg rapid IV push","Synchronised cardioversion"], ans: "Atropine 0.5 mg IV (first-line)", exp: "Symptomatic bradycardia: atropine 0.5 mg IV is first-line. Can repeat to a maximum of 3 mg. If atropine ineffective: transcutaneous pacing, dopamine infusion, or adrenaline infusion." },
      { q: "What is the treatment for stable narrow-complex tachycardia (SVT)?", opts: ["Synchronised cardioversion 100 J","Adenosine 6 mg rapid IV push","Amiodarone 150 mg IV over 10 min","Atropine 0.5 mg IV"], ans: "Adenosine 6 mg rapid IV push", exp: "Stable SVT: vagal manoeuvres first, then adenosine 6 mg rapid IV push (followed immediately by 20 mL saline flush). If ineffective: 12 mg adenosine. If still ineffective: synchronised cardioversion or rate-control medications." },
      { q: "What is the correct energy for synchronised cardioversion of unstable SVT?", opts: ["50–100 J (biphasic)","200 J (biphasic)","360 J (monophasic)","2 J/kg"], ans: "50–100 J (biphasic)", exp: "Synchronised cardioversion for unstable SVT: 50–100 J (biphasic). For unstable VT with a pulse: 100 J (biphasic). For AF: 120–200 J (biphasic). Always synchronise to avoid delivering the shock on the T-wave (which can cause VF)." },
      { q: "What is the target SpO₂ during post-cardiac arrest care?", opts: ["88–92%","94–99%","100%","Any level above 90%"], ans: "94–99%", exp: "Post-cardiac arrest SpO₂ target: 94–99%. Avoid hyperoxia (SpO₂ 100%) — hyperoxia causes oxidative stress and worsens neurological outcomes. Also avoid hypoxia (SpO₂ <94%)." },
      { q: "What is the target PaCO₂ during post-cardiac arrest ventilation?", opts: ["25–30 mmHg","35–45 mmHg","50–60 mmHg","Any level that maintains normal SpO₂"], ans: "35–45 mmHg", exp: "Post-cardiac arrest PaCO₂ target: 35–45 mmHg (normocapnia). Hypocapnia (PaCO₂ <35 mmHg) causes cerebral vasoconstriction and worsens neurological outcomes. Hypercapnia (>45 mmHg) increases intracranial pressure." },
      { q: "What is the STEMI management priority in the first 90 minutes?", opts: ["Thrombolysis within 90 minutes","Primary PCI within 90 minutes of first medical contact","Aspirin and heparin only","Coronary angiography within 24 hours"], ans: "Primary PCI within 90 minutes of first medical contact", exp: "STEMI: primary PCI within 90 minutes of first medical contact (door-to-balloon time). If primary PCI is not available within 120 minutes, fibrinolysis should be given within 30 minutes of presentation (door-to-needle time)." },
      { q: "What is the Cincinnati Prehospital Stroke Scale?", opts: ["GCS + pupil assessment + blood glucose","Facial droop, arm drift, speech abnormality","FAST: Face, Arms, Speech, Time","Headache, arm weakness, speech difficulty, vision changes"], ans: "Facial droop, arm drift, speech abnormality", exp: "The Cincinnati Prehospital Stroke Scale assesses 3 findings: facial droop (ask to smile), arm drift (hold arms out with eyes closed for 10 seconds), and speech abnormality (repeat a simple phrase). Any one finding positive = 72% probability of stroke." },
      { q: "What is the target temperature for TTM (targeted temperature management) after cardiac arrest?", opts: ["32–34°C or 36–37.5°C (strict normothermia)","38–39°C","30–32°C","35–36°C only"], ans: "32–34°C or 36–37.5°C (strict normothermia)", exp: "AHA 2020: TTM at 32–34°C or strict normothermia (36–37.5°C) for comatose survivors of cardiac arrest. The key evidence is that fever (>38°C) worsens neurological outcomes and must be prevented in all comatose post-arrest patients." },
      { q: "What is the treatment for pulseless electrical activity (PEA)?", opts: ["Defibrillation 200 J","CPR + adrenaline 1 mg IV every 3–5 min + identify and treat reversible causes","CPR + amiodarone 300 mg IV","Atropine 1 mg IV + CPR"], ans: "CPR + adrenaline 1 mg IV every 3–5 min + identify and treat reversible causes", exp: "PEA management: high-quality CPR + adrenaline 1 mg IV every 3–5 minutes + identify and treat reversible causes (H's and T's). PEA is not shockable — defibrillation has no role. The most critical step is identifying and treating the underlying cause." },
      { q: "What is the first-line vasopressor for septic shock in adults?", opts: ["Dopamine","Adrenaline","Noradrenaline","Vasopressin"], ans: "Noradrenaline", exp: "Noradrenaline (norepinephrine) is the first-line vasopressor for septic shock in adults (Surviving Sepsis Campaign 2021). It provides vasoconstriction with less tachycardia than dopamine. Vasopressin can be added as a second agent." },
      { q: "What is the correct approach to a wide-complex tachycardia of unknown type?", opts: ["Treat as SVT with aberrancy — give adenosine","Treat as VT — synchronised cardioversion if unstable; amiodarone if stable","Give atropine 0.5 mg IV","Observe and monitor only"], ans: "Treat as VT — synchronised cardioversion if unstable; amiodarone if stable", exp: "Wide-complex tachycardia of unknown type should be treated as VT until proven otherwise. VT is more common and more dangerous than SVT with aberrancy. If unstable: synchronised cardioversion. If stable: amiodarone 150 mg IV over 10 min." },
      { q: "What is the correct waveform capnography target during CPR to indicate effective compressions?", opts: ["ETCO₂ >5 mmHg","ETCO₂ >10 mmHg","ETCO₂ >20 mmHg","ETCO₂ >35 mmHg"], ans: "ETCO₂ >10 mmHg", exp: "During CPR, ETCO₂ >10 mmHg indicates effective compressions generating adequate cardiac output. ETCO₂ <10 mmHg suggests poor CPR quality. A sudden increase in ETCO₂ to >35–40 mmHg is a reliable indicator of ROSC." },
      { q: "What is the maximum total dose of atropine for symptomatic bradycardia?", opts: ["1 mg","2 mg","3 mg","5 mg"], ans: "3 mg", exp: "Maximum atropine dose for symptomatic bradycardia: 3 mg (6 doses of 0.5 mg). Doses above 3 mg provide no additional benefit and may cause adverse effects." },
      { q: "What is the correct management of torsades de pointes with a pulse?", opts: ["Amiodarone 300 mg IV","Synchronised cardioversion 200 J","Magnesium sulphate 1–2 g IV over 5–20 min","Adenosine 6 mg rapid IV push"], ans: "Magnesium sulphate 1–2 g IV over 5–20 min", exp: "Torsades de Pointes with a pulse: magnesium sulphate 1–2 g IV over 5–20 minutes. Amiodarone prolongs the QT interval and can worsen TdP. Correct electrolytes (K⁺ >4.0, Mg²⁺ >1.0). Pulseless TdP: defibrillation (unsynchronised)." },
      { q: "What is the correct dose of adenosine for the second attempt at SVT termination?", opts: ["6 mg","9 mg","12 mg","18 mg"], ans: "12 mg", exp: "Adenosine dosing for SVT: first dose 6 mg rapid IV push. If ineffective after 1–2 minutes: 12 mg rapid IV push. A third dose of 12 mg can be given if needed. Maximum single dose: 12 mg." },
      { q: "What is the correct post-ROSC blood glucose target?", opts: ["4–6 mmol/L","4–10 mmol/L","10–14 mmol/L","Any level that avoids hypoglycaemia"], ans: "4–10 mmol/L", exp: "Post-ROSC blood glucose target: 4–10 mmol/L. Both hypoglycaemia (<4 mmol/L) and hyperglycaemia (>10 mmol/L) worsen neurological outcomes. Strict glycaemic control (4–6 mmol/L) is not recommended due to hypoglycaemia risk." }
    ]
  },
  // PALS — Course ID 3
  3: {
    title: "PALS Final Knowledge Check",
    questions: [
      { q: "What is the most common cause of cardiac arrest in children?", opts: ["Primary cardiac arrhythmia","Respiratory failure leading to secondary cardiac arrest","Hypovolaemic shock","Electrolyte abnormalities"], ans: "Respiratory failure leading to secondary cardiac arrest", exp: "Unlike adults (where primary cardiac causes predominate), paediatric cardiac arrest is most commonly caused by respiratory failure. This is why ventilation is emphasised in paediatric BLS and PALS." },
      { q: "Using the APLS formula, what is the estimated weight of an 8-year-old child?", opts: ["16 kg","20 kg","24 kg","28 kg"], ans: "24 kg", exp: "APLS formula: Weight (kg) = (Age + 4) × 2. For an 8-year-old: (8 + 4) × 2 = 24 kg. Valid for children aged 1–10 years." },
      { q: "What is the initial defibrillation energy for a 15 kg child in VF?", opts: ["15 J","30 J","60 J","100 J"], ans: "30 J", exp: "Initial paediatric defibrillation energy: 2 J/kg. For a 15 kg child: 2 × 15 = 30 J. Subsequent shocks: 4 J/kg (60 J), then ≥4 J/kg (maximum 10 J/kg or adult dose, whichever is lower)." },
      { q: "A 10 kg child is in cardiac arrest. What is the correct adrenaline dose?", opts: ["0.1 mg IV/IO","0.5 mg IV/IO","1 mg IV/IO","0.01 mg IV/IO"], ans: "0.1 mg IV/IO", exp: "Paediatric adrenaline dose in cardiac arrest: 0.01 mg/kg IV/IO. For a 10 kg child: 0.01 × 10 = 0.1 mg (= 1 mL of 1:10,000 adrenaline). Maximum dose: 1 mg." },
      { q: "What is the Paediatric Assessment Triangle (PAT)?", opts: ["A scoring system for paediatric trauma","A 30-second visual assessment tool assessing Appearance, Work of Breathing, and Circulation to Skin","A tool for estimating paediatric weight","A scoring system for paediatric sepsis"], ans: "A 30-second visual assessment tool assessing Appearance, Work of Breathing, and Circulation to Skin", exp: "The PAT is the initial impression tool — a 30-second visual assessment before touching the child. It assesses: Appearance (TICLS), Work of Breathing, and Circulation to Skin. It identifies the general category of illness and guides urgency." },
      { q: "What is the minimum atropine dose in children?", opts: ["0.01 mg","0.05 mg","0.1 mg","0.5 mg"], ans: "0.1 mg", exp: "Minimum atropine dose in children: 0.1 mg. Doses below 0.1 mg can paradoxically cause bradycardia. The weight-based dose is 0.02 mg/kg, but the minimum is always 0.1 mg regardless of weight." },
      { q: "What is the first-line treatment for SVT in a haemodynamically stable child?", opts: ["Synchronised cardioversion","Vagal manoeuvres, then adenosine 0.1 mg/kg rapid IV push","Amiodarone 5 mg/kg IV","Atropine 0.02 mg/kg IV"], ans: "Vagal manoeuvres, then adenosine 0.1 mg/kg rapid IV push", exp: "Stable SVT in children: vagal manoeuvres first (ice to face in infants; Valsalva in older children), then adenosine 0.1 mg/kg rapid IV push (max 6 mg). Second dose: 0.2 mg/kg (max 12 mg). Unstable SVT: synchronised cardioversion 0.5–1 J/kg." },
      { q: "What is the Hour-1 Bundle for paediatric septic shock?", opts: ["Antibiotics, fluids, vasopressors, intubation","Lactate measurement, blood cultures, antibiotics, fluid resuscitation, vasopressors if fluid-refractory","Blood cultures, antibiotics, steroids, vasopressors","Fluids, antibiotics, intubation, steroids"], ans: "Lactate measurement, blood cultures, antibiotics, fluid resuscitation, vasopressors if fluid-refractory", exp: "Paediatric septic shock Hour-1 Bundle: (1) measure lactate, (2) blood cultures before antibiotics, (3) broad-spectrum antibiotics within 1 hour, (4) 10–20 mL/kg crystalloid boluses, (5) vasopressors if fluid-refractory (noradrenaline first-line)." },
      { q: "What is the correct ETT size for a 6-year-old child using a cuffed tube?", opts: ["4.0 mm","4.5 mm","5.0 mm","5.5 mm"], ans: "5.0 mm", exp: "Cuffed ETT formula: (Age/4) + 3.5. For a 6-year-old: (6/4) + 3.5 = 1.5 + 3.5 = 5.0 mm. Always have one size up and one size down available." },
      { q: "What is the neonatal CPR compression-to-ventilation ratio?", opts: ["30:2","15:2","5:1","3:1"], ans: "3:1", exp: "Neonatal CPR: 3:1 ratio (3 compressions : 1 breath) = 90 compressions + 30 breaths per minute. This differs from paediatric BLS because neonatal arrest is almost always respiratory — adequate ventilation is the priority." },
      { q: "A child has a heart rate of 40 bpm with altered consciousness. What is the first step?", opts: ["Atropine 0.02 mg/kg IV","Adrenaline 0.01 mg/kg IV","Open the airway and give oxygen","Transcutaneous pacing"], ans: "Open the airway and give oxygen", exp: "In children, bradycardia is most commonly caused by hypoxia. The first step is always to treat hypoxia — open the airway and give oxygen. Atropine given to a hypoxic child may cause VF." },
      { q: "What is the post-cardiac arrest temperature target for comatose paediatric survivors?", opts: ["32–34°C or 36–37.5°C (strict normothermia)","38–39°C","30–32°C","35–36°C only"], ans: "32–34°C or 36–37.5°C (strict normothermia)", exp: "AHA 2020 PALS: TTM at 32–34°C or strict normothermia (36–37.5°C) for comatose paediatric cardiac arrest survivors. The THAPCA trial showed no difference between 33°C and 36.8°C, but both groups had strict fever prevention. Prevent fever (>38°C) in all comatose post-arrest children." },
      { q: "What is the FEAST trial finding regarding fluid resuscitation in African children with severe febrile illness?", opts: ["Aggressive fluid resuscitation (20 mL/kg boluses) improved survival","Aggressive fluid resuscitation increased mortality","No difference between aggressive and conservative fluid resuscitation","Colloids were superior to crystalloids"], ans: "Aggressive fluid resuscitation increased mortality", exp: "The FEAST trial (Kenya/Uganda/Tanzania) found that aggressive fluid resuscitation (20–40 mL/kg boluses) increased 48-hour mortality in African children with severe febrile illness. This led to the recommendation for cautious fluid resuscitation (10 mL/kg boluses with reassessment) in resource-limited settings." },
      { q: "What is the correct management of anaphylaxis in a 20 kg child?", opts: ["IV chlorphenamine 0.2 mg/kg first-line","IM adrenaline 0.01 mg/kg of 1:1,000 into anterolateral thigh (0.2 mg)","IV hydrocortisone 4 mg/kg first-line","Nebulised salbutamol first-line"], ans: "IM adrenaline 0.01 mg/kg of 1:1,000 into anterolateral thigh (0.2 mg)", exp: "Anaphylaxis first-line: IM adrenaline 0.01 mg/kg of 1:1,000 into the anterolateral thigh (max 0.5 mg). For a 20 kg child: 0.01 × 20 = 0.2 mg. Antihistamines and corticosteroids are adjuncts — not first-line." },
      { q: "What is the correct compression depth for child CPR (1–8 years)?", opts: ["2–3 cm","At least 4 cm","At least 5 cm (or 1/3 AP diameter)","6–7 cm"], ans: "At least 5 cm (or 1/3 AP diameter)", exp: "Child CPR compression depth: at least 5 cm (approximately 2 inches) or 1/3 of the AP chest diameter. This is the same as adult CPR depth. Infant CPR depth is at least 4 cm." },
      { q: "What is the most common initial rhythm in paediatric out-of-hospital cardiac arrest?", opts: ["Ventricular fibrillation","Pulseless ventricular tachycardia","PEA/Asystole","Complete heart block"], ans: "PEA/Asystole", exp: "PEA and asystole account for approximately 85% of initial rhythms in paediatric cardiac arrest, reflecting the respiratory aetiology. Shockable rhythms (VF/pVT) account for only ~15%." },
      { q: "What is the correct management of tension pneumothorax in a child?", opts: ["Chest X-ray to confirm before treatment","Needle decompression at 2nd ICS MCL on the affected side","IV fluid bolus 20 mL/kg","Intubation and mechanical ventilation"], ans: "Needle decompression at 2nd ICS MCL on the affected side", exp: "Tension pneumothorax is a life-threatening emergency requiring immediate needle decompression — do not wait for a chest X-ray. Insert a large-bore needle at the 2nd intercostal space, midclavicular line on the affected side." },
      { q: "What is the PALS CPR ratio for a 2-rescuer scenario?", opts: ["30:2","15:2","5:1","3:1"], ans: "15:2", exp: "PALS 2-rescuer CPR: 15:2 ratio. This provides more frequent ventilation than adult CPR (30:2), reflecting the respiratory aetiology of most paediatric arrests. Single-rescuer paediatric CPR uses 30:2." },
      { q: "What is the correct dose of amiodarone for refractory VF/pVT in a 20 kg child?", opts: ["100 mg IV/IO","150 mg IV/IO","300 mg IV/IO","5 mg/kg (100 mg) IV/IO"], ans: "5 mg/kg (100 mg) IV/IO", exp: "Paediatric amiodarone dose for refractory VF/pVT: 5 mg/kg IV/IO (max 300 mg). For a 20 kg child: 5 × 20 = 100 mg. A second dose of 2.5 mg/kg can be given after the 5th shock." },
      { q: "What is the correct post-ROSC blood pressure target in children?", opts: ["Systolic BP >60 mmHg","Age-appropriate BP; MAP ≥5th percentile for age","Systolic BP >100 mmHg","Mean arterial pressure >65 mmHg"], ans: "Age-appropriate BP; MAP ≥5th percentile for age", exp: "Post-ROSC blood pressure target in children: age-appropriate BP with MAP ≥5th percentile for age. Normal BP varies significantly by age in children — use age-specific reference ranges." }
    ]
  },
  // Heartsaver — Course ID 30
  30: {
    title: "Heartsaver Final Knowledge Check",
    questions: [
      { q: "What is the Chain of Survival?", opts: ["A sequence of actions that maximises survival from cardiac arrest","A protocol for hospital-based resuscitation only","A checklist for AED maintenance","A scoring system for cardiac arrest severity"], ans: "A sequence of actions that maximises survival from cardiac arrest", exp: "The Chain of Survival describes the sequence of actions that maximise survival from cardiac arrest: (1) Recognition and activation, (2) Early CPR, (3) Rapid defibrillation, (4) Advanced resuscitation, (5) Post-cardiac arrest care, (6) Recovery." },
      { q: "What is the correct compression rate for adult CPR?", opts: ["60–80/min","80–100/min","100–120/min","120–140/min"], ans: "100–120/min", exp: "AHA 2020: compression rate 100–120 per minute. Rates below 100 are insufficient; rates above 120 reduce compression depth." },
      { q: "What is the correct compression depth for adult CPR?", opts: ["2–3 cm","At least 5 cm, no more than 6 cm","7–8 cm","1/3 of AP diameter"], ans: "At least 5 cm, no more than 6 cm", exp: "Adult compression depth: at least 5 cm (2 inches), no more than 6 cm (2.4 inches)." },
      { q: "When is hands-only CPR (compression-only CPR) appropriate?", opts: ["For all cardiac arrests","For untrained bystanders or when uncomfortable giving breaths, for witnessed adult arrest","For paediatric cardiac arrest","For drowning victims only"], ans: "For untrained bystanders or when uncomfortable giving breaths, for witnessed adult arrest", exp: "Hands-only CPR is appropriate for untrained bystanders and is as effective as standard CPR in the first few minutes of witnessed adult cardiac arrest. Standard CPR (with breaths) is preferred for children, drowning, and prolonged arrest." },
      { q: "What should you do immediately after an AED delivers a shock?", opts: ["Check for a pulse","Resume CPR immediately","Wait for the AED to re-analyse","Check if the person is breathing"], ans: "Resume CPR immediately", exp: "After an AED shock, resume CPR immediately — do not wait to check for a pulse. The AED will re-analyse after 2 minutes of CPR." },
      { q: "Where should AED pads be placed on an adult?", opts: ["Upper right chest and upper left chest","Upper right chest (below right collarbone) and lower left side","Centre of chest and back","Left side of chest only"], ans: "Upper right chest (below right collarbone) and lower left side", exp: "Standard AED pad placement: upper right chest (below the right collarbone) and lower left side (below and to the left of the left nipple). This positions the pads to deliver current across the heart." },
      { q: "What is agonal breathing?", opts: ["Normal breathing in a sleeping person","Rapid, shallow breathing in respiratory distress","Gasping or irregular breathing that is a sign of cardiac arrest","Deep, slow breathing indicating adequate oxygenation"], ans: "Gasping or irregular breathing that is a sign of cardiac arrest", exp: "Agonal breathing (gasping, snoring, or irregular breathing) is a sign of cardiac arrest — NOT normal breathing. Begin CPR if a person is unresponsive and not breathing normally (including gasping)." },
      { q: "What is the compression-to-ventilation ratio for single-rescuer child CPR?", opts: ["15:2","30:2","5:1","3:1"], ans: "30:2", exp: "Single-rescuer child CPR: 30:2. Two-rescuer child CPR: 15:2. The 15:2 ratio provides more frequent ventilation, reflecting the respiratory aetiology of most paediatric arrests." },
      { q: "What is the correct infant CPR technique for a single rescuer?", opts: ["Two-thumb encircling technique","Heel of one hand","Two fingers on the lower half of the sternum","Three fingers on the centre of the chest"], ans: "Two fingers on the lower half of the sternum", exp: "Single-rescuer infant CPR: two-finger technique on the lower half of the sternum. Two-thumb encircling technique is preferred with 2 rescuers as it generates higher coronary perfusion pressure." },
      { q: "What is the correct action for a choking child (over 1 year) with severe obstruction?", opts: ["5 back blows + 5 chest thrusts","5 back blows + 5 abdominal thrusts","Blind finger sweep","Begin CPR immediately"], ans: "5 back blows + 5 abdominal thrusts", exp: "Choking child (>1 year) with severe obstruction: 5 back blows + 5 abdominal thrusts. Repeat until cleared or child becomes unconscious. Infants: use chest thrusts (not abdominal thrusts)." },
      { q: "What should you do if AED paediatric pads are not available for a 4-year-old child?", opts: ["Do not use the AED — it is not safe","Use adult pads — do not delay defibrillation","Use only one pad","Wait for paediatric pads"], ans: "Use adult pads — do not delay defibrillation", exp: "If paediatric pads are not available, use adult pads — do NOT delay defibrillation. Place in anterior-posterior position if pads are too large to fit without overlapping." },
      { q: "When should you use the recovery position?", opts: ["For anyone who is unresponsive","For an unresponsive person who is breathing normally","For anyone who has had a cardiac arrest","For anyone who is confused"], ans: "For an unresponsive person who is breathing normally", exp: "Recovery position: for unresponsive people who are breathing normally. It keeps the airway open and prevents aspiration. If not breathing normally, begin CPR." },
      { q: "What is the minimum chest compression fraction (CCF) target during CPR?", opts: ["40%","50%","60%","80%"], ans: "60%", exp: "CCF should be at least 60%. Every interruption reduces coronary perfusion pressure. Minimise pauses to less than 10 seconds." },
      { q: "What is the correct airway opening technique for an infant?", opts: ["Head-tilt chin-lift with full extension","Neutral position — do not hyperextend","Jaw thrust only","No airway manoeuvre needed"], ans: "Neutral position — do not hyperextend", exp: "Infant airway: neutral position — do not hyperextend. The infant's large occiput naturally flexes the neck; a small shoulder roll may be needed to achieve neutral position." },
      { q: "What is the correct rescue breath technique for an infant?", opts: ["Cover the mouth only; pinch the nose","Cover both mouth and nose with your mouth; give small puffs","Give large breaths to ensure adequate ventilation","Use a bag-mask device only"], ans: "Cover both mouth and nose with your mouth; give small puffs", exp: "Infant rescue breaths: cover both mouth and nose with your mouth; give small puffs — just enough to see the chest rise. Over-ventilation causes gastric inflation and reduces venous return." }
    ]
  }
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  for (const [courseIdStr, assessment] of Object.entries(finalAssessments)) {
    const courseId = parseInt(courseIdStr);

    // Get the last module order for this course
    const [mods] = await conn.execute(
      `SELECT MAX(\`order\`) as maxOrder FROM modules WHERE courseId = ?`, [courseId]
    );
    const maxOrder = (mods as any[])[0].maxOrder ?? 0;
    const finalModuleOrder = maxOrder + 1;

    // Remove any existing final assessment module
    const [existing] = await conn.execute(
      `SELECT id FROM modules WHERE courseId = ? AND title LIKE '%Final%' OR (courseId = ? AND \`order\` = ?)`,
      [courseId, courseId, finalModuleOrder]
    );
    for (const mod of existing as any[]) {
      await conn.execute(`DELETE FROM quizQuestions WHERE quizId IN (SELECT id FROM quizzes WHERE moduleId = ?)`, [mod.id]);
      await conn.execute(`DELETE FROM quizzes WHERE moduleId = ?`, [mod.id]);
      await conn.execute(`DELETE FROM moduleSections WHERE moduleId = ?`, [mod.id]);
      await conn.execute(`DELETE FROM modules WHERE id = ?`, [mod.id]);
    }

    // Create the final assessment module
    const [modResult] = await conn.execute(
      `INSERT INTO modules (courseId, title, description, content, duration, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        courseId,
        `Final Knowledge Check`,
        `Comprehensive assessment covering all course modules. You must score ≥80% to receive your certificate.`,
        `This is the final knowledge check for the course. It covers all modules and must be completed to receive your certificate.`,
        20,
        finalModuleOrder
      ]
    );
    const moduleId = (modResult as any).insertId;

    // Add a single summary section
    await conn.execute(
      `INSERT INTO moduleSections (moduleId, title, content, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        moduleId,
        "Final Assessment Instructions",
        `<h2>Final Knowledge Check</h2>
<p>You have completed all learning modules. This final assessment covers the key concepts from all modules.</p>
<div class="clinical-note">
  <strong>Instructions:</strong>
  <ul>
    <li>You must score <strong>80% or above</strong> to pass and receive your certificate.</li>
    <li>Read each question carefully before selecting your answer.</li>
    <li>You may retake the assessment if you do not pass on the first attempt.</li>
  </ul>
</div>
<p>When you are ready, click <strong>Take Module Quiz</strong> to begin the final assessment.</p>`,
        1
      ]
    );

    // Create the quiz
    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes (moduleId, title, description, passingScore, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [moduleId, assessment.title, `Final comprehensive assessment — 80% required to pass`, 80]
    );
    const quizId = (quizResult as any).insertId;

    // Seed questions
    for (let i = 0; i < assessment.questions.length; i++) {
      const q = assessment.questions[i];
      await conn.execute(
        `INSERT INTO quizQuestions (quizId, question, options, correctAnswer, explanation, \`order\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [quizId, q.q, JSON.stringify(q.opts), q.ans, q.exp, i + 1]
      );
    }

    console.log(`  ✓ Course ${courseId}: Final assessment module created (${assessment.questions.length} questions, moduleId: ${moduleId})`);
  }

  console.log('\nAll AHA final assessments seeded successfully.');
  await conn.end();
}

main().catch(console.error);
