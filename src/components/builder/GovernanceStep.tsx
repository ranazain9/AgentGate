import { useState } from 'react';
import { Plus, Trash2, Shield } from 'lucide-react';
import type { ApprovalRule } from '../../types';
import type { WizardFormState } from './wizardTypes';
import RuleCreatorModal from './RuleCreatorModal';

interface GovernanceStepProps {
  formState: WizardFormState;
  onUpdate: (partial: Partial<WizardFormState>) => void;
}

const STATE_OPTIONS: { value: 'PROBATION' | 'ACTIVE' | 'SUSPENDED'; label: string; desc: string; className: string }[] = [
  { value: 'PROBATION', label: 'Probation', desc: 'Agent runs with limited trust and requires oversight', className: 'text-warning bg-amber-bg' },
  { value: 'ACTIVE', label: 'Active', desc: 'Agent is fully trusted and runs autonomously', className: 'text-primary bg-teal-bg' },
  { value: 'SUSPENDED', label: 'Suspended', desc: 'Agent is paused and cannot execute actions', className: 'text-destructive bg-red-bg' },
];

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  REQUIRE_HUMAN_APPROVAL: { label: 'Human Approval', className: 'text-warning bg-amber-bg' },
  AUTO_APPROVE: { label: 'Auto Approve', className: 'text-primary bg-teal-bg' },
  ESCALATE_TO_TEAM: { label: 'Escalate', className: 'text-destructive bg-red-bg' },
};

const OPERATOR_SYMBOLS: Record<string, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '==',
  neq: '!=',
};

export default function GovernanceStep({ formState, onUpdate }: GovernanceStepProps) {
  const [showRuleCreator, setShowRuleCreator] = useState(false);

  const addRule = (rule: ApprovalRule) => {
    onUpdate({ approvalRules: [...formState.approvalRules, rule] });
  };

  const removeRule = (index: number) => {
    onUpdate({ approvalRules: formState.approvalRules.filter((_, i) => i !== index) });
  };

  const toggleRuleEnabled = (index: number) => {
    const updated = formState.approvalRules.map((r, i) =>
      i === index ? { ...r, enabled: !r.enabled } : r
    );
    onUpdate({ approvalRules: updated });
  };

  return (
    <div className="space-y-6">
      {/* Governance State */}
      <div>
        <label className="block text-xs font-medium text-muted mb-2">Governance State</label>
        <div className="space-y-2">
          {STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ governanceState: opt.value })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                formState.governanceState === opt.value
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  formState.governanceState === opt.value ? 'border-primary' : 'border-border'
                }`}
              >
                {formState.governanceState === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{opt.label}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${opt.className}`}>
                    {opt.value}
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Spending Limit */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">Spending Limit (per day)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
          <input
            type="number"
            value={formState.spendingLimit}
            onChange={e => onUpdate({ spendingLimit: Number(e.target.value) })}
            min={0}
            className="w-full bg-bg border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Approval Rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-muted">Approval Rules</label>
          <button
            onClick={() => setShowRuleCreator(true)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
          >
            <Plus size={14} /> Add Rule
          </button>
        </div>

        {formState.approvalRules.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Shield size={28} className="mx-auto text-muted/40 mb-2" />
            <p className="text-xs text-muted">No approval rules defined.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {formState.approvalRules.map((rule, i) => {
              const actionInfo = ACTION_LABELS[rule.action.type] ?? { label: rule.action.type, className: 'text-muted bg-border' };

              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card">
                  <button
                    onClick={() => toggleRuleEnabled(i)}
                    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      rule.enabled ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {rule.enabled && <div className="w-2 h-2 rounded-full bg-black" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg">{rule.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${actionInfo.className}`}>
                        {actionInfo.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-mono mt-0.5">
                      {rule.condition.field} {OPERATOR_SYMBOLS[rule.condition.operator] ?? rule.condition.operator} {rule.condition.value}
                      {rule.action.routeToTeam && ` → ${rule.action.routeToTeam}`}
                      {rule.action.sla && ` (${rule.action.sla})`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeRule(i)}
                    className="text-muted hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RuleCreatorModal
        isOpen={showRuleCreator}
        onClose={() => setShowRuleCreator(false)}
        onSave={addRule}
      />
    </div>
  );
}