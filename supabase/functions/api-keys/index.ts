// ═══════════════════════════════════════════════════════════
// NestBrain API Keys Management — Supabase Edge Function
//
// POST   /functions/v1/api-keys          — Create a new API key
// GET    /functions/v1/api-keys          — List API keys
// DELETE /functions/v1/api-keys?id=<id>  — Revoke an API key
//
// All endpoints require Supabase JWT auth (not API key auth).
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, corsResponse } from '../_shared/cors.ts';
import { hashKey } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate with Supabase JWT only (not API keys)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return corsResponse(JSON.stringify({ error: 'Missing authorization' }), 401);
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return corsResponse(JSON.stringify({ error: 'Invalid session' }), 401);
    }

    // ─── POST: Create API key ─────────────────────────────
    if (req.method === 'POST') {
      const { name } = await req.json().catch(() => ({ name: 'Default' }));

      // Check key limit
      const { count } = await supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('revoked_at', null);

      if ((count ?? 0) >= 10) {
        return corsResponse(JSON.stringify({ error: 'API key limit reached (max 10)' }), 400);
      }

      // Generate key
      const rawBytes = new Uint8Array(32);
      crypto.getRandomValues(rawBytes);
      const rawKey = 'nb_' + Array.from(rawBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 40);

      const keyHash = await hashKey(rawKey);

      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: name || 'Default',
          key_hash: keyHash,
        });

      if (insertError) {
        return corsResponse(JSON.stringify({ error: insertError.message }), 500);
      }

      // Return the raw key ONCE — it cannot be retrieved again
      return corsResponse(JSON.stringify({
        key: rawKey,
        name,
        message: 'Store this key securely. It will not be shown again.',
      }), 201);
    }

    // ─── GET: List API keys ───────────────────────────────
    if (req.method === 'GET') {
      const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, name, created_at, last_used_at, revoked_at, permissions, rate_limit_per_minute')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return corsResponse(JSON.stringify({ error: error.message }), 500);
      }

      return corsResponse(JSON.stringify({ keys }), 200);
    }

    // ─── DELETE: Revoke API key ───────────────────────────
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const keyId = url.searchParams.get('id');
      if (!keyId) {
        return corsResponse(JSON.stringify({ error: 'id parameter required' }), 400);
      }

      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) {
        return corsResponse(JSON.stringify({ error: error.message }), 500);
      }

      return corsResponse(JSON.stringify({ success: true }), 200);
    }

    return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return corsResponse(JSON.stringify({ error: message }), 500);
  }
});
