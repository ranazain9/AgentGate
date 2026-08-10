import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Settings, Wrench, Database } from 'lucide-react';
import { useSentry } from '../context/SentryContext';
import { generateId } from '../utils/id';

export default function AgentBuilderForm() {
  const navigate = useNavigate();
  const { state, addAgentConfig } = useSentry();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [agentType, setAgentType] = useState<'WORKER' | 'SENTRY'>('WORKER');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [selectedDataSources, setSelectedDataSources] = useState<Set<string>>(new Set());

  const handleToggleTool = (toolName: string) => {
    setSelectedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolName)) next.delete(toolName);
      else next.add(toolName);
      return next;
    });
  };

  const handleToggleDataSource = (sourceName: string) => {
    setSelectedDataSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceName)) next.delete(sourceName);
      else next.add(sourceName);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goal.trim()) return;

    const configId = generateId();
    addAgentConfig({
      id: configId,
      metadata: {
        name: name.trim(),
        agentId: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        agentType,
      },
      spec: {
        goal: goal.trim(),
        description: description.trim() || goal.trim(),
        reasoning: {
          provider: 'aimlapi',
          model: 'gpt-4o',
          temperature: 0.1,
          maxTokens: 1000,
        },
        tools: Array.from(selectedTools),
        dataSources: Array.from(selectedDataSources).map(ds => ({
          name: ds,
          refreshPolicy: 'on_trigger',
        })),
        governance: {
          state: 'PROBATION',
          approvalRules: [
            {
              name: 'Require approval for all actions',
              enabled: true,
              condition: { field: 'any', operator: 'gte', value: '0' },
              action: { type: 'REQUIRE_HUMAN_APPROVAL' }
            }
          ]
        }
      },
      createdAt: Date.now()
    });
    navigate('/builder/agents');
  };

  const isFormValid = name.trim().length > 0 && goal.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Create Agent</h1>
          <p className="text-sm text-muted mt-1">Configure a new autonomous agent for your platform.</p>
        </div>
        <button onClick={() => navigate('/builder/agents')} className="text-sm text-muted hover:text-fg transition-colors cursor-pointer">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-fg">Core Configuration</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Marketing Strategist"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">Agent Type</label>
              <select
                value={agentType}
                onChange={e => setAgentType(e.target.value as 'WORKER' | 'SENTRY')}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="WORKER">Worker (Executes actions)</option>
                <option value="SENTRY">Sentry (Reviews proposals)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">System Prompt / Goal</label>
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="Describe exactly what this agent should do and what its rules are..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary/50 transition-colors resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">Short Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief summary of the agent's role"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tools */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-fg">Tools</h2>
            </div>
            <p className="text-xs text-muted mb-4">Select the tools this agent can use to perform actions.</p>
            
            {state.tools.length === 0 ? (
              <div className="bg-black/20 p-4 rounded-lg text-center text-xs text-muted border border-white/5">
                No tools registered yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {state.tools.map(tool => (
                  <label key={tool.id} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-lg cursor-pointer hover:bg-black/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedTools.has(tool.name)}
                      onChange={() => handleToggleTool(tool.name)}
                      className="rounded border-white/20 text-primary focus:ring-primary/20 bg-black/50 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{tool.name}</p>
                      <p className="text-xs text-muted font-mono truncate">{tool.handler}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Data Sources */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-fg">Data Sources</h2>
            </div>
            <p className="text-xs text-muted mb-4">Select the data sources this agent has access to.</p>
            
            {state.dataSources.length === 0 ? (
              <div className="bg-black/20 p-4 rounded-lg text-center text-xs text-muted border border-white/5">
                No data sources registered yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {state.dataSources.map(ds => (
                  <label key={ds.id} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-lg cursor-pointer hover:bg-black/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedDataSources.has(ds.name)}
                      onChange={() => handleToggleDataSource(ds.name)}
                      className="rounded border-white/20 text-primary focus:ring-primary/20 bg-black/50 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{ds.name}</p>
                      <p className="text-xs text-muted truncate">{ds.type}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/builder/agents')}
            className="px-6 py-2.5 text-sm font-medium text-muted hover:text-fg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-black text-sm font-semibold rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Deploy Agent
          </button>
        </div>
      </form>
    </div>
  );
}
