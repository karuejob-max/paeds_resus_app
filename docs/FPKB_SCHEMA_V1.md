# Failure Pattern Knowledge Base — Schema Specification v1.0

**Status:** Reference stub. The full document is maintained as `Paeds_Resus_FPKB_Schema.docx` (7 sections, 1,155 paragraphs).

**Summary of contents:** Section 1 (Purpose and Position — relationship to existing operational tables), Section 2 (Core Knowledge Tables — kb_failure_modes, kb_success_factors, kb_patterns, kb_pattern_modes, kb_pattern_observations, kb_content_versions), Section 3 (Action Tables — kb_recommendations, kb_interventions, kb_implementations), Section 4 (Governance and Audit Tables — kb_review_schedule, kb_governance_audit [append-only], kb_evidence_links), Section 5 (Indexes, Constraints, and the 12-migration sequence), Section 6 (Initial Taxonomy Seed Data — 28 failure modes, 10 success factors), Section 7 (Application Layer Requirements — confidence update rules, concept drift automated downgrade, implementation outcome feedback, Knowledge Stewardship API).

**Action required:** Implement migrations A–L per Section 5.3 sequencing. Apply only after Care Signal v3 ships (per PSoT §12 item 5). Convert this stub to the full markdown spec or maintain the .docx as authoritative source.
