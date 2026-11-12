import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  REPORT_REASON_LABELS,
  closeReportsFor,
  deleteComment,
  deletePost,
  listReportsForAdmin,
  reopenReport,
  setContentHidden,
} from '../../lib/queries/community';
import type { ContentReport, ReportStatus } from '../../lib/queries/community';
import { useAdminSession } from '../../lib/auth/adminAuth';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/opportunities/ErrorState';
import EmptyState from '../../components/opportunities/EmptyState';
import { FormError } from '../../components/community/communityUi';
import { formatPostedAt } from '../../utils/date';

const TABS: { status: ReportStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'resolved', label: 'Resolved' },
  { status: 'dismissed', label: 'Dismissed' },
];

function ReportCard({
  report,
  adminId,
  onChanged,
  onError,
}: {
  report: ContentReport;
  adminId: string;
  onChanged: () => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const kind = report.post ? 'post' : 'comment';
  const content = report.post ?? report.comment;
  const target = report.post ? { postId: report.post.id } : report.comment ? { commentId: report.comment.id } : null;
  const viewLink = report.post ? `/community/posts/${report.post.id}` : report.comment ? `/community/posts/${report.comment.post_id}` : null;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge tone="red">{REPORT_REASON_LABELS[report.reason]}</Badge>
        <Badge>{kind}</Badge>
        {content?.is_hidden && <Badge tone="amber">Currently hidden</Badge>}
        <span className="text-ink-3">Reported {formatPostedAt(report.created_at)}</span>
      </div>
      {report.details && <p className="mt-2 text-sm text-ink-2"><span className="font-medium">Reporter note:</span> {report.details}</p>}

      {content ? (
        <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
          {report.post && <p className="font-semibold text-ink">{report.post.title}</p>}
          <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-ink-2">{content.body}</p>
          <p className="mt-2 text-xs text-ink-3">By {content.author_name} · {formatPostedAt(content.created_at)}</p>
          {viewLink && <Link to={viewLink} className="mt-2 inline-block text-xs font-medium text-brand">View in context &rarr;</Link>}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-3">The reported content no longer exists.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {report.status === 'open' && target && content && (
          <>
            {!content.is_hidden && (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => run(async () => {
                  await setContentHidden(kind, content.id, true);
                  await closeReportsFor(target, 'resolved', adminId);
                })}
              >
                Hide &amp; resolve
              </Button>
            )}
            <Button variant="secondary" disabled={busy} onClick={() => run(() => closeReportsFor(target, 'dismissed', adminId))}>
              Dismiss (no action)
            </Button>
          </>
        )}
        {content?.is_hidden && (
          <Button variant="secondary" disabled={busy} onClick={() => run(() => setContentHidden(kind, content.id, false))}>
            Unhide
          </Button>
        )}
        {content && (confirmDelete ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-ink-2">Permanently delete this {kind}?</span>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => run(() => (kind === 'post' ? deletePost(content.id) : deleteComment(content.id)))}
            >
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </span>
        ) : (
          <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete {kind}</Button>
        ))}
        {report.status !== 'open' && (
          <Button variant="ghost" disabled={busy} onClick={() => run(() => reopenReport(report.id))}>Reopen report</Button>
        )}
      </div>
    </li>
  );
}

export default function AdminModerationPage() {
  const { session } = useAdminSession();
  const [status, setStatus] = useState<ReportStatus>('open');
  const [reports, setReports] = useState<ContentReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setReports(await listReportsForAdmin(status));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports.');
    }
  }, [status]);

  useEffect(() => {
    setReports(null);
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <Link to="/admin" className="mb-6 inline-block text-sm font-medium text-brand">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-ink">Community moderation</h1>
      <p className="mt-1 text-sm text-ink-2">
        Reports from signed-in members. Hidden content stays visible only to its author and admins.
      </p>

      <div className="mt-6 flex gap-2" role="tablist" aria-label="Report status">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            role="tab"
            aria-selected={status === t.status}
            onClick={() => setStatus(t.status)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${status === t.status ? 'border-brand bg-brand/10 text-brand' : 'border-border text-ink-2 hover:bg-surface-2'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4"><FormError message={actionError} /></div>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={load} /></div>}
      {!error && reports === null && <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-brand" /></div>}
      {!error && reports?.length === 0 && (
        <div className="mt-6"><EmptyState title={`No ${status} reports`} /></div>
      )}
      {!error && reports && reports.length > 0 && session && (
        <ul className="mt-6 space-y-4">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              adminId={session.user.id}
              onChanged={() => {
                setActionError(null);
                load();
              }}
              onError={setActionError}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
