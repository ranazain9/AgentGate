import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-2xl mx-auto mb-8">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-primary text-black'
                    : isCurrent
                    ? 'bg-primary text-black ring-2 ring-primary/30'
                    : 'bg-border text-muted'
                }`}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={`text-[10px] leading-tight text-center max-w-[72px] truncate hidden sm:block ${
                  isCurrent ? 'text-primary font-medium' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-px flex-1 mx-2 mt-[-1.25rem] ${
                  isCompleted ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}