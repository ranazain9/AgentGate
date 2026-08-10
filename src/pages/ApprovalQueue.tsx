import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import { useSentry } from '../context/SentryContext';
import type { ProposalCard } from '../types';
import ProposalCardView from '../components/ProposalCardView';
import SpikeBanner from '../components/SpikeBanner';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';
import { generateId } from '../utils/id';
import { generateProposal, evaluateProposalStream } from '../lib/edgeFunctions';
import SentryEvaluationPipeline, { PipelineState } from '../components/SentryEvaluationPipeline';

export default function ApprovalQueue() {
  const { state, pendingProposals, addProposal, removeProposal, addAuditEntry, adjustTrustScore, incrementSessionCount } = useSentry();
  const [loading, setLoading] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);

  // Check which agents have active spike warnings
  const activeSpikes = state.agents
    .filter(a => a.sessionRequestCount >= 3 && !state.dismissedBanners.includes(a.id))
    .map(a => ({ id: a.id, name: a.name, count: a.sessionRequestCount }));

  // Only WORKER agents (or backward compatible untyped agents) can propose actions
  const allButtons = state.agents
    .filter(a => a.agentType === 'WORKER' || !a.agentType)
    .map(a => ({ id: a.id, label: a.name, name: a.name }));

  async function handlePropose(agentId: string, agentName: string) {
    setLoading(agentId);
    
    // Initial Pipeline State
    setPipelineState({
      worker: { state: 'thinking', action: null },
      dispatcher: { state: 'idle', reasoning: null },
      security: { state: 'idle', reasoning: null },
      financial: { state: 'idle', reasoning: null },
      resolver: { state: 'idle', reasoning: null }
    });

    incrementSessionCount(agentId);

    try {
      // 1. Generate Proposal
      const data = await generateProposal({ agentName });
      
      // Update worker node
      setPipelineState(prev => prev ? { ...prev, worker: { state: 'approved', action: data.action }, dispatcher: { state: 'thinking', reasoning: null } } : null);

      // 2. Stream LangGraph Sentry Evaluation (LIVE VIA SUPABASE EDGE & AIML API)
      const finalStatus = await evaluateProposalStream(
        { agentName, action: data.action, riskJustification: data.riskJustification },
        (chunk) => {
          setPipelineState(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            
            if (chunk.dispatcher) {
              next.dispatcher = { state: 'approved', reasoning: chunk.dispatcher.reasoning[0] };
              next.security = { state: 'thinking', reasoning: null };
              next.financial = { state: 'thinking', reasoning: null };
            }
            if (chunk.security_sentry) {
              next.security = { state: chunk.security_sentry.decision, reasoning: chunk.security_sentry.reasoning[0] };
            }
            if (chunk.financial_sentry) {
              next.financial = { state: chunk.financial_sentry.decision, reasoning: chunk.financial_sentry.reasoning[0] };
            }
            if (chunk.resolver) {
              next.resolver = { state: chunk.resolver.finalStatus, reasoning: chunk.resolver.reasoning[0] };
            }
            
            return next;
          });
        }
      );

      const sentryDecision = finalStatus?.finalStatus || 'ESCALATED';
      const sentryReasoning = finalStatus?.reasoning?.join(' ') || 'Evaluation incomplete.';
      const confidenceScore = 90;

      if (sentryDecision === 'escalated' || sentryDecision === 'pending') {
        const proposal: ProposalCard = {
          id: generateId(),
          agentName,
          action: data.action,
          riskJustification: data.riskJustification,
          timestamp: Date.now(),
          status: 'ESCALATED',
          sentryReasoning,
          confidenceScore,
        };
        addProposal(proposal);
      } else {
        // Auto resolved by AI Sentry
        addAuditEntry({
          id: generateId(),
          agentName,
          action: data.action,
          riskJustification: data.riskJustification,
          decision: sentryDecision === 'approved' ? 'approved' : 'rejected',
          note: 'Auto-resolved by LangGraph Sentries',
          timestamp: Date.now(),
          sentryReasoning,
          confidenceScore,
        });
        adjustTrustScore(agentId, sentryDecision === 'approved' ? 10 : -15);
      }
    } catch (err: any) {
      console.error('Real Cloud Error:', err);
      // Show the exact error returned by the Supabase Edge Function or browser
      alert(`ACTUAL CLOUD ERROR:\n\n${err.message}\n\nCheck your browser console for more details.`);
    } finally {
      // Clear pipeline state after a short delay so the user can see the final result
      setTimeout(() => {
        setLoading(null);
        setPipelineState(null);
      }, 1500);
    }
  }

  function handleDecision(id: string, decision: 'approved' | 'rejected', note: string) {
    const proposal = pendingProposals.find(p => p.id === id);
    if (!proposal) return;

    const agent = state.agents.find(a => a.name === proposal.agentName);
    if (agent) {
      adjustTrustScore(agent.id, decision === 'approved' ? 10 : -15);
    }

    addAuditEntry({
      id: generateId(),
      agentName: proposal.agentName,
      action: proposal.action,
      riskJustification: proposal.riskJustification,
      decision,
      note,
      timestamp: Date.now(),
    });

    removeProposal(id);
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Approval Queue</h1>
          <p className="text-muted">Review, approve, or reject high-risk actions intercepted by Sentry AI.</p>
        </div>
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-warning/20 bg-warning/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
          </span>
          <span className="text-sm font-bold text-warning">Monitoring</span>
        </div>
      </div>

      {/* Spike warning banners */}
      {activeSpikes.map(spike => (
        <SpikeBanner key={spike.id} agentName={spike.name} count={spike.count} agentId={spike.id} />
      ))}

      {/* Proposal cards */}
      {pendingProposals.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="glass-panel p-16 rounded-[2rem] text-center flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
            <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Sparkles className="w-10 h-10 text-primary/60" />
            </div>
            <p className="text-fg font-bold text-2xl mb-2 relative z-10">Queue is Empty</p>
            <p className="text-muted relative z-10 max-w-sm">
              All agent proposals have been reviewed. Waiting for incoming intercepts from the LangGraph Sentry Evaluation.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {pendingProposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: 100 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ProposalCardView
                  proposal={proposal}
                  onDecision={(decision, note) => handleDecision(proposal.id, decision, note)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}