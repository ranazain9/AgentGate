import { Shield, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSentry } from '../context/SentryContext';

export default function AuditLog() {
  const { state } = useSentry();

  function downloadReport() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Agent,Decision,Action,Risk,Sentry AI Reasoning\n"
      + state.auditLog.map(e => `"${new Date(e.timestamp).toISOString()}","${e.agentName}","${e.decision}","${(e.action || '').replace(/"/g, '""')}","${(e.riskJustification || '').replace(/"/g, '""')}","${(e.sentryReasoning || e.note || '').replace(/"/g, '""')}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agentgate-compliance-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Audit Log</h1>
          <p className="text-muted">Immutable cryptographic record of all agent actions and Sentry decisions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadReport}
            className="px-4 py-2 bg-white/5 border border-white/10 text-fg text-sm font-bold rounded-lg hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2 group"
          >
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            Compliance Report
          </button>
          <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-blue-400">Recording</span>
          </div>
        </div>
      </div>

      {state.auditLog.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-16 rounded-[2rem] text-center flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-50" />
          <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <Clock className="w-10 h-10 text-blue-400/60" />
          </div>
          <p className="text-fg font-bold text-2xl mb-2 relative z-10">Log is Empty</p>
          <p className="text-muted relative z-10 max-w-sm">No decisions have been made yet. As agents execute actions, their cryptographic traces will appear here.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {state.auditLog.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="glass-panel p-6 rounded-2xl border border-white/5 relative group hover:border-blue-500/20 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-xl ${entry.decision === 'approved' ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                        {entry.decision === 'approved' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-fg">{entry.agentName}</h3>
                          <span className="text-xs text-muted">&bull;</span>
                          <span className="text-xs font-mono text-muted/60">{entry.id.slice(0, 8)}</span>
                        </div>
                        <div className="bg-black/30 px-3 py-2 rounded-lg border border-white/5 mb-3">
                          <p className="font-mono text-sm text-primary break-all">{entry.action}</p>
                        </div>
                        <p className="text-sm text-muted/80">{entry.riskJustification}</p>
                        
                        {entry.note && (
                          <div className="mt-3 text-sm text-muted bg-blue-500/5 px-3 py-2 rounded-lg border border-blue-500/10">
                            <span className="font-semibold text-fg/80 mr-2">Note:</span>
                            {entry.note}
                          </div>
                        )}
                        
                        {entry.sentryReasoning && (
                          <div className="mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-md p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Sentry AI Decision</span>
                              {entry.confidenceScore && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded font-bold">
                                  {entry.confidenceScore}% Confidence
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-indigo-100">{entry.sentryReasoning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:w-32 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        entry.decision === 'approved' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {entry.decision}
                      </span>
                      <span className="text-xs text-muted/60 font-medium">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}