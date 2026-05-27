# Master Services Agreement (B2B) — Template

**Document:** B2B_MSA_TEMPLATE.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft — template for execution (Phase 5 institutional GTM)  
**Platform operator:** Paeds Resus Limited, Nairobi, Kenya  
**Contact:** legal@paeds-resus.com | privacy@paeds-resus.com  

**Related documents:** [INSTITUTIONAL_B2B_ADDENDUM.md](./INSTITUTIONAL_B2B_ADDENDUM.md) (MOU + DPA terms), [PILOT_HOSPITAL_MOU_TEMPLATE.md](./PILOT_HOSPITAL_MOU_TEMPLATE.md), [TERMS_OF_USE_FULL.md](./TERMS_OF_USE_FULL.md), [DATA_RETENTION_SCHEDULE.md](./DATA_RETENTION_SCHEDULE.md)

---

## Instructions for counsel and sales

1. Complete all bracketed fields before execution.
2. Attach **Schedule A** (Services & fees) and **Schedule B** (Data Processing Addendum — may cross-reference INSTITUTIONAL_B2B_ADDENDUM Part B).
3. For **90-day pilots**, use [PILOT_HOSPITAL_MOU_TEMPLATE.md](./PILOT_HOSPITAL_MOU_TEMPLATE.md) first; convert to this MSA on renewal.
4. Institution must complete in-product B2B acceptance (`legal.acceptInstitutionalB2b`) before production access.

---

## MASTER SERVICES AGREEMENT

**MSA Reference:** [PR-MSA-YYYY-NNN]  
**Effective date:** [DATE]

This Master Services Agreement (“**Agreement**”) is entered into between:

| Party | Details |
|-------|---------|
| **Paeds Resus Limited** | Nairobi, Kenya; company registration [REG NO]; “**Provider**” |
| **[Customer legal name]** | [Address]; registration [REG NO if applicable]; “**Customer**” |

Provider and Customer are each a “**Party**” and together the “**Parties**”.

---

### 1. Definitions

1.1 **Platform** means the Paeds Resus web application and related services (Fellowship training, ResusGPS reference support, Care Signal QI reporting, institutional dashboards, Safe-Truth where enabled).

1.2 **Authorised Users** means Customer’s employees and contractors authorised by Customer to use the Platform under Customer’s institutional account.

1.3 **Customer Data** means data submitted to the Platform by or on behalf of Customer or Authorised Users, excluding Aggregated/De-identified Data.

1.4 **Services** means the subscription modules listed in Schedule A.

1.5 **Documentation** means counsel-approved terms at `/terms`, `/privacy`, `/legal/*`, and `docs/legal/` as referenced in [LEGAL_IMPLEMENTATION_INDEX.md](./LEGAL_IMPLEMENTATION_INDEX.md).

---

### 2. Scope of services

2.1 Provider grants Customer a **non-exclusive, non-transferable** right for Authorised Users to access the Services during the Term, subject to this Agreement and Documentation.

2.2 **ResusGPS** is clinical **decision support only** — not medical advice, not an emergency service. Customer remains clinically responsible for bedside care per [CLINICAL_INTENDED_USE_STATEMENT.md](./CLINICAL_INTENDED_USE_STATEMENT.md).

2.3 **Care Signal** supports quality improvement. Customer shall not use Platform data as the sole basis for disciplinary action without fair process and applicable labour law.

2.4 Provider may update the Platform for security, compliance, and product improvement. Material adverse changes to Services will be notified with **30 days** notice where practicable.

---

### 3. Customer obligations

3.1 Customer shall:

- Ensure Authorised Users are trained healthcare or administrative staff appropriate to each module
- Maintain accurate roster and facility linkage data
- Appoint an internal **data/privacy liaison** and **clinical governance lead**
- Comply with Documentation, including consent flows for Care Signal and institutional onboarding
- Not reverse-engineer, scrape, or resell Platform access except as expressly permitted

3.2 Customer is responsible for local clinical protocols, emergency services contact, and senior clinical review prevailing over Platform content.

3.3 Customer shall not publish mortality league tables, public facility rankings, or outcome superiority claims derived from Platform data without written joint approval and external review.

---

### 4. Fees and payment

4.1 Fees are set out in **Schedule A**.

4.2 **M-Pesa** and invoice terms per TERMS_OF_USE_FULL.md §6. Late payment may suspend access after **14 days** written notice.

4.3 Taxes: Customer responsible for applicable VAT/withholding unless Provider quotes inclusive pricing.

4.4 **Refund policy:** [Link to published M-Pesa refund policy — CEO to publish before scale]

---

### 5. Term and termination

5.1 **Initial term:** [12 months / pilot 90 days per MOU] from Effective date.

5.2 **Renewal:** Auto-renews for successive [12]-month periods unless either Party gives **60 days** written notice before expiry.

5.3 **Termination for convenience:** Either Party may terminate on **60 days** written notice after initial term (or **14 days** during pilot per MOU).

5.4 **Termination for cause:** Either Party may terminate immediately for material breach uncured within **30 days** of notice, insolvency, or unlawful use.

5.5 **Effect of termination:**

