import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Key, UserPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useSentry } from '../context/SentryContext';
import type { Agent } from '../types';
import { generateId } from '../utils/id';

function TrustBar({ score }: { score: number }) {
  const colorClass =
    score < 40 ? 'bg-destructive' :
    score < 70 ? 'bg-warning' :
    'bg-primary';

  const bgClass =
    score < 40 ? 'bg-red-bg' :
    score < 70 ? 'bg-amber-bg' :
    'bg-teal-bg';

  const textClass =
    score < 40 ? 'text-destructive' :
    score < 70 ? 'text-warning' :
    'text-primary';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-2 rounded-full ${bgClass} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums ${textClass} w-8 text-right`}>
        {score}
      </span>
    </div>
  );
}

export default function Agents() {
  const { state, addAgentConfig } = useSentry();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [rule, setRule] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  function handleAddAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !rule.trim()) return;

    // Check for duplicate names
    if (state.agents.some(a => a.name.toLowerCase() === name.trim().toLowerCase())) {
      alert(`An agent named "${name.trim()}" already exists.`);
      return;
    }

    const mockKey = generateId();
    const newId = `custom-${generateId()}`;
    
    addAgentConfig({
      id: newId,
      metadata: {
        name: name.trim(),
        agentId: newId,
        agentType: 'WORKER'
      },
      spec: {
        goal: rule.trim(),
        reasoning: { provider: 'openai', model: 'gpt-4o', temperature: 0.1, maxTokens: 1000 },
        tools: [],
        dataSources: [],
        governance: {
          state: 'ACTIVE',
          approvalRules: [{
            name: rule.trim(),
            enabled: true,
            condition: { field: 'action', operator: 'gte', value: '1' },
            action: { type: 'REQUIRE_HUMAN_APPROVAL' }
          }]
        }
      },
      createdAt: Date.now()
    });

    setGeneratedKey(mockKey);
    setName('');
    setRule('');
  }

  function closeModal() {
    setShowModal(false);
    setGeneratedKey(null);
    setName('');
    setRule('');
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Agents</h1>
          <p className="text-muted">Manage your deployed autonomous workforce and their security configurations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-fg font-medium rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Manual Add
          </button>
          <button
            onClick={() => navigate('/builder/agents/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(32,201,151,0.2)] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            AI Builder
          </button>
        </div>
      </div>

      {state.agents.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-16 rounded-[2rem] text-center">
          <p className="text-muted">No agents registered. Add an agent to get started.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {state.agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="glass-panel p-6 rounded-2xl border border-white/5 h-full flex flex-col group hover:border-primary/20 transition-colors relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <h3 className="text-xl font-bold text-fg mb-1">{agent.name}</h3>
                      <div className="flex items-center gap-2">
                        {agent.isBuiltIn ? (
                          <span className="text-[10px] uppercase tracking-widest text-muted font-semibold">Built-in</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Custom</span>
                        )}
                        {agent.agentType === 'SENTRY' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded uppercase font-bold">Sentry</span>
                        )}
                        {agent.agentType === 'WORKER' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase font-bold">Worker</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right glass-panel bg-black/20 px-3 py-1.5 rounded-lg border-white/5">
                      <span className="text-[10px] uppercase tracking-widest text-muted block mb-0.5">Sessions</span>
                      <p className="text-sm font-bold text-fg leading-none">{agent.sessionRequestCount}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 mb-6 relative z-10">
                    <p className="text-sm text-muted/80 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      {agent.rule}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10 pt-4 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-muted font-bold w-12 shrink-0">Trust</span>
                    <div className="flex-1">
                      <TrustBar score={agent.trustScore} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Trust score legend */}
      <div className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-muted text-center glass-panel inline-block mx-auto px-6 py-2 rounded-full border-white/5">
        Approved actions <span className="text-success">+10</span> <span className="mx-2 opacity-50">&bull;</span> Rejected actions <span className="text-destructive">-15</span>
      </div>

      {/* Add Agent Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {generatedKey ? (
              <div className="text-center">
                <Key className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-fg mb-2">Agent Created!</h3>
                <p className="text-sm text-muted mb-4">
                  Your mock API key is shown below. Copy it now — it won't be shown again.
                </p>
                <div className="bg-bg border border-border rounded-lg p-3 mb-4">
                  <code className="text-xs font-mono text-primary break-all">{generatedKey}</code>
                </div>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-all duration-150 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-fg">Add New Agent</h3>
                </div>
                <form onSubmit={handleAddAgent} className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">Agent Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Marketing Agent"
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">Approval Rule</label>
                    <textarea
                      value={rule}
                      onChange={e => setRule(e.target.value)}
                      placeholder="e.g. Requires approval for all marketing campaigns over $1,000"
                      rows={3}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border border-border text-muted rounded-lg hover:text-fg hover:bg-[#252525] transition-all duration-150 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
                    >
                      Create Agent
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}