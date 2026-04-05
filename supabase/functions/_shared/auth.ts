import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Authenticate a request using either:
 * 1. Supabase JWT token (from logged-in user session)
 * 2. Custom API key (from api_keys table)
 *
 * Returns the user_id or null if invalid.
 */
export async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // First try: JWT token via Supabase Auth
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (user) return { userId: user.id };

  // Second try: API key lookup
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const keyHash = await hashKey(token);

  const { data: apiKey } = await adminClient
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single();

  if (apiKey) {
    // Update last_used_at
    await adminClient
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);
    return { userId: apiKey.user_id };
  }

  return null;
}

export async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}
