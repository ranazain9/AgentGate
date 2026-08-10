import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { proposal_id, action } = await req.json()

    console.log(`Resolving proposal ${proposal_id} with action ${action}`);

    // Here you would typically resume an agent's execution loop 
    // or log the result to the audit_log table using the supabase client.

    return new Response(
      JSON.stringify({ 
        id: proposal_id,
        status: action,
        resolved_at: new Date().toISOString(),
        execution_result: action === 'approved' ? 'Action successfully executed.' : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
