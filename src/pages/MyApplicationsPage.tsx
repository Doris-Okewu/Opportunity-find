import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications } from '../hooks/useApplications';
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  removeApplication,
  updateApplication,
} from '../features/applications/applicationsStore';
import type { ApplicationRecord, ApplicationStatus } from '../features/applications/applicationsStore';
import { formatDeadline, isExpired } from '../utils/date';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import EmptyState from '../components/opportunities/EmptyState';
import DeadlineBadge from '../components/opportunities/DeadlineBadge';
import { trackSiteEvent } from '../features/tracking/trackSiteEvent';

type Filter = 'all' | ApplicationStatus;

const STATUS_TONE: Record<ApplicationStatus, 'default' | 'indigo' | 'amber' | 'red' | 'green' | 'violet'> = {
  opened: 'amber',
  applied: 'indigo',
  interviewing: 'violet',
  offer: 'green',
  not_selected: 'red',
  withdrawn: 'default',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ApplicationRow({ record }: { record: ApplicationRecord }) {
  const [notes, setNotes] = useState(record.notes);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const statusId = `status-${record.opportunityId}`;
  const notesId = `notes-${record.opportunityId}`;

  return (
    <li className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/opportunities/${record.opportunityId}`} className="text-lg font-semibold text-ink hover:text-brand">
            {record.title}
          </Link>
          <p className="text-sm text-ink-2">{record.organization}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[record.status]}>{APPLICATION_STATUS_LABELS[record.status]}</Badge>
          {!isExpired(record.deadline) && <DeadlineBadge deadline={record.deadline} />}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-3">
        <span>Deadline: {formatDeadline(record.deadline)}</span>
        <span>Link first opened: {formatDate(record.firstOpenedAt)}</span>
        <span>Last updated: {formatDate(record.updatedAt)}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[16rem_1fr]">
        <div>
          <label htmlFor={statusId} className="mb-1 block text-xs font-semibold text-ink-2">
            Status
          </label>
          <Select
            id={statusId}
            value={record.status}
            onChange={(e) => {
              const status = e.target.value as ApplicationStatus;
              updateApplication(record.opportunityId, { status });
              trackSiteEvent('tracker_status_change', { detail: status });
            }}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor={notesId} className="block text-xs font-semibold text-ink-2">
            Private notes
          </label>
          <p id={`${notesId}-help`} className="mb-1 text-xs text-ink-3">
            Only saved on this device. Keep track of your application activities and follow-ups.
          </p>
          <Textarea
            id={notesId}
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== record.notes) updateApplication(record.opportunityId, { notes });
            }}
            aria-describedby={`${notesId}-help`}
            placeholder="e.g. Submitted CV, interview scheduled, follow up next week."
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={record.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand"
        >
          Open application page<span className="sr-only"> (opens in a new tab)</span> &#8599;
        </a>
        {confirmingRemove ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-ink-2">Remove from your list?</span>
            <Button variant="danger" onClick={() => removeApplication(record.opportunityId)}>
              Remove
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingRemove(false)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmingRemove(true)}>
            Remove
          </Button>
        )}
      </div>
    </li>
  );
}

export default function MyApplicationsPage() {
  const applications = useApplications();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Partial<Record<ApplicationStatus, number>> = {};
    for (const a of applications) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [applications]);

  const visible = useMemo(() => {
    const list = filter === 'all' ? applications : applications.filter((a) => a.status === filter);
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [applications, filter]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">My Applications</h1>
      <p className="mt-2 text-sm text-ink-2">
        Opportunities you opened the Apply link for. Statuses are what you report — Opportunity Find can't see whether an
        application was submitted. This list is stored only in this browser and isn't synced to other devices.
      </p>

      {applications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No applications yet"
            description="When you open an Apply link from an opportunity, it will appear here so you can track its status."
            action={
              <Link to="/opportunities">
                <Button>Browse opportunities</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {(['all', ...APPLICATION_STATUSES] as Filter[]).map((f) => {
              const count = f === 'all' ? applications.length : (counts[f] ?? 0);
              if (f !== 'all' && count === 0) return null;
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active ? 'border-brand bg-brand/10 text-brand' : 'border-border text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {f === 'all' ? 'All' : APPLICATION_STATUS_LABELS[f]} ({count})
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-ink-3">No applications with this status.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {visible.map((record) => (
                <ApplicationRow key={record.opportunityId} record={record} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
