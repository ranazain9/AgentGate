import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    const requestedHeaders = req.headers.get('Access-Control-Request-Headers');
    const dynamicCors = {
      ...corsHeaders,
      'Access-Control-Allow-Headers': requestedHeaders || corsHeaders['Access-Control-Allow-Headers'],
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    };
    return new Response('ok', { headers: dynamicCors })
  }

  try {
    const { agentName } = await req.json()
    const apiKey = Deno.env.get('AIML_API_KEY');
    
    if (!apiKey) {
      throw new Error('AIML_API_KEY environment variable is missing.');
    }

    // Call AIML API to generate a realistic proposal
    const prompt = `You are a Worker Agent named "${agentName}". You need to propose an action to take in a business/IT system.
Return a strictly valid JSON object with exactly two keys:
1. "action": A short string describing the action you want to take (e.g. "Update User Table", "Scrape Website", "Send Marketing Email").
2. "riskJustification": A short sentence justifying why this action is necessary and acknowledging any potential risks.
Do not output any markdown or other text, ONLY the JSON object.`;

    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // using a fast standard model available on AIML
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AIML API error: ${response.status} ${errText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({ 
        action: parsed.action || 'Unknown Action', 
        riskJustification: parsed.riskJustification || 'No justification provided.' 
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
