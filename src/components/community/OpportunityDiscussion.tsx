import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPost, listOpportunityPosts } from '../../lib/queries/community';
import type { CommunityPost } from '../../lib/queries/community';
import { useCommunityAccount } from '../../hooks/useCommunityAccount';
import Spinner from '../ui/Spinner';
import { PostComposer, PostListItem, SignInLink } from './communityUi';

/** Opportunity-specific discussion threads, shown on the opportunity detail page. */
export default function OpportunityDiscussion({ opportunityId }: { opportunityId: string }) {
  const navigate = useNavigate();
  const account = useCommunityAccount();
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await listOpportunityPosts(opportunityId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the discussion.');
    }
  }, [opportunityId]);

  useEffect(() => {
    if (!account.loading) load();
  }, [load, account.loading, account.userId]);

  return (
    <div>
      <p className="mb-4 text-sm text-ink-2">
        Ask questions or share tips about this opportunity. Never pay anyone to apply, and verify details on the
        official site.
      </p>

      {account.loading ? null : !account.session ? (
        <p className="mb-4 text-sm text-ink-2"><SignInLink>Sign in</SignInLink> to start a thread.</p>
      ) : !account.profile ? (
        <p className="mb-4 text-sm text-ink-2">
          <Link to={`/account?next=/opportunities/${opportunityId}`} className="font-medium text-brand">Choose a display name</Link> to start a thread.
        </p>
      ) : (
        <div className="mb-4">
          <PostComposer
            titlePlaceholder="Question or topic"
            bodyPlaceholder="e.g. Has anyone done this program before? What was the interview like?"
            onSubmit={async (title, body) => {
              const id = await createPost({ authorId: account.userId!, title, body, opportunityId });
              navigate(`/community/posts/${id}`);
            }}
          />
        </div>
      )}

      {error ? (
        <p className="text-sm text-ink-3">{error}</p>
      ) : posts === null ? (
        <Spinner className="h-5 w-5 text-brand" />
      ) : posts.length === 0 ? (
        <p className="text-sm text-ink-3">No discussion yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => <PostListItem key={p.id} post={p} />)}
        </ul>
      )}
    </div>
  );
}
