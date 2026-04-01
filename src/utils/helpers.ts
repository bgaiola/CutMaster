import { v4 as uuidv4 } from 'uuid';

let pieceCounter = 0;

export function generatePieceCode(): string {
  pieceCounter++;
  return `P-${String(pieceCounter).padStart(4, '0')}`;
}

export function resetPieceCounter(lastNumber: number = 0): void {
  pieceCounter = lastNumber;
}

export function generateId(): string {
  return uuidv4();
}

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

export function parseNumberSafe(value: string, fallback: number = 0): number {
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? fallback : parsed;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function areaM2(widthMm: number, heightMm: number): number {
  return (widthMm * heightMm) / 1_000_000;
}

export function colorFromIndex(index: number): string {
  const palette = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#eab308',
    '#22c55e', '#d946ef', '#64748b', '#fb923c', '#2dd4bf',
    '#818cf8', '#f43f5e', '#4ade80', '#facc15', '#c084fc',
    '#fb7185', '#38bdf8', '#a3e635', '#fbbf24', '#a78bfa',
  ];
  return palette[index % palette.length];
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvToArray(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === ';' || ch === '\t') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = '';
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}
