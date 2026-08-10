import { useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { useSentry } from '../context/SentryContext';
import Card from '../components/Card';
import DataSourceCreatorModal from '../components/builder/DataSourceCreatorModal';

const TYPE_LABELS: Record<string, string> = {
  postgresql: 'PostgreSQL',
  snowflake: 'Snowflake',
  salesforce: 'Salesforce',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  s3: 'S3',
};

const REFRESH_LABELS: Record<string, { label: string; className: string }> = {
  on_trigger: { label: 'On Trigger', className: 'text-muted bg-border' },
  hourly: { label: 'Hourly', className: 'text-primary bg-teal-bg' },
  daily: { label: 'Daily', className: 'text-warning bg-amber-bg' },
};

export default function BuilderDataSources() {
  const { state, addDataSource, removeDataSource } = useSentry();
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = (source: Parameters<typeof addDataSource>[0]) => {
    addDataSource(source);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-4">
        <span className="text-fg">Builder</span>
        <span>/</span>
        <span className="text-fg">Data Sources</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Data Sources</h1>
          <p className="text-sm text-muted mt-1">
            Connect Bright Data sources for agent queries
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          + Add Data Source
        </button>
      </div>

      {state.dataSources.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Database size={40} className="mx-auto text-muted/40 mb-4" />
          <h3 className="text-base font-medium text-fg mb-2">No data sources configured</h3>
          <p className="text-sm text-muted mb-6">
            No data sources configured. Add a Bright Data source to enable agent queries.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
          >
            Add Your First Data Source
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {state.dataSources.map(source => {
            const refreshInfo = REFRESH_LABELS[source.refreshPolicy] ?? { label: source.refreshPolicy, className: 'text-muted bg-border' };

            return (
              <Card key={source.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-fg">{source.name}</h3>
                      <span className="text-[10px] font-medium text-primary bg-teal-bg px-1.5 py-0.5 rounded">
                        {TYPE_LABELS[source.type] ?? source.type}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${refreshInfo.className}`}>
                        {refreshInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-mono mt-1">{source.brightDataZone}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                        Connected
                      </span>
                      {(source.allowedTables?.length ?? 0) > 0 && (
                        <span className="text-[11px] text-muted">
                          {source.allowedTables!.length} table{source.allowedTables!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(source.id)}
                    className="shrink-0 text-muted hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="glass-panel rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-fg mb-2">Delete Data Source</h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete this data source? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-white/10 text-muted rounded-lg hover:text-fg hover:bg-white/5 transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeDataSource(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <DataSourceCreatorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        existingNames={state.dataSources.map(s => s.name)}
      />
    </div>
  );
}