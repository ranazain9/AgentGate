import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Card from '../components/Card';
import { useSentry } from '../context/SentryContext';

export default function AuditLog() {
  const { state } = useSentry();
  const { auditLog } = state;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-fg mb-6">Audit Log</h1>

      {auditLog.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted text-sm">No decisions have been made yet. Approve or reject a proposal to see it here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {auditLog.map(entry => (
            <Card key={entry.id} className="flex items-start gap-4 p-4">
              {/* Decision icon */}
              <div className="mt-0.5 shrink-0">
                {entry.decision === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-fg text-sm">{entry.agentName}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    entry.decision === 'approved'
                      ? 'text-success bg-teal-bg'
                      : 'text-destructive bg-red-bg'
                  }`}>
                    {entry.decision === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-fg mb-1">{entry.action}</p>
                <p className="text-xs text-muted mb-1">Risk: {entry.riskJustification}</p>
                {entry.note && (
                  <p className="text-xs text-muted italic mt-1">Note: {entry.note}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}