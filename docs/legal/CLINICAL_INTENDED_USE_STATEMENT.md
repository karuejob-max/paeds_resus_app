# Clinical Intended Use Statement — ResusGPS

**Document:** CLINICAL_INTENDED_USE_STATEMENT.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft — regulatory positioning  
**Manufacturer / operator:** Paeds Resus Limited, Nairobi, Kenya  
**Product:** ResusGPS (not Paeds Resus platform-wide)  
**Contact:** legal@paeds-resus.com | support@paeds-resus.com  

---

## 1. Document purpose

This statement defines the **intended use**, **intended user**, **limitations**, and **regulatory positioning** of **ResusGPS** for counsel, clinical governance, institutional MOUs, and bedside disclaimers (`ClinicalUseDisclaimer.tsx`).

It supports the position that ResusGPS, as currently deployed, is **clinical decision support / reference support** and **not** marketed or intended as a **medical device** requiring registration as SaMD under frameworks where Paeds Resus has not obtained such clearance — **subject to counsel and PPB/MOH confirmation in Kenya**.

---

## 2. Product identification

| Attribute | Value |
|-----------|-------|
| Product name | ResusGPS |
| Software route | `/resus` and related pathway modules |
| Version governance | Clinical content per CLINICAL_SAFETY_REGISTER.md |
| Platform | Web application (mobile browser supported) |
| Legal entity | Paeds Resus Limited |

**ResusGPS is a product name only.** The operator is Paeds Resus Limited. The broader Paeds Resus platform includes separate products with separate intended uses.

---

## 3. Intended use (summary)

ResusGPS is intended to provide **structured paediatric emergency reference support** for **trained healthcare providers** during resuscitation and acute stabilisation, including:

- ABCDE assessment prompts
- CPR clock and rhythm prompts
- Weight- and age-banded drug dosing **calculators** (reference arithmetic)
- Condition-specific pathway steps (e.g. shock, seizure, respiratory failure)
- Timers and checklist-style escalation reminders

**Intended outcome:** Improved adherence to **evidence-informed teaching pathways** and local protocol alignment — **not** autonomous diagnosis or treatment without provider judgment.

---

## 4. Intended users

| User | In scope | Out of scope |
|------|----------|--------------|
| Licensed clinicians and trainees under supervision | Yes | — |
| Nurses and clinical officers in paediatric emergency | Yes | — |
| Lay caregivers | **No** | Use public emergency numbers |
| Parents (Parent Safe-Truth lane) | **No** | Separate product |
| Automated devices / closed-loop pumps | **No** | No device integration |

Users must complete appropriate paediatric emergency training and follow **facility-approved protocols** that may supersede default pathway parameters.

---

## 5. Intended use environment

- Hospital emergency departments, paediatric wards, HDU/ICU, ambulances where mobile connectivity exists
- Low- and middle-income settings (LMIC) with teaching emphasis on fluid caution (e.g. FEAST-informed septic shock education)
- **Not** for sole reliance in environments without senior support when scope of practice requires escalation

---

## 6. What ResusGPS does NOT do (limitations)

ResusGPS does **not**:

1. Replace clinical examination, investigations, or senior review  
2. Constitute **medical advice** or a **doctor–patient relationship** with Paeds Resus  
3. Operate as an **emergency dispatch** or **ambulance coordination** service  
4. Store a legal **medical record** — session age/weight is browser session context; saved Fellowship cases exclude patient names  
5. Guarantee correct drug administration — users must verify concentrations, routes, allergies, and local formulary  
6. Provide ventilator, defibrillator, or infusion pump control (no hardware interface)  
7. Diagnose disease with regulatory-grade diagnostic claims  
8. Enforce mandatory reporting to employers or regulators  

**Connectivity limitation:** If the app fails to load, providers must use offline training, paper protocols, and emergency services.

---

## 7. Medical device positioning (Kenya draft)

### 7.1 Position statement (pending counsel confirmation)

Paeds Resus Limited positions ResusGPS as:

> **Non-device clinical decision support software** that presents educational pathways and arithmetic dosing aids for qualified users who retain full responsibility for care.

### 7.2 Factors supporting non-device classification (for counsel review)

| Factor | ResusGPS posture |
|--------|------------------|
| User type | Trained healthcare professional |
| Decision authority | User, not software |
| Autonomy | No autonomous therapy delivery |
| Hardware | General-purpose mobile/browser |
| Claims | No cure/diagnosis guarantees; disclaimers at bedside |
| Regulatory filings | None claimed as SaMD at v1.0.0 |

### 7.3 Risk factors requiring vigilance

| Factor | Mitigation |
|--------|------------|
| Weight-based drug dosing | Prominent disclaimers; verify locally; CLINICAL_SAFETY_REGISTER |
| Default bolus volumes (e.g. shock pathways) | LMIC teaching notes; facility protocol override culture |
| Bedside use in public hospitals | Institutional MOU + intended use training |
| Pharmacy and Poisons Board | No medicinal product marketing claims |

**Action:** Obtain written Kenya counsel memo on PPB/MOH/KEBS applicability before expanding public-hospital marketing.

---

## 8. LMIC fluid strategy disclaimer

Septic shock and fluid resuscitation content reflects **evidence-informed teaching** including caution in malnutrition and FEAST-context settings. **Default pathway parameters** (e.g. 20 mL/kg crystalloid bolus in shock teaching modules) may **differ** from facility protocol. Users must:

- Follow **local protocol** when conflict exists  
- Escalate to senior clinicians for complex fluid decisions  
- Not treat calculator output as mandatory orders  

---

## 9. Emergency services

ResusGPS displays: **Kenya 999 or 112**; EAC countries per EAC_EXPANSION_LEGAL_CHECKLIST.md. **Call emergency services first** in life-threatening emergencies.

---

## 10. Data and privacy (clinical context)

- Age/weight in `sessionStorage` — sensitive workflow context, not a medical record (SECURITY_BASELINE.md §5)  
- Acknowledgement version stored server-side (`legal.acceptResusGpsDisclaimer`)  
- No patient names in saved cases  

---

## 11. Training and competency

ResusGPS assumes users have completed relevant paediatric emergency training (e.g. PALS-equivalent or national programmes). Paeds Resus courses and Fellowship do **not** by themselves confer licensure.

---

## 12. Incident reporting

Adverse events related to software usability or content errors should be reported to support@paeds-resus.com with facility, date, and description (no patient identifiers). Serious clinical incidents follow facility and national reporting rules independently of Paeds Resus.

---

## 13. Version control and change management

Pathway changes require clinical governance review per PSOT §13 and CLINICAL_SAFETY_REGISTER.md. Material changes trigger disclaimer version bumps in `LEGAL_DOCUMENT_VERSIONS.resusGpsDisclaimer`.

---

## 14. Relationship to other documents

| Document | Relationship |
|----------|--------------|
| TERMS_OF_USE_FULL.md | Contractual disclaimers |
| PRIVACY_POLICY_FULL.md | Session data processing |
| INSTITUTIONAL_B2B_ADDENDUM.md | Hospital pilot governance |
| CLINICAL_SAFETY_REGISTER.md | Source evidence register |

---

## 15. User acknowledgement text (reference)

Bedside UI (`ClinicalUseDisclaimer.tsx`) should align with:

> *ResusGPS is structured paediatric emergency **reference support** for trained providers. Not medical advice. Not an emergency service. You remain clinically responsible. Call 999 or 112 in Kenya.*

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial intended use statement |

---

*© 2026 Paeds Resus Limited. Not a regulatory clearance document.*
