import type { SimulationPhase } from "@/lib/simulation";

/** Phase badge: VSCode-toned border + tinted panel for quick scan */
export const PHASE_PILL: Record<SimulationPhase, string> = {
  IDLE: "border-[#3c3c3c] bg-[#2d2d2d] text-[#9d9d9d]",
  RUNNING: "border-[#2d7d46]/70 bg-[#10261a] text-[#89d185]",
  PAUSED: "border-[#a1760b]/70 bg-[#2b230e] text-[#e2c08d]",
  COMPLETED: "border-[#007acc]/70 bg-[#0e2233] text-[#75beff]",
};
