import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OptimizationResult, CuttingPlan, Material, CURRENCY_SYMBOLS, Currency } from '@/types';

interface PdfExportOptions {
  result: OptimizationResult;
  materials: Material[];
  projectName: string;
  currency: Currency;
  costEnabled: boolean;
}

/**
 * Generate a full PDF report with cutting plans, material consumption, and costs.
 */
export function exportFullPdfReport(opts: PdfExportOptions): void {
  const { result, materials, projectName, currency, costEnabled } = opts;
  const sym = CURRENCY_SYMBOLS[currency];
  const materialMap = new Map(materials.map((m) => [m.code, m]));
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ─── Cover Page ──────────────────────────
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('NestBrain', pageW / 2, 50, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, pageW / 2, 65, { align: 'center' });
  doc.setFontSize(11);
  doc.text(new Date().toLocaleDateString(), pageW / 2, 78, { align: 'center' });

  // Summary stats
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryLines = [
    `Total Plans: ${result.plans.length}`,
    `Total Sheets: ${result.totalSheets} (${result.totalStackedSheets} stacked)`,
    `Total Pieces: ${result.totalPieces}`,
    `Global Utilization: ${result.globalUtilization.toFixed(1)}%`,
    `Machine Loads: ${result.totalMachineLoads}`,
    `Compute Time: ${result.computeTimeMs}ms`,
  ];
  summaryLines.forEach((line, i) => doc.text(line, 25, 110 + i * 7));

  // ─── Cut List Table ──────────────────────
  doc.addPage('a4', 'landscape');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cut List', 14, 15);

  const cutListRows: string[][] = [];
  result.plans.forEach((plan, pi) => {
    plan.pieces.forEach((p) => {
      cutListRows.push([
        String(pi + 1),
        p.code,
        p.description || '',
        p.material,
        `${p.originalWidth}`,
        `${p.originalHeight}`,
        p.rotated ? 'Yes' : 'No',
        `${Math.round(p.x)},${Math.round(p.y)}`,
      ]);
    });
  });

  autoTable(doc, {
    startY: 20,
    head: [['Plan', 'Code', 'Description', 'Material', 'Width', 'Height', 'Rotated', 'Position']],
    body: cutListRows,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 98, 255] },
  });

  // ─── Material Consumption Table ──────────
  doc.addPage('a4', 'landscape');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Material Consumption', 14, 15);

  const matSummary = new Map<string, { sheets: number; usedArea: number; wasteArea: number }>();
  for (const plan of result.plans) {
    const entry = matSummary.get(plan.materialCode) ?? { sheets: 0, usedArea: 0, wasteArea: 0 };
    entry.sheets += plan.stackCount;
    entry.usedArea += plan.usedArea * plan.stackCount;
    entry.wasteArea += plan.wasteArea * plan.stackCount;
    matSummary.set(plan.materialCode, entry);
  }

  const matRows = Array.from(matSummary.entries()).map(([code, s]) => {
    const mat = materialMap.get(code);
    const totalArea = s.usedArea + s.wasteArea;
    return [
      code,
      mat?.description ?? '',
      String(s.sheets),
      (s.usedArea / 1e6).toFixed(3),
      (s.wasteArea / 1e6).toFixed(3),
      totalArea > 0 ? ((s.usedArea / totalArea) * 100).toFixed(1) + '%' : '-',
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['Code', 'Description', 'Sheets', 'Used (m\u00B2)', 'Waste (m\u00B2)', 'Utilization']],
    body: matRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 98, 255] },
  });

  // ─── Cost Report (if enabled) ────────────
  if (costEnabled && result.grandTotalCost != null) {
    doc.addPage('a4', 'landscape');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost Report', 14, 15);

    const costRows = [
      ['Material Cost', `${sym} ${(result.totalMaterialCost ?? 0).toFixed(2)}`],
      ['Waste Cost', `${sym} ${(result.totalWasteCost ?? 0).toFixed(2)}`],
      ['Cutting Cost', `${sym} ${(result.totalCuttingCost ?? 0).toFixed(2)}`],
      ['Edge Band Cost', `${sym} ${(result.totalEdgeBandCost ?? 0).toFixed(2)}`],
      ['Total Cost', `${sym} ${result.grandTotalCost.toFixed(2)}`],
      ['Cost per Piece', `${sym} ${result.totalPieces > 0 ? (result.grandTotalCost / result.totalPieces).toFixed(2) : '0.00'}`],
    ];

    autoTable(doc, {
      startY: 20,
      head: [['Item', 'Value']],
      body: costRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 98, 255] },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });
  }

  // ─── Per-Plan Details ────────────────────
  result.plans.forEach((plan, i) => {
    doc.addPage('a4', 'landscape');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Plan ${i + 1} — ${plan.materialCode}`, 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${plan.sheetWidth}x${plan.sheetHeight}mm | ${plan.pieces.length} pieces | ${plan.utilizationPercent.toFixed(1)}% util | ${plan.stackCount} sheets`,
      14, 18
    );

    drawCuttingPlan(doc, plan, 14, 24, pageW - 28, 140);
  });

  doc.save(`${projectName || 'NestBrain'}_report.pdf`);
}