- Access ends at termination effective date
- Customer may request export of facility aggregates and training completion CSV within **30 days**
- Provider will delete or anonymise Customer-scoped data within **90 days** per DATA_RETENTION_SCHEDULE.md, except legal/tax retention

---

### 6. Data protection

6.1 **Schedule B** (Data Processing Addendum) is incorporated by reference. If conflict, Schedule B prevails for personal data processing.

6.2 Customer acknowledges sub-processors at `/legal/subprocessors` and EU database hosting per Privacy Policy.

6.3 Breach notification: Provider will notify Customer without undue delay and within **72 hours** where required by applicable law.

---

### 7. Confidentiality

7.1 Each Party shall protect the other’s confidential information with reasonable care for **3 years** after termination (trade secrets indefinitely).

7.2 Exclusions: public domain, independently developed, or required by law (with notice where permitted).

---

### 8. Intellectual property

8.1 Provider retains all rights in the Platform, Documentation, and aggregated anonymised analytics models.

8.2 Customer retains rights in Customer Data. Customer grants Provider a licence to process Customer Data to deliver Services and improve Platform security/reliability.

8.3 **Fellowship / AHA-aligned content:** Certificate issuance subject to Provider accreditation status and Terms §5.

---

### 9. Warranties and disclaimers

9.1 Provider warrants it will deliver Services with reasonable skill and care.

9.2 **EXCEPT AS STATED, SERVICES ARE PROVIDED “AS IS.”** Provider disclaims implied warranties including fitness for a particular clinical outcome.

9.3 Customer warrants it has authority to enter this Agreement and share Authorised User data.

---

### 10. Limitation of liability

10.1 Subject to §10.3, each Party’s aggregate liability arising from this Agreement is capped at **fees paid by Customer in the 12 months** preceding the claim.

10.2 Neither Party is liable for indirect, consequential, or lost-profit damages.

10.3 Cap does not apply to: (a) death/personal injury from negligence; (b) fraud; (c) Customer’s payment obligations; (d) breaches of confidentiality or data protection law where uncapped by mandatory law.

10.4 **Clinical responsibility** remains with Customer and Authorised Users at all times.

---

### 11. Indemnity

11.1 Customer shall indemnify Provider against claims arising from Customer’s clinical decisions, misuse of Platform, or breach of this Agreement — except to the extent caused by Provider’s gross negligence or wilful misconduct.

---

### 12. Governing law and disputes

12.1 **Laws of Kenya.** Courts of **Nairobi, Kenya** have exclusive jurisdiction.

12.2 Parties will attempt good-faith executive resolution for **30 days** before litigation.

---

### 13. General

13.1 Entire agreement; amendments in writing signed by both Parties.

13.2 Order of precedence: (1) executed Schedule A/B; (2) this MSA; (3) INSTITUTIONAL_B2B_ADDENDUM Part B if incorporated; (4) Terms of Use and Privacy Policy for end-user flows.

13.3 Neither Party may assign without consent, except Provider may assign to an affiliate or acquirer.

13.4 Force majeure: neither Party liable for events beyond reasonable control (excluding payment obligations).

---

### Signatures

| For Paeds Resus Limited | For [Customer] |
|-------------------------|----------------|
| Name: __________________ | Name: __________________ |
| Title: __________________ | Title: __________________ |
| Date: ____________________ | Date: ____________________ |

---

## Schedule A — Services and fees

| Module | Included (Y/N) | Seat / facility cap | Fee (KES) | Notes |
|--------|----------------|---------------------|-----------|-------|
| Institutional dashboard | [ ] | [N staff] | [AMOUNT] | Roster, training schedules |
| Care Signal facility tab | [ ] | [N providers] | [AMOUNT] | QI aggregates only |
| ResusGPS institutional access | [ ] | [N providers] | [AMOUNT] | Reference support — not SaMD claim |
| Fellowship institutional enrolment | [ ] | [N seats] | [AMOUNT] | Per course pricing may apply |
| Action log / QI workflow | [ ] | — | [INCLUDED] | Phase 4 vertical slice |
| Support SLA | — | — | — | support@paeds-resus.com; business hours EAT |

**Billing cycle:** [Monthly / Annual upfront]  
**Payment method:** [M-Pesa STK / Invoice / Bank transfer]

---

## Schedule B — Data Processing Addendum (summary)

Incorporates [INSTITUTIONAL_B2B_ADDENDUM.md](./INSTITUTIONAL_B2B_ADDENDUM.md) **Part B** in full. Key points:

| Topic | Reference |
|-------|-----------|
| Roles (controller/processor) | Addendum B.1 |
| Institution instructions | Addendum B.2 |
| Sub-processors | `/legal/subprocessors` |
| Retention / deletion | DATA_RETENTION_SCHEDULE.md |
| DSAR assistance | DSAR_PROCEDURE.md — 30-day SLA |
| Care Signal institutional use | Addendum B.11–B.12 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | v1.0.0 — Initial counsel-ready B2B MSA template (Phase 5) |

---

*© 2026 Paeds Resus Limited. Template only — not legal advice. Obtain qualified counsel review before execution.*
