import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/i18n';
import { Tag, Printer } from 'lucide-react';

export function LabelsTab() {
  const { t } = useTranslation();
  const result = useAppStore((s) => s.result);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-surface-400">
        {t.labelsTab.optimizeFirst}
      </div>
    );
  }

  const allPieces = result.plans.flatMap((p, planIdx) =>
    p.pieces.map((piece, pieceIdx) => ({
      ...piece,
      planNumber: planIdx + 1,
      sheetNumber: planIdx + 1,
    }))
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-200 bg-surface-0">
        <Tag className="w-4 h-4 text-surface-500" />
        <span className="text-sm font-medium text-surface-700">{t.labelsTab.title}</span>
        <div className="flex-1" />
        <button className="btn-primary btn-sm">
          <Printer className="w-3.5 h-3.5" /> {t.labelsTab.generatePDF}
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Label layout editor */}
        <div className="flex-1 p-4">
          <div className="card p-6 max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold mb-4">{t.labelsTab.layoutTitle}</h3>
            <div className="border-2 border-dashed border-surface-300 rounded-lg bg-surface-50 
                          relative overflow-hidden" style={{ width: '400px', height: '200px' }}>
              {/* Simulated label */}
              <div className="absolute top-4 left-4 text-xs font-bold text-surface-700">
                {t.labelsTab.pieceId}
              </div>
              <div className="absolute top-4 right-4 text-xs text-surface-500">
                {t.labelsTab.materialLabel}
              </div>
              <div className="absolute top-12 left-4 text-lg font-mono font-bold text-brand-700">
                P-0001
              </div>
              <div className="absolute top-20 left-4 text-xs text-surface-600">
                500 × 300 mm — 15mm
              </div>
              <div className="absolute bottom-4 left-4 text-2xs text-surface-400">
                {t.labelsTab.planSheet.replace('{plan}', '1').replace('{sheet}', '1')} — {new Date().toLocaleDateString()}
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-1">
                <div className="w-16 h-8 bg-surface-200 rounded flex items-center justify-center text-2xs text-surface-400">
                  {t.labelsTab.barcode}
                </div>
              </div>
            </div>
            <p className="text-xs text-surface-400 mt-3">
              {t.labelsTab.editorWIP}
            </p>
          </div>
        </div>

        {/* Piece list for labels */}
        <div className="w-64 border-l border-surface-200 bg-surface-0 overflow-y-auto p-2">
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            {t.labelsTab.pieces} ({allPieces.length})
          </h3>
          {allPieces.map((piece, idx) => (
            <div key={idx} className="px-2 py-1.5 text-xs hover:bg-surface-50 rounded flex justify-between">
              <span className="font-mono">{piece.code}</span>
              <span className="text-surface-400">{piece.originalWidth}×{piece.originalHeight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
