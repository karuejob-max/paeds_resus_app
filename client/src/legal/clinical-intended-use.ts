import { LEGAL_CONTACT, LEGAL_DOCUMENT_VERSIONS, LEGAL_LAST_UPDATED } from "@shared/legal-versions";
import type { LegalDocumentMeta } from "./types";

export const clinicalIntendedUseDocument: LegalDocumentMeta = {
  title: "Clinical Intended Use — ResusGPS",
  version: LEGAL_DOCUMENT_VERSIONS.clinicalIntendedUse,
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    "This statement defines the intended use, intended user, limitations, and regulatory positioning of ResusGPS for counsel, clinical governance, institutional MOUs, and bedside disclaimers.",
  sections: [
    {
      id: "identification",
      title: "1. Product identification",
      bullets: [
        "Product name: ResusGPS (software route /resus and related pathway modules).",
        "Operator: Paeds Resus Limited, Nairobi, Kenya.",
        "ResusGPS is a product name only — the broader Paeds Resus platform includes separate products with separate intended uses.",
      ],
    },
    {
      id: "intended-use",
      title: "2. Intended use",
      paragraphs: [
        "ResusGPS provides structured paediatric emergency reference support for trained healthcare providers during resuscitation and acute stabilisation, including ABCDE prompts, CPR clock, age- and weight-banded drug dosing calculators, condition-specific pathway steps, and checklist-style escalation reminders.",
        "Intended outcome: improved adherence to evidence-informed teaching pathways and local protocol alignment — not autonomous diagnosis or treatment without provider judgment.",
      ],
    },
    {
      id: "users",
      title: "3. Intended users",
      bullets: [
        "Licensed clinicians and trainees under supervision: in scope.",
        "Nurses and clinical officers in paediatric emergency: in scope.",
        "Lay caregivers: out of scope — use public emergency numbers.",
        "Parents (Parent Safe-Truth lane): out of scope — separate product.",
        "Automated devices / closed-loop pumps: out of scope — no device integration.",
      ],
      paragraphs: [
        "Users must complete appropriate paediatric emergency training and follow facility-approved protocols that may supersede default pathway parameters.",
      ],
    },
    {
      id: "environment",
      title: "4. Intended use environment",
      bullets: [
        "Hospital emergency departments, paediatric wards, HDU/ICU, ambulances where mobile connectivity exists.",
        "Low- and middle-income settings with teaching emphasis on fluid caution (e.g. FEAST-informed septic shock education).",
        "Not for sole reliance in environments without senior support when scope of practice requires escalation.",
      ],
    },
    {
      id: "limitations",
      title: "5. What ResusGPS does NOT do",
      bullets: [
        "Replace clinical examination, investigations, or senior review.",
        "Constitute medical advice or a doctor–patient relationship with Paeds Resus.",
        "Operate as emergency dispatch or ambulance coordination.",
        "Store a legal medical record — session age/weight is browser context; saved Fellowship cases exclude patient names.",
        "Guarantee correct drug administration — verify concentrations, routes, allergies, and local formulary.",
        "Provide ventilator, defibrillator, or infusion pump control.",
        "Diagnose disease with regulatory-grade diagnostic claims.",
        "Enforce mandatory reporting to employers or regulators.",
      ],
      paragraphs: [
        "If the app fails to load, providers must use offline training, paper protocols, and emergency services.",
      ],
    },
    {
      id: "regulatory",
      title: "6. Medical device positioning (Kenya draft — counsel to confirm)",
      paragraphs: [
        "Paeds Resus Limited positions ResusGPS as non-device clinical decision support software that presents educational pathways and arithmetic dosing aids for qualified users who retain full responsibility for care.",
        "No SaMD clearance is claimed at v1.0.0. Obtain written Kenya counsel memo on PPB/MOH/KEBS applicability before expanding public-hospital marketing.",
      ],
    },
    {
      id: "lmic-fluid",
      title: "7. LMIC fluid strategy disclaimer",
      paragraphs: [
        "Septic shock and fluid resuscitation content reflects evidence-informed teaching including caution in malnutrition and FEAST-context settings. Default pathway parameters may differ from facility protocol. Follow local protocol when conflict exists; escalate to senior clinicians for complex fluid decisions.",
      ],
    },
    {
      id: "emergency",
      title: "8. Emergency services",
      paragraphs: [
        "Kenya: call 999 or 112. Call emergency services first in life-threatening emergencies.",
      ],
    },
    {
      id: "incidents",
      title: "9. Incident reporting",
      paragraphs: [
        `Adverse events related to software usability or content errors should be reported to ${LEGAL_CONTACT.supportEmail} with facility, date, and description (no patient identifiers). Serious clinical incidents follow facility and national reporting rules independently of Paeds Resus.`,
      ],
    },
    {
      id: "acknowledgement",
      title: "10. User acknowledgement (reference)",
      paragraphs: [
        "ResusGPS is structured paediatric emergency reference support for trained providers. Not medical advice. Not an emergency service. You remain clinically responsible. Call 999 or 112 in Kenya.",
      ],
    },
  ],
};
