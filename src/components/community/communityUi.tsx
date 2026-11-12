import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Badge from '../ui/Badge';
import { REPORT_REASON_LABELS, reportContent } from '../../lib/queries/community';
import type { CommunityPost, ReportReason } from '../../lib/queries/community';
import { formatPostedAt } from '../../utils/date';

/** Link to the account page that returns the user to the current page afterwards. */
export function SignInLink({ children }: { children: string }) {
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);
  return (
    <Link to={`/account?next=${next}`} className="font-medium text-brand">
      {children}
    </Link>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function PostComposer({
  onSubmit,
  titlePlaceholder = 'Title',
  bodyPlaceholder = 'Share a question, resource or experience…',
}: {
  onSubmit: (title: string, body: string) => Promise<void>;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (!body.trim()) return setError('Please write something in the post.');
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(title, body);
      setTitle('');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish your post.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <label className="sr-only" htmlFor="post-title">Post title</label>
      <Input id="post-title" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder={titlePlaceholder} />
      <label className="sr-only" htmlFor="post-body">Post body</label>
      <Textarea id="post-body" rows={4} value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} placeholder={bodyPlaceholder} />
      <FormError message={error} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-3">Be respectful. Never share passwords or pay anyone to apply.</p>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </form>
  );
}

export function PostListItem({ post }: { post: CommunityPost }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-strong">
      <Link to={`/community/posts/${post.id}`} className="block">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{post.title}</h3>
          {post.is_hidden && <Badge tone="red">Hidden by moderators</Badge>}
        </div>
        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-ink-2">{post.body}</p>
        <p className="mt-2 text-xs text-ink-3">
          {post.author_name} · {formatPostedAt(post.created_at)} · {post.comment_count}{' '}
          {post.comment_count === 1 ? 'comment' : 'comments'}
        </p>
      </Link>
    </li>
  );
}

/** Inline report form. Only rendered for signed-in users (the server enforces it too). */
export function ReportControl({
  reporterId,
  target,
}: {
  reporterId: string;
  target: { postId: string } | { commentId: string };
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const idBase = 'postId' in target ? `report-post-${target.postId}` : `report-comment-${target.commentId}`;

  if (done) return <span className="text-xs text-ink-3" role="status">{done}</span>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-ink-3 hover:text-danger">
        Report
      </button>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await reportContent({ reporterId, target, reason, details });
      setDone(result === 'already_reported' ? 'You already reported this.' : 'Reported. Thanks — moderators will review it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 w-full space-y-2 rounded-lg border border-border bg-surface-2 p-3">
      <label htmlFor={`${idBase}-reason`} className="block text-xs font-semibold text-ink-2">Why are you reporting this?</label>
      <Select id={`${idBase}-reason`} value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
        {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((r) => (
          <option key={r} value={r}>{REPORT_REASON_LABELS[r]}</option>
        ))}
      </Select>
      <label htmlFor={`${idBase}-details`} className="block text-xs font-semibold text-ink-2">Details (optional)</label>
      <Textarea id={`${idBase}-details`} rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={submitting}>{submitting ? 'Sending…' : 'Send report'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
