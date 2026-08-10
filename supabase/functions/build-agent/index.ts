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
    const { prompt } = await req.json()
    const apiKey = Deno.env.get('AIML_API_KEY');
    
    if (!apiKey) {
      throw new Error('AIML_API_KEY environment variable is missing.');
    }

    const systemPrompt = `You are a Meta-Builder AI Architect for a multi-agent platform. 
The user will describe an agent they want to build. Your job is to translate their description into a strictly valid JSON configuration for the new agent.

The JSON MUST match this structure exactly:
{
  "name": "A short 1-3 word name for the agent",
  "description": "A 1-2 sentence description of what the agent does",
  "systemPrompt": "A detailed system prompt instructing the agent on its role, constraints, and behavior",
  "agentType": "WORKER",
  "provider": "aimlapi"
}
If they ask for a Sentry/Approval agent, set agentType to "SENTRY".

Do not output any markdown formatting, only the raw JSON string.`;

    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AIML API error: ${response.status} ${errText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    const agentConfig = JSON.parse(content);

    return new Response(
      JSON.stringify(agentConfig),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
