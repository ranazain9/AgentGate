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
    const { tool, trace } = await req.json()

    console.log(`Executing tool: ${tool?.name || tool?.type}`);

    // Mock delay for tool execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = { success: true, data: 'Mock tool execution result' };

    return new Response(
      JSON.stringify({ 
        result,
        duration_ms: 1500
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
