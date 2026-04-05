import { OptimizationResult, Material, EdgeBand, CURRENCY_SYMBOLS, Currency } from '@/types';
import { saveAs } from 'file-saver';

/**
 * Export the cut list as a CSV file — every piece with its placement details.
 */
export function exportCutListCsv(result: OptimizationResult, projectName: string): void {
  const header = 'Plan,Code,Description,Material,Width (mm),Height (mm),Quantity,Rotated,X,Y,Edge Top,Edge Bottom,Edge Left,Edge Right,Grain';
  const rows: string[] = [];

  result.plans.forEach((plan, pi) => {
    for (const p of plan.pieces) {
      rows.push([
        pi + 1,
        esc(p.code),
        esc(p.description),
        esc(p.material),
        p.originalWidth,
        p.originalHeight,
        p.quantity,
        p.rotated ? 'Yes' : 'No',
        Math.round(p.x),
        Math.round(p.y),
        esc(p.edgeBandTop),
        esc(p.edgeBandBottom),
        esc(p.edgeBandLeft),
        esc(p.edgeBandRight),
        p.grainDirection,
      ].join(','));
    }
  });

  const csv = header + '\n' + rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
  saveAs(blob, `${projectName || 'NestBrain'}_cut_list.csv`);
}

/**
 * Export optimization summary as CSV — one row per material.
 */
export function exportSummaryCsv(
  result: OptimizationResult,
  materials: Material[],
  currency: Currency,
  costEnabled: boolean,
  projectName: string,
): void {
  const sym = CURRENCY_SYMBOLS[currency];
  const materialMap = new Map(materials.map((m) => [m.code, m]));

  const header = costEnabled
    ? 'Material,Description,Sheets,Used Area (m2),Waste Area (m2),Utilization %,Material Cost,Waste Cost,Cutting Cost,Edge Band Cost,Total Cost'
    : 'Material,Description,Sheets,Used Area (m2),Waste Area (m2),Utilization %';

  const matSummary = new Map<string, {
    sheets: number; usedArea: number; wasteArea: number;
    matCost: number; wasteCost: number; cutCost: number; edgeCost: number;
  }>();

  for (const plan of result.plans) {
    const entry = matSummary.get(plan.materialCode) ?? {
      sheets: 0, usedArea: 0, wasteArea: 0,
      matCost: 0, wasteCost: 0, cutCost: 0, edgeCost: 0,
    };
    entry.sheets += plan.stackCount;
    entry.usedArea += plan.usedArea * plan.stackCount;
    entry.wasteArea += plan.wasteArea * plan.stackCount;
    entry.matCost += plan.materialCost ?? 0;
    entry.wasteCost += plan.wasteCost ?? 0;
    entry.cutCost += plan.cuttingCost ?? 0;
    entry.edgeCost += plan.edgeBandCost ?? 0;
    matSummary.set(plan.materialCode, entry);
  }

  const rows: string[] = [];
  for (const [code, s] of matSummary) {
    const mat = materialMap.get(code);
    const total = s.usedArea + s.wasteArea;
    const util = total > 0 ? ((s.usedArea / total) * 100).toFixed(1) : '0';
    const base = [
      esc(code),
      esc(mat?.description ?? ''),
      s.sheets,
      (s.usedArea / 1e6).toFixed(3),
      (s.wasteArea / 1e6).toFixed(3),
      util,
    ];
    if (costEnabled) {
      base.push(
        `${sym}${s.matCost.toFixed(2)}`,
        `${sym}${s.wasteCost.toFixed(2)}`,
        `${sym}${s.cutCost.toFixed(2)}`,
        `${sym}${s.edgeCost.toFixed(2)}`,
        `${sym}${(s.matCost + s.wasteCost + s.cutCost + s.edgeCost).toFixed(2)}`,
      );
    }
    rows.push(base.join(','));
  }

  const csv = header + '\n' + rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${projectName || 'NestBrain'}_summary.csv`);
}

function esc(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
