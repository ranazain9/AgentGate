import YAMLViewer from './YAMLViewer';

interface CodeStepProps {
  yaml: string;
}

export default function CodeStep({ yaml }: CodeStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl px-4 py-3">
        <p className="text-xs text-muted">
          This YAML is auto-generated from your form selections. Changes will update as you navigate back.
          The YAML is read-only — use the form steps to make changes.
        </p>
      </div>
      <YAMLViewer code={yaml} maxHeight="400px" />
    </div>
  );
}