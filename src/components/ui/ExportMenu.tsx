import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useTranslation } from '@/i18n';
import { exportFullPdfReport, exportPlansPdf } from '@/utils/pdfExporter';
import { exportAllPlansDxf } from '@/utils/dxfExporter';
import { exportCutListCsv, exportSummaryCsv } from '@/utils/csvExporter';
import { downloadBlob } from '@/utils/helpers';
import {
  Download, FileText, FileSpreadsheet, FileCode, FileJson, Image,
} from 'lucide-react';

export function ExportMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const result = useAppStore((s) => s.result);
  const projectName = useAppStore((s) => s.projectName);
  const currency = useAppStore((s) => s.currency);
  const costEnabled = useAppStore((s) => s.costEnabled);
  const materials = useMaterialsStore((s) => s.materials);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!result) return null;

  const handlePdfReport = () => {
    exportFullPdfReport({ result, materials, projectName, currency, costEnabled });
    setOpen(false);
  };

  const handlePdfPlans = () => {
    exportPlansPdf({ result, materials, projectName, currency, costEnabled });
    setOpen(false);
  };

  const handleDxf = () => {
    exportAllPlansDxf(result, projectName);
    setOpen(false);
  };

  const handleCsvCutList = () => {
    exportCutListCsv(result, projectName);
    setOpen(false);
  };

  const handleCsvSummary = () => {
    exportSummaryCsv(result, materials, currency, costEnabled, projectName);
    setOpen(false);
  };

  const handleJson = () => {
    const json = JSON.stringify(result, null, 2);
    downloadBlob(new Blob([json], { type: 'application/json' }), `${projectName || 'NestBrain'}_result.json`);
    setOpen(false);
  };

  const handleSvg = () => {
    const svgEl = document.querySelector('.cutting-plan-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    downloadBlob(new Blob([svgData], { type: 'image/svg+xml' }), `${projectName || 'NestBrain'}_plan.svg`);
    setOpen(false);
  };

  const items = [
    { icon: FileText, label: t.exportMenu.pdfReport, action: handlePdfReport },
    { icon: FileText, label: t.exportMenu.pdfPlans, action: handlePdfPlans },
    { icon: FileCode, label: t.exportMenu.dxfAll, action: handleDxf },
    { icon: FileSpreadsheet, label: t.exportMenu.csvCutList, action: handleCsvCutList },
    { icon: FileSpreadsheet, label: 'CSV Summary', action: handleCsvSummary },
    { icon: FileJson, label: t.exportMenu.json, action: handleJson },
    { icon: Image, label: t.exportMenu.svg, action: handleSvg },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        className="btn-ghost btn-sm flex items-center gap-1.5"
        onClick={() => setOpen(!open)}
      >
        <Download className="w-4 h-4" />
        <span className="text-xs">{t.exportMenu.title}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-surface-200 py-1 z-50 min-w-[220px] animate-fade-in">
          {items.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors text-left"
              onClick={item.action}
            >
              <item.icon className="w-4 h-4 text-surface-400" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
