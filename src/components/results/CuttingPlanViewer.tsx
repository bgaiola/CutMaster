import { useState, useRef, useCallback, useEffect } from 'react';
import { CuttingPlan } from '@/types';
import { colorFromIndex, colorWithAlpha } from '@/utils/helpers';

interface Props {
  plan: CuttingPlan;
  pieceColorMap: Map<string, string>;
  hoveredPieceId: string | null;
  onHoverPiece: (id: string | null) => void;
  showLabels: boolean;
  showKerf: boolean;
  showTrims: boolean;
  showEdgeBands: boolean;
  showScraps: boolean;
}

export function CuttingPlanViewer({
  plan, pieceColorMap, hoveredPieceId, onHoverPiece,
  showLabels, showKerf, showTrims, showEdgeBands, showScraps,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: plan.sheetWidth, h: plan.sheetHeight });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Zoom with scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    setViewBox((vb) => {
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      const nw = vb.w * factor;
      const nh = vb.h * factor;
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    });
  }, []);

  // Pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - panStart.x) * (viewBox.w / rect.width);
      const dy = (e.clientY - panStart.y) * (viewBox.h / rect.height);
      setViewBox((vb) => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart, viewBox]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  // Reset zoom
  const resetZoom = () => {
    setViewBox({ x: -20, y: -20, w: plan.sheetWidth + 40, h: plan.sheetHeight + 40 });
  };

  useEffect(() => {
    resetZoom();
  }, [plan.planId]);

  const hatchPatternId = `hatch-${plan.planId.slice(0, 8)}`;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <svg
        ref={svgRef}
        className="w-full h-full bg-surface-100 rounded cursor-grab active:cursor-grabbing"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Hatch pattern for trim areas */}
          <pattern id={hatchPatternId} patternUnits="userSpaceOnUse" width="8" height="8">
            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Sheet background */}
        <rect x={0} y={0} width={plan.sheetWidth} height={plan.sheetHeight}
          fill="white" stroke="#64748b" strokeWidth={2} />

        {/* Trim areas (refilos) */}
        {showTrims && (
          <>
            <rect x={0} y={0} width={plan.sheetWidth} height={plan.pieces[0]?.y || 0}
              fill={`url(#${hatchPatternId})`} opacity={0.5} />
            <rect x={0} y={0} width={plan.pieces[0]?.x || 0} height={plan.sheetHeight}
              fill={`url(#${hatchPatternId})`} opacity={0.5} />
          </>
        )}

        {/* Scraps */}
        {showScraps && plan.scraps.map((scrap, idx) => (
          <rect key={`scrap-${idx}`}
            x={scrap.x} y={scrap.y} width={scrap.width} height={scrap.height}
            fill={scrap.usable ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)'}
            stroke={scrap.usable ? '#22c55e' : '#94a3b8'}
            strokeWidth={1}
            strokeDasharray={scrap.usable ? '4,2' : '2,2'}
          />
        ))}

        {/* Placed pieces */}
        {plan.pieces.map((piece, idx) => {
          const color = pieceColorMap.get(piece.code) || colorFromIndex(idx);
          const isHovered = piece.pieceId === hoveredPieceId;
          const fontSize = Math.min(piece.width, piece.height) * 0.12;
          const canFitLabel = piece.width > 60 && piece.height > 30;

          return (
            <g key={`piece-${idx}`}
              onMouseEnter={() => {
                onHoverPiece(piece.pieceId);
                setTooltip({
                  x: piece.x + piece.width / 2,
                  y: piece.y - 10,
                  text: `${piece.code} — ${piece.originalWidth}×${piece.originalHeight}mm`,
                });
              }}
              onMouseLeave={() => {
                onHoverPiece(null);
                setTooltip(null);
              }}
            >
              {/* Piece fill */}
              <rect
                x={piece.x} y={piece.y}
                width={piece.width} height={piece.height}
                fill={colorWithAlpha(color, isHovered ? 0.5 : 0.3)}
                stroke={isHovered ? '#1e40af' : color}
                strokeWidth={isHovered ? 2.5 : 1.2}
                rx={1}
              />

              {/* Edge band indicators */}
              {showEdgeBands && piece.edgeBandTop && (
                <line x1={piece.x} y1={piece.y + 1} x2={piece.x + piece.width} y2={piece.y + 1}
                  stroke="#ef4444" strokeWidth={3} />
              )}
              {showEdgeBands && piece.edgeBandBottom && (
                <line x1={piece.x} y1={piece.y + piece.height - 1}
                  x2={piece.x + piece.width} y2={piece.y + piece.height - 1}
                  stroke="#f59e0b" strokeWidth={3} />
              )}
              {showEdgeBands && piece.edgeBandLeft && (
                <line x1={piece.x + 1} y1={piece.y} x2={piece.x + 1} y2={piece.y + piece.height}
                  stroke="#10b981" strokeWidth={3} />
              )}
              {showEdgeBands && piece.edgeBandRight && (
                <line x1={piece.x + piece.width - 1} y1={piece.y}
                  x2={piece.x + piece.width - 1} y2={piece.y + piece.height}
                  stroke="#8b5cf6" strokeWidth={3} />
              )}

              {/* Label */}
              {showLabels && canFitLabel && (
                <>
                  <text
                    x={piece.x + piece.width / 2}
                    y={piece.y + piece.height / 2 - fontSize * 0.3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(fontSize, 8)}
                    fontWeight="600"
                    fill="#1e293b"
                  >{piece.code}</text>
                  <text
                    x={piece.x + piece.width / 2}
                    y={piece.y + piece.height / 2 + fontSize * 0.8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(fontSize * 0.7, 6)}
                    fill="#64748b"
                  >{piece.originalWidth}×{piece.originalHeight}</text>
                </>
              )}

              {/* Rotation indicator */}
              {piece.rotated && (
                <text
                  x={piece.x + 4} y={piece.y + Math.max(fontSize, 10)}
                  fontSize={Math.max(fontSize * 0.6, 6)}
                  fill="#64748b"
                >↻</text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 60} y={tooltip.y - 18} width={120} height={16}
              rx={3} fill="#1e293b" opacity={0.9} />
            <text x={tooltip.x} y={tooltip.y - 8} textAnchor="middle"
              fontSize={8} fill="white" fontWeight="500">{tooltip.text}</text>
          </g>
        )}
      </svg>

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button className="btn-secondary btn-sm w-8 h-8 flex items-center justify-center"
          onClick={() => setViewBox((vb) => ({
            x: vb.x + vb.w * 0.1, y: vb.y + vb.h * 0.1,
            w: vb.w * 0.8, h: vb.h * 0.8,
          }))}>+</button>
        <button className="btn-secondary btn-sm w-8 h-8 flex items-center justify-center"
          onClick={() => setViewBox((vb) => ({
            x: vb.x - vb.w * 0.125, y: vb.y - vb.h * 0.125,
            w: vb.w * 1.25, h: vb.h * 1.25,
          }))}>−</button>
        <button className="btn-secondary btn-sm w-8 h-8 flex items-center justify-center text-xs"
          onClick={resetZoom}>⟲</button>
      </div>
    </div>
  );
}
