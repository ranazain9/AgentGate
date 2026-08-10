import { useNavigate } from 'react-router-dom';
import { Plus, Code } from 'lucide-react';
import { useSentry } from '../context/SentryContext';
import AgentConfigCard from '../components/builder/AgentConfigCard';

export default function BuilderAgents() {
  const navigate = useNavigate();
  const { state } = useSentry();

  const { agentConfigs } = state;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-4">
        <span className="text-fg">Builder</span>
        <span>/</span>
        <span className="text-fg">Agents</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Agents</h1>
          <p className="text-sm text-muted mt-1">
            Manage your agent configurations
          </p>
        </div>
        <button
          onClick={() => navigate('/builder/agents/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          <Plus size={16} />
          Create Agent
        </button>
      </div>

      {agentConfigs.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Code size={40} className="mx-auto text-muted/40 mb-4" />
          <h3 className="text-base font-medium text-fg mb-2">No agents yet</h3>
          <p className="text-sm text-muted mb-6">
            No agent configurations yet. Create your first agent to get started.
          </p>
          <button
            onClick={() => navigate('/builder/agents/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150"
          >
            <Plus size={16} />
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {agentConfigs.map(config => (
            <AgentConfigCard
              key={config.id}
              config={config}
              onClick={() => navigate(`/builder/agents/${config.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}