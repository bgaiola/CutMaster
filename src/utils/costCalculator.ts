import { Material, EdgeBand, OptimizationResult, CuttingPlan } from '@/types';

/**
 * Enriches an OptimizationResult with cost calculations per plan and totals.
 * All areas are in mm² internally; costs use m² and linear meters.
 * 
 * Per plan:
 *   materialCost   = sheetArea (m²) × stackCount × pricePerM²
 *   wasteCost      = wasteArea (m²) × stackCount × wasteCostPerM²
 *   cuttingCost    = totalCutLength (linear m) × stackCount × cutCostPerLinearM
 *   edgeBandCost   = Σ(edge band linear meters × costPerLinearM) × stackCount
 *   totalPlanCost  = materialCost + wasteCost + cuttingCost + edgeBandCost
 */
export function enrichResultWithCosts(
  result: OptimizationResult,
  materials: Material[],
  edgeBands: EdgeBand[] = [],
): OptimizationResult {
  const materialMap = new Map(materials.map((m) => [m.code, m]));
  const bandMap = new Map(edgeBands.map((eb) => [eb.code, eb]));

  let totalMaterialCost = 0;
  let totalWasteCost = 0;
  let totalCuttingCost = 0;
  let totalEdgeBandCost = 0;

  const enrichedPlans: CuttingPlan[] = result.plans.map((plan) => {
    const mat = materialMap.get(plan.materialCode);
    if (!mat) return plan;

    const sheetAreaM2 = (plan.sheetWidth * plan.sheetHeight) / 1e6;
    const wasteAreaM2 = plan.wasteArea / 1e6;

    // Estimate total cut length from placed pieces.
    // Each unique cut line (horizontal or vertical edge of a piece) contributes to the total.
    // We collect all distinct X and Y coordinates where cuts occur within the usable area,
    // then sum up the actual lengths those cuts span across the sheet.
    const trimL = mat.trimLeft;
    const trimT = mat.trimTop;
    const usableW = plan.sheetWidth - mat.trimLeft - mat.trimRight;
    const usableH = plan.sheetHeight - mat.trimTop - mat.trimBottom;

    const hLines = new Set<number>(); // Y coordinates of horizontal cuts
    const vLines = new Set<number>(); // X coordinates of vertical cuts
    for (const piece of plan.pieces) {
      // Bottom edge of piece (horizontal cut)
      const bottom = piece.y + piece.height;
      if (bottom > trimT && bottom < trimT + usableH) hLines.add(Math.round(bottom * 100));
      // Right edge of piece (vertical cut)
      const right = piece.x + piece.width;
      if (right > trimL && right < trimL + usableW) vLines.add(Math.round(right * 100));
    }
    // Each horizontal cut traverses the usable width; each vertical cut traverses the usable height
    const totalCutLengthM = (hLines.size * usableW + vLines.size * usableH) / 1000;

    // Edge band cost: sum up linear meters per band code for all pieces in plan
    let planEdgeBandCost = 0;
    for (const piece of plan.pieces) {
      const sides: { bandCode: string; lengthMm: number }[] = [
        { bandCode: piece.edgeBandTop, lengthMm: piece.width },
        { bandCode: piece.edgeBandBottom, lengthMm: piece.width },
        { bandCode: piece.edgeBandLeft, lengthMm: piece.height },
        { bandCode: piece.edgeBandRight, lengthMm: piece.height },
      ];
      for (const side of sides) {
        if (!side.bandCode) continue;
        const band = bandMap.get(side.bandCode);
        if (!band || band.costPerLinearM <= 0) continue;
        planEdgeBandCost += (side.lengthMm / 1000) * band.costPerLinearM;
      }
    }
    // Multiply by stack count
    planEdgeBandCost *= plan.stackCount;

    const materialCost = sheetAreaM2 * plan.stackCount * mat.pricePerM2;
    const wasteCost = wasteAreaM2 * plan.stackCount * mat.wasteCostPerM2;
    const cuttingCost = totalCutLengthM * plan.stackCount * mat.cutCostPerLinearM;
    const totalPlanCost = materialCost + wasteCost + cuttingCost + planEdgeBandCost;

    totalMaterialCost += materialCost;
    totalWasteCost += wasteCost;
    totalCuttingCost += cuttingCost;
    totalEdgeBandCost += planEdgeBandCost;

    return {
      ...plan,
      materialCost,
      wasteCost,
      cuttingCost,
      edgeBandCost: planEdgeBandCost,
      totalPlanCost,
    };
  });

  return {
    ...result,
    plans: enrichedPlans,
    totalMaterialCost,
    totalWasteCost,
    totalCuttingCost,
    totalEdgeBandCost,
    grandTotalCost: totalMaterialCost + totalWasteCost + totalCuttingCost + totalEdgeBandCost,
  };
}
