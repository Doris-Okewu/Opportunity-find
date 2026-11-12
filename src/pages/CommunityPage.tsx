import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createPost,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listCommunityPosts,
} from '../lib/queries/community';
import type { CommunityPost, CommunitySummary } from '../lib/queries/community';
import { useCommunityAccount } from '../hooks/useCommunityAccount';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/opportunities/ErrorState';
import EmptyState from '../components/opportunities/EmptyState';
import { FormError, PostComposer, PostListItem, SignInLink } from '../components/community/communityUi';

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const account = useCommunityAccount();
  const [community, setCommunity] = useState<CommunitySummary | null | undefined>(undefined);
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await listCommunities();
      const found = all.find((c) => c.slug === slug) ?? null;
      setCommunity(found);
      setPosts(found ? await listCommunityPosts(found.id) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load this community.');
    }
  }, [slug]);

  useEffect(() => {
    if (!account.loading) load();
  }, [load, account.loading, account.userId]);

  async function toggleMembership() {
    if (!community || !account.userId) return;
    setBusy(true);
    setActionError(null);
    try {
      if (community.is_member) await leaveCommunity(community.id, account.userId);
      else await joinCommunity(community.id, account.userId);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update membership.');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6"><ErrorState message={error} onRetry={load} /></div>;
  }

  if (community === undefined) {
    return <div className="flex flex-1 justify-center py-24"><Spinner className="h-6 w-6 text-brand" /></div>;
  }

  if (community === null) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <EmptyState
          title="Community not found"
          action={<Button variant="secondary" onClick={() => navigate('/community')}>All communities</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link to="/community" className="mb-6 inline-block text-sm font-medium text-brand">&larr; All communities</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">{community.name}</h1>
          <p className="mt-1 text-sm text-ink-2">{community.description}</p>
          <p className="mt-2 text-xs text-ink-3">
            {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
          </p>
        </div>
        {account.session && (
          <Button variant={community.is_member ? 'secondary' : 'primary'} disabled={busy} onClick={toggleMembership}>
            {busy ? '…' : community.is_member ? 'Leave community' : 'Join community'}
          </Button>
        )}
      </div>

      <div className="mt-4"><FormError message={actionError} /></div>

      <section className="mt-6">
        {!account.session ? (
          <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-ink-2">
            <SignInLink>Sign in</SignInLink> and join this community to post.
          </p>
        ) : !account.profile ? (
          <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-ink-2">
            <Link to={`/account?next=/community/${community.slug}`} className="font-medium text-brand">Choose a display name</Link> to post.
          </p>
        ) : !community.is_member ? (
          <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-ink-2">
            Join this community to start a post.
          </p>
        ) : (
          <PostComposer
            onSubmit={async (title, body) => {
              const id = await createPost({ authorId: account.userId!, title, body, communityId: community.id });
              navigate(`/community/posts/${id}`);
            }}
          />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">Posts</h2>
        {posts === null ? (
          <Spinner className="h-5 w-5 text-brand" />
        ) : posts.length === 0 ? (
          <p className="text-sm text-ink-3">No posts yet. Be the first to start a conversation.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => <PostListItem key={p.id} post={p} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
