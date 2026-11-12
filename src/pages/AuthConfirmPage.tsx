import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { readConfirmOutcome } from '../lib/auth/authRedirect';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';

/** Only allow same-site relative redirects. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/community';
}

/**
 * Landing page for the signup confirmation email (emailRedirectTo).
 * Explains the result and handles expired, already-used and invalid links.
 */
export default function AuthConfirmPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [outcome] = useState(readConfirmOutcome);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    // supabase-js finishes exchanging the link's tokens asynchronously.
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setSignedIn(Boolean(session));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (outcome.kind !== 'expired' && outcome.kind !== 'invalid' && signedIn === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-brand" />
      </div>
    );
  }

  const verified = outcome.kind === 'verified' || (outcome.kind === 'none' && signedIn);

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
      <Card className="space-y-4">
        {verified && (
          <>
            <h1 className="text-2xl font-bold text-ink">Email verified</h1>
            <p className="text-sm text-ink-2">
              Your email address has been confirmed. You can now return to Opportunity Find and sign in to join
              communities, post and comment.
            </p>
            {signedIn && <p className="text-sm text-ink-2">You're already signed in on this device.</p>}
            <div className="flex flex-wrap gap-3">
              {signedIn ? (
                <Link to={`/account?next=${encodeURIComponent(next)}`}>
                  <Button>Set up your community profile</Button>
                </Link>
              ) : (
                <Link to={`/account?next=${encodeURIComponent(next)}`}>
                  <Button>Sign in</Button>
                </Link>
              )}
              <Link to="/">
                <Button variant="secondary">Back to Opportunity Find</Button>
              </Link>
            </div>
          </>
        )}

        {outcome.kind === 'expired' && (
          <>
            <h1 className="text-2xl font-bold text-ink">This link has expired or was already used</h1>
            <p className="text-sm text-ink-2">
              Confirmation links can only be used once and expire after a while. If you already confirmed your email,
              just sign in. Otherwise, create your account again to receive a new confirmation email.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={`/account?next=${encodeURIComponent(next)}`}>
                <Button>Go to sign in</Button>
              </Link>
              <Link to="/">
                <Button variant="secondary">Back to Opportunity Find</Button>
              </Link>
            </div>
          </>
        )}

        {outcome.kind === 'invalid' && (
          <>
            <h1 className="text-2xl font-bold text-ink">We couldn't confirm your email</h1>
            <p className="text-sm text-ink-2">
              This confirmation link is invalid. Please make sure you opened the full link from the most recent email,
              or sign in if you've already confirmed.
            </p>
            <p className="text-xs text-ink-3">Details: {outcome.message}</p>
            <div className="flex flex-wrap gap-3">
              <Link to={`/account?next=${encodeURIComponent(next)}`}>
                <Button>Go to sign in</Button>
              </Link>
              <Link to="/">
                <Button variant="secondary">Back to Opportunity Find</Button>
              </Link>
            </div>
          </>
        )}

        {outcome.kind === 'none' && !signedIn && (
          <>
            <h1 className="text-2xl font-bold text-ink">Confirm your email</h1>
            <p className="text-sm text-ink-2">
              Open the confirmation link we emailed you. Once your email is confirmed, sign in to join the community.
            </p>
            <Link to={`/account?next=${encodeURIComponent(next)}`}>
              <Button>Go to sign in</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
