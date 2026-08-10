import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Agent, AuditEntry, ProposalCard, SentryState, AgentConfig, ToolDefinition, DataSource } from '../types';

// ────────────────────────────────────────────
// Row types returned by Supabase
// ────────────────────────────────────────────

interface AgentConfigRow {
  id: string;
  name: string;
  agent_id_slug: string;
  description: string | null;
  namespace: string | null;
  owner: string | null;
  goal: string;
  reasoning_provider: string;
  reasoning_model: string;
  temperature: number;
  max_tokens: number;
  governance_state: 'PROBATION' | 'ACTIVE' | 'SUSPENDED';
  spending_limit_daily: number | null;
  tools_attached: Array<{ tool_id: string; tool_name: string }>;
  data_sources_attached: Array<Record<string, unknown>>;
  approval_rules: Array<Record<string, unknown>>;
  config_yaml: string | null;
  is_active: boolean;
  created_at: string;
}

interface ToolRow {
  id: string;
  name: string;
  type: 'rest_read' | 'rest_write' | 'databright_select';
  handler: string;
  method: string | null;
  requires_approval: boolean;
  approval_threshold: number | null;
  timeout_seconds: number;
  rate_limit: string | null;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

interface ApprovalQueueRow {
  id: string;
  agent_config_id: string;
  tool_name: string;
  tool_arguments: Record<string, unknown>;
  risk_score: number;
  risk_justification: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewer_note: string | null;
  created_at: string;
  resolved_at: string | null;
  agent_name?: string;
  agent_configs?: { name: string };
}

// ────────────────────────────────────────────
// Transform helpers
// ────────────────────────────────────────────

function rowToAgent(row: AgentConfigRow): Agent {
  const rules = (row.approval_rules ?? []) as Array<any>;
  let rule = row.description ?? row.goal;
  
  if (rules.length > 0) {
    const firstRule = rules[0];
    if (firstRule.reason) {
      rule = firstRule.reason;
    } else if (firstRule.condition && firstRule.condition.field) {
      rule = `Requires approval if ${firstRule.condition.field} ${firstRule.condition.operator} ${firstRule.condition.value}`;
    }
  }
  return {
    id: row.id,
    name: row.name,
    rule,
    trustScore: row.governance_state === 'ACTIVE' ? 70 : row.governance_state === 'PROBATION' ? 40 : 10,
    sessionRequestCount: 0,
    isBuiltIn: false,
  };
}

function rowToAgentConfig(row: AgentConfigRow): AgentConfig {
  const rawSources = (row.data_sources_attached ?? []) as Array<{ name?: string; refreshPolicy?: string }>;
  const rawRules = (row.approval_rules ?? []) as Array<{ [key: string]: unknown }>;
  return {
    id: row.id,
    metadata: {
      name: row.name,
      agentId: row.agent_id_slug,
      namespace: row.namespace ?? undefined,
      owner: row.owner ?? undefined,
    },
    spec: {
      goal: row.goal,
      description: row.description ?? undefined,
      reasoning: {
        provider: row.reasoning_provider,
        model: row.reasoning_model,
        temperature: row.temperature,
        maxTokens: row.max_tokens,
      },
      tools: (row.tools_attached ?? []).map(t => t.tool_name),
      dataSources: rawSources.map(d => ({
        name: String(d.name ?? ''),
        refreshPolicy: (d.refreshPolicy as 'on_trigger' | 'hourly' | 'daily') ?? 'on_trigger',
      })),
      governance: {
        state: row.governance_state,
        spendingLimit: row.spending_limit_daily != null ? { daily: row.spending_limit_daily } : undefined,
        approvalRules: rawRules.map(r => ({
          name: String(r.reason ?? `${r.type} rule`),
          enabled: true,
          condition: {
            field: String(r.tool ?? r.type ?? 'unknown'),
            operator: 'gte' as const,
            value: String(r.limit ?? 0),
          },
          action: {
            type: 'REQUIRE_HUMAN_APPROVAL' as const,
          },
        })),
      },
    },
    createdAt: new Date(row.created_at).getTime(),
  };
}

function rowToTool(row: ToolRow): ToolDefinition {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    handler: row.handler,
    method: row.method ?? undefined,
    requiresApproval: row.requires_approval,
    approvalThreshold: row.approval_threshold ?? undefined,
    timeout: row.timeout_seconds,
    rateLimit: row.rate_limit ?? '10/min',
    inputSchema: row.input_schema ?? {},
    outputSchema: row.output_schema ?? {},
  };
}

