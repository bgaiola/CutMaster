import { create } from 'zustand';
import { Piece } from '@/types';
import { generateId, generatePieceCode, resetPieceCounter } from '@/utils/helpers';

interface HistoryEntry {
  pieces: Piece[];
}

interface PiecesState {
  pieces: Piece[];
  selectedPieceId: string | null;
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  addPiece: (partial?: Partial<Piece>) => void;
  updatePiece: (id: string, updates: Partial<Piece>) => void;
  removePieces: (ids: string[]) => void;
  duplicatePieces: (ids: string[]) => void;
  setPieces: (pieces: Piece[]) => void;
  selectPiece: (id: string | null) => void;
  importPieces: (rows: Partial<Piece>[]) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

function createDefaultPiece(overrides?: Partial<Piece>): Piece {
  return {
    id: generateId(),
    code: generatePieceCode(),
    material: '',
    quantity: 1,
    width: 0,
    height: 0,
    edgeBandTop: '',
    edgeBandBottom: '',
    edgeBandLeft: '',
    edgeBandRight: '',
    sequence: null,
    description: '',
    description2: '',
    grainDirection: 'none',
    ...overrides,
  };
}

export const usePiecesStore = create<PiecesState>((set, get) => ({
  pieces: [],
  selectedPieceId: null,
  history: [{ pieces: [] }],
  historyIndex: 0,

  pushHistory: () => {
    const { pieces, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pieces: JSON.parse(JSON.stringify(pieces)) });
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addPiece: (partial) => {
    const { pushHistory } = get();
    pushHistory();
    const piece = createDefaultPiece(partial);
    set((s) => ({ pieces: [...s.pieces, piece], selectedPieceId: piece.id }));
  },

  updatePiece: (id, updates) => {
    set((s) => ({
      pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  removePieces: (ids) => {
    const { pushHistory } = get();
    pushHistory();
    set((s) => ({
      pieces: s.pieces.filter((p) => !ids.includes(p.id)),
      selectedPieceId: ids.includes(s.selectedPieceId || '') ? null : s.selectedPieceId,
    }));
  },

  duplicatePieces: (ids) => {
    const { pieces, pushHistory } = get();
    pushHistory();
    const dupes = pieces
      .filter((p) => ids.includes(p.id))
      .map((p) => ({
        ...p,
        id: generateId(),
        code: generatePieceCode(),
      }));
    set((s) => ({ pieces: [...s.pieces, ...dupes] }));
  },

  setPieces: (pieces) => {
    const { pushHistory } = get();
    pushHistory();
    const maxNum = pieces.reduce((max, p) => {
      const num = parseInt(p.code.replace('P-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    resetPieceCounter(maxNum);
    set({ pieces });
  },

  selectPiece: (id) => set({ selectedPieceId: id }),

  importPieces: (rows) => {
    const { pushHistory } = get();
    pushHistory();
    const newPieces = rows.map((row) => createDefaultPiece(row));
    set((s) => ({ pieces: [...s.pieces, ...newPieces] }));
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        pieces: JSON.parse(JSON.stringify(history[newIndex].pieces)),
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        pieces: JSON.parse(JSON.stringify(history[newIndex].pieces)),
        historyIndex: newIndex,
      });
    }
  },
}));
