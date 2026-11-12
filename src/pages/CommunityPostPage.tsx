import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createComment,
  deleteComment,
  deletePost,
  getPost,
  listCommunities,
  listComments,
} from '../lib/queries/community';
import type { CommunityComment, CommunityPost, CommunitySummary } from '../lib/queries/community';
import { getOpportunityById } from '../lib/queries/opportunities';
import { useCommunityAccount } from '../hooks/useCommunityAccount';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Textarea from '../components/ui/Textarea';
import ErrorState from '../components/opportunities/ErrorState';
import EmptyState from '../components/opportunities/EmptyState';
import { FormError, ReportControl, SignInLink } from '../components/community/communityUi';
import { formatPostedAt } from '../utils/date';

interface Context {
  label: string;
  to: string;
  community: CommunitySummary | null;
}

function ConfirmDelete({ label, onConfirm }: { label: string; onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-xs font-medium text-ink-3 hover:text-danger">
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-ink-2">Delete this {label}?</span>
      <Button
        variant="danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setConfirming(false);
          }
        }}
      >
        Delete
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
    </span>
  );
}

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const account = useCommunityAccount();
  const [post, setPost] = useState<CommunityPost | null | undefined>(undefined);
  const [context, setContext] = useState<Context | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const p = await getPost(id);
      setPost(p);
      if (!p) return;
      const [c, ctx] = await Promise.all([
        listComments(p.id),
        (async (): Promise<Context> => {
          if (p.community_id) {
            const community = (await listCommunities()).find((x) => x.id === p.community_id) ?? null;
            return { label: community?.name ?? 'Community', to: community ? `/community/${community.slug}` : '/community', community };
          }
          const opp = p.opportunity_id ? await getOpportunityById(p.opportunity_id) : null;
          return { label: opp ? `Discussion: ${opp.title}` : 'Opportunity discussion', to: p.opportunity_id ? `/opportunities/${p.opportunity_id}` : '/opportunities', community: null };
        })(),
      ]);
      setComments(c);
      setContext(ctx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load this post.');
    }
  }, [id]);

  useEffect(() => {
    if (!account.loading) load();
  }, [load, account.loading, account.userId]);

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!post || !account.userId || !commentBody.trim()) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await createComment(post.id, account.userId, commentBody);
      setCommentBody('');
      setComments(await listComments(post.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6"><ErrorState message={error} onRetry={load} /></div>;
  if (post === undefined) return <div className="flex flex-1 justify-center py-24"><Spinner className="h-6 w-6 text-brand" /></div>;
  if (post === null) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <EmptyState title="Post not found" description="It may have been removed by its author or a moderator." action={<Button variant="secondary" onClick={() => navigate('/community')}>Communities</Button>} />
      </div>
    );
  }

  const isAuthor = account.userId === post.author_id;
  const canDeletePost = isAuthor || account.isAdmin;
  // Mirrors the server rule (can_comment_on_post): opportunity discussions are
  // open to any signed-in user with a profile; community posts need membership.
  const canComment =
    Boolean(account.userId && account.profile) &&
    !post.is_hidden &&
    (post.opportunity_id !== null || Boolean(context?.community?.is_member));

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      {context && <Link to={context.to} className="mb-6 inline-block text-sm font-medium text-brand">&larr; {context.label}</Link>}

      <article className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">{post.title}</h1>
          {post.is_hidden && <Badge tone="red">Hidden by moderators</Badge>}
        </div>
        <p className="mt-1 text-xs text-ink-3">{post.author_name} · {formatPostedAt(post.created_at)}</p>
        <p className="mt-4 whitespace-pre-line text-ink-2">{post.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {canDeletePost && (
            <ConfirmDelete
              label="post"
              onConfirm={async () => {
                try {
                  await deletePost(post.id);
                  navigate(context?.to ?? '/community');
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Failed to delete post.');
                }
              }}
            />
          )}
          {account.userId && !isAuthor && <ReportControl reporterId={account.userId} target={{ postId: post.id }} />}
        </div>
      </article>

      <div className="mt-4"><FormError message={actionError} /></div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                <span className="font-medium text-ink-2">{c.author_name}</span>
                <span>· {formatPostedAt(c.created_at)}</span>
                {c.is_hidden && <Badge tone="red">Hidden by moderators</Badge>}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{c.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {(account.userId === c.author_id || account.isAdmin) && (
                  <ConfirmDelete
                    label="comment"
                    onConfirm={async () => {
                      try {
                        await deleteComment(c.id);
                        setComments((prev) => prev.filter((x) => x.id !== c.id));
                      } catch (err) {
                        setActionError(err instanceof Error ? err.message : 'Failed to delete comment.');
                      }
                    }}
                  />
                )}
                {account.userId && account.userId !== c.author_id && (
                  <ReportControl reporterId={account.userId} target={{ commentId: c.id }} />
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {canComment ? (
            <form onSubmit={handleComment} className="space-y-2">
              <label htmlFor="comment-body" className="block text-sm font-medium text-ink-2">Add a comment</label>
              <Textarea id="comment-body" rows={3} maxLength={2000} value={commentBody} onChange={(e) => setCommentBody(e.target.value)} />
              <Button type="submit" disabled={submitting || !commentBody.trim()}>{submitting ? 'Posting…' : 'Comment'}</Button>
            </form>
          ) : post.is_hidden ? null : !account.userId ? (
            <p className="text-sm text-ink-2"><SignInLink>Sign in</SignInLink> to comment.</p>
          ) : !account.profile ? (
            <p className="text-sm text-ink-2">
              <Link to={`/account?next=/community/posts/${post.id}`} className="font-medium text-brand">Choose a display name</Link> to comment.
            </p>
          ) : context?.community ? (
            <p className="text-sm text-ink-2">
              <Link to={context.to} className="font-medium text-brand">Join {context.community.name}</Link> to comment.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
