import type { ReactNode } from 'react';

type Tone = 'default' | 'indigo' | 'amber' | 'red' | 'green' | 'violet';

// Prop names are unchanged so every existing call site across the app keeps
// working without edits — only the underlying colors move onto the Waypoint
// semantic tokens (indigo -> brand, red -> danger, green -> success). "violet"
// is a new, additive tone for the AI role — nothing existing used it before.
const TONE_CLASSES: Record<Tone, string> = {
  default: 'bg-surface-2 text-ink-2 border border-border',
  indigo: 'bg-brand/10 text-brand dark:bg-brand/15',
  amber: 'bg-milestone/10 text-milestone dark:bg-milestone/15',
  red: 'bg-danger/10 text-danger dark:bg-danger/15',
  green: 'bg-success/10 text-success dark:bg-success/15',
  violet: 'bg-ai/10 text-ai dark:bg-ai/15',
};

export default function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
