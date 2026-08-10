import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSentry } from '../context/SentryContext';
import Card from '../components/Card';
import { Activity, ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { state, pendingProposals } = useSentry();
  const { agents, auditLog } = state;
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Command Center</h1>
          <p className="text-muted">Real-time surveillance and control of all active autonomous agents.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-success/20 bg-success/5 shadow-[0_0_15px_rgba(32,201,151,0.15)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
              <span className="text-sm font-bold text-success">System Nominal</span>
            </div>
          </div>
          <span className="text-[10px] text-muted font-medium px-2">v2.4.0 (Secure Mode)</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Active Agents</p>
            <p className="text-2xl font-black text-fg">{agents.length}</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-warning/10 rounded-full blur-2xl group-hover:bg-warning/20 transition-all duration-500" />
          <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Blocked Actions</p>
            <p className="text-2xl font-black text-fg">{pendingProposals.length}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Approvals (24h)</p>
            <p className="text-2xl font-black text-fg">{auditLog.filter(l => l.decision === 'approved').length}</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics Chart */}
      <div className="mb-8 glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-primary/20 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-fg mb-1">Security Enforcement Volume</h3>
            <p className="text-xs text-muted">Threats intercepted vs. authorized actions over the last 7 days</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/50" />
              <span className="text-xs text-muted">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <span className="text-xs text-muted">Blocked</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { name: 'Mon', approved: 400, blocked: 240 },
                { name: 'Tue', approved: 300, blocked: 139 },
                { name: 'Wed', approved: 200, blocked: 980 },
                { name: 'Thu', approved: 278, blocked: 390 },
                { name: 'Fri', approved: 189, blocked: 480 },
                { name: 'Sat', approved: 239, blocked: 380 },
                { name: 'Sun', approved: 349, blocked: 430 },
              ]}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20C997" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#20C997" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="approved" stroke="#20C997" strokeWidth={3} fillOpacity={1} fill="url(#colorApproved)" />
              <Area type="monotone" dataKey="blocked" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorBlocked)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {agents.map((agent, index) => {
            const agentProposals = pendingProposals.filter(p => p.agentName === agent.name || p.agentName === agent.id);
            const agentAudit = auditLog.filter(a => a.agentName === agent.name || a.agentName === agent.id).slice(0, 3);
            
            const isWorking = agentProposals.length > 0;
            const statusColor = isWorking ? 'text-warning' : 'text-primary';
            const bgGlow = isWorking ? 'shadow-warning/10' : 'shadow-primary/5';

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`h-full flex flex-col ${isWorking ? 'border-warning/30' : ''} shadow-lg ${bgGlow}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-fg">{agent.name}</h2>
                        {isWorking && (
                          <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3 h-3" />
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted line-clamp-2">{agent.rule}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5">
                      <Activity className={`w-4 h-4 ${statusColor} ${isWorking ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-semibold ${statusColor}`}>
                        {isWorking ? 'AWAITING APPROVAL' : 'IDLE'}
                      </span>
                    </div>
                  </div>

                  {/* Body - Split into Pending and Past */}
                  <div className="flex-1 space-y-6">
                    {/* Pending Approvals */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Action Required
                      </h3>
                      {agentProposals.length === 0 ? (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5 text-center">
                          <p className="text-xs text-muted/60">No pending approvals</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {agentProposals.map(proposal => (
                            <div key={proposal.id} className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                              <p className="text-sm text-warning font-mono mb-2 break-words">{proposal.action}</p>
                              <p className="text-xs text-warning/80 mb-3 line-clamp-2">{proposal.riskJustification}</p>
                              <div className="flex gap-2">
                                <button onClick={() => navigate('/approval-queue')} className="flex-1 px-3 py-1.5 bg-warning text-warning-bg font-medium text-xs rounded-md hover:bg-warning/90 transition-colors cursor-pointer">
                                  Review in Queue
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Recent Activity
                      </h3>
                      {agentAudit.length === 0 ? (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5 text-center">
                          <p className="text-xs text-muted/60">No recent activity</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {agentAudit.map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 bg-black/20 rounded-lg p-2.5 border border-white/5">
                              {entry.decision === 'approved' ? (
                                <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-mono text-fg/80 truncate mb-1" title={entry.action}>{entry.action}</p>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${entry.decision === 'approved' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                                    {entry.decision.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-muted">
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Live Terminal Feed */}
      <div className="mt-8 glass-panel p-4 rounded-2xl border border-white/5 relative overflow-hidden h-48 bg-black/40">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
          </div>
          <span className="text-[10px] font-mono text-muted/60 uppercase tracking-widest ml-2">Sentry_Evaluation_Stream.log</span>
        </div>
        <div className="font-mono text-xs text-primary/70 space-y-1.5 overflow-hidden flex flex-col justify-end h-[calc(100%-40px)]">
          <p className="opacity-40">System initialized. Awaiting autonomous agent proposals...</p>
          <p className="opacity-60">[SENTRY_CORE] Connected to LangGraph evaluation pipeline.</p>
          <p className="opacity-80">Listening on secure channel wss://sentry.agentgate.io/stream</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
          >
            <p className="text-fg/80">
              <span className="text-indigo-400">[{new Date().toLocaleTimeString()}]</span> {" "}
              Polling active agent states... [OK]
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
