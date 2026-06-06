/**
 * Per-module learning objectives for fellowship courses without inline objectives in seed HTML.
 * Injected at seed time via enhanceFellowshipModuleContent (asthma-i/ii authored inline as gold template).
 */

export type ModuleEnrichment = {
  objectives: string[];
};

/** catalogSlug → module index (0-based) → enrichment */
export const FELLOWSHIP_MODULE_ENRICHMENT: Record<string, ModuleEnrichment[]> = {
  "dka-i": [
    { objectives: ["Define DKA using glucose, ketones, and acidosis in mmol/L", "Classify DKA severity (mild, moderate, severe)", "Recognise cerebral oedema red flags on first assessment"] },
    { objectives: ["Implement first-hour IV access, monitoring, and fluid strategy", "Apply ISPAD-aligned insulin start criteria (K⁺ and timing)", "Explain NS vs balanced crystalloid using governance conflict template"] },
    { objectives: ["Monitor potassium safely — never IV push KCl", "Know when to hold insulin and add dextrose to fluids", "Escalate when GCS falls or acidosis persists"] },
  ],
  "dka-ii": [
    { objectives: ["Manage cerebral oedema with mannitol/hypertonic saline per protocol", "Adjust fluids when glucose falls below 14 mmol/L", "Continue insulin until ketosis resolves — not glucose alone"] },
    { objectives: ["Recognise hypokalaemia and hyperkalaemia during DKA treatment", "Replace potassium via infusion — never bolus", "Interpret VBG trends during resuscitation"] },
    { objectives: ["Transition to subcutaneous insulin safely", "Counsel on sick-day rules and follow-up", "Document handover for ongoing ward care"] },
  ],
  "status-epilepticus-i": [
    { objectives: ["Define status epilepticus (≥5 min or recurrent without recovery)", "Perform ABCs with recovery position and glucose check", "Protect airway without delaying treatment"] },
    { objectives: ["Give first-line benzodiazepine weight-based with repeat limits", "Apply international vs Kenya diazepam conflict template", "State neonatal exception — no benzos first-line"] },
  ],
  "status-epilepticus-ii": [
    { objectives: ["Define refractory and super-refractory status epilepticus", "Escalate to second-line agents after two benzo doses", "Identify reversible causes (glucose, infection, toxins)"] },
    { objectives: ["Select levetiracetam or phenytoin per available protocol", "Monitor for respiratory depression and hypotension", "Prepare ICU transfer criteria"] },
    { objectives: ["Use anaesthetic infusions in super-refractory SE with monitoring", "Maintain EEG targets per specialist protocol", "Plan safe weaning and rehabilitation handover"] },
  ],
  "septic-shock-i": [
    { objectives: ["Recognise paediatric septic shock beyond fever alone", "Combine CRT, pulse, and mental status for perfusion assessment", "Activate sepsis bundle within one hour"] },
    { objectives: ["Give 10–20 mL/kg isotonic boluses with FEAST-aware reassessment", "Start empiric antibiotics after cultures when possible", "Avoid fluid overload in compensated febrile illness"] },
    { objectives: ["Know vasopressor indications when fluids fail", "Apply noradrenaline vs adrenaline availability framing", "Escalate to ICU when perfusion does not improve"] },
  ],
  "septic-shock-ii": [
    { objectives: ["Manage warm vs cold shock phenotypes", "Titrate vasopressors with central/peripheral access cautions", "Reassess lactate and perfusion hourly in ICU"] },
    { objectives: ["Source control timing for abscess, line, and surgical sepsis", "Adjust antibiotics with culture data", "Recognise adrenal insufficiency in refractory shock"] },
    { objectives: ["Wean vasopressors with perfusion targets", "Prevent ICU-acquired complications", "Plan step-down and oral antibiotic transition"] },
  ],
  "pneumonia-i": [
    { objectives: ["Classify pneumonia severity using WHO danger signs", "Target SpO₂ ≥90% with titration toward 90–94%", "Differentiate viral vs bacterial severe pneumonia"] },
    { objectives: ["Start empiric antibiotics within one hour for severe disease", "Apply WHO IMCI vs hospital ceftriaxone conflict template", "Prepare intubation for tiring or silent chest"] },
    { objectives: ["Support work of breathing with oxygen and positioning", "Recognise pleural effusion and empyema red flags", "Refer when ICU or surgical drainage needed"] },
  ],
  "pneumonia-ii": [
    { objectives: ["Manage ARDS with lung-protective ventilation principles", "Prone positioning and PEEP titration when available", "Balance fluids in septic lung injury"] },
    { objectives: ["Drain empyema and manage bronchopleural fistula", "Select antibiotics for atypical and resistant organisms", "Use ECMO referral criteria when refractory hypoxaemia"] },
    { objectives: ["Prevent ventilator-associated pneumonia", "Wean oxygen and ventilation safely", "Rehabilitation and follow-up imaging plan"] },
  ],
  "hypovolemic-shock-i": [
    { objectives: ["Identify hypovolaemic shock causes (dehydration, haemorrhage, burns)", "Use tachycardia before hypotension as early paediatric sign", "Assess perfusion with CRT and mental status"] },
    { objectives: ["Give 10–20 mL/kg boluses with reassessment after each", "Apply FEAST-aware fluid caution in febrile children", "Control external haemorrhage before large fluid loads"] },
    { objectives: ["Recognise when fluids alone are insufficient", "Start blood products early in haemorrhagic shock", "Document response and escalate to ICU"] },
  ],
  "hypovolemic-shock-ii": [
    { objectives: ["Activate massive transfusion protocol early", "Correct lethal triad: hypothermia, acidosis, coagulopathy", "Use pelvic binder and tourniquet when indicated"] },
    { objectives: ["Balance crystalloid vs blood in ongoing haemorrhage", "Monitor calcium and clotting in massive transfusion", "Plan damage control resuscitation"] },
    { objectives: ["Transfer to trauma centre when resources exceeded", "Prevent secondary brain injury in concurrent head trauma", "Warm fluids and patient throughout resuscitation"] },
  ],
  "cardiogenic-shock-i": [
    { objectives: ["Recognise cardiogenic shock — avoid repeated fluid boluses", "Differentiate from septic and hypovolaemic shock", "Assess gallop, hepatomegaly, and poor perfusion"] },
    { objectives: ["Start inotropes per ICU protocol when available", "Use dopamine/adrenaline framing for Kenya reality", "Support ventilation without fluid overload"] },
    { objectives: ["Monitor arrhythmias during inotrope infusion", "Escalate to cardiology/PICU for refractory shock", "Treat underlying myocarditis or congenital lesion"] },
  ],
  "cardiogenic-shock-ii": [
    { objectives: ["Titrate milrinone and noradrenaline for mixed shock", "Manage RV failure and pulmonary hypertension", "Avoid excessive PEEP in failing ventricle"] },
    { objectives: ["Consider mechanical circulatory support referral", "Balance afterload reduction with perfusion pressure", "Correct electrolytes and acid-base derangement"] },
    { objectives: ["Wean inotropes with haemodynamic monitoring", "Long-term heart failure medications at step-down", "Family counselling and follow-up plan"] },
  ],
  "anaphylaxis-i": [
    { objectives: ["Recognise anaphylaxis — airway, breathing, circulation, skin", "Give IM adrenaline 0.01 mg/kg immediately", "Position patient supine with legs elevated when tolerated"] },
    { objectives: ["Repeat adrenaline every 5–15 minutes if needed", "Administer high-flow oxygen and IV fluids for hypotension", "Prepare for biphasic reaction observation"] },
    { objectives: ["Differentiate anaphylaxis from asthma and panic", "Prescribe auto-injector and action plan at discharge", "Admit if refractory or airway compromise"] },
  ],
  "anaphylaxis-ii": [
    { objectives: ["Manage refractory anaphylaxis with adrenaline infusion", "Intubate early if stridor or angioedema progresses", "Treat concurrent asthma bronchospasm"] },
    { objectives: ["Identify non-IgE reactions and mast cell disorders", "Plan prolonged observation for biphasic anaphylaxis", "Coordinate allergy testing after stabilisation"] },
    { objectives: ["ICU vasopressor support when adrenaline infusion insufficient", "Glucagon for beta-blocker-associated refractory shock", "Safe transfer and handover documentation"] },
  ],
  "malaria-i": [
    { objectives: ["Define severe malaria using WHO criteria", "Check glucose in mmol/L — hypoglycaemia is common", "Start IV/IM artesunate without delay"] },
    { objectives: ["Avoid artemether IV as first-line for severe malaria", "Treat seizures and raised ICP in cerebral malaria", "Transition to oral ACT when tolerating"] },
    { objectives: ["Monitor for pulmonary oedema and renal failure", "Transfuse for severe anaemia per threshold", "Counsel on completion of ACT and prevention"] },
  ],
  "malaria-ii": [
    { objectives: ["Manage cerebral malaria with airway protection and ICP care", "Correct severe anaemia without fluid overload", "Prevent aspiration in obtunded children"] },
    { objectives: ["Renal replacement indications in severe malaria", "Exchange transfusion criteria for very high parasitaemia", "Secondary bacterial infection surveillance"] },
    { objectives: ["Rehabilitation after cerebral malaria", "Long-term neuro follow-up planning", "Community prevention messaging"] },
  ],
  "meningitis-i": [
    { objectives: ["Recognise meningitis across infant and older child age groups", "Treat non-blanching rash as meningococcal emergency", "Assess neck stiffness and fontanelle in context"] },
    { objectives: ["Give empiric antibiotics before LP when suspected", "Use ceftriaxone per Kenya hospital practice", "Defer LP when unstable or herniation signs"] },
    { objectives: ["Give dexamethasone with or before first antibiotic dose", "Protect airway and treat seizures per SE protocol", "Avoid hypotonic fluids — SIADH risk"] },
  ],
  "meningitis-ii": [
    { objectives: ["Manage raised ICP with head elevation and osmotherapy", "Hourly GCS and pupil monitoring in ICU", "Avoid hypotension and hypoxia"] },
    { objectives: ["Treat seizures without benzos first-line in neonates", "Image for subdural empyema when not improving", "Adjust antibiotics to culture sensitivities"] },
    { objectives: ["Manage SIADH with isotonic fluids and sodium monitoring", "Fluid restrict per specialist guidance when indicated", "Plan rehabilitation and hearing follow-up"] },
  ],
  "trauma-i": [
    { objectives: ["Perform ABCDE primary survey in correct order", "Protect C-spine during airway management", "Treat life threats before completing survey"] },
    { objectives: ["Control haemorrhage with direct pressure and tourniquet", "Give 10–20 mL/kg crystalloid with reassessment", "Recognise early paediatric shock signs"] },
    { objectives: ["Identify traumatic brain injury red flags", "Prevent secondary brain injury from hypoxia/hypotension", "Activate trauma team for high-energy mechanism"] },
  ],
  "trauma-ii": [
    { objectives: ["Activate MTP for ongoing massive haemorrhage", "Use damage control resuscitation principles", "Apply pelvic binder for suspected pelvic fracture"] },
    { objectives: ["Manage blunt abdominal solid organ injury conservatively when stable", "Decompress tension pneumothorax immediately", "Plan imaging and surgical referral"] },
    { objectives: ["Perform damage control surgery when indicated", "Ventilate head injury with permissive hypercapnia if needed", "Transfer when local resources exceeded"] },
  ],
  "burns-i": [
    { objectives: ["Assess airway for inhalation injury", "Calculate TBSA and classify partial vs full thickness", "Start Parkland-based fluid plan with urine output targets"] },
    { objectives: ["Provide weight-based analgesia and wound cover", "Prevent hypothermia during resuscitation", "Know referral criteria for major burns"] },
    { objectives: ["Recognise circumferential burn compartment risk", "Monitor for rhabdomyolysis and myoglobinuria", "Counsel on tetanus and infection prevention"] },
  ],
  "burns-ii": [
    { objectives: ["Perform escharotomy for circumferential full-thickness burns", "Titrate fluids to urine output — not formula alone", "Manage burn wound infection aggressively"] },
    { objectives: ["Recognise sepsis in major burns", "Topical antimicrobial and surgical debridement timing", "Nutrition and hypermetabolic support"] },
    { objectives: ["Rehabilitation and scar management planning", "Psychosocial support for child and family", "Safe transfer to burn centre when indicated"] },
  ],
  "aki-i": [
    { objectives: ["Define AKI using creatinine rise and urine output (KDIGO-aligned)", "Identify prerenal, intrinsic, and postrenal causes", "Avoid nephrotoxic drugs in at-risk children"] },
    { objectives: ["Resuscitate with isotonic fluids when prerenal", "Fluid restrict when overloaded — avoid hypotonic fluids", "Monitor electrolytes in mmol/L"] },
    { objectives: ["Recognise hyperkalaemia ECG changes", "Treat K⁺ without IV push — infusion only", "Plan early RRT discussion when refractory"] },
  ],
  "aki-ii": [
    { objectives: ["Apply RRT indications (AEIOU framework)", "Balance daily fluid prescription to insensible losses + output", "Dose-adjust medications for renal failure"] },
    { objectives: ["Manage hyperphosphataemia and acidosis", "Use PD as LMIC option when HD unavailable — not default where HD exists", "Prevent line infections during dialysis access"] },
    { objectives: ["Wean RRT as native function recovers", "Long-term nephrology follow-up after severe AKI", "Counsel on nephrotoxin avoidance at discharge"] },
  ],
  "anaemia-i": [
    { objectives: ["Assess severity using Hb and clinical perfusion", "Apply WHO transfusion thresholds", "Differentiate haemolysis, blood loss, and nutritional anaemia"] },
    { objectives: ["Transfuse 10 mL/kg when cardiac failure risk — not always 20 mL/kg", "Treat malaria before or with transfusion when co-present", "Start iron for nutritional deficiency after stabilisation"] },
    { objectives: ["Recognise acute splenic sequestration in sickle cell", "Monitor for transfusion reactions", "Plan discharge iron and folate supplementation"] },
  ],
  "anaemia-ii": [
    { objectives: ["Manage vaso-occlusive crisis with hydration and analgesia", "Exchange transfusion indications for stroke and severe ACS", "Coordinate with haematology for chronic disease"] },
    { objectives: ["Prevent iron overload in transfusion-dependent anaemia", "Chelation when indicated per specialist", "Vaccination and infection prevention in sickle cell"] },
    { objectives: ["Counsel families on fever and sepsis in sickle cell", "Community blood availability planning in Kenya", "Long-term growth and development monitoring"] },
  ],
};

export function getModuleEnrichment(
  catalogSlug: string,
  moduleIndex: number
): ModuleEnrichment | undefined {
  return FELLOWSHIP_MODULE_ENRICHMENT[catalogSlug]?.[moduleIndex];
}
