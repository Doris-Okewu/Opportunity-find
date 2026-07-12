import type { LadderStageKey, SkillLadderResult } from '../../features/intelligence/types';
import Badge from '../ui/Badge';

// The four stages are a fixed, product-wide sequence (see
// features/intelligence/skillLadder.ts) — repeated here only to draw the
// full path around the calculated current/next stages, not to redefine or
// recalculate them.
const ALL_STAGES: Array<{ key: LadderStageKey; label: string }> = [
  { key: 'foundations', label: 'Foundations' },
  { key: 'jobReady', label: 'Job-Ready' },
  { key: 'productionReady', label: 'Production-Ready' },
  { key: 'strategic', label: 'Strategic / Leadership' },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.25 7.5a.75.75 0 0 1-1.08.02l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 6.72-6.95a.75.75 0 0 1 1.074-.04Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function SkillLadderPanel({ ladder }: { ladder: SkillLadderResult }) {
  const currentIndex = ALL_STAGES.findIndex((s) => s.key === ladder.current.stageKey);

  return (
    <div>
      <div>
        {ALL_STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isImmediateNext = i === currentIndex + 1;
          const isFarFuture = i > currentIndex + 1;

          return (
            <div
              key={stage.key}
              className="animate-reveal relative flex gap-4 pb-8 last:pb-0"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              {i < ALL_STAGES.length - 1 && (
                <div
                  className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${
                    isCompleted ? 'bg-brand' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}

              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  isCurrent
                    ? 'border-brand bg-brand text-white'
                    : isCompleted
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-surface text-ink-3'
                }`}
              >
                {isCompleted ? <CheckIcon /> : i + 1}
              </div>

              <div className={`min-w-0 flex-1 pt-1.5 ${isFarFuture ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`min-w-0 whitespace-normal break-normal text-sm font-semibold ${isCurrent ? 'text-brand' : 'text-ink'}`}>{stage.label}</p>
                  {isCurrent && <Badge tone="indigo">Your current stage</Badge>}
                  {isImmediateNext && <Badge tone="default">Next</Badge>}
                </div>

                {isCurrent && (
                  <>
                    <p className="mt-1 text-sm text-ink-2">{ladder.current.focus}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ladder.current.keySkills.map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                  </>
                )}

                {isImmediateNext && ladder.next && (
                  <>
                    <p className="mt-1 text-sm text-ink-2">{ladder.next.focus}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ladder.next.keySkills.map((skill) => (
                        <Badge key={skill} tone="default">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs italic text-ink-3">{ladder.disclaimer}</p>
    </div>
  );
}
