# Individual Profile and Departments — Implementation Handoff

**Status:** Implemented; no database migration required.

## What changed

The Professional profile now exposes the fields required by the existing profile-readiness calculation. **Specialization** is editable in Professional Identity and is persisted through `provider.updateProfile` to `providerProfiles.specialization`. **Bio** is always visible in the Professional profile form for every account type and is persisted through the same provider-profile mutation.

The former duplicate workplace editor was removed from `ProviderProfileForm`. Facility and department editing remain owned by **Workplaces & access**, which is the live single source of truth. This eliminates a dead, gated copy of FacilityPicker, DepartmentSelectors, and facility metadata from the professional profile form.

Professional profile now links directly to **Workplaces & access** in both states: users with a saved department can choose **Change**, while users without one receive **Set it in Workplaces & access**.

## Department catalog

The shared catalog now includes first-class top-level entries for **Emergency Medicine**, **Anaesthesia and Critical Care Support**, **Pharmacy**, **Laboratory**, and **Radiology and Imaging**, with practical subdepartments. `Surgery → Theatre` remains available in the hierarchical catalog and the flat legacy catalog.

The legacy value `Out Patient Department: Accident and Emergency / Casualty` remains valid. The old OPD emergency entry was not removed, so existing saved profiles are not orphaned. Moving old values to the new Emergency Medicine parent would require a separate, explicitly approved data-cleanup migration and is intentionally out of scope.

## Recovery and safety

A user who selected the wrong cadre path can clear and reselect the Professional Identity values using the existing reversible selector. A user who entered the wrong specialization or bio can edit and resave those fields directly. Department corrections are made through Workplaces & access; the profile page now provides the route instead of duplicating workplace state.

The provider update contract already supported `specialization` and `bio`; this release makes those fields reachable and does not alter the completion algorithm or the 80% product threshold. No existing user profile was rewritten and no production data repair was performed.

## Validation

Focused department tests cover the new top-level catalog entries, Surgery → Theatre parity, and preservation of the legacy OPD emergency value. The provider-router regression file passes under the repository’s general Vitest configuration. The full repository check, unit suite, production build, prerender, and whitespace validation must pass before release.

## Rollback

Rollback is code-only: revert the ProfessionalIdentityCard, ProviderProfileForm, ProviderProfile, and shared clinical-departments changes. No schema rollback or data repair is required. Existing saved department strings remain safe because the legacy OPD emergency entry is preserved.
