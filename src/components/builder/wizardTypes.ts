import type { ApprovalRule } from '../../types';

export interface WizardFormState {
  // Step 1: Basic Info
  name: string;
  agentId: string;
  goal: string;
  model: string;
  temperature: number;
  description: string;
  namespace: string;
  owner: string;
  // Step 2: Tools
  selectedTools: string[];
  // Step 3: Data Sources
  selectedDataSources: string[];
  // Step 4: Governance
  governanceState: 'PROBATION' | 'ACTIVE' | 'SUSPENDED';
  spendingLimit: number;
  approvalRules: ApprovalRule[];
}

export function emptyWizardFormState(): WizardFormState {
  return {
    name: '',
    agentId: '',
    goal: '',
    model: 'gpt-4-turbo',
    temperature: 0.3,
    description: '',
    namespace: '',
    owner: '',
    selectedTools: [],
    selectedDataSources: [],
    governanceState: 'PROBATION',
    spendingLimit: 50000,
    approvalRules: [],
  };
}

export function generateAgentIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}