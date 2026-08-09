import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import { useSentry } from '../context/SentryContext';
import type { ProposalCard } from '../types';
import ProposalCardView from '../components/ProposalCardView';
import SpikeBanner from '../components/SpikeBanner';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';
import { generateId } from '../utils/id';

export default function ApprovalQueue() {
  const { state, pendingProposals, addProposal, removeProposal, addAuditEntry, adjustTrustScore, incrementSessionCount } = useSentry();
  const [loading, setLoading] = useState<string | null>(null);

  // Check which agents have active spike warnings
  const activeSpikes = state.agents
    .filter(a => a.sessionRequestCount >= 3 && !state.dismissedBanners.includes(a.id))
    .map(a => ({ id: a.id, name: a.name, count: a.sessionRequestCount }));

  // All agents become proposal buttons
  const allButtons = state.agents.map(a => ({ id: a.id, label: a.name, name: a.name }));

  async function handlePropose(agentId: string, agentName: string) {
    setLoading(agentId);
    incrementSessionCount(agentId);

    try {
      // Call Edge Function
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ agentName }),
      });

      if (!res.ok) {
        let errorMsg = 'Edge Function error';
        try {
          const errBody = await res.json();
          errorMsg = errBody.error || errorMsg;
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const proposal: ProposalCard = {
        id: generateId(),
        agentName,
        action: data.action,
        riskJustification: data.riskJustification,
        timestamp: Date.now(),
      };
      addProposal(proposal);
    } catch (err) {
      console.error('Failed to generate proposal:', err);
      // Show the user a friendlier error
      alert(`Couldn't generate proposal: ${err instanceof Error ? err.message : 'Unknown error'}. Make sure the AIML API key is configured.`);
    } finally {
      setLoading(null);
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-fg mb-6">Approval Queue</h1>

      {/* Spike warning banners */}
      {activeSpikes.map(spike => (
        <SpikeBanner key={spike.id} agentName={spike.name} count={spike.count} agentId={spike.id} />
      ))}

      {/* Agent proposal buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {allButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => handlePropose(btn.id, btn.name)}
            disabled={loading === btn.id}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === btn.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading === btn.id ? 'Generating...' : `${btn.label}: Propose Action`}
          </button>
        ))}
      </div>

      {/* Proposal cards */}
      {pendingProposals.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted text-sm">No pending proposals. Click an agent button above to generate a new proposal.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingProposals.map(proposal => (
            <ProposalCardView
              key={proposal.id}
              proposal={proposal}
              onDecision={(decision, note) => handleDecision(proposal.id, decision, note)}
            />
          ))}
        </div>
      )}
    </div>
  );
}