const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DIMENSION_MM = 20_000; // 20 metres
const MAX_QUANTITY = 9_999;

export interface ValidationError {
  field: string;
  message: string;
}

/** Validate a CSV file before reading. */
export function validateCSVFile(file: File): ValidationError | null {
  if (file.size > MAX_CSV_SIZE_BYTES) {
    return { field: 'file', message: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` };
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'csv' && ext !== 'txt') {
    return { field: 'file', message: `Invalid file type ".${ext}". Only .csv and .txt are accepted.` };
  }
  return null;
}

/** Clamp a numeric dimension to valid range. Returns clamped value. */
export function clampDimension(value: number, min = 1, max = MAX_DIMENSION_MM): number {
  if (!Number.isFinite(value) || value < min) return min;
  if (value > max) return max;
  return value;
}

/** Clamp quantity to valid range. */
export function clampQuantity(value: number, min = 1, max = MAX_QUANTITY): number {
  const v = Math.round(value);
  if (!Number.isFinite(v) || v < min) return min;
  if (v > max) return max;
  return v;
}

/** Ensure a non-negative cost value. */
export function clampCost(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}
