# Engineering governance checklist (until compliance is fully locked)

**PSOT:** [PLATFORM_SOURCE_OF_TRUTH.md §11](./PLATFORM_SOURCE_OF_TRUTH.md) — data retention, PHI, and full compliance posture are **not fully defined**. This checklist is **minimal discipline** for shipping safely.

---

## 1. HTML and rich content

- Prefer React-rendered text. Where **`dangerouslySetInnerHTML`** or CMS HTML is used, treat input as **trusted-only** (admin-seeded, reviewed) unless sanitisation (e.g. DOMPurify) is explicitly approved.
- Do not inject user-supplied HTML into clinical flows without review.

---

## 2. PHI and browser storage

- **Assume** clinical-adjacent strings (symptoms, weights, free text) need **appropriate handling** per future policy.
- Avoid storing unnecessary identifiers in **localStorage** / **IndexedDB**; prefer session-scoped or server-side storage when adding new features.
- Existing offline/sync stores: document purpose in PR when extended.

---

## 3. Clinical pathways & claims

- **PSOT §2–3:** Support professional judgment; avoid overstated outcome claims in user-facing copy.
- Pathway changes (protocol text, doses): align with **clinical review** process when the organisation defines one; track **owner / version / review date** in internal docs when leadership requires it.

---

## 4. Analytics

- Use the **standard** path to **`analyticsEvents`** ([PSOT §8](./PLATFORM_SOURCE_OF_TRUTH.md))—no shadow metrics tables for the same KPI.

---

## 5. When policy locks

Replace or shrink this file when legal/clinical defines retention, PHI classification, and sanitisation rules—then reflect **canonical** rules in PSOT §11 and archive superseded notes.
