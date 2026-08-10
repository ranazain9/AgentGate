import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the State for the multi-agent graph
interface SentryState {
  agentName: string;
  action: string;
  riskJustification: string;
  securityDecision?: 'approved' | 'rejected';
  financialDecision?: 'approved' | 'rejected';
  finalStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
  reasoning: string[];
}

// Helper function to call AIML API
async function askSentry(role: string, action: string, riskJustification: string) {
  const apiKey = Deno.env.get('AIML_API_KEY');
  if (!apiKey) throw new Error("Missing AIML_API_KEY");

  const prompt = `You are a strict AI ${role}. A Worker Agent has proposed the following action:
ACTION: "${action}"
JUSTIFICATION: "${riskJustification}"

Evaluate this action. Is it safe to approve or should it be rejected?
Return a strictly valid JSON object with exactly two keys:
1. "decision": either "approved" or "rejected".
2. "reasoning": A short, 1-sentence explanation of why.
Do not output any markdown.`;

  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error("AIML API Request failed");
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    decision: parsed.decision === 'approved' ? 'approved' : 'rejected',
    reasoning: parsed.reasoning || 'No reasoning provided.'
  };
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
    const { agentName, action, riskJustification } = await req.json();

    // Stream the LangGraph execution back to the client using SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const state: SentryState = {
            agentName,
            action,
            riskJustification,
            reasoning: [],
          };

          // 1. Dispatcher
          sendEvent({ type: 'update', chunk: { dispatcher: { reasoning: ["Dispatcher: Received proposal, routing to Security and Financial Sentries."] } } });
          
          // 2. Sentries (Parallel)
          const securityPromise = askSentry('Security & Privacy Sentry (checking for PII leaks and destructive data operations)', action, riskJustification)
            .then(ai => ({ securityDecision: ai.decision, reasoning: `Security: ${ai.reasoning}` }))
            .catch(err => ({ securityDecision: 'rejected', reasoning: `Security: Error connecting to AI (${err.message}).` }));
            
          const financialPromise = askSentry('Financial & Resource Sentry (checking for budget and rate limit violations)', action, riskJustification)
            .then(ai => ({ financialDecision: ai.decision, reasoning: `Financial: ${ai.reasoning}` }))
            .catch(err => ({ financialDecision: 'rejected', reasoning: `Financial: Error connecting to AI (${err.message}).` }));

          const [sec, fin] = await Promise.all([securityPromise, financialPromise]);
          
          state.securityDecision = sec.securityDecision as any;
          state.financialDecision = fin.financialDecision as any;
          
          sendEvent({ type: 'update', chunk: { security_sentry: { decision: sec.securityDecision, reasoning: [sec.reasoning] } } });
          sendEvent({ type: 'update', chunk: { financial_sentry: { decision: fin.financialDecision, reasoning: [fin.reasoning] } } });

          // 3. Resolver
          let finalStatus = 'approved';
          const reasons = [];
          if (state.securityDecision === 'rejected' || state.financialDecision === 'rejected') {
            finalStatus = 'rejected';
            reasons.push("Resolver: Proposal was rejected by one or more Sentries.");
          } else {
            reasons.push("Resolver: Proposal passed all Sentries successfully.");
          }
          sendEvent({ type: 'update', chunk: { resolver: { finalStatus, reasoning: reasons } } });

          sendEvent({ type: 'done' });
          controller.close();
        } catch (err) {
          sendEvent({ type: 'error', error: err.message });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
