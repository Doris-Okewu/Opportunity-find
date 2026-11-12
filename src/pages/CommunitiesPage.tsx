import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCommunities, joinCommunity, leaveCommunity } from '../lib/queries/community';
import type { CommunitySummary } from '../lib/queries/community';
import { useCommunityAccount } from '../hooks/useCommunityAccount';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/opportunities/ErrorState';
import EmptyState from '../components/opportunities/EmptyState';
import { FormError, SignInLink } from '../components/community/communityUi';

export default function CommunitiesPage() {
  const account = useCommunityAccount();
  const { profile: onboarding } = useOnboardingProfile();
  const [communities, setCommunities] = useState<CommunitySummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCommunities(await listCommunities());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communities.');
    }
  }, []);

  // Reload when the signed-in user changes so is_member is accurate.
  useEffect(() => {
    if (!account.loading) load();
  }, [load, account.loading, account.userId]);

  async function toggleMembership(c: CommunitySummary) {
    if (!account.userId) return;
    setBusyId(c.id);
    setActionError(null);
    try {
      if (c.is_member) await leaveCommunity(c.id, account.userId);
      else await joinCommunity(c.id, account.userId);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update membership.');
    } finally {
      setBusyId(null);
    }
  }

  const suggested = onboarding?.careerPath;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Communities</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Field communities for sharing questions, resources and experiences. Anyone can read; members can post.
      </p>
      {!account.loading && !account.session && (
        <p className="mt-3 text-sm text-ink-2">
          <SignInLink>Sign in or create an account</SignInLink> to join a community.
        </p>
      )}
      {account.session && !account.profile && !account.loading && (
        <p className="mt-3 text-sm text-ink-2">
          <Link to="/account?next=/community" className="font-medium text-brand">Choose a display name</Link> to start
          posting.
        </p>
      )}

      <div className="mt-4">
        <FormError message={actionError} />
      </div>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={load} /></div>}

      {!error && communities === null && (
        <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-brand" /></div>
      )}

      {!error && communities?.length === 0 && (
        <div className="mt-6"><EmptyState title="No communities yet" description="Communities will appear here once an admin sets them up." /></div>
      )}

      {!error && communities && communities.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <li key={c.id} className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/community/${c.slug}`} className="text-lg font-semibold text-ink hover:text-brand">{c.name}</Link>
                {suggested && c.career_slug === suggested && <Badge tone="violet">Your path</Badge>}
                {c.is_member && <Badge tone="green">Joined</Badge>}
              </div>
              <p className="mt-1 flex-1 text-sm text-ink-2">{c.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-ink-3">
                  {c.member_count} {c.member_count === 1 ? 'member' : 'members'} · {c.post_count}{' '}
                  {c.post_count === 1 ? 'post' : 'posts'}
                </p>
                {account.session && (
                  <Button
                    variant={c.is_member ? 'secondary' : 'primary'}
                    disabled={busyId === c.id}
                    onClick={() => toggleMembership(c)}
                  >
                    {busyId === c.id ? '…' : c.is_member ? 'Leave' : 'Join'}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
