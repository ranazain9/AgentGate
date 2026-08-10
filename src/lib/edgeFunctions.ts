import { SUPABASE_URL } from '../constants/config';
import { supabase, getEdgeToken } from './supabase';

const EDGE_URL = `${SUPABASE_URL}/functions/v1`;

async function callEdge(
  slug: string,
  body: unknown,
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke(slug, {
    body,
  });

  if (error) {
    throw error;
  }
  
  return data;
}

async function callEdgeGet(
  slug: string,
  params: Record<string, string>,
): Promise<unknown> {
  const token = await getEdgeToken();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${EDGE_URL}/${slug}?${qs}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: token,
    },
  });

  if (!res.ok) {
    let msg = `Edge function error (${res.status})`;
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json();
}

// --- Run Agent ---

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  type: 'rest_read' | 'rest_write';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: Record<string, unknown>;
}

export async function runAgent(params: {
  run_id: string;
  prompt: string;
  system_prompt?: string;
  model?: string;
  tools?: ToolConfig[];
  max_steps?: number;
}) {
  return callEdge('run-agent', params) as Promise<{
    result: string;
    steps: number;
    traces_url: string;
  }>;
}

// --- Resolve Approval ---

export async function resolveApproval(params: {
  proposal_id: string;
  action: 'approved' | 'rejected';
}) {
  return callEdge('resolve-approval', params) as Promise<{
    id: string;
    status: string;
    resolved_at: string;
    execution_result: unknown | null;
  }>;
}

// --- Get Run Traces ---

export async function getRunTraces(run_id: string) {
  return callEdgeGet('get-run-traces', { run_id }) as Promise<{
    run_id: string;
    traces: unknown[];
  }>;
}

// --- List Runs ---

export async function listRuns(params?: {
  limit?: number;
  offset?: number;
}) {
  return callEdgeGet('list-runs', {
    limit: String(params?.limit ?? 20),
    offset: String(params?.offset ?? 0),
  }) as Promise<{
    runs: unknown[];
    total: number;
    limit: number;
    offset: number;
  }>;
}

// --- Tool Executor ---

export interface ToolCall {
  id: string;
  type: 'rest_read' | 'rest_write';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
}

export async function executeTool(params: {
  tool: ToolCall;
  trace?: {
    run_id: string;
    step: number;
    type: 'llm_call' | 'tool_call' | 'decision';
    input: unknown;
    output: unknown;
  };
}) {
  return callEdge('tool-executor', params) as Promise<{
    result: unknown;
    duration_ms: number;
  }>;
}

// --- Generate Proposal ---

export async function generateProposal(params: { agentName: string }) {
  return (await callEdge('generate-proposal', params)) as {
    action: string;
    riskJustification: string;
  };
}

// --- Build Agent (AI Builder) ---

export async function buildAgent(prompt: string) {
  return (await callEdge('build-agent', { prompt })) as {
    name: string;
    description: string;
    systemPrompt: string;
    agentType: 'WORKER' | 'SENTRY';
    provider: string;
  };
}

// --- Sentry Orchestrator (Multi-Agent) ---

export async function evaluateProposalStream(
  params: { agentName: string; action: string; riskJustification: string },
  onUpdate: (chunk: any) => void
): Promise<any> {
  const token = await getEdgeToken();
  const res = await fetch(`${EDGE_URL}/sentry-orchestrator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: token,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`Edge function error (${res.status})`);
  if (!res.body) throw new Error('No stream body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkStr = decoder.decode(value, { stream: true });
    const lines = chunkStr.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        try {
          const data = JSON.parse(dataStr);
          if (data.type === 'update') {
            onUpdate(data.chunk);
            if (data.chunk?.resolver) {
              finalResult = data.chunk.resolver;
            }
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        } catch (e) {
          // parse error
        }
      }
    }
  }
  return finalResult;
}