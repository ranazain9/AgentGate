import { useState } from 'react';
import { Check, Plus, Wrench } from 'lucide-react';
import type { ToolDefinition } from '../../types';
import type { WizardFormState } from './wizardTypes';
import ToolCreatorModal from './ToolCreatorModal';

interface ToolsStepProps {
  formState: WizardFormState;
  onUpdate: (partial: Partial<WizardFormState>) => void;
  tools: ToolDefinition[];
  onToolCreated?: (tool: ToolDefinition) => void;
}

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  rest_read: { label: 'REST Read', className: 'text-primary bg-teal-bg' },
  rest_write: { label: 'REST Write', className: 'text-warning bg-amber-bg' },
  databright_select: { label: 'Bright Data', className: 'text-purple-400 bg-purple-500/10' },
};

export default function ToolsStep({ formState, onUpdate, tools, onToolCreated }: ToolsStepProps) {
  const [showCreator, setShowCreator] = useState(false);

  const toggleTool = (toolId: string) => {
    const selected = formState.selectedTools.includes(toolId)
      ? formState.selectedTools.filter(id => id !== toolId)
      : [...formState.selectedTools, toolId];
    onUpdate({ selectedTools: selected });
  };

  const handleToolCreated = (tool: ToolDefinition) => {
    onToolCreated?.(tool);
    onUpdate({ selectedTools: [...formState.selectedTools, tool.id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Select tools for this agent, or register a new one.
        </p>
        <button
          onClick={() => setShowCreator(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
        >
          <Plus size={14} /> Add New Tool
        </button>
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Wrench size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="text-sm text-muted">No tools registered yet.</p>
          <button
            onClick={() => setShowCreator(true)}
            className="mt-3 text-xs text-primary hover:text-primary-hover transition-colors"
          >
            Register your first tool
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tools.map(tool => {
            const isSelected = formState.selectedTools.includes(tool.id);
            const typeInfo = TYPE_LABELS[tool.type] ?? { label: tool.type, className: 'text-muted bg-border' };

            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{tool.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeInfo.className}`}>
                      {typeInfo.label}
                    </span>
                    {tool.requiresApproval && (
                      <span className="text-[10px] text-warning bg-amber-bg px-1.5 py-0.5 rounded">Requires Approval</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted font-mono mt-0.5 truncate">
                    {tool.handler}
                  </p>
                </div>
                <span className="text-[11px] text-muted">{tool.timeout}s</span>
              </button>
            );
          })}
        </div>
      )}

      <ToolCreatorModal
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onSave={handleToolCreated}
        existingNames={tools.map(t => t.name)}
      />
    </div>
  );
}