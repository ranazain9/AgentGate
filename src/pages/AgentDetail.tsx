import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Hash, User, Globe, Play, Loader2, ExternalLink } from 'lucide-react';
import { useSentry } from '../context/SentryContext';
import { generateAgentYaml } from '../utils/yamlGenerator';
import YAMLViewer from '../components/builder/YAMLViewer';
import { runAgent, listRuns, type ToolConfig } from '../lib/edgeFunctions';
import { generateId } from '../utils/id';

const STATE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  PROBATION: { bg: 'bg-amber-bg', text: 'text-warning', label: 'Probation' },
  ACTIVE: { bg: 'bg-teal-bg', text: 'text-primary', label: 'Active' },
  SUSPENDED: { bg: 'bg-red-bg', text: 'text-destructive', label: 'Suspended' },
};

interface RunSummary {
  id: string;
  agent_name: string;
  status: string;
  result: { finalContent?: string } | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useSentry();
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [showRuns, setShowRuns] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const config = state.agentConfigs.find(c => c.id === id);

  async function handleRunAgent() {
    if (!config || !prompt.trim()) return;
    setRunning(true);
    setRunResult(null);

    try {
      const runId = generateId();
      const tools: ToolConfig[] = state.tools
        .filter(t => config.spec.tools.includes(t.name))
        .map(t => ({
          id: t.id,
          name: t.name,
          description: t.name,
          type: t.type === 'databright_select' ? 'rest_read' : t.type,
          url: t.handler,
          method: (t.method as ToolConfig['method']) || 'GET',
        }));

      const result = await runAgent({
        run_id: runId,
        prompt: prompt.trim(),
        system_prompt: config.spec.goal,
        model: config.spec.reasoning.model,
        tools,
        max_steps: 3,
      });

      setRunResult(result.result);
    } catch (err) {
      setRunResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleLoadRuns() {
    setLoadingRuns(true);
    setShowRuns(true);
    try {
      const data = await listRuns({ limit: 10 });
      setRuns(data.runs as RunSummary[]);
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  }

  if (!config) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <h2 className="text-lg font-semibold text-fg mb-2">Agent Not Found</h2>
          <p className="text-sm text-muted mb-6">
            The agent configuration you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/builder/agents')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-all duration-150"
          >
            <ArrowLeft size={16} />
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const badge = STATE_BADGES[config.spec.governance.state] ?? STATE_BADGES.PROBATION;
  const createdDate = new Date(config.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const yaml = generateAgentYaml(config);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-4">
        <button onClick={() => navigate('/builder/agents')} className="hover:text-fg transition-colors">
          Builder
        </button>
        <span>/</span>
        <button onClick={() => navigate('/builder/agents')} className="hover:text-fg transition-colors">
          Agents
        </button>
        <span>/</span>
        <span className="text-fg max-w-[200px] truncate inline-block align-bottom">
          {config.metadata.name}
        </span>
      </nav>

      {/* Back button */}
      <button
        onClick={() => navigate('/builder/agents')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Agents
      </button>

      {/* Agent header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-fg">{config.metadata.name}</h1>
            <p className="text-sm text-muted font-mono mt-1">{config.metadata.agentId}</p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-muted" />
            <span className="text-xs text-muted font-mono">{config.spec.reasoning.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <span className="text-xs text-muted">{createdDate}</span>
          </div>
          {config.metadata.namespace && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-muted" />
              <span className="text-xs text-muted">{config.metadata.namespace}</span>
            </div>
          )}
          {config.metadata.owner && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted" />
              <span className="text-xs text-muted">{config.metadata.owner}</span>
            </div>
          )}
        </div>
      </div>

      {/* Goal */}
      {config.spec.goal && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Goal</h3>
          <p className="text-sm text-fg whitespace-pre-wrap">{config.spec.goal}</p>
        </div>
      )}

      {/* Config summary chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-[11px] font-medium text-primary bg-teal-bg px-2.5 py-1 rounded-full">
          {config.spec.tools.length} tool{(config.spec.tools.length ?? 0) !== 1 ? 's' : ''}
        </span>
        <span className="text-[11px] font-medium text-primary bg-teal-bg px-2.5 py-1 rounded-full">
          {config.spec.dataSources.length} data source{(config.spec.dataSources.length ?? 0) !== 1 ? 's' : ''}
        </span>
        <span className="text-[11px] font-medium text-warning bg-amber-bg px-2.5 py-1 rounded-full">
          {config.spec.governance.approvalRules.length} rule{(config.spec.governance.approvalRules.length ?? 0) !== 1 ? 's' : ''}
        </span>
        {config.spec.governance.spendingLimit && (
          <span className="text-[11px] font-medium text-muted bg-border px-2.5 py-1 rounded-full">
            ${config.spec.governance.spendingLimit.daily.toLocaleString()}/day limit
          </span>
        )}
      </div>

      {/* Run Agent section */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Run Agent</h3>
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter a prompt to run this agent..."
            rows={3}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleRunAgent}
              disabled={running || !prompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {running ? 'Running...' : 'Run Agent'}
            </button>
            <button
              onClick={handleLoadRuns}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border text-muted rounded-lg hover:text-fg hover:bg-[#252525] transition-all duration-150 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              View Past Runs
            </button>
          </div>
        </div>

        {/* Run result */}
        {runResult && (
          <div className="mt-4 bg-bg border border-border rounded-lg p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Result</h4>
            <p className="text-sm text-fg whitespace-pre-wrap">{runResult}</p>
          </div>
        )}
      </div>

      {/* Past runs */}
      {showRuns && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Past Runs</h3>
          {loadingRuns ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No runs yet. Run the agent to see results here.</p>
          ) : (
            <div className="space-y-3">
              {runs.map(run => (
                <div key={run.id} className="bg-bg border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted">{run.id.slice(0, 8)}...</span>
                    <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      run.status === 'completed'
                        ? 'text-success bg-teal-bg'
                        : run.status === 'running'
                        ? 'text-warning bg-amber-bg'
                        : 'text-destructive bg-red-bg'
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  {run.result?.finalContent && (
                    <p className="text-xs text-fg mt-1 line-clamp-2">{run.result.finalContent}</p>
                  )}
                  {run.error && (
                    <p className="text-xs text-destructive mt-1">{run.error}</p>
                  )}
                  <p className="text-[10px] text-muted mt-1">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* YAML */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Agent Configuration (YAML)</h3>
        <YAMLViewer code={yaml} maxHeight="500px" />
      </div>
    </div>
  );
}