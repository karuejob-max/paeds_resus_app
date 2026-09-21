export type EventDataClass =
  | 'production_clinical'
  | 'training_simulation'
  | 'manikin_drill'
  | 'synthetic_fixture'
  | 'test'
  | 'unknown';

export interface EventProvenanceEnvelope {
  provenanceSchemaVersion: 1;
  sourceProduct: 'resusgps';
  dataClass: EventDataClass;
  quarantineStatus: 'pending_review' | 'cleared';
  analyticsEligible: false;
  serverAssigned: true;
  activationLinked: boolean;
}

/**
 * ResusGPS events are not production-QI evidence by default. A later governed
 * provenance service may clear a row after tenant, scenario, and deployment
 * context are verified; clients cannot claim production clinical provenance.
 */
export function defaultResusGpsProvenance(activationLinked: boolean): EventProvenanceEnvelope {
  return {
    provenanceSchemaVersion: 1,
    sourceProduct: 'resusgps',
    dataClass: 'unknown',
    quarantineStatus: 'pending_review',
    analyticsEligible: false,
    serverAssigned: true,
    activationLinked,
  };
}
