import { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import Card from './Card';
import type { ProposalCard } from '../types';

interface Props {
  proposal: ProposalCard;
  onDecision: (decision: 'approved' | 'rejected', note: string) => void;
}

export default function ProposalCardView({ proposal, onDecision }: Props) {
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | null>(null);

  function handleDecision(decision: 'approved' | 'rejected') {
    if (showNoteInput || note) {
      onDecision(decision, note);
    } else {
      setSelectedAction(decision);
      setShowNoteInput(true);
    }
  }

  function confirmWithNote() {
    if (selectedAction) {
      onDecision(selectedAction, note);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-fg text-sm">{proposal.agentName}</span>
            <span className="text-xs text-muted">
              {new Date(proposal.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-fg mb-2">{proposal.action}</p>
          <div className="bg-bg border border-border rounded-lg p-3 mb-3">
            <p className="text-xs text-muted font-medium mb-1">Risk Assessment</p>
            <p className="text-sm text-fg">{proposal.riskJustification}</p>
          </div>
          
          {proposal.sentryReasoning && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-indigo-400 font-medium">Sentry AI Evaluation</span>
                {proposal.confidenceScore && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    {proposal.confidenceScore}% Confidence
                  </span>
                )}
              </div>
              <p className="text-sm text-indigo-100">{proposal.sentryReasoning}</p>
            </div>
          )}

          {/* Note input */}
          {(showNoteInput || note) && (
            <div className="mb-3">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note (optional)..."
                rows={2}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
              {selectedAction && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={confirmWithNote}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Confirm {selectedAction}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!showNoteInput && (
            <div className="flex gap-2">
              <button
                onClick={() => handleDecision('approved')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/20 text-success text-xs font-medium rounded-lg hover:bg-success/30 active:scale-[0.97] transition-all duration-150 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => handleDecision('rejected')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive/20 text-destructive text-xs font-medium rounded-lg hover:bg-destructive/30 active:scale-[0.97] transition-all duration-150 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}