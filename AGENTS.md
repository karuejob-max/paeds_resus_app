# AGENTS.md — Mandatory Pre-Read for All AI Agents
**Read this file before doing anything else in this repository.**  
**Last updated:** May 1, 2026  
**Owner:** Job Karue (Chair, Paeds Resus)

---

## 1. Brand Architecture (CRITICAL — Never Confuse These)

This is the single most common source of error for AI agents working on this project. Read this section carefully and apply it with precision in every response, document, and code change.

| Entity | What It Is | Used In |
| :--- | :--- | :--- |
| **Paeds Resus** | The **brand / parent company** | Logo, copyright, website title, all user-facing copy, social media |
| **Paeds Resus Limited** | The **legal entity / AHA-aligned training provider** | Invoices, certificates, training sign-up forms, WhatsApp messages about BLS/ACLS/PALS |
| **ResusGPS** | A **product** of Paeds Resus — the point-of-care bedside clinical decision support app | The `/resus` route, CPR Clock, ABCDE flow, drug calculators, clinical protocols |
| **Care Signal** | A **product** of Paeds Resus — provider incident and near-miss reporting | The `/care-signal` route |
| **Parent Safe-Truth** | A **product** of Paeds Resus — family-facing safety information | The `/parent-safe-truth` route |

### The One-Line Rule:
> **Paeds Resus** is the company. **ResusGPS** is one of its apps. They are NOT the same thing and must NEVER be used interchangeably.

### Practical Examples:
- ✅ "Sign up for training delivered by **Paeds Resus Limited**."
- ✅ "During a Code Blue, open **ResusGPS** on your phone."
- ✅ "The **Paeds Resus** Institutional Portal manages your hospital's ERT."
- ❌ "Sign up for training on **ResusGPS**." ← WRONG. ResusGPS is the bedside tool, not the training system.
- ❌ "The **ResusGPS** Institutional Portal..." ← WRONG. The portal belongs to Paeds Resus, not ResusGPS.
- ❌ "**ResusGPS** will sponsor your BLS..." ← WRONG. Paeds Resus Limited sponsors training.

---

## 2. Platform Products Summary

```
Paeds Resus (Brand)
├── Paeds Resus Limited (Legal entity — AHA Training Provider)
│   ├── BLS Certification
│   ├── ACLS Certification
│   └── PALS Certification
├── ResusGPS (App — Bedside Clinical Decision Support)
│   ├── CPR Clock
│   ├── ABCDE Assessment Flow
│   ├── Drug & Weight Calculators
│   └── Emergency Protocols
├── Care Signal (App — Incident Reporting)
└── Parent Safe-Truth (App — Family Safety Information)
```

---

## 3. Active Institutional Client: Consolata Hospital Mathari (CHM)

CHM is the **first live Paeds Resus Institutional Pro customer**. Their configuration is the **Gold Standard Template** for all future hospital onboarding.

- **Template file:** `CHM_GOLD_STANDARD_TEMPLATE.md` (repo root)
- **Training provider:** Paeds Resus Limited (AHA-Aligned Training Site)
- **ERT Launch date:** April 27, 2026
- **ERT Chair:** Job Karue
- **Pole structure:** North Pole (Lead: Irene Gatwiri) + South Pole (Lead: Danson)
- **Training sign-up form:** https://docs.google.com/forms/d/1n3SfP9DuHH8RK9quSe8w1dWD1cjFKmZ8ZNufGoMrDNU/viewform
- **Tracking dashboard:** https://docs.google.com/spreadsheets/d/1NFbGB1HoORWCa3FS_0lfxkuV2YYcU-IEZPU87PfyW-0/edit
- **Training WhatsApp group:** https://chat.whatsapp.com/JU6G7K6mkUz5Cbc09jt09b?mode=gi_t

---

## 4. Key Strategic Mandates

1. **Mission:** Reduce preventable child deaths. Every feature must answer: *"Does this save a child's life?"*
2. **Financial goal:** Build toward a $1B+ platform valuation.
3. **Clinical standard:** All protocols must align with AHA guidelines and be weight-based, evidence-based, and sequentially correct.
4. **Scale model:** CHM is the proof of concept. The app is the scale engine. Any new hospital should be operational in < 30 minutes using a template.
5. **No lock-in:** Always maintain domain control, DNS backup, auth fallback, and data export paths.

---

## 5. Key Files to Read Before Major Work

| File | Purpose |
| :--- | :--- |
| `RESUSGPS_DNA.md` | Core platform DNA — 7 strands, mission, success metrics |
| `docs/BRAND_UPDATE_PAEDS_RESUS.md` | Full brand update history (ResusGPS → Paeds Resus) |
| `docs/INSTITUTIONAL_BACKLOG_BOARD.md` | Current institutional feature backlog (INST-0 to INST-15) |
| `docs/BACKLOG_HIGH_IMPACT.md` | High-impact platform-wide roadmap |
| `CHM_GOLD_STANDARD_TEMPLATE.md` | CHM configuration as reusable institutional template |
| `INSTITUTIONAL_OS_BLUEPRINT.md` | 4-module Institutional OS architecture blueprint |

---

## 6. Development Rules

- **Never break the core emergency flow:** open app → enter findings → get priority next actions → reassessment prompts.
- **Small, reviewable changes only.** No big rewrites unless absolutely necessary.
- **All changes must be pushed to GitHub** for Cursor and other developers to access.
- **Clinical content changes** require explicit approval from Job Karue before merging.
- **Brand naming:** Always use "Paeds Resus" in user-facing copy. "ResusGPS" is reserved for the bedside clinical tool only.
- **Avoid broad error suppression** or hidden shortcuts without explicit approval.

---

## 7. Contact & Ownership

- **Owner:** Job Karue — PICU Nurse, Entrepreneur, ERT Chair
- **Email:** paedsresus254@gmail.com
- **LinkedIn:** https://www.linkedin.com/company/paeds-resus/
- **Website:** https://www.paedsresus.com

---

*This file must be updated whenever a major strategic, brand, or architectural decision is made.*
