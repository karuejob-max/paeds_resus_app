import type {
  FellowshipSimStep,
  FellowshipSimulationPages,
} from "../../shared/fellowship-simulation-types";
import { FELLOWSHIP_SIMULATION_CATALOG } from "../data/fellowship-simulations";

export type FellowshipSimulationScenario = {
  courseId: string;
  level: "foundational" | "advanced";
  title: string;
  description: string;
  pages: FellowshipSimulationPages;
  stepOrder: string[];
};

export const FELLOWSHIP_SIMULATIONS: FellowshipSimulationScenario[] =
  FELLOWSHIP_SIMULATION_CATALOG.map((sim) => ({
    courseId: sim.courseId,
    level: sim.level,
    title: sim.title,
    description: sim.description,
    pages: sim.pages,
    stepOrder: sim.stepOrder,
  }));

export type { FellowshipSimStep };
