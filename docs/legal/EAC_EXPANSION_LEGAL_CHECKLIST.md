# East African Community (EAC) Expansion — Legal Checklist

**Document:** EAC_EXPANSION_LEGAL_CHECKLIST.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft — pre-market checklist  
**Operator:** Paeds Resus Limited (Kenya)  
**Contact:** legal@paeds-resus.com | privacy@paeds-resus.com  

---

## 1. Purpose

Before marketing or deploying Paeds Resus products (ResusGPS, Care Signal, Fellowship, training) in **EAC member states and adjacent priority countries**, complete this checklist with **local qualified counsel**. Kenya DPA compliance alone is insufficient.

**Products in scope:** All platform products per PRIVACY_POLICY_FULL.md §2.

---

## 2. Country rollout matrix

| Country | Data protection law (summary) | Local entity needed? | Counsel review | Product launch |
|---------|------------------------------|----------------------|------------------|----------------|
| **Kenya** | DPA 2019; ODPC | Paeds Resus Limited ✓ | ☑ Baseline | ☑ Primary |
| **Uganda** | Data Protection and Privacy Act 2019; PDPO | TBD | ☐ | ☐ |
| **Tanzania** | Personal Data Protection Act 2022 | TBD | ☐ | ☐ |
| **Rwanda** | Law No. 058/2021 | TBD | ☐ | ☐ |
| **Burundi** | Limited framework; evolving | TBD | ☐ | ☐ |
| **South Sudan** | Limited framework | TBD | ☐ | ☐ |
| **DRC** | Law No. 09/022 (2013) + guidelines | TBD | ☐ | ☐ |

**Cross-border hosting:** Aiven **EU** — document transfers per country (PRIVACY_POLICY_FULL.md §9).

---

## 3. Universal pre-launch items (all countries)

- [ ] Local privacy notice translation (if required)  
- [ ] Terms governing law clause — Kenya vs local consumer mandatory rules  
- [ ] Emergency numbers in UI (`ClinicalUseDisclaimer.tsx`, `SafeTruthGuardianGate.tsx`)  
- [ ] M-Pesa availability — Kenya only; other payment rails TBD  
- [ ] Clinical intended use — ResusGPS not registered as local medical device unless counsel advises  
- [ ] Care Signal — employer reporting laws may require parallel systems  
- [ ] Training certificates — AHA alignment may not imply local MOH recognition  
- [ ] Institutional MOU — local hospital authority signatory  
- [ ] Insurance / liability — Kenya limitation clause enforceability abroad  
- [ ] Tax and VAT registration for digital services  

---

## 4. Emergency numbers reference

**Display in product UI.** Users must call **local emergency services** — Paeds Resus is not an emergency service.

| Country | Primary emergency | Ambulance / notes | Police | In-product reference |
|---------|-------------------|-------------------|--------|----------------------|
| **Kenya** | **999** or **112** | 112 GSM mobile | 999 | ✓ Shipped |
| **Uganda** | **999** or **112** | 112 universal | 999 | Update disclaimers |
| **Tanzania** | **114** (ambulance) | **112** / 999 mobile | 112 | Update disclaimers |
| **Rwanda** | **912** | Police 112 | 112 | Update disclaimers |
| **Burundi** | **112** | Limited national dispatch | 112 | Update disclaimers |
| **South Sudan** | **777** (Juba common) | **112** where GSM works; fragile infrastructure | Varies | Counsel + local ops |
| **DRC** | **112** (GSM) | **118** Kinshasa fire; regional variation | Varies by province | Localise per city |

**Counsel action:** Verify numbers annually with MOH or ITU emergency access reports.

**Engineering:** `ClinicalUseDisclaimer.tsx` lists Kenya 999/112 plus Uganda, Tanzania, Rwanda, Burundi, South Sudan — extend for DRC on launch.

---

## 5. Kenya (baseline — complete first)

| Item | Status | Owner |
|------|--------|-------|
| ODPC registration | Placeholder — [counsel to insert] | CEO |
| DPO contact privacy@ | ✓ | CEO |
| Privacy Policy v1.0.0 | Draft | Counsel |
| M-Pesa refunds in Terms | Draft | Counsel |
| Nairobi courts jurisdiction | Draft Terms | Counsel |

