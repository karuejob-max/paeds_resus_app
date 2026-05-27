# Terms of Use

**Document:** TERMS_OF_USE_FULL.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft — not legal advice  
**Contracting entity:** Paeds Resus Limited, Nairobi, Kenya  

---

## Important notice

These Terms of Use (“**Terms**”) govern access to and use of the Paeds Resus platform and all products listed below. They are drafted for Kenya law and must be reviewed by qualified counsel before publication. By creating an account, enrolling, checking acceptance boxes, or using the platform, you agree to these Terms and our Privacy Policy.

**Contact:** legal@paeds-resus.com | support@paeds-resus.com | privacy@paeds-resus.com  

---

## 1. Parties and definitions

| Term | Meaning |
|------|---------|
| **Paeds Resus Limited** (“**we**”, “**us**”) | The Kenyan company that operates the platform, issues training invoices and certificates, and processes payments |
| **Paeds Resus** | Trade name for the multi-product platform |
| **You** / **User** | Any person or authorised institutional representative using the platform |
| **Platform** | paeds-resus.com, related APIs, mobile web, and admin tools |
| **Products** | ResusGPS, Care Signal, Parent Safe-Truth, Fellowship, AHA-aligned courses, instructor training, institutional portal, certificate verification |
| **ResusGPS** | Bedside paediatric emergency **reference support** product — not the company name |
| **Paeds Resus Fellow** | Platform credential earned through Fellowship automation — **not** AHA Fellow, **not** MOH specialist registration |

---

## 2. Acceptance of terms

You accept these Terms by:

- Creating an account (`/register`) — including links to Terms and Privacy
- Checking acceptance on enrollment or payment flows (`/enroll`, `/payment`)
- Institutional onboarding checkboxes
- Continuing to use the platform after material updates when re-consent is requested (`LegalReconsentGate`)
- Product-specific acknowledgements (ResusGPS disclaimer, Care Signal consent, Safe-Truth guardian gate)

If you do not agree, do not use the platform.

---

## 3. Eligibility and accounts

3.1 You must be at least **18 years old** (or the age of majority in your country) to create a provider or institutional account, unless counsel-approved parental flows apply for specific training products.

3.2 You must provide accurate registration information. Certificate names should match the spelling you want on credentials.

3.3 **Account security:** You are responsible for safeguarding credentials. Notify support@paeds-resus.com of suspected compromise immediately.

3.4 **Role switching:** A single account may access provider, parent, and institutional contexts where permitted. You must use each context only for its intended purpose. Care Signal consent does not cover Safe-Truth submissions and vice versa.

3.5 We may suspend or terminate accounts for breach, fraud, abuse of Care Signal, or misrepresentation of credentials.

---

## 4. Not medical advice; not emergency services

4.1 **Education and reference only.** Paeds Resus provides health **education**, training, structured **reference support**, and quality-improvement tools. **Nothing on the platform is medical advice, diagnosis, or treatment.** Content does not replace your clinical judgment, senior review, local protocols, national guidelines, or mandatory employer reporting.

4.2 **Not an emergency service.** In a medical emergency, **call local emergency services immediately.** Kenya: **999** or **112**. Other countries: see EAC_EXPANSION_LEGAL_CHECKLIST.md and in-product disclaimers.

4.3 **ResusGPS** provides weight-based dosing calculators, timers, and pathway prompts as **decision support**. You remain **clinically responsible** for all care decisions. See CLINICAL_INTENDED_USE_STATEMENT.md.

4.4 **Care Signal** is for provider QI learning — not a patient medical record and not a substitute for employer or regulator incident reporting where required.

4.5 **Parent Safe-Truth** is for family voice and system improvement — not emergency care, not a formal complaint substitute unless your jurisdiction provides otherwise.

4.6 **Connectivity.** Mobile networks may fail. Do not rely solely on the platform in resuscitation without offline training and local resources.

---

## 5. Product-specific terms

### 5.1 ResusGPS

- Intended for **trained healthcare providers** in paediatric emergency contexts
- Session age/weight data is stored client-side per Privacy Policy
- You must acknowledge the clinical disclaimer before bedside use (version tracked server-side)
- Pathway defaults (e.g. fluid bolus strategies) may reflect LMIC evidence-informed teaching; **follow your facility protocol** where it differs
- You must not enter patient names in saved Fellowship cases

