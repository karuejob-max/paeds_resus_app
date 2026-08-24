# Paeds Resus IERS Documentation Index

**Status:** Canonical navigation map
**Version:** 1.0
**Updated:** 24 August 2026
**Owner:** Paeds Resus

This index is the quickest way to find the right IERS document. It prevents a new client, provider, administrator, or agent from having to read every file before understanding what to do.

> **Start here for a facility:** [IERS Client Onboarding and Operating Manual V1](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md).
> **Start here for a repository collaborator:** [`AGENTS.md`](../../AGENTS.md), then the [Paeds Resus Coherent Picture](../PAEDS_RESUS_COHERENT_PICTURE.md).

## 1. Which document should I read?

| Audience or task | Read first | Then use |
|---|---|---|
| Hospital CEO, Medical Director, DNS, county or insurer | [IERMS Standard V1](./IERMS_STANDARD_V1.md) | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md), [Audit Scorecard](./IERMS_AUDIT_SCORECARD_V1.md) |
| New institutional client implementation team | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) | [IERMS Implementation Suite](./IERMS_IMPLEMENTATION_SUITE.md), [IERS Operating Guide](./IERS_OPERATING_GUIDE_V1.md), [Facility Appendix Template](./IERS_FACILITY_ONBOARDING_APPENDIX_TEMPLATE.md) |
| Institution administrator | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) §7 and §17 | People & roles and administration UI, [Institution Portal Architecture](./INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md) |
| ERCo or IERS Lead | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) §8–§14 | [CPD/department/UTL workflow V2](./IERS_CPD_DEPARTMENT_AND_UTL_WORKFLOW_DESIGN_V2.md), [Provider Integration Architecture](./IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md) |
| UTL | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) §8–§9 | [IERS Operating Guide](./IERS_OPERATING_GUIDE_V1.md), local facility readiness appendix |
| ERTL or ERT member | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) §8 and §10–§12 | [Provider Integration Architecture](./IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md), labelled drill plan |
| Independent reviewer or QI lead | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) §12–§14 | [IERMS Standard](./IERMS_STANDARD_V1.md), [Observation Architecture](../OBSERVATION_ARCHITECTURE_V1_1.md) |
| Paeds Resus implementation/support team | [Client Onboarding Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) §6 and §18 | [IERMS Implementation Suite](./IERMS_IMPLEMENTATION_SUITE.md), [Operating Guide](./IERS_OPERATING_GUIDE_V1.md), [WORK_STATUS](../WORK_STATUS.md) |
| Developer or AI agent | [`AGENTS.md`](../../AGENTS.md) | [Coherent Picture](../PAEDS_RESUS_COHERENT_PICTURE.md), [Platform Source of Truth](../PLATFORM_SOURCE_OF_TRUTH.md), [Agent Operations Playbook](../AGENT_OPERATIONS_PLAYBOOK.md), this index |
| Clinical-content or safety change | [Clinical Safety Register](../CLINICAL_SAFETY_REGISTER.md) | [Clinical protocols index](../clinical-protocols/README.md), [Clinical Intended Use](../legal/CLINICAL_INTENDED_USE_STATEMENT.md) |
| Data, privacy, or adaptive-learning change | [Observation Architecture V1.1](../OBSERVATION_ARCHITECTURE_V1_1.md) | [Event Models V1](../EVENT_MODELS_V1.md), [Privacy Policy](../legal/PRIVACY_POLICY_FULL.md), [Care Signal notice](../legal/CARE_SIGNAL_DATA_PROCESSING_NOTICE.md) |
| Production release or migration | [`AGENTS.md`](../../AGENTS.md) § production rules | [Agent Operations Playbook](../AGENT_OPERATIONS_PLAYBOOK.md), [WORK_STATUS](../WORK_STATUS.md) |

## 2. The documentation hierarchy

The documents have different authority. They should not be treated as interchangeable.

| Level | Document | Authority |
|---|---|---|
| Constitutional | [Paeds Resus Coherent Picture](../PAEDS_RESUS_COHERENT_PICTURE.md), [North Star V2](../NORTH_STAR_V2.md) | Mission, identity, theory of change, and strategic direction |
| Data and learning governance | [Observation Architecture V1.1](../OBSERVATION_ARCHITECTURE_V1_1.md), [Event Models V1](../EVENT_MODELS_V1.md) | Observation, privacy, classifiers, learning transformation, and provenance |
| Product and technical | [Platform Source of Truth](../PLATFORM_SOURCE_OF_TRUTH.md) | Binding product, technical, auth, data, and priority decisions |
| External institutional standard | [IERMS Standard V1](./IERMS_STANDARD_V1.md) | Facility-level readiness domains and institutional standard |
| Client operation | [Client Onboarding and Operating Manual V1](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md), [Facility Appendix Template](./IERS_FACILITY_ONBOARDING_APPENDIX_TEMPLATE.md) | How an adopting facility onboards, operates, reviews, and escalates, including its local contacts and policies |
| Rollout playbook | [IERMS Implementation Suite](./IERMS_IMPLEMENTATION_SUITE.md) | 90-day implementation sequence and deliverables |
| Provider operation | [Provider Integration Architecture V1](./IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md), [New-User Orientation Guide](./IERS_NEW_USER_ORIENTATION_GUIDE.md) | Individual-platform roles, duties, acceptance, response, and improvement |
| Engineering operation | [`AGENTS.md`](../../AGENTS.md), [Agent Operations Playbook](../AGENT_OPERATIONS_PLAYBOOK.md) | Repository safety, protected releases, migrations, testing, and handoff |
| Execution record | [WORK_STATUS](../WORK_STATUS.md) | What has actually shipped, been verified, blocked, or remains pending |

