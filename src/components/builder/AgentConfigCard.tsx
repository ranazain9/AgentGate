import type { AgentConfig } from '../../types';
import Card from '../Card';

interface AgentConfigCardProps {
  config: AgentConfig;
  onClick?: () => void;
}

const STATE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  PROBATION: { bg: 'bg-amber-bg', text: 'text-warning', label: 'Probation' },
  ACTIVE: { bg: 'bg-teal-bg', text: 'text-primary', label: 'Active' },
  SUSPENDED: { bg: 'bg-red-bg', text: 'text-destructive', label: 'Suspended' },
};

export default function AgentConfigCard({ config, onClick }: AgentConfigCardProps) {
  // Defensive defaults for potentially incomplete localStorage data
  const governanceState = config.spec?.governance?.state;
  const badge = governanceState && STATE_BADGES[governanceState]
    ? STATE_BADGES[governanceState]
    : STATE_BADGES.PROBATION;

  const model = config.spec?.reasoning?.model ?? 'Unknown model';
  const provider = config.spec?.reasoning?.provider ?? 'Unknown provider';
  const name = config.metadata?.name ?? 'Unnamed Agent';
  const agentId = config.metadata?.agentId ?? config.id;

  const createdDate = config.createdAt
    ? new Date(config.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown date';

  return (
    <Card
      className={`cursor-pointer hover:border-primary/40 transition-all duration-150 ${
        onClick ? 'active:scale-[0.98]' : ''
      }`}
    >
      <div onClick={onClick} className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-fg truncate">
            {name}
          </h3>
          <p className="text-xs text-muted font-mono mt-0.5">
            {agentId}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-muted font-mono">
              {model}
            </span>
            <span className="text-[11px] text-muted">
              {provider}
            </span>
            <span className="text-[11px] text-muted">· {createdDate}</span>
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>
      </div>
    </Card>
  );
}