### 5.2 Care Signal

- First submission requires explicit consent to the Care Signal Data Processing Notice
- Maximum **5 submissions per day** (East Africa Time) and duplicate guards apply
- Do not include patient identifiers in free text
- Reports are linked to your provider account — de-identified from **patients**, not anonymous to the platform
- Appeals for **system errors** only: `/care-signal/appeal` — see Fellowship §11.3 governance
- Institutional viewing is governed by B2B terms and facility policies

### 5.3 Parent Safe-Truth

- Separate product with separate KPIs — never merged with Care Signal metrics
- Guardian gate requires emergency-services acknowledgement
- Bereavement submissions treated with heightened sensitivity

### 5.4 Paeds Resus Fellowship

- Three pillars: micro-courses, ResusGPS cases, Care Signal streak
- **Paeds Resus Fellow** title is awarded **only by automation** when `fellowTitleEnabled` is true (currently **false** until CEO and counsel approval)
- **No manual conferral** of Fellow title by staff
- Grace, catch-up, and reset rules are published in Fellowship documentation and may be updated with notice
- Fellowship certificates attest **platform pathway completion**, not clinical competence or licensure

### 5.5 AHA-aligned training (Paeds Resus Limited)

- Paeds Resus Limited operates as an **AHA-Aligned Training Provider** for BLS, ACLS, PALS, Heartsaver, and related courses where offered
- AHA eCards and alignment rules are separate from Fellowship credentials
- Certificates attest **course completion** for the stated course — verify at `/verify-certificate`
- Misuse of verification codes or forged certificates is prohibited and may be referred to authorities

### 5.6 Instructor training

- Instructor numbers are assigned through approved workflows
- Instructors must comply with Paeds Resus instructor policies and applicable AHA alignment obligations

### 5.7 Institutional portal

- Hospital administrators access staff and facility data only as authorised
- Institutional onboarding requires acceptance of Terms, Privacy, and Institutional B2B Addendum
- Employer policies govern staff conduct; we are not the employer

### 5.8 Certificate verification

- Public verification at `/verify-certificate` shows issuance metadata
- Unless explicitly stated on a certificate, verification does **not** attest MOH registration, specialist status, or AHA Fellow status

---

## 6. Payments, M-Pesa, and refunds {#payments}

### 6.1 Pricing and currency

- Prices displayed at checkout are in **Kenyan Shillings (KES)** unless otherwise stated
- Fees are due as shown at purchase; tax treatment per applicable law

### 6.2 M-Pesa (Safaricom Daraja)

- STK push charges your Safaricom line per **Safaricom’s terms**
- You authorise the transaction amount shown before approving on your handset
- Webhook confirmation may take seconds; manual reconciliation paths exist for failed STK
- Fellowship micro-course payments must use the **Fellowship checkout** path where indicated

### 6.3 Refund policy (Kenya-appropriate draft)

| Scenario | Policy |
|----------|--------|
| **Duplicate charge** | Full refund or credit within 14 business days of verified duplicate |
| **Course not started** | Refund less payment processing costs if requested within **7 calendar days** of payment and before course materials access beyond orientation |
| **Course started** | No refund except where required by law or our error |
| **Failed STK / technical error** | We will reconcile using webhook logs; no charge if payment did not complete |
| **Manual Lipa na M-Pesa** | Credited upon verified receipt matching enrollment |
| **Institutional bulk** | Per signed B2B invoice terms |

Refund requests: support@paeds-resus.com with payment reference, phone number, and enrollment ID. We respond within **10 business days**. Refunds are issued via M-Pesa reversal or bank transfer where applicable.

### 6.4 Consumer protection

Nothing in these Terms limits your **non-waivable rights** under the Kenya Consumer Protection Act or other mandatory law.

---

## 7. Intellectual property

7.1 Platform software, branding, pathways, course content, and documentation are owned by Paeds Resus Limited or licensors.

7.2 We grant you a limited, non-exclusive, non-transferable licence to use the platform for personal or authorised institutional purposes.

7.3 You may not scrape, reverse engineer, resell access, or reproduce content for competing commercial products without written consent.

7.4 **User submissions** (Care Signal, Safe-Truth): You grant us a licence to store, aggregate, and use submissions for QI, fellowship operations, and governance as described in the Privacy Policy. You represent that your submissions comply with identifier prohibitions and do not defame individuals with unjustified factual claims.

