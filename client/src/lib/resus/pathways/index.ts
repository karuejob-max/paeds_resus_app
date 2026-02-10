import type { Pathway, PathwayId } from '../stateMachine';
import { cardiacArrestPathway } from './cardiacArrest';
import { breathingPathway } from './breathing';
import { shockPathway } from './shock';
import { seizurePathway } from './seizure';
import { metabolicPathway } from './metabolic';
import { allergicPathway } from './allergic';
import { traumaPathway } from './trauma';
import { newbornPathway } from './newborn';

// Single registry. One source of truth.
export const pathwayRegistry = new Map<PathwayId, Pathway>([
  ['cardiac_arrest', cardiacArrestPathway],
  ['breathing', breathingPathway],
  ['shock', shockPathway],
  ['seizure', seizurePathway],
  ['metabolic', metabolicPathway],
  ['allergic', allergicPathway],
  ['trauma', traumaPathway],
  ['newborn', newbornPathway],
]);

// Pathways shown in IDENTIFY state (provider picks what they see)
export const identifyOptions: { id: PathwayId; label: string; icon: string; description: string }[] = [
  { id: 'breathing', label: 'Breathing Difficulty', icon: '🫁', description: 'Wheezing, stridor, retractions, low O2' },
  { id: 'shock', label: 'Shock / Poor Perfusion', icon: '💧', description: 'Pale, cold, fast HR, weak pulse' },
  { id: 'seizure', label: 'Seizure / Altered Mental Status', icon: '🧠', description: 'Convulsing, confused, unresponsive' },
  { id: 'allergic', label: 'Severe Allergic Reaction', icon: '⚠️', description: 'Rash, swelling, difficulty breathing' },
  { id: 'metabolic', label: 'DKA / Metabolic Emergency', icon: '🔬', description: 'Vomiting, deep breathing, high glucose' },
  { id: 'trauma', label: 'Trauma / Injury', icon: '🩹', description: 'Injury, bleeding, mechanism of injury' },
  { id: 'newborn', label: 'Newborn Emergency', icon: '👶', description: 'Birth, neonatal distress, prematurity' },
];

export {
  cardiacArrestPathway,
  breathingPathway,
  shockPathway,
};