/**
 * Export only the cutting plan pages as PDF.
 */
export function exportPlansPdf(opts: PdfExportOptions): void {
  const { result, projectName } = opts;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  result.plans.forEach((plan, i) => {
    if (i > 0) doc.addPage('a4', 'landscape');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Plan ${i + 1} — ${plan.materialCode}`, 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${plan.sheetWidth}x${plan.sheetHeight}mm | ${plan.pieces.length} pcs | ${plan.utilizationPercent.toFixed(1)}% | x${plan.stackCount}`,
      14, 18
    );
    drawCuttingPlan(doc, plan, 14, 24, pageW - 28, 140);
  });

  doc.save(`${projectName || 'NestBrain'}_plans.pdf`);
}

/** Draw a cutting plan visualization on the PDF. */
function drawCuttingPlan(doc: jsPDF, plan: CuttingPlan, ox: number, oy: number, maxW: number, maxH: number) {
  const scaleX = maxW / plan.sheetWidth;
  const scaleY = maxH / plan.sheetHeight;
  const scale = Math.min(scaleX, scaleY);
  const w = plan.sheetWidth * scale;
  const h = plan.sheetHeight * scale;

  // Sheet border
  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  doc.rect(ox, oy, w, h);

  // Pieces
  const colors = [
    [66, 133, 244], [52, 168, 83], [251, 188, 4], [234, 67, 53],
    [171, 71, 188], [0, 172, 193], [255, 112, 67], [63, 81, 181],
  ];

  plan.pieces.forEach((p, idx) => {
    const [r, g, b] = colors[idx % colors.length];
    doc.setFillColor(r, g, b);
    doc.setDrawColor(50);
    doc.setLineWidth(0.2);
    doc.rect(ox + p.x * scale, oy + p.y * scale, p.width * scale, p.height * scale, 'FD');

    // Label
    const pw = p.width * scale;
    const ph = p.height * scale;
    if (pw > 8 && ph > 4) {
      doc.setFontSize(Math.min(6, pw / 4));
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(p.code, ox + p.x * scale + pw / 2, oy + p.y * scale + ph / 2, { align: 'center', baseline: 'middle' });
    }
  });

  // Scraps
  plan.scraps.forEach((s) => {
    doc.setFillColor(s.usable ? 200 : 240, s.usable ? 230 : 240, s.usable ? 200 : 240);
    doc.setDrawColor(180);
    doc.setLineWidth(0.1);
    doc.rect(ox + s.x * scale, oy + s.y * scale, s.width * scale, s.height * scale, 'FD');
  });

  // Reset
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
}
