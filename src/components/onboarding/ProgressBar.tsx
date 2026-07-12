export default function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-3">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{Math.round((step / totalSteps) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
