// ═══════════════════════════════════════════════════════════
// NestBrain Optimization API — Supabase Edge Function
//
// POST /functions/v1/optimize
//
// Headers:
//   Authorization: Bearer <jwt_or_api_key>
//   X-Project-Name: "My Project" (optional)
//
// Body (JSON):
//   { pieces, materials, edgeBands?, config, saveProject?: boolean, costEnabled?: boolean }
//
// Response:
//   { success, data: OptimizationResult, projectId?, computeTimeMs }
// ═══════════════════════════════════════════════════════════

import { corsHeaders, corsResponse } from '../_shared/cors.ts';
import { authenticateRequest, getAdminClient } from '../_shared/auth.ts';

// NOTE: The optimizer core is embedded here as a self-contained copy
// for the Edge Function runtime. In production, you'd bundle it from
// src/engine/optimizer.worker.ts. For now, the Edge Function calls
// a simplified version or you deploy the full optimizer as a Deno module.

interface OptimizeRequest {
  pieces: unknown[];
  materials: unknown[];
  edgeBands?: unknown[];
  config: {
    bladeThickness: number;
    mode: 'freeform' | 'guillotine';
    guillotineMaxLevels: number;
    maxStackThickness: number;
    allowRotation: boolean;
    advancedMode: boolean;
  };
  saveProject?: boolean;
  costEnabled?: boolean;
  projectName?: string;
}

const MAX_PIECES = 2000;
const MAX_MATERIALS = 100;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // requests per window

// In-memory rate limiter (per Edge Function instance; for production use Redis)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
  }

  try {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    if (!auth) {
      return corsResponse(JSON.stringify({ error: 'Invalid or missing authentication token' }), 401);
    }

    // 1b. Rate limit
    if (!checkRateLimit(auth.userId)) {
      return corsResponse(JSON.stringify({
        error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per minute.`,
      }), 429);
    }

    // 2. Parse request
    const body: OptimizeRequest = await req.json();

    // 3. Validate
    if (!body.pieces?.length) {
      return corsResponse(JSON.stringify({ error: 'pieces array is required and must not be empty' }), 400);
    }
    if (!body.materials?.length) {
      return corsResponse(JSON.stringify({ error: 'materials array is required and must not be empty' }), 400);
    }
    if (!body.config) {
      return corsResponse(JSON.stringify({ error: 'config object is required' }), 400);
    }
    if (body.pieces.length > MAX_PIECES) {
      return corsResponse(JSON.stringify({ error: `Too many pieces (max ${MAX_PIECES})` }), 400);
    }
    if (body.materials.length > MAX_MATERIALS) {
      return corsResponse(JSON.stringify({ error: `Too many materials (max ${MAX_MATERIALS})` }), 400);
    }

    // 4. Run optimization
    // The optimizer core is loaded dynamically from the shared module.
    // For the Edge Function deployment, bundle the optimizer-core.ts alongside.
    // Here we use dynamic import from a bundled module:
    const { runOptimizationCore } = await import('./optimizer-core.ts');
    const { enrichResultWithCosts } = await import('./cost-calculator.ts');

    const startTime = performance.now();

    let result = runOptimizationCore(
      body.pieces,
      body.materials,
      body.edgeBands ?? [],
      body.config,
    );

    // Enrich with costs if requested
    if (body.costEnabled) {
      result = enrichResultWithCosts(result, body.materials, body.edgeBands ?? []);
    }

    const computeTimeMs = Math.round(performance.now() - startTime);

    // 5. Save project if requested
    let projectId: string | undefined;
    if (body.saveProject !== false) {
      const adminClient = getAdminClient();
      const projectName = body.projectName
        || req.headers.get('X-Project-Name')
        || `API Optimization ${new Date().toISOString().slice(0, 10)}`;

      const { data: project, error: dbError } = await adminClient
        .from('projects')
        .insert({
          user_id: auth.userId,
          name: projectName,
          description: `Generated via API — ${body.pieces.length} pieces, ${body.materials.length} materials`,
          data: {
            pieces: body.pieces,
            materials: body.materials,
            edgeBands: body.edgeBands ?? [],
            config: body.config,
            costEnabled: body.costEnabled ?? false,
          },
        })
        .select('id')
        .single();

      if (!dbError && project) {
        projectId = project.id;
      }
    }

    // 6. Return result
    return corsResponse(JSON.stringify({
      success: true,
      data: result,
      projectId,
      computeTimeMs,
    }), 200);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Optimization API error:', err);
    return corsResponse(JSON.stringify({ error: message }), 500);
  }
});
