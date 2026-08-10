export interface Agent {
  id: string;
  name: string;
  rule: string;
  trustScore: number;
  sessionRequestCount: number;
  isBuiltIn: boolean;
  mockApiKey?: string;
  agentType?: 'WORKER' | 'SENTRY';
  sentryId?: string;
}

export interface AuditEntry {
  id: string;
  agentName: string;
  action: string;
  riskJustification: string;
  decision: 'approved' | 'rejected' | 'escalated';
  note: string;
  timestamp: number;
  sentryReasoning?: string;
  confidenceScore?: number;
}

export interface ProposalCard {
  id: string;
  agentName: string;
  action: string;
  riskJustification: string;
  timestamp: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  sentryReasoning?: string;
  confidenceScore?: number;
}

export interface ApprovalRule {
  name: string;
  enabled: boolean;
  condition: {
    field: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
    value: string;
  };
  action: {
    type: 'REQUIRE_HUMAN_APPROVAL' | 'AUTO_APPROVE' | 'ESCALATE_TO_TEAM';
    routeToTeam?: string;
    sla?: string;
  };
}

export interface AgentConfig {
  id: string;
  metadata: {
    name: string;
    agentId: string;
    namespace?: string;
    owner?: string;
    agentType?: 'WORKER' | 'SENTRY';
    sentryId?: string;
  };
  spec: {
    goal: string;
    description?: string;
    reasoning: {
      provider: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
    tools: string[];
    dataSources: Array<{
      name: string;
      refreshPolicy: 'on_trigger' | 'hourly' | 'daily';
    }>;
    governance: {
      state: 'PROBATION' | 'ACTIVE' | 'SUSPENDED';
      spendingLimit?: { daily: number };
      approvalRules: ApprovalRule[];
    };
  };
  createdAt: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  type: 'rest_read' | 'rest_write' | 'databright_select';
  handler: string;
  method?: string;
  requiresApproval: boolean;
  approvalThreshold?: number;
  timeout: number;
  rateLimit: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'snowflake' | 'salesforce' | 'mysql' | 'mongodb' | 's3';
  brightDataZone: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  queryTemplate: string;
  allowedTables: string[];
  refreshPolicy: 'on_trigger' | 'hourly' | 'daily';
}

export interface SentryState {
  agents: Agent[];
  auditLog: AuditEntry[];
  dismissedBanners: string[];
  agentConfigs: AgentConfig[];
  tools: ToolDefinition[];
  dataSources: DataSource[];
}