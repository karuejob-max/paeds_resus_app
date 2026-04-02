# Clinical protocols (documentation)

**Purpose:** Authoritative narrative for each clinical protocol we ship: evidence alignment and where it lives in code (especially ResusGPS).

**Rule:** When you change ResusGPS pathways or the ABCDE engine, update the matching protocol doc in the same change (or follow-up PR immediately). Keep this folder aligned with `client/src/lib/resus/`.

## Relationship to ResusGPS

- **Identified pathways:** User picks a presentation and gets ordered steps. Code: `client/src/lib/resus/pathways/*.ts` and `pathways/index.ts`.
- **XABCDE engine:** Threats and interventions from primary survey answers (fluid ladder, vasopressors, etc.). Code: `client/src/lib/resus/abcdeEngine.ts`.

See [RESUSGPS_REGISTRY.md](./RESUSGPS_REGISTRY.md) for the full pathway list.

## Index of protocol documents

| Protocol | Doc | LMS / course |
|----------|-----|----------------|
| Paediatric septic shock | [paediatric-septic-shock.md](./paediatric-septic-shock.md) | [E2E Paediatric septic shock course](../E2E_PAEDIATRIC_SEPTIC_SHOCK_COURSE.md) |
| Seriously ill child (PALS-style) | *(future: seriously-ill-child.md)* | [E2E Seriously ill child](../E2E_SERIOUSLY_ILL_CHILD_COURSE.md) |

## Adding a new protocol

1. Copy [_TEMPLATE.md](./_TEMPLATE.md) to `docs/clinical-protocols/<slug>.md`.
2. Align ResusGPS code with the doc.
3. Add a row to the index table above; add an E2E course doc if we sell or assign training.

## Evidence and disclaimers

Educational and internal alignment only; not a substitute for hospital policy or licensure. Cite guideline families without reproducing proprietary full-text content.

## Related

- [RESUSGPS_DNA.md](../../RESUSGPS_DNA.md) (vision; not a substitute for implementation truth in this folder)
- [PLATFORM_SOURCE_OF_TRUTH.md](../PLATFORM_SOURCE_OF_TRUTH.md)
