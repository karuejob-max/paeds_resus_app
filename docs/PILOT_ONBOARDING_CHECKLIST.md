# Clinical outcomes pilot — CEO onboarding checklist

**Audience:** Job Karue (CEO)  
**Goal:** Execute hospital MOU and enable a safe 90-day QI pilot (septic shock vertical slice).  
**References:** [PILOT_HOSPITAL_MOU_TEMPLATE.md](./legal/PILOT_HOSPITAL_MOU_TEMPLATE.md), [CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md), [INSTITUTIONAL_B2B_ADDENDUM.md](./legal/INSTITUTIONAL_B2B_ADDENDUM.md), [STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md)

---

## 1. Hospital selection criteria

Select **one** partner facility that meets:

| Criterion | Required |
|-----------|----------|
| County or referral hospital with paediatric emergency volume | Yes |
| Medical director willing to sign MOU and chair monthly QI review | Yes |
| Identified **champion nurse** (≥0.5 FTE coaching time during pilot) | Yes |
| Data/privacy liaison (DPO or equivalent) available for Schedule B review | Yes |
| Institutional account on Paeds Resus (or commitment to complete onboarding) | Yes |
| Accepts process metrics only — no public mortality claims | Yes |
| Septic shock pathway aligned with local protocol (CEO clinical note in [CLINICAL_REVIEW_SEPTIC_SHOCK_I.md](./CLINICAL_REVIEW_SEPTIC_SHOCK_I.md)) | Review |

**Shortlist template:**

| Hospital | County | Medical director | Champion nurse | Notes |
|----------|--------|------------------|----------------|-------|
| | | | | |

---

## 2. MOU signing (counsel-ready package)

- [ ] Complete [PILOT_HOSPITAL_MOU_TEMPLATE.md](./legal/PILOT_HOSPITAL_MOU_TEMPLATE.md) bracketed fields
- [ ] Attach Schedule A baseline targets (TBD → numeric after baseline month)
- [ ] Confirm Schedule B / INSTITUTIONAL_B2B_ADDENDUM Part B reviewed by hospital privacy liaison
- [ ] CEO sign for Paeds Resus Limited; hospital signatory = medical director
- [ ] Champion nurse + privacy liaison acknowledgement lines signed
- [ ] Scan executed PDF to secure ops folder; record MOU reference in CRM / WORK_STATUS

**Counsel:** Final joint-controller vs processor wording per ODPC guidance before production data flows.

---

## 3. Enable pilot on staging (engineering)

After MOU signed:

- [ ] Set on **staging** `.env` (never commit secrets):
  - `CLINICAL_OUTCOMES_PILOT_ENABLED=true`
  - `PILOT_FACILITY_IDS=<institutionalAccountId>` (comma-separated if multiple test facilities)
- [ ] Redeploy staging; confirm Admin Reports → **Maturity** tab shows pilot status **enabled**
- [ ] Hospital admin dashboard shows **Pilot program** badge for listed facility IDs
- [ ] Run holistic loop smoke: ResusGPS save → Care Signal → institutional action log ([E2E_TEST_SETUP.md](./E2E_TEST_SETUP.md))

Production: **do not** enable without explicit CEO flag and governance table in CLINICAL_OUTCOMES_PILOT.md signed.

---

## 4. Champion training (week 0)

- [ ] 60–90 min session: ResusGPS septic shock path, Care Signal v2 steps, action log workflow
- [ ] Share [CLINICAL_INTENDED_USE_STATEMENT.md](./legal/CLINICAL_INTENDED_USE_STATEMENT.md) — decision support only
- [ ] Confirm providers linked to facility via profile / facility picker
- [ ] Non-retaliation QI policy communicated internally at hospital

---

## 5. Baseline month (Schedule A)

- [ ] Freeze baseline start/end dates in MOU Schedule A
- [ ] Export Admin **Maturity KPIs (CSV)** weekly during baseline
- [ ] Record baseline counts in CLINICAL_OUTCOMES_PILOT.md metric table
- [ ] Medical director sign-off: baseline complete → go-live date

---

## 6. Weekly review during 90-day intervention

Each week (CEO or delegate + champion):

- [ ] Admin Reports → **Maturity** → **Export maturity KPIs (CSV)**
- [ ] Review: Care Signal submission rate, ResusGPS sessions, action log open/closed counts
- [ ] Institutional **action log** tab: assign owners, move open → in progress → completed
- [ ] Document ≥3 system changes linked to gaps by end of pilot (target in CLINICAL_OUTCOMES_PILOT.md)
- [ ] No external press or MOH slides without joint governance approval

**Institutional action log workflow:** Care Signal submit may auto-draft action log entries for linked facilities; hospital admin completes gap text and closure (see Hospital Admin dashboard → Action log tab).

---

## 7. Pilot close-out

- [ ] Final KPI CSV export at day 90
- [ ] Internal QI report (not public) — medical director + CEO
- [ ] Decision: extend, second hospital LOI, or disable `CLINICAL_OUTCOMES_PILOT_ENABLED`
- [ ] Update [WORK_STATUS.md](./WORK_STATUS.md) and [MATURITY_REMAINING_PRIORITIES.md](./MATURITY_REMAINING_PRIORITIES.md)

---

## CEO actions remaining after engineering prep

| Action | Owner |
|--------|-------|
| Pick hospital from shortlist | CEO |
| Sign MOU with hospital medical director | CEO |
| Counsel review of executed MOU + Schedule B | CEO + counsel |
| Baseline month + go-live date | CEO + medical director |

---

*Last updated: 2026-05-27*