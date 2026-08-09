import { useState } from 'react';
import { Plus, Key, UserPlus } from 'lucide-react';
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
  const { state, addAgent } = useSentry();
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
    const newAgent: Agent = {
      id: `custom-${generateId()}`,
      name: name.trim(),
      rule: rule.trim(),
      trustScore: 50,
      sessionRequestCount: 0,
      isBuiltIn: false,
      mockApiKey: mockKey,
    };

    addAgent(newAgent);
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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-fg">Agents</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {state.agents.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted text-sm">No agents registered. Add an agent to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.agents.map(agent => (
            <Card key={agent.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-fg">{agent.name}</h3>
                  {agent.isBuiltIn ? (
                    <span className="text-xs text-muted">Built-in agent</span>
                  ) : (
                    <span className="text-xs text-primary">Custom agent</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted">Session requests</span>
                  <p className="text-sm font-medium text-fg">{agent.sessionRequestCount}</p>
                </div>
              </div>
              <p className="text-sm text-muted mb-4">{agent.rule}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted w-16 shrink-0">Trust</span>
                <TrustBar score={agent.trustScore} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Trust score legend */}
      <div className="mt-6 text-xs text-muted text-center">
        Approved actions <span className="text-success">+10</span> &bull; Rejected actions <span className="text-destructive">-15</span>
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