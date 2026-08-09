import type { AgentConfig } from '../types';

/**
 * Escape a string value for safe YAML output.
 * If the value contains special characters, wraps it in quotes.
 */
function yamlValue(value: string, indent = 0): string {
  const pad = ' '.repeat(indent);
  if (/^[a-zA-Z0-9_/. -]+$/.test(value) && !/^[0-9]/.test(value)) {
    return `${pad}${value}`;
  }
  // Escape backslashes and quotes
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `${pad}"${escaped}"`;
}

/**
 * Generate a YAML string from an AgentConfig following the sentry/v1 schema.
 * Uses pure string templates — no js-yaml dependency.
 */
export function generateAgentYaml(config: AgentConfig): string {
  const lines: string[] = [];

  // Header
  lines.push('apiVersion: sentry/v1');
  lines.push('kind: Agent');
  lines.push('metadata:');
  lines.push(`  name: ${yamlValue(config.metadata.name, 2)}`);
  lines.push(`  agent_id: ${yamlValue(config.metadata.agentId, 2)}`);
  if (config.metadata.namespace) {
    lines.push(`  namespace: ${yamlValue(config.metadata.namespace, 2)}`);
  }
  if (config.metadata.owner) {
    lines.push(`  owner: ${yamlValue(config.metadata.owner, 2)}`);
  }

  // Spec
  lines.push('spec:');

  // Goal (multi-line with |)
  lines.push(`  goal: |`);
  const goalLines = config.spec.goal.split('\n');
  for (const gLine of goalLines) {
    lines.push(`    ${gLine}`);
  }

  // Description (optional)
  if (config.spec.description) {
    lines.push(`  description: |`);
    const descLines = config.spec.description.split('\n');
    for (const dLine of descLines) {
      lines.push(`    ${dLine}`);
    }
  }

  // Reasoning
  lines.push('  reasoning:');
  lines.push(`    provider: ${yamlValue(config.spec.reasoning.provider, 4)}`);
  lines.push(`    model: ${yamlValue(config.spec.reasoning.model, 4)}`);
  lines.push(`    temperature: ${config.spec.reasoning.temperature}`);
  lines.push(`    max_tokens: ${config.spec.reasoning.maxTokens}`);

  // Tools (empty array in v2)
  lines.push('  tools: []');

  // Data sources
  if (config.spec.dataSources.length > 0) {
    lines.push('  data_sources:');
    for (const ds of config.spec.dataSources) {
      lines.push(`    - name: ${yamlValue(ds.name, 6)}`);
      lines.push(`      refresh_policy: ${ds.refreshPolicy}`);
    }
  } else {
    lines.push('  data_sources: []');
  }

  // Governance
  lines.push('  governance:');
  lines.push(`    state: ${config.spec.governance.state}`);

  if (config.spec.governance.spendingLimit) {
    lines.push('    spending_limit:');
    lines.push(`      daily: ${config.spec.governance.spendingLimit.daily}`);
  }

  if (config.spec.governance.approvalRules.length > 0) {
    lines.push('    approval_rules:');
    for (const rule of config.spec.governance.approvalRules) {
      lines.push(`      - name: ${yamlValue(rule.name, 8)}`);
      lines.push(`        enabled: ${rule.enabled}`);
      lines.push('        condition:');
      lines.push(`          field: ${rule.condition.field}`);
      lines.push(`          operator: ${rule.condition.operator}`);
      lines.push(`          value: "${rule.condition.value}"`);
      lines.push('        action:');
      lines.push(`          type: ${rule.action.type}`);
      if (rule.action.routeToTeam) {
        lines.push(`          route_to_team: ${yamlValue(rule.action.routeToTeam, 10)}`);
      }
      if (rule.action.sla) {
        lines.push(`          sla: ${rule.action.sla}`);
      }
    }
  } else {
    lines.push('    approval_rules: []');
  }

  return lines.join('\n');
}