function formatRowAction(row: ApprovalQueueRow): string {
  const args = row.tool_arguments as Record<string, any> | undefined;
  if (args && args.full_action) {
    return String(args.full_action);
  }
  
  if (!args || Object.keys(args).length === 0) {
    return row.tool_name ?? 'Unknown Action';
  }
  
  // Format cleanly if there are arguments
  const cleanArgs = Object.entries(args)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
    
  return `${row.tool_name} (${cleanArgs})`;
}

function rowToProposal(row: ApprovalQueueRow): ProposalCard {
  return {
    id: row.id,
    agentName: row.agent_name ?? 'Unknown Agent',
    action: formatRowAction(row),
    riskJustification: row.risk_justification ?? '',
    timestamp: new Date(row.created_at).getTime(),
  };
}

function rowToAuditEntry(row: ApprovalQueueRow): AuditEntry {
  return {
    id: row.id,
    agentName: row.agent_name ?? 'Unknown Agent',
    action: formatRowAction(row),
    riskJustification: row.risk_justification ?? '',
    decision: (row.status === 'approved' ? 'approved' : 'rejected') as 'approved' | 'rejected',
    note: row.reviewer_note ?? '',
    timestamp: new Date(row.resolved_at ?? row.created_at).getTime(),
  };
}

// ────────────────────────────────────────────
// Context value type
// ────────────────────────────────────────────

interface SentryContextValue {
  state: SentryState;
  pendingProposals: ProposalCard[];
  loading: boolean;
  error: string | null;
  addProposal: (proposal: ProposalCard) => void;
  removeProposal: (id: string) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  adjustTrustScore: (agentId: string, delta: number) => void;
  incrementSessionCount: (agentId: string) => void;
  dismissBanner: (agentId: string) => void;
  addAgent: (agent: Agent) => void;
  addAgentConfig: (config: AgentConfig) => void;
  removeAgentConfig: (id: string) => void;
  addTool: (tool: ToolDefinition) => void;
  removeTool: (id: string) => void;
  addDataSource: (source: DataSource) => void;
  removeDataSource: (id: string) => void;
  getAgentConfigById: (id: string) => AgentConfig | undefined;
  triggerSimulation: () => void;
}

const SentryContext = createContext<SentryContextValue | null>(null);

// ────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────

