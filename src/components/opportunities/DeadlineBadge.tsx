import Badge from '../ui/Badge';
import { deadlineCountdownLabel, isClosingSoon } from '../../utils/date';

export default function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return <Badge tone="default">Rolling</Badge>;

  const closingSoon = isClosingSoon(deadline);
  return <Badge tone={closingSoon ? 'red' : 'green'}>{deadlineCountdownLabel(deadline)}</Badge>;
}
