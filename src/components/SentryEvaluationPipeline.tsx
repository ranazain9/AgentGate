import { Loader2, CheckCircle2, XCircle, Shield, HandCoins, Network, Bot } from 'lucide-react';
import Card from './Card';

export type NodeState = 'idle' | 'thinking' | 'approved' | 'rejected';

export interface PipelineState {
  worker: { state: NodeState; action: string | null };
  dispatcher: { state: NodeState; reasoning: string | null };
  security: { state: NodeState; reasoning: string | null };
  financial: { state: NodeState; reasoning: string | null };
  resolver: { state: NodeState; reasoning: string | null };
}

interface SentryEvaluationPipelineProps {
  pipeline: PipelineState;
}

function PipelineNode({ 
  icon: Icon, 
  label, 
  state, 
  reasoning, 
  delay = 0 
}: { 
  icon: any, 
  label: string, 
  state: NodeState, 
  reasoning: string | null,
  delay?: number
}) {
  const isIdle = state === 'idle';
  const isThinking = state === 'thinking';
  const isApproved = state === 'approved';
  const isRejected = state === 'rejected';

  return (
    <div className={`relative flex flex-col items-center group transition-opacity duration-500`} style={{ transitionDelay: `${delay}ms` }}>
      {/* Node Circle */}
      <div className={`
        relative w-14 h-14 rounded-full flex items-center justify-center
        transition-all duration-300 z-10 border-2
        ${isIdle ? 'bg-bg border-border text-muted scale-95 opacity-50' : ''}
        ${isThinking ? 'bg-primary/20 border-primary text-primary scale-110 shadow-[0_0_15px_rgba(208,255,0,0.3)]' : ''}
        ${isApproved ? 'bg-success/20 border-success text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}
        ${isRejected ? 'bg-destructive/20 border-destructive text-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
      `}>
        {isThinking && <Loader2 className="absolute -inset-2.5 w-[4.75rem] h-[4.75rem] text-primary/50 animate-spin-slow" />}
        <Icon className="w-6 h-6 relative z-10" />
        
        {/* Status Badge */}
        {(isApproved || isRejected) && (
          <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5">
            {isApproved ? (
              <CheckCircle2 className="w-4 h-4 text-success fill-success/20" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive fill-destructive/20" />
            )}
          </div>
        )}
      </div>

      <span className={`mt-3 text-xs font-medium transition-colors ${isIdle ? 'text-muted' : 'text-fg'}`}>
        {label}
      </span>

      {/* Tooltip */}
      {reasoning && !isIdle && (
        <div className="absolute -bottom-2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 w-48">
          <div className="bg-[#1a1a1a] border border-border/50 shadow-xl rounded-lg p-3 text-xs text-muted leading-relaxed">
            {reasoning}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SentryEvaluationPipeline({ pipeline }: SentryEvaluationPipelineProps) {
  return (
    <Card className="mb-8 p-8 bg-[#0a0a0a] border-primary/20 overflow-visible relative">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <SparklesIcon className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-xs font-mono text-primary uppercase tracking-wider">AI Evaluation Stream</span>
      </div>

      <div className="flex items-center justify-between max-w-2xl mx-auto mt-6 relative">
        {/* Connection Background Lines */}
        <div className="absolute top-7 left-7 right-7 h-0.5 bg-border z-0" />

        {/* Worker */}
        <PipelineNode 
          icon={Bot} 
          label="Worker" 
          state={pipeline.worker.state} 
          reasoning={pipeline.worker.action ? `Proposed: ${pipeline.worker.action}` : null} 
        />

        {/* Dispatcher */}
        <PipelineNode 
          icon={Network} 
          label="Dispatcher" 
          state={pipeline.dispatcher.state} 
          reasoning={pipeline.dispatcher.reasoning} 
        />

        {/* Parallel Sentries */}
        <div className="flex flex-col gap-8 -mt-6">
          <PipelineNode 
            icon={Shield} 
            label="Security" 
            state={pipeline.security.state} 
            reasoning={pipeline.security.reasoning} 
          />
          <PipelineNode 
            icon={HandCoins} 
            label="Financial" 
            state={pipeline.financial.state} 
            reasoning={pipeline.financial.reasoning} 
          />
        </div>

        {/* Resolver */}
        <PipelineNode 
          icon={Network} 
          label="Resolver" 
          state={pipeline.resolver.state} 
          reasoning={pipeline.resolver.reasoning} 
        />
      </div>
    </Card>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
