import { useState, useCallback } from 'react';
import type { WizardFormState } from './wizardTypes';
import { generateAgentIdFromName } from './wizardTypes';

interface BasicInfoStepProps {
  formState: WizardFormState;
  onUpdate: (partial: Partial<WizardFormState>) => void;
}

const MODELS = [
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'llama-2-70b', label: 'Llama 2 (70B)' },
  { value: 'llama-3-instruct', label: 'Llama 3 Instruct' },
];

export default function BasicInfoStep({ formState, onUpdate }: BasicInfoStepProps) {
  const [agentIdManuallyEdited, setAgentIdManuallyEdited] = useState(false);

  const handleNameChange = useCallback((value: string) => {
    onUpdate({ name: value });
    if (!agentIdManuallyEdited) {
      onUpdate({ agentId: generateAgentIdFromName(value) });
    }
  }, [agentIdManuallyEdited, onUpdate]);

  const handleAgentIdChange = useCallback((value: string) => {
    setAgentIdManuallyEdited(true);
    onUpdate({ agentId: value });
  }, [onUpdate]);

  return (
    <div className="space-y-5">
      {/* Agent Name */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">Agent Name *</label>
        <input
          type="text"
          value={formState.name}
          onChange={e => handleNameChange(e.target.value)}
          placeholder="e.g. Vendor Invoice Processor"
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Agent ID */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">Agent ID</label>
        <input
          type="text"
          value={formState.agentId}
          onChange={e => handleAgentIdChange(e.target.value)}
          placeholder="auto-generated"
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors"
        />
        <p className="text-[10px] text-muted mt-1">Auto-generated from name unless manually edited</p>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">Goal *</label>
        <textarea
          value={formState.goal}
          onChange={e => onUpdate({ goal: e.target.value })}
          rows={4}
          placeholder="Describe what this agent should do..."
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      {/* Model & Temperature */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Model</label>
          <select
            value={formState.model}
            onChange={e => onUpdate({ model: e.target.value })}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">
            Temperature: {formState.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formState.temperature}
            onChange={e => onUpdate({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted">
            <span>0.0 (Precise)</span>
            <span>1.0 (Creative)</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">Description (optional)</label>
        <textarea
          value={formState.description}
          onChange={e => onUpdate({ description: e.target.value })}
          rows={2}
          placeholder="Brief description of the agent's purpose"
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      {/* Namespace & Owner */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Namespace (optional)</label>
          <input
            type="text"
            value={formState.namespace}
            onChange={e => onUpdate({ namespace: e.target.value })}
            placeholder="e.g. finance"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Owner (optional)</label>
          <input
            type="text"
            value={formState.owner}
            onChange={e => onUpdate({ owner: e.target.value })}
            placeholder="e.g. finance-team@company.com"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}