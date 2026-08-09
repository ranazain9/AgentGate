import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useSentry } from '../context/SentryContext';
import type { AgentConfig } from '../types';
import { generateAgentYaml } from '../utils/yamlGenerator';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import StepIndicator from '../components/builder/StepIndicator';
import BasicInfoStep from '../components/builder/BasicInfoStep';
import ToolsStep from '../components/builder/ToolsStep';
import DataSourcesStep from '../components/builder/DataSourcesStep';
import GovernanceStep from '../components/builder/GovernanceStep';
import CodeStep from '../components/builder/CodeStep';
import type { WizardFormState } from '../components/builder/wizardTypes';
import { emptyWizardFormState } from '../components/builder/wizardTypes';
import { generateId } from '../utils/id';

const STEPS = ['Basic Info', 'Tools', 'Data Sources', 'Governance', 'Code'];

export default function AgentBuilderWizard() {
  const navigate = useNavigate();
  const { state, addAgentConfig, addTool, addDataSource } = useSentry();
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<WizardFormState>(emptyWizardFormState);
  const [error, setError] = useState('');
  const [hasModified, setHasModified] = useState(false);

  const { isBlocked, proceed, reset, guardNavigation } = useNavigationGuard(hasModified);

  const onUpdate = useCallback((partial: Partial<WizardFormState>) => {
    setFormState(prev => ({ ...prev, ...partial }));
    setHasModified(true);
    setError('');
  }, []);

  const goBackToBuilder = useCallback(() => {
    guardNavigation(() => navigate('/builder/agents'));
  }, [guardNavigation, navigate]);

  // Generate YAML from current form state
  const yaml = useMemo(() => {
    const previewConfig: AgentConfig = {
      id: 'preview',
      metadata: {
        name: formState.name || 'unnamed-agent',
        agentId: formState.agentId || 'unnamed-agent',
        namespace: formState.namespace || undefined,
        owner: formState.owner || undefined,
      },
      spec: {
        goal: formState.goal || 'No goal defined',
        description: formState.description || undefined,
        reasoning: {
          provider: 'aimlapi',
          model: formState.model,
          temperature: formState.temperature,
          maxTokens: 4096,
        },
        tools: formState.selectedTools,
        dataSources: formState.selectedDataSources.map(name => ({
          name,
          refreshPolicy: 'on_trigger' as const,
        })),
        governance: {
          state: formState.governanceState,
          spendingLimit: formState.spendingLimit > 0 ? { daily: formState.spendingLimit } : undefined,
          approvalRules: formState.approvalRules,
        },
      },
      createdAt: Date.now(),
    };
    return generateAgentYaml(previewConfig);
  }, [formState]);

  const validateStep = (step: number): boolean => {
    setError('');
    if (step === 1) {
      if (!formState.name.trim()) {
        setError('Agent name is required');
        return false;
      }
      if (!formState.goal.trim()) {
        setError('Agent goal is required');
        return false;
      }
      if (!formState.agentId.trim()) {
        setError('Agent ID is required');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(s => s - 1);
    setError('');
  };

  const handleCreate = () => {
    // Check duplicate name
    const duplicate = state.agentConfigs.find(
      c => c.metadata.name.toLowerCase() === formState.name.trim().toLowerCase()
    );
    if (duplicate) {
      setError(`An agent named "${formState.name.trim()}" already exists.`);
      return;
    }

    const config: AgentConfig = {
      id: formState.agentId || generateId(),
      metadata: {
        name: formState.name.trim(),
        agentId: formState.agentId || formState.name.trim().toLowerCase().replace(/\s+/g, '-'),
        namespace: formState.namespace.trim() || undefined,
        owner: formState.owner.trim() || undefined,
      },
      spec: {
        goal: formState.goal.trim(),
        description: formState.description.trim() || undefined,
        reasoning: {
          provider: 'aimlapi',
          model: formState.model,
          temperature: formState.temperature,
          maxTokens: 4096,
        },
        tools: formState.selectedTools,
        dataSources: formState.selectedDataSources.map(name => ({
          name,
          refreshPolicy: 'on_trigger' as const,
        })),
        governance: {
          state: formState.governanceState,
          spendingLimit: formState.spendingLimit > 0 ? { daily: formState.spendingLimit } : undefined,
          approvalRules: formState.approvalRules,
        },
      },
      createdAt: Date.now(),
    };

    addAgentConfig(config);
    navigate('/builder/agents');
  };

  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-4">
        <button onClick={goBackToBuilder} className="hover:text-fg transition-colors">
          Builder
        </button>
        <span>/</span>
        <button onClick={goBackToBuilder} className="hover:text-fg transition-colors">
          Agents
        </button>
        <span>/</span>
        <span className="text-fg">New Agent</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Create New Agent</h1>
        <p className="text-sm text-muted mt-1">
          Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]}
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {/* Step Content */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px]">
        {currentStep === 1 && (
          <BasicInfoStep formState={formState} onUpdate={onUpdate} />
        )}
        {currentStep === 2 && (
          <ToolsStep
            formState={formState}
            onUpdate={onUpdate}
            tools={state.tools}
            onToolCreated={addTool}
          />
        )}
        {currentStep === 3 && (
          <DataSourcesStep
            formState={formState}
            onUpdate={onUpdate}
            dataSources={state.dataSources}
            onSourceCreated={addDataSource}
          />
        )}
        {currentStep === 4 && (
          <GovernanceStep formState={formState} onUpdate={onUpdate} />
        )}
        {currentStep === 5 && (
          <CodeStep yaml={yaml} />
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-xs text-destructive bg-red-bg px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-muted border border-border rounded-lg hover:text-fg hover:bg-card transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary text-black rounded-lg hover:bg-primary-hover transition-all duration-150 active:scale-[0.97]"
          >
            <Check size={16} />
            Create Agent
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-black rounded-lg hover:bg-primary-hover transition-all duration-150 active:scale-[0.97]"
          >
            Next
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Unsaved changes blocker dialog */}
      {isBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-fg mb-2">Unsaved Changes</h3>
            <p className="text-sm text-muted mb-4">
              You have unsaved changes. Are you sure you want to leave?
            </p>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2 border border-border text-muted rounded-lg hover:text-fg hover:bg-card transition-all duration-150"
              >
                Stay
              </button>
              <button
                onClick={proceed}
                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:opacity-90 transition-all duration-150"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}