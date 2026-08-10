import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Brain, ArrowRight, Lock } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col items-center selection:bg-primary/30">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[150px] pointer-events-none z-0" />
      
      {/* Floating Decorative Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] w-24 h-24 border border-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] backdrop-blur-md z-0" 
      />
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] right-[10%] w-32 h-32 border border-primary/10 bg-gradient-to-bl from-primary/5 to-transparent rounded-full backdrop-blur-md z-0" 
      />

      {/* Navigation */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight text-fg">AgentGate</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium text-fg hover:text-primary transition-colors cursor-pointer px-4 py-2"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 flex flex-col justify-center relative z-10 pt-20 pb-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Security for the Autonomous Era
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-fg tracking-tight mb-8 leading-[1.1]">
            Autonomously Handling <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-cyan-400">
              AI Agents 24/7
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            The ultimate command center and security firewall. Monitor, evaluate, and control every action your AI agents try to take in the real world before they happen.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-[0_0_40px_rgba(32,201,151,0.3)] cursor-pointer"
            >
              Launch Command Center
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open('https://lablab.ai', '_blank')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/5 text-fg font-medium rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32"
        >
          {/* Feature 1 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 relative group hover:border-primary/30 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
            <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner relative z-10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-fg mb-3 relative z-10">Real-Time Surveillance</h3>
            <p className="text-sm text-muted leading-relaxed relative z-10">
              Watch your entire AI workforce in real-time. Immediately flag and intercept high-risk proposals before they execute.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 relative group hover:border-indigo-500/30 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
            <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner relative z-10">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-fg mb-3 relative z-10">Sentry AI Evaluator</h3>
            <p className="text-sm text-muted leading-relaxed relative z-10">
              A built-in AI overseer that automatically scores the risk of every action and generates detailed safety reports for human managers.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 relative group hover:border-blue-500/30 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
            <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner relative z-10">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-fg mb-3 relative z-10">Immutable Audit Logs</h3>
            <p className="text-sm text-muted leading-relaxed relative z-10">
              Cryptographically record every single decision. Know exactly what your agents did, why they did it, and who authorized it.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-xs text-muted/60 relative z-10 border-t border-white/5 mt-auto">
        Built for the AI Factory Hackathon by lablab.ai
      </footer>
    </div>
  );
}
