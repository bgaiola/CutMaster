export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-project-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function corsResponse(body: string, status: number, extra?: Record<string, string>) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extra },
  });
}
