import { SUPABASE_URL } from '../constants/config';
import { getEdgeToken } from './supabase';

const EDGE_URL = `${SUPABASE_URL}/functions/v1`;

async function callEdge(
  slug: string,
  body: unknown,
): Promise<unknown> {
  const token = await getEdgeToken();
  const res = await fetch(`${EDGE_URL}/${slug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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