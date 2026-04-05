import { OptimizationResult, CuttingPlan } from '@/types';
import { saveAs } from 'file-saver';

/**
 * Export all cutting plans as DXF R12 (ASCII) files bundled as individual downloads.
 * DXF R12 is the most universally compatible format for CNC machines.
 */
export function exportAllPlansDxf(result: OptimizationResult, projectName: string): void {
  result.plans.forEach((plan, idx) => {
    const dxf = generateDxfForPlan(plan, idx + 1);
    const blob = new Blob([dxf], { type: 'application/dxf' });
    saveAs(blob, `${projectName || 'NestBrain'}_plan_${idx + 1}.dxf`);
  });
}

/** Export a single cutting plan as DXF. */
export function exportSinglePlanDxf(plan: CuttingPlan, planIndex: number, projectName: string): void {
  const dxf = generateDxfForPlan(plan, planIndex);
  const blob = new Blob([dxf], { type: 'application/dxf' });
  saveAs(blob, `${projectName || 'NestBrain'}_plan_${planIndex}.dxf`);
}

function generateDxfForPlan(plan: CuttingPlan, planNum: number): string {
  const lines: string[] = [];

  // Header section
  lines.push('0', 'SECTION', '2', 'HEADER');
  lines.push('9', '$ACADVER', '1', 'AC1009'); // DXF R12
  lines.push('9', '$INSUNITS', '70', '4'); // mm
  lines.push('0', 'ENDSEC');

  // Tables section (layers)
  lines.push('0', 'SECTION', '2', 'TABLES');

  // Layer table
  lines.push('0', 'TABLE', '2', 'LAYER', '70', '4');
  lines.push(...dxfLayer('SHEET_BORDER', 7));  // white
  lines.push(...dxfLayer('PIECES', 3));         // green
  lines.push(...dxfLayer('SCRAPS', 8));         // gray
  lines.push(...dxfLayer('CUTS', 1));           // red
  lines.push('0', 'ENDTAB');

  lines.push('0', 'ENDSEC');

  // Entities section
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  // Sheet border
  lines.push(...dxfRect(0, 0, plan.sheetWidth, plan.sheetHeight, 'SHEET_BORDER'));

  // Pieces
  for (const piece of plan.pieces) {
    lines.push(...dxfRect(piece.x, piece.y, piece.width, piece.height, 'PIECES'));
    // Add piece code as text
    lines.push(
      '0', 'TEXT',
      '8', 'PIECES',
      '10', String(piece.x + piece.width / 2),
      '20', String(piece.y + piece.height / 2),
      '30', '0',
      '40', String(Math.min(piece.width, piece.height) * 0.15), // text height
      '1', `${piece.code} ${piece.originalWidth}x${piece.originalHeight}`,
      '72', '1', // center alignment
      '11', String(piece.x + piece.width / 2),
      '21', String(piece.y + piece.height / 2),
      '31', '0',
    );
  }

  // Scraps (usable ones)
  for (const scrap of plan.scraps) {
    if (scrap.usable) {
      lines.push(...dxfRect(scrap.x, scrap.y, scrap.width, scrap.height, 'SCRAPS'));
    }
  }

  // Cut lines — derive from piece edges
  const hCuts = new Set<number>();
  const vCuts = new Set<number>();
  for (const piece of plan.pieces) {
    hCuts.add(piece.y);
    hCuts.add(piece.y + piece.height);
    vCuts.add(piece.x);
    vCuts.add(piece.x + piece.width);
  }
  for (const y of hCuts) {
    if (y > 0 && y < plan.sheetHeight) {
      lines.push(...dxfLine(0, y, plan.sheetWidth, y, 'CUTS'));
    }
  }
  for (const x of vCuts) {
    if (x > 0 && x < plan.sheetWidth) {
      lines.push(...dxfLine(x, 0, x, plan.sheetHeight, 'CUTS'));
    }
  }

  lines.push('0', 'ENDSEC');

  // Comment
  lines.push('999', `NestBrain Plan ${planNum}`);

  // EOF
  lines.push('0', 'EOF');

  return lines.join('\n');
}

function dxfLayer(name: string, color: number): string[] {
  return ['0', 'LAYER', '2', name, '70', '0', '62', String(color), '6', 'CONTINUOUS'];
}

function dxfRect(x: number, y: number, w: number, h: number, layer: string): string[] {
  return [
    '0', 'LWPOLYLINE',
    '8', layer,
    '90', '4',   // vertex count
    '70', '1',   // closed
    '10', String(x), '20', String(y),
    '10', String(x + w), '20', String(y),
    '10', String(x + w), '20', String(y + h),
    '10', String(x), '20', String(y + h),
  ];
}

function dxfLine(x1: number, y1: number, x2: number, y2: number, layer: string): string[] {
  return [
    '0', 'LINE',
    '8', layer,
    '10', String(x1), '20', String(y1), '30', '0',
    '11', String(x2), '21', String(y2), '31', '0',
  ];
}
