const DAY_MS = 1000 * 60 * 60 * 24;
const CLOSING_SOON_DAYS = 5;

export function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / DAY_MS);
}

export function isClosingSoon(deadline: string | null): boolean {
  if (!deadline) return false;
  const days = daysUntil(deadline);
  return days >= 0 && days <= CLOSING_SOON_DAYS;
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Rolling / no deadline';
  return new Date(deadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function deadlineCountdownLabel(deadline: string | null): string {
  if (!deadline) return 'No deadline';
  const days = daysUntil(deadline);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}
