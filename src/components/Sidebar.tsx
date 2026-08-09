import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Shield, ClipboardList, Users, Activity, AlertTriangle, Code, Wrench, Database } from 'lucide-react';
import { useSentry } from '../context/SentryContext';

const navItems = [
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
  const { resetDemoData } = useSentry();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function handleReset() {
    resetDemoData();
    setShowResetConfirm(false);
    navigate('/approval-queue');
  }

  return (
    <>
      <aside className="w-60 min-h-screen border-r border-border flex flex-col shrink-0">
        {/* App logo / name */}
        <div className="flex items-center gap-2.5 px-5 py-6 border-b border-border">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight text-fg">Sentry</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* Sentry section */}
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-card text-primary border-l-2 border-primary pl-[10px]'
                    : 'text-muted hover:text-fg hover:bg-card'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}

          {/* Divider */}
          <div className="pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted px-3 pb-1">
              Builder
            </p>
            {builderItems.map(item => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-card text-primary border-l-2 border-primary pl-[10px]'
                      : 'text-muted hover:text-fg hover:bg-card'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer area */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-muted hover:text-destructive transition-colors cursor-pointer"
          >
            Reset demo data
          </button>
        </div>
      </aside>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-fg text-center mb-2">Reset All Data?</h3>
            <p className="text-sm text-muted text-center mb-5">
              This will clear all agents, audit logs, and trust scores. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-border text-muted rounded-lg hover:text-fg hover:bg-[#252525] transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 bg-destructive text-white font-medium rounded-lg hover:opacity-90 active:scale-[0.97] transition-all duration-150 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}