---

## 6. Uganda checklist

- [ ] Register with **Personal Data Protection Office (PDPO)** if required for foreign controllers  
- [ ] Lawful basis memo for Care Signal at Mulago / regional hospitals  
- [ ] Uganda Medical and Dental Practitioners Council — clinical decision support positioning  
- [ ] Shilling payments — mobile money partner (MTN MoMo) if not M-Pesa  
- [ ] Emergency: **999 / 112** in UI  
- [ ] Swahili/Luganda privacy summary if marketing to parents (Safe-Truth)  

---

## 7. Tanzania checklist

- [ ] **Personal Data Protection Commission** registration  
- [ ] Swahili Terms summary  
- [ ] Tanzania Medicines and Medical Devices Authority — device classification for ResusGPS  
- [ ] M-Pesa Tanzania (Vodacom) separate integration if selling courses  
- [ ] Emergency: **114** ambulance + **112**  
- [ ] Zanzibar regulatory overlay if serving Zanzibar facilities  

---

## 8. Rwanda checklist

- [ ] **National Cyber Security Authority (NCSA)** data processing requirements  
- [ ] French/Kinyarwanda consumer notices  
- [ ] Rwanda FDA equivalent for clinical software (if any)  
- [ ] Emergency: **912**  
- [ ] Institutional MOU with CHUK / district hospitals  

---

## 9. Burundi checklist

- [ ] Limited DP law — document legitimate interests and consent heavily  
- [ ] French privacy notice  
- [ ] Fragile connectivity — offline ResusGPS disclaimer emphasis  
- [ ] Emergency: **112**  
- [ ] Security risk assessment for staff data  

---

## 10. South Sudan checklist

- [ ] Conflict-sensitive data hosting review  
- [ ] Minimal data collection for Safe-Truth  
- [ ] Emergency: **777** Juba + **112** — confirm with WHO cluster  
- [ ] No public outcome claims without humanitarian ethics review  
- [ ] USD pricing and payment rails  

---

## 11. DRC checklist

- [ ] **APDN** (Autorité de Protection des Données) registration  
- [ ] French processing notice  
- [ ] Provincial variation (Kinshasa vs Goma vs Lubumbashi)  
- [ ] Emergency numbers **not national-single** — city-specific UI required  
- [ ] Cross-border from EU hosting — DRC transfer assessment  
- [ ] Francophone clinical content review  

---

## 12. Product-specific expansion notes

### ResusGPS

- Pathway defaults (fluids, antibiotics) may need **national protocol** variants  
- CLINICAL_INTENDED_USE_STATEMENT.md translated excerpts  
- Register local clinical safety officer contact  

### Care Signal

- Whistleblower laws vary — institutional MOU must reference local labour law  
- Do not promise MOH national surveillance without government MOU  

### Fellowship / Fellow title

- Keep `fellowTitleEnabled = false` until each country counsel clearance  
- No implication of government fellowship  

### M-Pesa

- Kenya-only unless separate Daraja/market integration  

---

## 13. Documentation deliverables per country

| Deliverable | Path |
|-------------|------|
| Privacy Policy local annex | `docs/legal/local/[country].md` (future) |
| Terms jurisdiction addendum | Counsel |
| Emergency number config | `ClinicalUseDisclaimer.tsx` |
| Sub-processor notice | `/legal/subprocessors` |

---

## 14. Sign-off gate

| Country | CEO | Counsel | Date |
|---------|-----|---------|------|
| Kenya | ☐ | ☐ | |
| Uganda | ☐ | ☐ | |
| Tanzania | ☐ | ☐ | |
| Rwanda | ☐ | ☐ | |
| Burundi | ☐ | ☐ | |
| South Sudan | ☐ | ☐ | |
| DRC | ☐ | ☐ | |

**Do not enable** country-specific marketing pages until row complete.

---

## 15. Related documents

- PRIVACY_POLICY_FULL.md  
- TERMS_OF_USE_FULL.md  
- CLINICAL_INTENDED_USE_STATEMENT.md  
- INSTITUTIONAL_B2B_ADDENDUM.md  
- LEGAL_IMPLEMENTATION_INDEX.md  

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial EAC expansion checklist with emergency numbers |

---

*© 2026 Paeds Resus Limited.*
