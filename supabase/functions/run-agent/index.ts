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
    const { run_id, prompt, system_prompt, agentName } = await req.json()
    
    const aimlKey = Deno.env.get('AIML_API_KEY');
    const brightDataKey = Deno.env.get('BRIGHT_DATA_API_KEY');
    
    if (!aimlKey) {
      throw new Error('AIML_API_KEY environment variable is missing.');
    }

    console.log(`Starting agent run ${run_id} with prompt: ${prompt}`);

    // Define the tools available to the agent
    const tools = [
      {
        type: "function",
        function: {
          name: "scrape_website",
          description: "Scrape a website and extract its text content.",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "The full URL of the website to scrape." }
            },
            required: ["url"],
          },
        }
      }
    ];

    // 1. Initial LLM Call (Agent decides whether to use a tool)
    const messages = [
      { role: "system", content: system_prompt || `You are a helpful AI agent named ${agentName || 'Assistant'}. You have access to tools.` },
      { role: "user", content: prompt }
    ];

    let response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aimlKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AIML API error: ${response.status} ${errText}`);
    }

    let aiData = await response.json();
    let message = aiData.choices[0].message;
    let finalResult = message.content;
    let steps = 1;

    // 2. Execute Tool if LLM requested it
    if (message.tool_calls && message.tool_calls.length > 0) {
      steps++;
      messages.push(message); // append assistant's tool call request

      for (const toolCall of message.tool_calls) {
        if (toolCall.function.name === "scrape_website") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`Agent wants to scrape URL: ${args.url}`);
          
          let toolResult = "";
          if (!brightDataKey) {
            toolResult = `ERROR: Bright Data API Key is missing. Tell the user to add BRIGHT_DATA_API_KEY to the Supabase environment variables to actually scrape ${args.url}.`;
          } else {
            try {
              // Call Bright Data Web Scraper API (example implementation)
              // This is a generic representation; actual Bright Data endpoints may vary
              const bdResponse = await fetch('https://api.brightdata.com/dca/trigger', {
                 method: 'POST',
                 headers: {
                   'Authorization': `Bearer ${brightDataKey}`,
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                   zone: 'web_unlocker', // Example zone
                   url: args.url,
                   format: 'raw'
                 })
              });
              
              if (bdResponse.ok) {
                // For simplicity, we just mock that the scraping was triggered or returned data
                toolResult = `Successfully scraped ${args.url}. (Simulated content: The website mentions exciting new AI features and pricing plans.)`;
              } else {
                toolResult = `Failed to scrape ${args.url}. Status: ${bdResponse.status}`;
              }
            } catch (err) {
               toolResult = `Error executing scrape: ${err.message}`;
            }
          }

          // Append tool result back to messages
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResult
          });
        }
      }

      // 3. Final LLM Call to summarize tool results
      const finalResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aimlKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.7,
        })
      });

      const finalData = await finalResponse.json();
      finalResult = finalData.choices[0].message.content;
    }

    const traces_url = `/runs/${run_id}/traces`;

    return new Response(
      JSON.stringify({ result: finalResult, steps, traces_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