When documents conflict, use this order: technical/product questions follow the Platform Source of Truth; data and learning questions follow Observation Architecture; strategic questions follow the North Star; operational questions follow the approved facility policy and the current product contract. Record unresolved conflict in WORK_STATUS rather than silently choosing a convenient interpretation.

## 3. What already existed and what was missing

The repository already contained strong pieces, but they were fragmented by audience. The [IERMS Standard](./IERMS_STANDARD_V1.md) was the strongest external policy document but was written primarily for institutional leadership. The [IERMS Implementation Suite](./IERMS_IMPLEMENTATION_SUITE.md) covered the 90-day rollout but did not function as a daily role manual. The [IERS Operating Guide](./IERS_OPERATING_GUIDE_V1.md) documented the operating loop and safety states. The [IERS New-User Orientation Guide](./IERS_NEW_USER_ORIENTATION_GUIDE.md) explained the portals and role ownership. The provider-integration architecture defined the Individual-platform contract. The engineering runbooks served agents.

What was missing was a single external-facing bridge that a new client could use to move from executive approval to named people, configured departments, accepted duties, readiness checks, response, review, and improvement. This index and the [Client Onboarding and Operating Manual](./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md) fill that gap without replacing the existing standards or engineering runbooks.

## 4. Minimum documentation a client needs

A facility should receive, at minimum, the following package:

1. This index, to direct people to the correct source.
2. The Client Onboarding and Operating Manual, to explain the roles and daily workflow.
3. The IERMS Standard, to explain the institutional standard and five readiness domains.
4. The IERMS Implementation Suite, to plan the first 90 days.
5. A facility-specific appendix containing the local emergency policy, call/escalation numbers, department and pole map, ERCo/UTL/ERTL names, approved readiness-template version, crash-cart locations, restocking owners, and reviewer contacts. Use the [Facility Onboarding Appendix Template](./IERS_FACILITY_ONBOARDING_APPENDIX_TEMPLATE.md) rather than inventing a new local format.
6. The legal/privacy documents applicable to the institution’s agreement and reporting channels.

The facility-specific appendix is essential. Paeds Resus must not invent local phone numbers, drug stocks, equipment locations, response targets, escalation authorities, or scope-of-practice permissions.

## 5. Minimum documentation the repository needs

The repository should retain the following stable set:

- Constitutional and product truth: Coherent Picture, North Star, Observation Architecture, Platform Source of Truth.
- External institutional policy: IERMS Standard.
- Client operation: Client Onboarding and Operating Manual plus the Facility Onboarding Appendix Template.
- Client rollout: IERMS Implementation Suite.
- Provider orientation and architecture: New-User Orientation Guide and Provider Integration Architecture.
- Technical agent operation: AGENTS, Agent Operations Playbook, AI Team Workflow, and relevant checklists.
- Execution evidence: WORK_STATUS and dated operational deployment notes.

New documents should be added only when they answer a distinct question. Do not create a second policy manual for the same audience. Update this index and the PSOT registry when a new canonical document is created.

## 6. First-day reading plans

### New client leadership

Read the executive summary and five-domain framework in the IERMS Standard. Then read §§2–7 and §§15–17 of the Client Onboarding Manual. End by naming the executive sponsor, clinical governance lead, implementation lead, institution admin, IERS Lead, and independent reviewer.

### New provider

Read §§2–4, §§8–12, and §17 of the Client Onboarding Manual. Then open the Individual platform and confirm institution, department, standing role, dated duty, acceptance state, readiness task, and reporting boundaries. Providers should never be asked to enter patient identifiers into IERS improvement records.

### New ERCo or UTL

Read §§4, 5, 7–9, 12, and 14 of the Client Onboarding Manual. Then demonstrate one labelled, non-emergency staffing and readiness workflow using no real patient information.

### New agent

Read `AGENTS.md` in full, then the Coherent Picture, Platform Source of Truth, relevant product specification, this index, and WORK_STATUS. Before changing code or schema, confirm the fresh `main` baseline, migration reservation, test plan, protected PR path, deployment gate, and production migration approval boundary.

## References

[1]: ./IERS_CLIENT_ONBOARDING_AND_OPERATING_MANUAL_V1.md "IERS Client Onboarding and Operating Manual V1"

[2]: ./IERMS_STANDARD_V1.md "IERMS Standard V1"

[3]: ./IERMS_IMPLEMENTATION_SUITE.md "IERMS Implementation Suite"

[4]: ./IERS_OPERATING_GUIDE_V1.md "IERS Operating Guide V1"

[5]: ./IERS_NEW_USER_ORIENTATION_GUIDE.md "IERS New-User Orientation Guide"

[6]: ./IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md "IERS Provider Integration and Individual Portal Architecture V1"

[7]: ../PLATFORM_SOURCE_OF_TRUTH.md "Platform Source of Truth"

[8]: ../PAEDS_RESUS_COHERENT_PICTURE.md "Paeds Resus Coherent Picture"

[9]: ../OBSERVATION_ARCHITECTURE_V1_1.md "Observation Architecture V1.1"

[10]: ../../AGENTS.md "Repository operating and recovery rules"

[11]: ../AGENT_OPERATIONS_PLAYBOOK.md "Agent Operations Playbook"

[12]: ../WORK_STATUS.md "Paeds Resus work-status log"