---

## 8. Acceptable use

You must not:

- Submit false Care Signal reports or game fellowship streaks
- Impersonate another provider or institution
- Upload malware, probe security, or bypass rate limits
- Use the platform to provide unauthorised telemedicine where prohibited
- Publish or imply **mortality reduction claims**, **national league tables**, or **accredited facility rankings** without CEO and clinical governance sign-off
- Enable or display **Paeds Resus Fellow** credentials while `fellowTitleEnabled` is false
- Process patient identifiers through Care Signal or ResusGPS saved cases

We may investigate abuse and cooperate with law enforcement where required.

---

## 9. Disclaimers and limitation of liability (Kenya-appropriate)

### 9.1 Disclaimer of warranties

To the fullest extent permitted by **Kenya law**, the platform and content are provided **“as is”** and **“as available”** without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant uninterrupted or error-free operation.

### 9.2 Limitation of liability

To the fullest extent permitted by law:

- Paeds Resus Limited, its directors, employees, and agents shall **not be liable** for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or clinical outcomes, arising from use or inability to use the platform
- Our **aggregate liability** for claims arising from these Terms or the platform shall not exceed the **greater of** (a) amounts you paid us in the **12 months** before the claim, or (b) **KES 50,000**
- Nothing excludes liability for **death or personal injury caused by negligence**, **fraud**, or other liability that **cannot be excluded** under Kenyan law

### 9.3 Clinical responsibility

You acknowledge that **you**, not Paeds Resus, are responsible for clinical decisions, drug administration, and emergency actions at the bedside.

### 9.4 Third parties

We are not liable for Safaricom, Aiven, hosting providers, or employer actions based on Care Signal data.

---

## 10. Indemnity

You agree to indemnify Paeds Resus Limited against claims arising from your breach of these Terms, unlawful submissions, misrepresentation of credentials, or clinical misuse attributable to your conduct, except where caused by our gross negligence or wilful misconduct.

---

## 11. Suspension and termination

We may suspend or terminate access immediately for breach, legal requirement, or platform safety. You may stop using the platform at any time. Sections that by nature survive (liability limits, indemnity, dispute resolution, IP) survive termination.

Upon termination, data handling follows the Privacy Policy and DATA_RETENTION_SCHEDULE.md.

---

## 12. Dispute resolution and governing law

12.1 **Governing law:** Laws of the **Republic of Kenya**.

12.2 **Negotiation:** Parties will attempt good-faith resolution by contacting legal@paeds-resus.com within **30 days** of a written dispute notice.

12.3 **Courts:** Subject to mandatory consumer rights, exclusive jurisdiction lies with the **courts of Nairobi, Kenya**.

12.4 **ODPC:** Data protection complaints may also be lodged with the Office of the Data Protection Commissioner.

---

## 13. Force majeure

We are not liable for failure or delay due to events beyond reasonable control (network outages, acts of government, pandemic restrictions, Safaricom outages, cloud provider failures).

---

## 14. Assignment

You may not assign these Terms without our consent. We may assign to an affiliate or successor with notice.

---

## 15. Entire agreement

These Terms, the Privacy Policy, product-specific notices (Care Signal, cookies, clinical intended use), and any signed **Institutional B2B Addendum** constitute the entire agreement for platform use, superseding prior informal understandings.

---

## 16. Changes

We may update these Terms. Version `1.0.0` is tracked in `shared/legal-versions.ts`. Material updates trigger re-consent via `LegalReconsentGate` where implemented.

---

## 17. Contact

| Matter | Email |
|--------|-------|
| Legal | legal@paeds-resus.com |
| Support / refunds | support@paeds-resus.com |
| Privacy | privacy@paeds-resus.com |

---

## 18. Related documents

| Document | Topic |
|----------|-------|
| PRIVACY_POLICY_FULL.md | Data processing |
| CLINICAL_INTENDED_USE_STATEMENT.md | ResusGPS positioning |
| INSTITUTIONAL_B2B_ADDENDUM.md | Hospitals |
| CARE_SIGNAL_DATA_PROCESSING_NOTICE.md | QI data |
| LEGAL_IMPLEMENTATION_INDEX.md | Engineering map |

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial counsel-ready full terms draft |

---

*© 2026 Paeds Resus Limited. All rights reserved.*
