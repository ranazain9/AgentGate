import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ApprovalRule } from '../../types';

interface RuleCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: ApprovalRule) => void;
}

const OPERATORS: { value: ApprovalRule['condition']['operator']; label: string }[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '==' },
  { value: 'neq', label: '!=' },
];

const ACTION_TYPES: { value: ApprovalRule['action']['type']; label: string }[] = [
  { value: 'REQUIRE_HUMAN_APPROVAL', label: 'Require Human Approval' },
  { value: 'AUTO_APPROVE', label: 'Auto Approve' },
  { value: 'ESCALATE_TO_TEAM', label: 'Escalate to Team' },
];

export default function RuleCreatorModal({ isOpen, onClose, onSave }: RuleCreatorModalProps) {
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [field, setField] = useState('');
  const [operator, setOperator] = useState<ApprovalRule['condition']['operator']>('gt');
  const [value, setValue] = useState('');
  const [actionType, setActionType] = useState<ApprovalRule['action']['type']>('REQUIRE_HUMAN_APPROVAL');
  const [routeToTeam, setRouteToTeam] = useState('');
  const [sla, setSla] = useState('');
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEnabled(true);
      setField('');
      setOperator('gt');
      setValue('');
      setActionType('REQUIRE_HUMAN_APPROVAL');
      setRouteToTeam('');
      setSla('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSave = () => {
    setError('');

    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }
    if (!field.trim()) {
      setError('Condition field is required');
      return;
    }
    if (!value.trim()) {
      setError('Condition value is required');
      return;
    }
    if ((actionType === 'REQUIRE_HUMAN_APPROVAL' || actionType === 'ESCALATE_TO_TEAM') && !routeToTeam.trim()) {
      setError('Route to Team is required for this action type');
      return;
    }

    onSave({
      name: name.trim(),
      enabled,
      condition: {
        field: field.trim(),
        operator,
        value: value.trim(),
      },
      action: {
        type: actionType,
        routeToTeam: routeToTeam.trim() || undefined,
        sla: sla.trim() || undefined,
      },
    });

    onClose();
  };

  const showRouteTeam = actionType === 'REQUIRE_HUMAN_APPROVAL' || actionType === 'ESCALATE_TO_TEAM';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-12"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">New Approval Rule</h2>
          <button onClick={onClose} className="text-muted hover:text-fg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Rule Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Large Transaction"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg">Enabled</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                enabled ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 ${
                  enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-medium text-muted mb-2">Condition</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={field}
                onChange={e => setField(e.target.value)}
                placeholder="field name"
                className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
              <select
                value={operator}
                onChange={e => setOperator(e.target.value as ApprovalRule['condition']['operator'])}
                className="w-16 bg-bg border border-border rounded-lg px-2 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
              >
                {OPERATORS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="value"
                className="w-24 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Action Type *</label>
            <select
              value={actionType}
              onChange={e => setActionType(e.target.value as ApprovalRule['action']['type'])}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
            >
              {ACTION_TYPES.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Route To Team */}
          {showRouteTeam && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Route to Team *</label>
              <input
                type="text"
                value={routeToTeam}
                onChange={e => setRouteToTeam(e.target.value)}
                placeholder="e.g. Finance"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}

          {/* SLA */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">SLA (optional)</label>
            <input
              type="text"
              value={sla}
              onChange={e => setSla(e.target.value)}
              placeholder="e.g. 30m"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive bg-red-bg px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-fg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-primary text-black rounded-lg hover:bg-primary-hover transition-all duration-150 active:scale-[0.97]"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}