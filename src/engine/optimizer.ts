// ═══════════════════════════════════════════════════════════
// OPTIMIZER — Thin wrapper that delegates to a Web Worker
// so the main/UI thread is NEVER blocked.
// ═══════════════════════════════════════════════════════════

import type {
  Piece, Material, EdgeBand, OptimizationConfig, OptimizationResult,
} from '@/types';

// Vite resolves `?worker` imports to inline web workers at build time.
import OptimizerWorker from './optimizer.worker?worker';

import type { WorkerOutMsg } from './optimizer.worker';

export async function runOptimization(
  pieces: Piece[],
  materials: Material[],
  edgeBands: EdgeBand[],
  config: OptimizationConfig,
  onProgress?: (pct: number, detail?: string) => void,
): Promise<OptimizationResult> {
  return new Promise<OptimizationResult>((resolve, reject) => {
    const worker = new OptimizerWorker();

    worker.onmessage = (e: MessageEvent<WorkerOutMsg>) => {
      const msg = e.data;

      if (msg.type === 'progress') {
        onProgress?.(msg.pct, msg.detail);
        return;
      }

      if (msg.type === 'result') {
        worker.terminate();
        resolve(msg.data);
        return;
      }

      if (msg.type === 'error') {
        worker.terminate();
        reject(new Error(msg.message));
        return;
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || 'Worker error'));
    };

    // Send data to the worker to start optimization
    worker.postMessage({
      type: 'run',
      pieces,
      materials,
      edgeBands,
      config,
    });
  });
}
