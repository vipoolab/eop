// KPI auto-distributor — split KPI targets across effective units

import type { KpiAssignment, KpiDefinition } from "./types";

/**
 * Distribute a KPI target across N units.
 *
 * - QUANTITATIVE with targetTotal: divides evenly (rounded up).
 * - QUALITATIVE: every unit gets the same task (no share).
 */
export function distributeKpi(
  kpi: KpiDefinition,
  unitIds: string[]
): KpiAssignment[] {
  if (unitIds.length === 0) return [];

  if (kpi.type === "QUANTITATIVE" && kpi.targetTotal && kpi.targetTotal > 0) {
    const share = Math.ceil(kpi.targetTotal / unitIds.length);
    return unitIds.map((uid) => ({
      kpiId: kpi.id,
      unitId: uid,
      targetShare: share,
      status: "PENDING",
      currentValue: 0,
    }));
  }

  // Qualitative or no target — every unit gets it equally as a task
  return unitIds.map((uid) => ({
    kpiId: kpi.id,
    unitId: uid,
    status: "PENDING",
  }));
}

/** Distribute multiple KPIs across units */
export function distributeAllKpis(
  kpis: KpiDefinition[],
  unitIds: string[]
): KpiAssignment[] {
  return kpis.flatMap((k) => distributeKpi(k, unitIds));
}
