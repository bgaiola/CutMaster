import { create } from 'zustand';
import { Figure, FigurePiecePlacement } from '@/types';
import { generateId } from '@/utils/helpers';

interface FiguresState {
  figures: Figure[];
  addFigure: (pieceIds: string[], gap: number) => Figure;
  updateFigure: (id: string, updates: Partial<Figure>) => void;
  updateLayout: (id: string, layout: FigurePiecePlacement[], boundingWidth: number, boundingHeight: number) => void;
  removeFigure: (id: string) => void;
  setFigures: (figures: Figure[]) => void;
}

export const useFiguresStore = create<FiguresState>()((set, get) => ({
  figures: [],

  addFigure: (pieceIds, gap) => {
    const figure: Figure = {
      id: generateId(),
      name: `Figure ${get().figures.length + 1}`,
      pieceIds,
      layout: pieceIds.map((pid) => ({ pieceId: pid, relativeX: 0, relativeY: 0 })),
      gap,
      boundingWidth: 0,
      boundingHeight: 0,
    };
    set((s) => ({ figures: [...s.figures, figure] }));
    return figure;
  },

  updateFigure: (id, updates) => {
    set((s) => ({
      figures: s.figures.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  },

  updateLayout: (id, layout, boundingWidth, boundingHeight) => {
    set((s) => ({
      figures: s.figures.map((f) =>
        f.id === id ? { ...f, layout, boundingWidth, boundingHeight } : f
      ),
    }));
  },

  removeFigure: (id) => {
    set((s) => ({ figures: s.figures.filter((f) => f.id !== id) }));
  },

  setFigures: (figures) => set({ figures }),
}));
