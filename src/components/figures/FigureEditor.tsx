import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePiecesStore } from '@/stores/piecesStore';
import { useFiguresStore } from '@/stores/figuresStore';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/i18n';
import { Piece, FigurePiecePlacement } from '@/types';
import { X, Save, RotateCcw, AlignVerticalSpaceAround, AlignHorizontalSpaceAround } from 'lucide-react';
import { colorFromIndex } from '@/utils/helpers';

interface FigureEditorProps {
  pieceIds: string[];
  figureId?: string; // if editing existing figure
  onClose: () => void;
  onSave: (figureId: string) => void;
}

const CANVAS_PADDING = 40;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

export function FigureEditor({ pieceIds, figureId, onClose, onSave }: FigureEditorProps) {
  const { t } = useTranslation();
  const allPieces = usePiecesStore((s) => s.pieces);
  const bladeThickness = useAppStore((s) => s.config.bladeThickness);
  const addFigure = useFiguresStore((s) => s.addFigure);
  const updateLayout = useFiguresStore((s) => s.updateLayout);
  const updateFigure = useFiguresStore((s) => s.updateFigure);
  const existingFigure = useFiguresStore((s) => s.figures.find((f) => f.id === figureId));

  const pieces = useMemo(() =>
    pieceIds.map((id) => allPieces.find((p) => p.id === id)).filter(Boolean) as Piece[],
    [pieceIds, allPieces],
  );

  const [gap, setGap] = useState(existingFigure?.gap ?? bladeThickness);
  const [name, setName] = useState(existingFigure?.name ?? `Figure ${pieceIds.length} pcs`);
  const [layout, setLayout] = useState<FigurePiecePlacement[]>(() => {
    if (existingFigure?.layout.length) return existingFigure.layout;
    // Default: stack vertically with gap
    let y = 0;
    return pieces.map((p) => {
      const placement: FigurePiecePlacement = { pieceId: p.id, relativeX: 0, relativeY: y };
      y += p.height + gap;
      return placement;
    });
  });

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute bounding box
  const bounds = useMemo(() => {
    let maxW = 0, maxH = 0;
    for (const pl of layout) {
      const piece = pieces.find((p) => p.id === pl.pieceId);
      if (!piece) continue;
      maxW = Math.max(maxW, pl.relativeX + piece.width);
      maxH = Math.max(maxH, pl.relativeY + piece.height);
    }
    return { width: maxW, height: maxH };
  }, [layout, pieces]);

  // Scale to fit canvas
  const canvasW = 600;
  const canvasH = 500;
  const scale = useMemo(() => {
    if (bounds.width === 0 || bounds.height === 0) return 1;
    const sx = (canvasW - CANVAS_PADDING * 2) / bounds.width;
    const sy = (canvasH - CANVAS_PADDING * 2) / bounds.height;
    return Math.min(Math.max(Math.min(sx, sy), MIN_SCALE), MAX_SCALE);
  }, [bounds]);

  const toSvg = useCallback((mm: number) => mm * scale, [scale]);

  // Drag handlers
  const handleMouseDown = (pieceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const pl = layout.find((l) => l.pieceId === pieceId);
    if (!pl || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setDragging(pieceId);
    setDragOffset({
      x: e.clientX - rect.left - CANVAS_PADDING - toSvg(pl.relativeX),
      y: e.clientY - rect.top - CANVAS_PADDING - toSvg(pl.relativeY),
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const newX = Math.max(0, (e.clientX - rect.left - CANVAS_PADDING - dragOffset.x) / scale);
      const newY = Math.max(0, (e.clientY - rect.top - CANVAS_PADDING - dragOffset.y) / scale);
      setLayout((prev) =>
        prev.map((pl) =>
          pl.pieceId === dragging
            ? { ...pl, relativeX: Math.round(newX), relativeY: Math.round(newY) }
            : pl,
        ),
      );
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, dragOffset, scale]);

  // Auto-arrange: stack vertically
  const arrangeVertical = () => {
    let y = 0;
    setLayout(pieces.map((p) => {
      const pl: FigurePiecePlacement = { pieceId: p.id, relativeX: 0, relativeY: y };
      y += p.height + gap;
      return pl;
    }));
  };

  // Auto-arrange: stack horizontally
  const arrangeHorizontal = () => {
    let x = 0;
    setLayout(pieces.map((p) => {
      const pl: FigurePiecePlacement = { pieceId: p.id, relativeX: x, relativeY: 0 };
      x += p.width + gap;
      return pl;
    }));
  };

  const handleSave = () => {
    if (figureId && existingFigure) {
      updateFigure(figureId, { name, gap });
      updateLayout(figureId, layout, bounds.width, bounds.height);
      onSave(figureId);
    } else {
      const figure = addFigure(pieceIds, gap);
      updateFigure(figure.id, { name });
      updateLayout(figure.id, layout, bounds.width, bounds.height);
      onSave(figure.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-surface-800">{t.figures.editorTitle}</h2>
            <input
              className="text-sm font-medium text-surface-700 bg-transparent border-b border-surface-300 outline-none focus:border-brand-500 px-1 py-0.5 w-48 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-surface-100">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-surface-500">{t.figures.gap}:</label>
            <input
              type="number"
              className="input w-16 text-center py-1"
              value={gap}
              min={0}
              step={0.5}
              onChange={(e) => setGap(parseFloat(e.target.value) || 0)}
            />
            <span className="text-xs text-surface-400">mm</span>
          </div>

          <div className="h-5 w-px bg-surface-200" />

          <button onClick={arrangeVertical} className="btn-ghost btn-sm flex items-center gap-1" title={t.figures.stackVertical}>
            <AlignVerticalSpaceAround className="w-4 h-4" />
            <span className="text-xs">{t.figures.stackVertical}</span>
          </button>
          <button onClick={arrangeHorizontal} className="btn-ghost btn-sm flex items-center gap-1" title={t.figures.stackHorizontal}>
            <AlignHorizontalSpaceAround className="w-4 h-4" />
            <span className="text-xs">{t.figures.stackHorizontal}</span>
          </button>

          <div className="flex-1" />

          <div className="text-xs text-surface-400">
            {bounds.width.toFixed(0)} x {bounds.height.toFixed(0)} mm &middot; {pieces.length} {t.common.pieces}
          </div>

          <button onClick={handleSave} className="btn-primary flex items-center gap-1.5 px-4 py-2">
            <Save className="w-4 h-4" />
            {t.figures.save}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-surface-50 flex items-center justify-center p-4">
          <svg
            ref={svgRef}
            width={canvasW}
            height={canvasH}
            className="bg-white rounded-lg border border-surface-200 shadow-inner"
          >
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width={toSvg(50)} height={toSvg(50)} patternUnits="userSpaceOnUse">
                <path d={`M ${toSvg(50)} 0 L 0 0 0 ${toSvg(50)}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={canvasW} height={canvasH} fill="url(#grid)" />

            {/* Grain direction indicator (vertical lines) */}
            <g opacity={0.08}>
              {Array.from({ length: Math.ceil(canvasW / 12) }, (_, i) => (
                <line key={i} x1={i * 12} y1={0} x2={i * 12} y2={canvasH} stroke="#8B4513" strokeWidth="1" />
              ))}
            </g>

            {/* Pieces */}
            <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>
              {layout.map((pl, idx) => {
                const piece = pieces.find((p) => p.id === pl.pieceId);
                if (!piece) return null;
                const x = toSvg(pl.relativeX);
                const y = toSvg(pl.relativeY);
                const w = toSvg(piece.width);
                const h = toSvg(piece.height);
                const color = colorFromIndex(idx);
                const isDragging = dragging === pl.pieceId;

                return (
                  <g
                    key={pl.pieceId}
                    transform={`translate(${x}, ${y})`}
                    onMouseDown={(e) => handleMouseDown(pl.pieceId, e)}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  >
                    <rect
                      width={w}
                      height={h}
                      fill={color}
                      fillOpacity={0.3}
                      stroke={isDragging ? '#2962FF' : color}
                      strokeWidth={isDragging ? 2 : 1.5}
                      rx={2}
                    />
                    {/* Grain lines */}
                    {piece.grainDirection !== 'none' && (
                      <g opacity={0.15} clipPath={`inset(0 0 0 0)`}>
                        {piece.grainDirection === 'vertical'
                          ? Array.from({ length: Math.ceil(w / 8) }, (_, i) => (
                              <line key={i} x1={i * 8} y1={0} x2={i * 8} y2={h} stroke="#5D4037" strokeWidth="0.8" />
                            ))
                          : Array.from({ length: Math.ceil(h / 8) }, (_, i) => (
                              <line key={i} x1={0} y1={i * 8} x2={w} y2={i * 8} stroke="#5D4037" strokeWidth="0.8" />
                            ))
                        }
                      </g>
                    )}
                    {/* Label */}
                    {w > 30 && h > 14 && (
                      <text
                        x={w / 2}
                        y={h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={Math.min(11, w / 6)}
                        fontWeight="600"
                        fill="#333"
                      >
                        {piece.code}
                      </text>
                    )}
                    {w > 40 && h > 26 && (
                      <text
                        x={w / 2}
                        y={h / 2 + 12}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={Math.min(9, w / 8)}
                        fill="#666"
                      >
                        {piece.width}x{piece.height}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-surface-100 text-xs text-surface-400">
          {t.figures.hint}
        </div>
      </div>
    </div>
  );
}
