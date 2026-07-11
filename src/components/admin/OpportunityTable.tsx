import { Link } from 'react-router-dom';
import type { Opportunity } from '../../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS } from '../../types/opportunity';
import { formatDeadline, isExpired } from '../../utils/date';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function OpportunityTable({
  opportunities,
  onTogglePublish,
  onDelete,
}: {
  opportunities: Opportunity[];
  onTogglePublish: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Deadline</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {opportunities.map((opportunity) => {
            const expired = isExpired(opportunity.deadline);
            return (
              <tr key={opportunity.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 dark:text-white">{opportunity.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{opportunity.organization}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {OPPORTUNITY_TYPE_LABELS[opportunity.type]}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatDeadline(opportunity.deadline)}
                  {expired && (
                    <span className="ml-2">
                      <Badge tone="red">Expired</Badge>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={opportunity.is_published ? 'green' : 'default'}>
                    {opportunity.is_published ? 'Published' : 'Unpublished'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/opportunities/${opportunity.id}/edit`}>
                      <Button variant="secondary" className="px-3 py-1 text-xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="px-3 py-1 text-xs"
                      onClick={() => onTogglePublish(opportunity)}
                    >
                      {opportunity.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => onDelete(opportunity)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
