import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Basic Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header (Expected: Bearer <API_KEY>)");
    }

    const { agentName, action, riskJustification } = await req.json();
    if (!agentName || !action || !riskJustification) {
      throw new Error("Missing required fields: agentName, action, riskJustification");
    }

    // 1. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Look up the Agent in the Database
    // Note: In a real production app, we would validate the API key securely.
    // For this demo, we will trust the agentName and just look it up.
    const { data: configs, error: configError } = await supabase
      .from('agent_configs')
      .select('id, name')
      .eq('name', agentName)
      .limit(1);

    let agentConfigId;
    if (configError || !configs || configs.length === 0) {
      // For the demo, gracefully fallback if agent not found in DB
      agentConfigId = "00000000-0000-0000-0000-000000000000";
    } else {
      agentConfigId = configs[0].id;
    }

    // 3. Run AI Sentries (Security & Financial)
    const securityPromise = askSentry('Security & Privacy Sentry', action, riskJustification)
      .catch(err => ({ decision: 'rejected', reasoning: `Error: ${err.message}` }));
      
    const financialPromise = askSentry('Financial & Resource Sentry', action, riskJustification)
      .catch(err => ({ decision: 'rejected', reasoning: `Error: ${err.message}` }));

    const [sec, fin] = await Promise.all([securityPromise, financialPromise]);

    let finalStatus = 'approved';
    let reviewerNote = "Auto-approved by LangGraph Sentries";
    
    if (sec.decision === 'rejected' || fin.decision === 'rejected') {
      finalStatus = 'pending'; // Requires Human Approval (ESCALATED)
      reviewerNote = `Security: ${sec.reasoning} | Financial: ${fin.reasoning}`;
    }

    // 4. Insert into Approval Queue
    // Because we set up Realtime in SentryContext.tsx, this INSERT will magically appear on the user's UI!
    const runId = crypto.randomUUID();
    // Insert a dummy run to satisfy the foreign key constraint
    await supabase.from('agent_runs').insert({
      id: runId,
      agent_config_id: agentConfigId,
      status: 'running'
    });

    const { error: insertError } = await supabase
      .from('approval_queue')
      .insert({
        agent_config_id: agentConfigId,
        run_id: runId,
        tool_name: action.substring(0, 50),
        tool_arguments: { full_action: action },
        risk_score: 90,
        risk_justification: riskJustification,
        status: finalStatus,
        reviewer_note: reviewerNote
      });

    if (insertError) {
      throw new Error(`Failed to insert into approval queue: ${insertError.message}`);
    }

    // 5. Return Response to External Agent
    if (finalStatus === 'pending') {
      return new Response(JSON.stringify({ 
        status: "PENDING_APPROVAL", 
        message: "Your proposal was blocked by the AI Sentries and has been escalated for human review. Please check the AgentGate dashboard."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202,
      })
    } else {
      return new Response(JSON.stringify({ 
        status: "APPROVED", 
        message: "Your proposal was auto-approved by the AI Sentries! You may proceed."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
