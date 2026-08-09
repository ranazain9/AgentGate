import { useState } from 'react';
import { Wrench, Trash2 } from 'lucide-react';
import { useSentry } from '../context/SentryContext';
import Card from '../components/Card';
import ToolCreatorModal from '../components/builder/ToolCreatorModal';

const TYPE_INFO: Record<string, { label: string; className: string }> = {
  rest_read: { label: 'REST Read', className: 'text-primary bg-teal-bg' },
  rest_write: { label: 'REST Write', className: 'text-warning bg-amber-bg' },
  databright_select: { label: 'Bright Data', className: 'text-purple-400 bg-purple-500/10' },
};

export default function BuilderTools() {
  const { state, addTool, removeTool } = useSentry();
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = (tool: Parameters<typeof addTool>[0]) => {
    addTool(tool);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-4">
        <span className="text-fg">Builder</span>
        <span>/</span>
        <span className="text-fg">Tools</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Tools</h1>
          <p className="text-sm text-muted mt-1">
            Register REST APIs and Bright Data queries for your agents
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          + Register New Tool
        </button>
      </div>

      {state.tools.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Wrench size={40} className="mx-auto text-muted/40 mb-4" />
          <h3 className="text-base font-medium text-fg mb-2">No tools registered</h3>
          <p className="text-sm text-muted mb-6">
            No tools registered. Add a tool to use in your agents.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover active:scale-[0.97] transition-all duration-150"
          >
            Register Your First Tool
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {state.tools.map(tool => {
            const typeInfo = TYPE_INFO[tool.type] ?? { label: tool.type, className: 'text-muted bg-border' };

            return (
              <Card key={tool.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-fg">{tool.name}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeInfo.className}`}>
                        {typeInfo.label}
                      </span>
                      {tool.requiresApproval && (
                        <span className="text-[10px] text-warning bg-amber-bg px-1.5 py-0.5 rounded">Requires Approval</span>
                      )}
                    </div>
                    <p className="text-xs text-muted font-mono truncate mt-1">
                      {tool.handler}
                      {tool.method && ` (${tool.method})`}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-muted">{tool.timeout}s timeout</span>
                      <span className="text-[11px] text-muted">{tool.rateLimit}</span>
                      {tool.approvalThreshold && (
                        <span className="text-[11px] text-warning">${tool.approvalThreshold} threshold</span>
                      )}
                    </div>
                    {tool.inputSchema && Object.keys(tool.inputSchema).length > 0 && (
                      <p className="text-[11px] text-muted mt-1">
                        Input: {Object.keys(tool.inputSchema).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDelete(tool.id)}
                    className="shrink-0 text-muted hover:text-destructive transition-colors"
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
            className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-fg mb-2">Delete Tool</h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete this tool? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-border text-muted rounded-lg hover:text-fg hover:bg-card transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeTool(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:opacity-90 transition-all duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolCreatorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        existingNames={state.tools.map(t => t.name)}
      />
    </div>
  );
}