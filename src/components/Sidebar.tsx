import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Shield, ClipboardList, Users, Activity, Code, Wrench, Database, LayoutDashboard, Home, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Home Page', icon: Home },
  { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/approval-queue', label: 'Approval Queue', icon: ClipboardList },
  { to: '/audit-log', label: 'Audit Log', icon: Activity },
  { to: '/agents', label: 'Agents', icon: Users },
];

const builderItems = [
  { to: '/builder/agents', label: 'Agents', icon: Code },
  { to: '/builder/tools', label: 'Tools', icon: Wrench },
  { to: '/builder/data-sources', label: 'Data Sources', icon: Database },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderNavItem = (item: { to: string; label: string; icon: any }, isBuilder = false) => {
    // For builder items, we want to match sub-paths too, except for the exact '/builder'
    const isActive = isBuilder 
      ? location.pathname.startsWith(item.to) 
      : location.pathname === item.to;

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onMouseEnter={() => setHoveredPath(item.to)}
        onMouseLeave={() => setHoveredPath(null)}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer group ${isCollapsed ? 'justify-center px-0' : ''}`}
        title={isCollapsed ? item.label : undefined}
      >
        {/* Animated Active/Hover Background Pill */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-pill"
            className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
            initial={false}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        
        {hoveredPath === item.to && !isActive && (
          <motion.div
            layoutId="sidebar-hover-pill"
            className="absolute inset-0 bg-white/5 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0">
          <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted group-hover:text-fg'}`} />
        </div>
        
        {!isCollapsed && (
          <span className={`relative z-10 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted group-hover:text-fg'}`}>
            {item.label}
          </span>
        )}
        
        {isActive && !isCollapsed && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
          />
        )}
      </NavLink>
    );
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-[calc(100vh-2rem)] sticky top-4 border-r border-white/5 glass-panel flex flex-col shrink-0 ml-4 mb-4 rounded-[2rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50"
    >
      {/* Subtle ambient glow behind sidebar */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary/5 blur-[80px] pointer-events-none" />

      {/* App logo / name & Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} px-4 py-8 border-b border-white/5`}>
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
          title={isCollapsed ? "AgentGate" : undefined}
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Shield className="w-5 h-5 text-black" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-fg leading-none">AgentGate</span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Security Core</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-fg transition-colors ${isCollapsed ? 'mt-2' : ''}`}
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map(item => renderNavItem(item, false))}

        {/* Divider */}
        <div className="pt-6 pb-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-4 px-4 mb-2 whitespace-nowrap">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60">
                Builder Suite
              </p>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-8 h-[1px] bg-white/10" />
            </div>
          )}
          <div className="space-y-2">
            {builderItems.map(item => renderNavItem(item, true))}
          </div>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className={`p-4 border-t border-white/5 bg-black/20 flex ${isCollapsed ? 'justify-center' : 'items-center gap-3'} transition-all`}>
        <div 
          className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner cursor-pointer hover:scale-105 transition-transform"
          title={isCollapsed ? "Admin User" : undefined}
        >
          <span className="text-xs font-bold text-white">AD</span>
        </div>
        {!isCollapsed && (
          <>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-fg truncate">Admin User</span>
              <span className="text-[10px] text-muted truncate">admin@agentgate.io</span>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-muted group-hover:text-fg transition-colors cursor-pointer" />
          </>
        )}
      </div>
    </motion.aside>
  );
}