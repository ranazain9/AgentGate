import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { ToolDefinition } from '../../types';
import { generateId } from '../../utils/id';

interface ToolCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: ToolDefinition) => void;
  existingNames: string[];
}

type ToolType = 'rest_read' | 'rest_write' | 'databright_select';

const TOOL_TYPES: { value: ToolType; label: string }[] = [
  { value: 'rest_read', label: 'REST (Read-Only)' },
  { value: 'rest_write', label: 'REST (Write + Governance)' },
  { value: 'databright_select', label: 'Bright Data (Unified Query)' },
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

interface SchemaEntry {
  key: string;
  value: string;
}

function emptySchemaEntry(): SchemaEntry {
  return { key: '', value: 'string' };
}

export default function ToolCreatorModal({ isOpen, onClose, onSave, existingNames }: ToolCreatorModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ToolType>('rest_read');
  const [handler, setHandler] = useState('');
  const [method, setMethod] = useState('GET');
  const [queryTemplate, setQueryTemplate] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalThreshold, setApprovalThreshold] = useState(500);
  const [timeout, setTimeout_] = useState(30);
  const [rateLimit, setRateLimit] = useState('10000/hour');
  const [inputSchema, setInputSchema] = useState<SchemaEntry[]>([emptySchemaEntry()]);
  const [outputSchema, setOutputSchema] = useState<SchemaEntry[]>([emptySchemaEntry()]);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType('rest_read');
      setHandler('');
      setMethod('GET');
      setQueryTemplate('');
      setRequiresApproval(false);
      setApprovalThreshold(500);
      setTimeout_(30);
      setRateLimit('10000/hour');
      setInputSchema([emptySchemaEntry()]);
      setOutputSchema([emptySchemaEntry()]);
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
      setError('Tool name is required');
      return;
    }
    if (existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase())) {
      setError('A tool with this name already exists');
      return;
    }

    if (type === 'rest_read' || type === 'rest_write') {
      if (!handler.trim()) {
        setError('Handler URL is required for REST tools');
        return;
      }
    }
    if (type === 'databright_select') {
      if (!handler.trim()) {
        setError('Bright Data Zone is required');
        return;
      }
    }

    const schemaToRecord = (entries: SchemaEntry[]): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const e of entries) {
        if (e.key.trim()) result[e.key.trim()] = e.value || 'string';
      }
      return result;
    };

    onSave({
      id: generateId(),
      name: name.trim(),
      type,
      handler: handler.trim(),
      method: type === 'rest_read' || type === 'rest_write' ? method : undefined,
      requiresApproval,
      approvalThreshold: requiresApproval ? approvalThreshold : undefined,
      timeout,
      rateLimit,
      inputSchema: schemaToRecord(inputSchema),
      outputSchema: schemaToRecord(outputSchema),
    });

    onClose();
  };

  const updateSchemaEntry = (
    entries: SchemaEntry[],
    setEntries: (e: SchemaEntry[]) => void,
    index: number,
    field: 'key' | 'value',
    val: string
  ) => {
    const next = entries.map((e, i) => (i === index ? { ...e, [field]: val } : e));
    setEntries(next);
  };

  const addSchemaEntry = (setEntries: (e: SchemaEntry[]) => void, entries: SchemaEntry[]) => {
    setEntries([...entries, emptySchemaEntry()]);
  };

  const removeSchemaEntry = (setEntries: (e: SchemaEntry[]) => void, entries: SchemaEntry[], index: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const isRestType = type === 'rest_read' || type === 'rest_write';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-12"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">Register New Tool</h2>
          <button onClick={onClose} className="text-muted hover:text-fg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Tool Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. vendor-invoice-api"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Tool Type *</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as ToolType)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
            >
              {TOOL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Handler / Zone */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              {isRestType ? 'Handler URL *' : 'Bright Data Zone *'}
            </label>
            <input
              type="text"
              value={handler}
              onChange={e => setHandler(e.target.value)}
              placeholder={isRestType ? 'https://api.example.com/v1/{{param}}' : 'brightdata_zone_name'}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
            {isRestType && (
              <p className="text-[10px] text-muted mt-1">
                Use {'{{param}}'} for dynamic path parameters
              </p>
            )}
            {type === 'databright_select' && (
              <>
                <label className="block text-xs font-medium text-muted mb-1.5 mt-3">Query Template</label>
                <textarea
                  value={queryTemplate}
                  onChange={e => setQueryTemplate(e.target.value)}
                  rows={3}
                  placeholder="SELECT * FROM table WHERE id = {{param}}"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </>
            )}
          </div>

          {/* HTTP Method (REST only) */}
          {isRestType && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">HTTP Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
              >
                {HTTP_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Requires Approval */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg">Requires Approval</span>
            <button
              type="button"
              role="switch"
              aria-checked={requiresApproval}
              onClick={() => setRequiresApproval(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                requiresApproval ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`block w-4 h-4 bg-white rounded-full transition-transform mt-0.5 ${
                  requiresApproval ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Approval Threshold */}
          {requiresApproval && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Approval Threshold ($)</label>
              <input
                type="number"
                value={approvalThreshold}
                onChange={e => setApprovalThreshold(Number(e.target.value))}
                min={0}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}

          {/* Timeout & Rate Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Timeout (seconds)</label>
              <input
                type="number"
                value={timeout}
                onChange={e => setTimeout_(Number(e.target.value))}
                min={1}
                max={300}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Rate Limit</label>
              <input
                type="text"
                value={rateLimit}
                onChange={e => setRateLimit(e.target.value)}
                placeholder="10000/hour"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Input Schema */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted">Input Schema</label>
              <button
                onClick={() => addSchemaEntry(setInputSchema, inputSchema)}
                className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {inputSchema.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.key}
                    onChange={e => updateSchemaEntry(inputSchema, setInputSchema, i, 'key', e.target.value)}
                    placeholder="field_name"
                    className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50"
                  />
                  <select
                    value={entry.value}
                    onChange={e => updateSchemaEntry(inputSchema, setInputSchema, i, 'value', e.target.value)}
                    className="w-24 bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-fg focus:outline-none focus:border-primary/50"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="object">object</option>
                    <option value="array">array</option>
                  </select>
                  <button
                    onClick={() => removeSchemaEntry(setInputSchema, inputSchema, i)}
                    className="text-muted hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Output Schema */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted">Output Schema</label>
              <button
                onClick={() => addSchemaEntry(setOutputSchema, outputSchema)}
                className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {outputSchema.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.key}
                    onChange={e => updateSchemaEntry(outputSchema, setOutputSchema, i, 'key', e.target.value)}
                    placeholder="field_name"
                    className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50"
                  />
                  <select
                    value={entry.value}
                    onChange={e => updateSchemaEntry(outputSchema, setOutputSchema, i, 'value', e.target.value)}
                    className="w-24 bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-fg focus:outline-none focus:border-primary/50"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="object">object</option>
                    <option value="array">array</option>
                  </select>
                  <button
                    onClick={() => removeSchemaEntry(setOutputSchema, outputSchema, i)}
                    className="text-muted hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive bg-red-bg px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-fg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-primary text-black rounded-lg hover:bg-primary-hover transition-all duration-150 active:scale-[0.97]"
          >
            Save Tool
          </button>
        </div>
      </div>
    </div>
  );
}