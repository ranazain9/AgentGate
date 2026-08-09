import { useState } from 'react';
import { Check, Plus, Database } from 'lucide-react';
import type { DataSource } from '../../types';
import type { WizardFormState } from './wizardTypes';
import DataSourceCreatorModal from './DataSourceCreatorModal';

interface DataSourcesStepProps {
  formState: WizardFormState;
  onUpdate: (partial: Partial<WizardFormState>) => void;
  dataSources: DataSource[];
  onSourceCreated?: (source: DataSource) => void;
}

const TYPE_LABELS: Record<string, string> = {
  postgresql: 'PostgreSQL',
  snowflake: 'Snowflake',
  salesforce: 'Salesforce',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  s3: 'S3',
};

const REFRESH_LABELS: Record<string, string> = {
  on_trigger: 'On Trigger',
  hourly: 'Hourly',
  daily: 'Daily',
};

export default function DataSourcesStep({ formState, onUpdate, dataSources, onSourceCreated }: DataSourcesStepProps) {
  const [showCreator, setShowCreator] = useState(false);

  const toggleSource = (sourceName: string) => {
    const selected = formState.selectedDataSources.includes(sourceName)
      ? formState.selectedDataSources.filter(s => s !== sourceName)
      : [...formState.selectedDataSources, sourceName];
    onUpdate({ selectedDataSources: selected });
  };

  const handleSourceCreated = (source: DataSource) => {
    onSourceCreated?.(source);
    onUpdate({ selectedDataSources: [...formState.selectedDataSources, source.name] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Connect Bright Data sources for agent queries.
        </p>
        <button
          onClick={() => setShowCreator(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
        >
          <Plus size={14} /> Add Data Source
        </button>
      </div>

      {dataSources.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Database size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="text-sm text-muted">No data sources configured yet.</p>
          <button
            onClick={() => setShowCreator(true)}
            className="mt-3 text-xs text-primary hover:text-primary-hover transition-colors"
          >
            Add your first data source
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {dataSources.map(source => {
            const isSelected = formState.selectedDataSources.includes(source.name);

            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{source.name}</span>
                    <span className="text-[10px] font-medium text-primary bg-teal-bg px-1.5 py-0.5 rounded">
                      {TYPE_LABELS[source.type] ?? source.type}
                    </span>
                    <span className="text-[10px] text-muted bg-border px-1.5 py-0.5 rounded">
                      {REFRESH_LABELS[source.refreshPolicy] ?? source.refreshPolicy}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted font-mono mt-0.5 truncate">
                    {source.brightDataZone}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <DataSourceCreatorModal
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onSave={handleSourceCreated}
        existingNames={dataSources.map(s => s.name)}
      />
    </div>
  );
}