import { useState } from 'react';
import { useEdgeBandsStore } from '@/stores/edgeBandsStore';
import { EdgeBand } from '@/types';
import { parseNumberSafe } from '@/utils/helpers';
import { useTranslation } from '@/i18n';
import { Plus, Trash2 } from 'lucide-react';

export function EdgeBandsTab() {
  const { t } = useTranslation();
  const edgeBands = useEdgeBandsStore((s) => s.edgeBands);
  const addEdgeBand = useEdgeBandsStore((s) => s.addEdgeBand);
  const updateEdgeBand = useEdgeBandsStore((s) => s.updateEdgeBand);
  const removeEdgeBands = useEdgeBandsStore((s) => s.removeEdgeBands);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleChange = (id: string, key: keyof EdgeBand, value: string) => {
    if (key === 'supplementaryIncrease') {
      updateEdgeBand(id, { [key]: parseNumberSafe(value, 0) });
    } else {
      updateEdgeBand(id, { [key]: value } as Partial<EdgeBand>);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-200 bg-surface-0">
        <button className="btn-primary btn-sm" onClick={() => addEdgeBand()}>
          <Plus className="w-3.5 h-3.5" /> {t.edgeBandsTab.newBand}
        </button>
        <button
          className="btn-danger btn-sm"
          onClick={() => { removeEdgeBands(Array.from(selectedIds)); setSelectedIds(new Set()); }}
          disabled={selectedIds.size === 0}
        >
          <Trash2 className="w-3.5 h-3.5" /> {t.edgeBandsTab.remove}
        </button>
        <div className="flex-1" />
        <span className="text-xs text-surface-400">{t.edgeBandsTab.count.replace('{count}', String(edgeBands.length))}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse max-w-2xl">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="grid-cell-header w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === edgeBands.length && edgeBands.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(edgeBands.map((eb) => eb.id)));
                    else setSelectedIds(new Set());
                  }}
                />
              </th>
              <th className="grid-cell-header w-32">{t.edgeBandsTab.colCode}</th>
              <th className="grid-cell-header w-64">{t.edgeBandsTab.colDescription}</th>
              <th className="grid-cell-header w-36">{t.edgeBandsTab.colIncrease}</th>
            </tr>
          </thead>
          <tbody>
            {edgeBands.map((eb) => (
              <tr key={eb.id} className={selectedIds.has(eb.id) ? 'grid-row-selected' : 'hover:bg-surface-50'}>
                <td className="grid-cell w-8 text-center">
                  <input type="checkbox" checked={selectedIds.has(eb.id)}
                    onChange={() => toggleSelect(eb.id)} />
                </td>
                <td className="grid-cell w-32">
                  <input className="grid-cell-input" value={eb.code}
                    onChange={(e) => handleChange(eb.id, 'code', e.target.value)} />
                </td>
                <td className="grid-cell w-64">
                  <input className="grid-cell-input" value={eb.description}
                    onChange={(e) => handleChange(eb.id, 'description', e.target.value)} />
                </td>
                <td className="grid-cell w-36">
                  <input className="grid-cell-input" type="number" step={0.1}
                    value={eb.supplementaryIncrease}
                    onChange={(e) => handleChange(eb.id, 'supplementaryIncrease', e.target.value)} />
                </td>
              </tr>
            ))}
            {edgeBands.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-surface-400">
                  <p>{t.edgeBandsTab.emptyTitle}</p>
                  <p className="text-xs mt-1">{t.edgeBandsTab.emptyHint}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Info */}
      <div className="px-3 py-2 border-t border-surface-200 bg-surface-50 text-xs text-surface-500">
        {t.edgeBandsTab.info}
      </div>
    </div>
  );
}
