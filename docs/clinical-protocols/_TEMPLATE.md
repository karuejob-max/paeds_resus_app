# Protocol title (replace me)

**Status:** Draft | Active | Deprecated  
**Last reviewed:** YYYY-MM-DD  
**Owner:** Team / role

---

## 1. Scope

Who (age group), setting (ED, ward, pre-hospital), and what clinical problem this protocol addresses.

---

## 2. Evidence basis

Bullet the **families** of guidance we align with (e.g. international sepsis campaigns, national paediatric advanced life support, WHO).  
Do not paste proprietary guideline text. Note local formulary overrides when relevant.

---

## 3. Product surfaces

| Surface | Purpose |
|---------|---------|
| ResusGPS | Bedside steps, dosing, reassessment |
| `/protocols` or Emergency Protocols UI | If applicable |
| LMS course | If we sell or assign training |

---

## 4. ResusGPS mapping

### Identified pathway (if applicable)

- **Pathway ID:** `…`  
- **Subpathway ID:** `…`  
- **File:** `client/src/lib/resus/pathways/….ts`  
- **Clarifying questions / match:** …

### XABCDE engine (if applicable)

- **Threats / perfusion / escalation:** reference sections of `abcdeEngine.ts` (describe behaviour, not line numbers—lines drift).

---

## 5. Step sequence (canonical order)

Numbered list that mirrors the implementation order in code. Each step: action, criticality, reassessment triggers.

---

## 6. Out of scope

What we deliberately do not cover here (e.g. definitive ICU management, surgical source control details).

---

## 7. Change log

| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial doc |
