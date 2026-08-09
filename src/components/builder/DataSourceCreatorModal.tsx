import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { DataSource } from '../../types';
import { generateId } from '../../utils/id';

interface DataSourceCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (source: DataSource) => void;
  existingNames: string[];
}

const SOURCE_TYPES: { value: DataSource['type']; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 's3', label: 'S3' },
];

const REFRESH_POLICIES: { value: DataSource['refreshPolicy']; label: string }[] = [
  { value: 'on_trigger', label: 'On Trigger' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
];

export default function DataSourceCreatorModal({ isOpen, onClose, onSave, existingNames }: DataSourceCreatorModalProps) {
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<DataSource['type']>('postgresql');
  const [brightDataZone, setBrightDataZone] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [queryTemplate, setQueryTemplate] = useState('');
  const [allowedTables, setAllowedTables] = useState('');
  const [refreshPolicy, setRefreshPolicy] = useState<DataSource['refreshPolicy']>('on_trigger');
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSourceType('postgresql');
      setBrightDataZone('');
      setHost('');
      setPort(5432);
      setDatabase('');
      setUsername('');
      setQueryTemplate('');
      setAllowedTables('');
      setRefreshPolicy('on_trigger');
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
      setError('Source name is required');
      return;
    }
    if (existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase())) {
      setError('A data source with this name already exists');
      return;
    }
    if (!brightDataZone.trim()) {
      setError('Bright Data Zone is required');
      return;
    }

    onSave({
      id: generateId(),
      name: name.trim(),
      type: sourceType,
      brightDataZone: brightDataZone.trim(),
      host: host.trim() || undefined,
      port: port || undefined,
      database: database.trim() || undefined,
      username: username.trim() || undefined,
      queryTemplate,
      allowedTables: allowedTables.split(',').map(t => t.trim()).filter(Boolean),
      refreshPolicy,
    });

    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-12"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">Add Data Source</h2>
          <button onClick={onClose} className="text-muted hover:text-fg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Source Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. production-db"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Source Type *</label>
            <select
              value={sourceType}
              onChange={e => setSourceType(e.target.value as DataSource['type'])}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
            >
              {SOURCE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Bright Data Zone */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Bright Data Zone *</label>
            <input
              type="text"
              value={brightDataZone}
              onChange={e => setBrightDataZone(e.target.value)}
              placeholder="brightdata_zone_name"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Connection Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Host</label>
              <input
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="localhost"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Port</label>
              <input
                type="number"
                value={port}
                onChange={e => setPort(Number(e.target.value))}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Database</label>
              <input
                type="text"
                value={database}
                onChange={e => setDatabase(e.target.value)}
                placeholder="mydb"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Query Template */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Base Query Template</label>
            <textarea
              value={queryTemplate}
              onChange={e => setQueryTemplate(e.target.value)}
              rows={3}
              placeholder="SELECT * FROM table WHERE id = {{param}}"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Allowed Tables */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Allowed Tables (comma-separated)</label>
            <input
              type="text"
              value={allowedTables}
              onChange={e => setAllowedTables(e.target.value)}
              placeholder="users, invoices, orders"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg placeholder:text-muted/50 font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Refresh Policy */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Refresh Policy</label>
            <select
              value={refreshPolicy}
              onChange={e => setRefreshPolicy(e.target.value as DataSource['refreshPolicy'])}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/50 transition-colors"
            >
              {REFRESH_POLICIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
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
            Save Data Source
          </button>
        </div>
      </div>
    </div>
  );
}