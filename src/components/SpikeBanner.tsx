import { AlertTriangle, X } from 'lucide-react';
import { useSentry } from '../context/SentryContext';

interface Props {
  agentName: string;
  count: number;
  agentId: string;
}

export default function SpikeBanner({ agentName, count, agentId }: Props) {
  const { dismissBanner } = useSentry();

  return (
    <div className="flex items-start gap-3 bg-warning-bg border border-warning/30 rounded-xl p-4 mb-4">
      <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-warning">
          ⚠ {agentName} has sent {count} requests this session — above its usual rate
        </p>
      </div>
      <button
        onClick={() => dismissBanner(agentId)}
        className="text-warning/60 hover:text-warning cursor-pointer transition-colors shrink-0"
        aria-label="Dismiss warning"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}