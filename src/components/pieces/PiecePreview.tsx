import { Piece } from '@/types';
import { useEdgeBandsStore } from '@/stores/edgeBandsStore';
import { useTranslation } from '@/i18n';

interface Props {
  piece: Piece;
}

const EDGE_COLORS: Record<string, string> = {};
function getEdgeColor(code: string): string {
  if (!code) return 'none';
  if (!EDGE_COLORS[code]) {
    const hue = (Object.keys(EDGE_COLORS).length * 60 + 200) % 360;
    EDGE_COLORS[code] = `hsl(${hue}, 70%, 50%)`;
  }
  return EDGE_COLORS[code];
}

export function PiecePreview({ piece }: Props) {
  const { t } = useTranslation();
  const edgeBands = useEdgeBandsStore((s) => s.edgeBands);

  if (!piece || piece.width <= 0 || piece.height <= 0) {
    return (
      <div className="flex items-center justify-center h-full text-surface-400 text-sm">
        {t.piecesTab.validDimensions}
      </div>
    );
  }

  const padding = 40;
  const labelSpace = 30;
  const maxW = 280;
  const maxH = 240;

  const scaleX = (maxW - padding * 2 - labelSpace) / piece.width;
  const scaleY = (maxH - padding * 2 - labelSpace) / piece.height;
  const scale = Math.min(scaleX, scaleY);

  const w = piece.width * scale;
  const h = piece.height * scale;
  const ox = (maxW - w) / 2;
  const oy = (maxH - h) / 2;

  const edgeThickness = 4;

  const getEdgeBandDesc = (code: string) => {
    const eb = edgeBands.find((e) => e.code === code);
    return eb ? eb.description || eb.code : code;
  };

  // Generate grain direction lines
  const grainLines = [];
  if (piece.grainDirection !== 'none') {
    const spacing = 12;
    if (piece.grainDirection === 'horizontal') {
      for (let y = oy + spacing; y < oy + h - spacing / 2; y += spacing) {
        grainLines.push(
          <line key={`grain-${y}`} x1={ox + 6} y1={y} x2={ox + w - 6} y2={y}
            stroke="#93c5fd" strokeWidth={0.6} strokeDasharray="4,3" opacity={0.7} />
        );
      }
    } else {
      for (let x = ox + spacing; x < ox + w - spacing / 2; x += spacing) {
        grainLines.push(
          <line key={`grain-${x}`} x1={x} y1={oy + 6} x2={x} y2={oy + h - 6}
            stroke="#93c5fd" strokeWidth={0.6} strokeDasharray="4,3" opacity={0.7} />
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={maxW} height={maxH} className="bg-surface-50 rounded border border-surface-200">
        {/* Main piece rectangle */}
        <rect
          x={ox}
          y={oy}
          width={w}
          height={h}
          fill="#dbeafe"
          stroke="#3b82f6"
          strokeWidth={1.5}
          rx={2}
        />

        {/* Grain direction lines */}
        {grainLines}

        {/* Edge bands */}
        {piece.edgeBandTop && (
          <rect x={ox} y={oy} width={w} height={edgeThickness}
            fill={getEdgeColor(piece.edgeBandTop)} rx={1} />
        )}
        {piece.edgeBandBottom && (
          <rect x={ox} y={oy + h - edgeThickness} width={w} height={edgeThickness}
            fill={getEdgeColor(piece.edgeBandBottom)} rx={1} />
        )}
        {piece.edgeBandLeft && (
          <rect x={ox} y={oy} width={edgeThickness} height={h}
            fill={getEdgeColor(piece.edgeBandLeft)} rx={1} />
        )}
        {piece.edgeBandRight && (
          <rect x={ox + w - edgeThickness} y={oy} width={edgeThickness} height={h}
            fill={getEdgeColor(piece.edgeBandRight)} rx={1} />
        )}

        {/* Grain direction arrow indicator */}
        {piece.grainDirection !== 'none' && (
          <g opacity={0.6}>
            {piece.grainDirection === 'horizontal' ? (
              <>
                <line x1={ox + w / 2 - 12} y1={oy + h - 12} x2={ox + w / 2 + 12} y2={oy + h - 12}
                  stroke="#2563eb" strokeWidth={1.5} markerEnd="url(#grainArrow)" />
                <text x={ox + w / 2 + 16} y={oy + h - 9} fontSize={7} fill="#2563eb" fontWeight="500">⇒</text>
              </>
            ) : (
              <>
                <line x1={ox + w - 12} y1={oy + h / 2 + 12} x2={ox + w - 12} y2={oy + h / 2 - 12}
                  stroke="#2563eb" strokeWidth={1.5} markerEnd="url(#grainArrow)" />
                <text x={ox + w - 16} y={oy + h / 2 - 14} fontSize={7} fill="#2563eb" fontWeight="500" textAnchor="middle">⇓</text>
              </>
            )}
          </g>
        )}

        {/* Width dimension */}
        <line x1={ox} y1={oy + h + 15} x2={ox + w} y2={oy + h + 15}
          stroke="#64748b" strokeWidth={0.8} markerEnd="url(#arrow)" markerStart="url(#arrowR)" />
        <text x={ox + w / 2} y={oy + h + 28} textAnchor="middle"
          className="fill-surface-600 text-xs font-mono">{piece.width} mm</text>

        {/* Height dimension */}
        <line x1={ox + w + 15} y1={oy} x2={ox + w + 15} y2={oy + h}
          stroke="#64748b" strokeWidth={0.8} />
        <text x={ox + w + 20} y={oy + h / 2 + 4} textAnchor="start"
          className="fill-surface-600 text-xs font-mono">{piece.height} mm</text>

        {/* ID label */}
        <text x={ox + w / 2} y={oy + h / 2 + 5} textAnchor="middle"
          className="fill-brand-700 font-semibold text-sm">{piece.code}</text>

        {/* Arrow markers */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="#64748b" />
          </marker>
          <marker id="arrowR" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6" fill="#64748b" />
          </marker>
          <marker id="grainArrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5" fill="#2563eb" />
          </marker>
        </defs>
      </svg>

      {/* Edge band legend */}
      <div className="mt-2 flex flex-wrap gap-2 justify-center text-2xs">
        {[
          { label: t.piecePreview.top, code: piece.edgeBandTop },
          { label: t.piecePreview.bottom, code: piece.edgeBandBottom },
          { label: t.piecePreview.left, code: piece.edgeBandLeft },
          { label: t.piecePreview.right, code: piece.edgeBandRight },
        ].filter(e => e.code).map((e) => (
          <span key={e.label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: getEdgeColor(e.code) }} />
            <span className="text-surface-500">{e.label}: {getEdgeBandDesc(e.code)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