export function SentryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SentryState>({
    agents: [],
    auditLog: [],
    dismissedBanners: [],
    agentConfigs: [],
    tools: [],
    dataSources: [],
  });
  const [pendingProposals, setPendingProposals] = useState<ProposalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch all data in parallel (anon key + RLS policies handle auth)
        const [agCfgRes, toolsRes, pendingRes, resolvedRes] = await Promise.all([
          supabase.from('agent_configs').select('*').order('created_at', { ascending: false }),
          supabase.from('agent_tools').select('*').order('created_at', { ascending: false }),
          supabase.from('approval_queue')
            .select('*, agent_configs!inner(name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
          supabase.from('approval_queue')
            .select('*, agent_configs!inner(name)')
            .in('status', ['approved', 'rejected'])
            .order('resolved_at', { ascending: false }),
        ]);

        if (cancelled) return;

        if (agCfgRes.error) throw agCfgRes.error;
        if (toolsRes.error) throw toolsRes.error;
        if (pendingRes.error) throw pendingRes.error;
        if (resolvedRes.error) throw resolvedRes.error;

        const configRows = (agCfgRes.data ?? []) as unknown as AgentConfigRow[];
        const toolRows = (toolsRes.data ?? []) as unknown as ToolRow[];
        const pendingRows = (pendingRes.data ?? []) as unknown as ApprovalQueueRow[];
        const resolvedRows = (resolvedRes.data ?? []) as unknown as ApprovalQueueRow[];

        // Normalise agent_name from the join
        for (const r of pendingRows) r.agent_name = r.agent_configs?.name ?? r.agent_name;
        for (const r of resolvedRows) r.agent_name = r.agent_configs?.name ?? r.agent_name;

        setState({
          agents: [...configRows.map(rowToAgent)],
          auditLog: resolvedRows.map(rowToAuditEntry),
          dismissedBanners: [],
          agentConfigs: configRows.map(rowToAgentConfig),
          tools: toolRows.map(rowToTool),
          dataSources: [
            { id: 'ds_aws_cloudtrail', name: 'AWS CloudTrail', type: 's3', refreshPolicy: 'on_trigger', brightDataZone: 'us-east-1', allowedTables: ['cloudtrail_logs'] },
            { id: 'ds_zendesk', name: 'Zendesk Tickets', type: 'postgresql', refreshPolicy: 'on_trigger', brightDataZone: 'zendesk-analytics', allowedTables: ['tickets', 'users', 'metrics'] },
            { id: 'ds_stripe', name: 'Stripe Transactions', type: 'snowflake', refreshPolicy: 'hourly', brightDataZone: 'stripe-dw-prod', allowedTables: ['charges', 'refunds', 'disputes'] },
            { id: 'ds_salesforce', name: 'Salesforce CRM', type: 'salesforce', refreshPolicy: 'hourly', brightDataZone: 'salesforce-replica', allowedTables: ['Account', 'Contact', 'Opportunity'] },
            { id: 'ds_github', name: 'GitHub PRs', type: 'postgresql', refreshPolicy: 'on_trigger', brightDataZone: 'github-metadata-db', allowedTables: ['pull_requests', 'commits'] }
          ],
        });
        setPendingProposals(pendingRows.map(rowToProposal));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // ── Realtime Subscription ──
    const channel = supabase
      .channel('approval_queue_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approval_queue' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            const newRow = payload.new as unknown as ApprovalQueueRow;
            // Optimistically add it (Agent name might be missing if we don't join, but UI will still show the ID)
            const newProposal = rowToProposal(newRow);
            setPendingProposals(prev => [newProposal, ...prev.filter(p => p.id !== newProposal.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as unknown as ApprovalQueueRow;
            if (updatedRow.status === 'approved' || updatedRow.status === 'rejected') {
              // Remove from queue and push to audit log
              setPendingProposals(prev => prev.filter(p => p.id !== updatedRow.id));
              setState(prev => {
                const entry = rowToAuditEntry(updatedRow);
                // Prevent duplicate audit entries
                if (prev.auditLog.some(e => e.id === entry.id)) return prev;
                return { ...prev, auditLog: [entry, ...prev.auditLog] };
              });
            }
          }
        }
      )
      .subscribe();

    return () => { 
      cancelled = true; 
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Mutations (local + Supabase) ──

  const addProposal = useCallback((proposal: ProposalCard) => {
    setPendingProposals(prev => [proposal, ...prev]);
  }, []);

  const removeProposal = useCallback((id: string) => {
    setPendingProposals(prev => prev.filter(p => p.id !== id));
  }, []);

  const addAuditEntry = useCallback((entry: AuditEntry) => {
    setState(prev => ({
      ...prev,
      auditLog: [entry, ...prev.auditLog],
    }));
  }, []);

  const adjustTrustScore = useCallback((agentId: string, delta: number) => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.id === agentId
          ? { ...a, trustScore: Math.max(0, Math.min(100, a.trustScore + delta)) }
          : a
      ),
    }));
  }, []);

  const incrementSessionCount = useCallback((agentId: string) => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.id === agentId
          ? { ...a, sessionRequestCount: a.sessionRequestCount + 1 }
          : a
      ),
    }));
  }, []);

  const dismissBanner = useCallback((agentId: string) => {
    setState(prev => ({
      ...prev,
      dismissedBanners: prev.dismissedBanners.includes(agentId)
        ? prev.dismissedBanners
        : [...prev.dismissedBanners, agentId],
    }));
  }, []);

  const clearSessionData = useCallback(() => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(a => ({ ...a, sessionRequestCount: 0 })),
      dismissedBanners: [],
    }));
  }, []);

  const addAgent = useCallback((agent: Agent) => {
    setState(prev => ({
      ...prev,
      agents: [...prev.agents, agent],
    }));
  }, []);

  // ── AgentConfig mutations ──

  const addAgentConfig = useCallback(async (config: AgentConfig) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      agentConfigs: [...prev.agentConfigs, config],
      agents: [...prev.agents, {
        id: config.id,
        name: config.metadata.name,
        rule: config.spec.governance.approvalRules.map(r => r.name).join('; '),
        trustScore: config.spec.governance.state === 'ACTIVE' ? 70 : config.spec.governance.state === 'PROBATION' ? 40 : 10,
        sessionRequestCount: 0,
        isBuiltIn: false,
        agentType: config.metadata.agentType,
        sentryId: config.metadata.sentryId,
      }],
    }));

    const { error: insertErr } = await supabase.from('agent_configs').insert({
      id: config.id,
      name: config.metadata.name,
      agent_id_slug: config.metadata.agentId,
      namespace: config.metadata.namespace ?? null,
      owner: config.metadata.owner ?? null,
      goal: config.spec.goal,
      description: config.spec.description ?? null,
      reasoning_provider: config.spec.reasoning.provider,
      reasoning_model: config.spec.reasoning.model,
      temperature: config.spec.reasoning.temperature,
      max_tokens: config.spec.reasoning.maxTokens,
      governance_state: config.spec.governance.state,
      spending_limit_daily: config.spec.governance.spendingLimit?.daily ?? null,
      tools_attached: config.spec.tools.map(name => ({ tool_name: name })),
      data_sources_attached: config.spec.dataSources.map(d => ({ name: d.name, refreshPolicy: d.refreshPolicy })),
      approval_rules: config.spec.governance.approvalRules.map(r => ({
        name: r.name, condition: r.condition, action: r.action,
      })),
    });
    if (insertErr) console.error('Failed to persist agent config:', insertErr);
  }, []);

  const removeAgentConfig = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      agentConfigs: prev.agentConfigs.filter(c => c.id !== id),
      agents: prev.agents.filter(a => a.id !== id),
    }));
    supabase.from('agent_configs').delete().eq('id', id).then(({ error: delErr }) => {
      if (delErr) console.error('Failed to delete agent config:', delErr);
    });
  }, []);

  // ── Tool mutations ──

  const addTool = useCallback((tool: ToolDefinition) => {
    setState(prev => ({ ...prev, tools: [...prev.tools, tool] }));
    supabase.from('agent_tools').insert({
      id: tool.id, name: tool.name, type: tool.type, handler: tool.handler,
      method: tool.method ?? null, requires_approval: tool.requiresApproval,
      approval_threshold: tool.approvalThreshold ?? null, timeout_seconds: tool.timeout,
      rate_limit: tool.rateLimit, input_schema: tool.inputSchema, output_schema: tool.outputSchema,
    }).then(({ error: insertErr }) => {
      if (insertErr) console.error('Failed to persist tool:', insertErr);
    });
  }, []);

  const removeTool = useCallback((id: string) => {
    setState(prev => ({ ...prev, tools: prev.tools.filter(t => t.id !== id) }));
    supabase.from('agent_tools').delete().eq('id', id).then(({ error: delErr }) => {
      if (delErr) console.error('Failed to delete tool:', delErr);
    });
  }, []);

  // ── DataSource mutations (local only — no dedicated table) ──

  const addDataSource = useCallback((source: DataSource) => {
    setState(prev => ({ ...prev, dataSources: [...prev.dataSources, source] }));
  }, []);

  const removeDataSource = useCallback((id: string) => {
    setState(prev => ({ ...prev, dataSources: prev.dataSources.filter(d => d.id !== id) }));
  }, []);

  const getAgentConfigById = useCallback((id: string) => {
    return state.agentConfigs.find(c => c.id === id);
  }, [state.agentConfigs]);

  const triggerSimulation = useCallback(() => {
    const fakeProposals: ProposalCard[] = [
      {
        id: `sim-${Date.now()}-1`,
        agentName: 'Finance Optimizer',
        action: 'Transfer $1,000,000 to unrecognized wallet',
        riskJustification: 'Unusual amount to external non-whitelisted address.',
        timestamp: Date.now(),
        status: 'ESCALATED',
        sentryReasoning: 'Critical risk: Amount exceeds daily limit and destination is unknown.',
        confidenceScore: 98,
      },
      {
        id: `sim-${Date.now()}-2`,
        agentName: 'Database Maintainer',
        action: 'DROP TABLE users CASCADE',
        riskJustification: 'Irreversible deletion of core authentication data.',
        timestamp: Date.now() + 1000,
        status: 'ESCALATED',
        sentryReasoning: 'Catastrophic risk: Attempting to delete production user table.',
        confidenceScore: 99,
      },
      {
        id: `sim-${Date.now()}-3`,
        agentName: 'Marketing Auto-Bot',
        action: 'Email 500,000 users with subject "FREE MONEY"',
        riskJustification: 'Mass email blast detected without human review step.',
        timestamp: Date.now() + 2000,
        status: 'ESCALATED',
        sentryReasoning: 'High risk: Spam heuristic matched, potential brand damage.',
        confidenceScore: 85,
      }
    ];

    setPendingProposals(prev => [...fakeProposals, ...prev]);
  }, []);

  return (
    <SentryContext.Provider
      value={{
        state, pendingProposals, loading, error,
        addProposal, removeProposal, addAuditEntry,
        adjustTrustScore, incrementSessionCount, dismissBanner,
        clearSessionData, addAgent, 
        addAgentConfig, removeAgentConfig,
        addTool, removeTool,
        addDataSource, removeDataSource,
        getAgentConfigById, triggerSimulation
      }}
    >
      {children}
    </SentryContext.Provider>
  );
}

export function useSentry() {
  const ctx = useContext(SentryContext);
  if (!ctx) throw new Error('useSentry must be used within SentryProvider');
  return ctx;
}