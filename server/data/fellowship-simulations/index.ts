import type { BuiltFellowshipSimulation } from "./build";
import { CROSS_CUTTING_SIMULATIONS } from "./cross-cutting";
import { INFECTIOUS_SIMULATIONS } from "./infectious";
import { METABOLIC_NEURO_SIMULATIONS } from "./metabolic-neuro";
import { RESPIRATORY_SIMULATIONS } from "./respiratory";
import { SHOCK_SIMULATIONS } from "./shock";
import { TRAUMA_BURNS_SIMULATIONS } from "./trauma-burns";

export const FELLOWSHIP_SIMULATION_CATALOG: BuiltFellowshipSimulation[] = [
  ...CROSS_CUTTING_SIMULATIONS,
  ...RESPIRATORY_SIMULATIONS,
  ...SHOCK_SIMULATIONS,
  ...METABOLIC_NEURO_SIMULATIONS,
  ...INFECTIOUS_SIMULATIONS,
  ...TRAUMA_BURNS_SIMULATIONS,
];
