import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { saveDisplayName } from '../lib/queries/community';
import { useCommunityAccount } from '../hooks/useCommunityAccount';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { FormError } from '../components/community/communityUi';
import { trackSiteEvent } from '../features/tracking/trackSiteEvent';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { getCareerPath } from '../features/careerEngine/careerPaths';
import { EXPERIENCE_LEVEL_LABELS } from '../types/opportunity';

/** Career preferences are stored in this browser and editable at any time. */
function PreferencesCard() {
  const { profile } = useOnboardingProfile();
  return (
    <Card className="mt-6 space-y-3">
      <h2 className="text-lg font-semibold text-ink">Career preferences</h2>
      {profile ? (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-3">Career path</dt>
            <dd className="text-ink">{getCareerPath(profile.careerPath)?.label ?? profile.careerPath}</dd>
            <dt className="text-ink-3">Experience</dt>
            <dd className="text-ink">{EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]}</dd>
          </dl>
          <p className="text-xs text-ink-3">Saved on this device. Changing them updates your personalised recommendations.</p>
          <Link to="/onboarding?edit=1">
            <Button variant="secondary">Edit preferences</Button>
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-2">You haven't set your career path yet.</p>
          <Link to="/onboarding">
            <Button variant="secondary">Find my path</Button>
          </Link>
        </>
      )}
    </Card>
  );
}

const MIN_PASSWORD_LENGTH = 8;

/** Only allow same-site relative redirects. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/community';
}

function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error('Invalid email or password, or your email is not confirmed yet.');
        trackSiteEvent('sign_in');
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
        });
        if (err) throw new Error(err.message);
        if (!data.session) {
          setInfo('Check your email for a confirmation link, then come back and sign in.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Account">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === m ? 'bg-brand/10 text-brand' : 'text-ink-2 hover:bg-surface-2'}`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="account-email" className="mb-1 block text-sm font-medium text-ink-2">Email</label>
          <Input id="account-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="account-password" className="mb-1 block text-sm font-medium text-ink-2">Password</label>
          <Input
            id="account-password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <FormError message={error} />
        {info && <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{info}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-xs text-ink-3">
        Your email is never shown publicly. Other members only see the display name you choose.
      </p>
    </Card>
  );
}

function DisplayNameForm({
  userId,
  current,
  onSaved,
}: {
  userId: string;
  current: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(current ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      setError('Display name must be 2–40 characters.');
      return;
    }
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await saveDisplayName(userId, trimmed, current !== null);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="display-name" className="block text-sm font-medium text-ink-2">
        Display name (shown on your posts and comments)
      </label>
      <Input id="display-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
      <FormError message={error} />
      {saved && <p role="status" className="text-sm text-success">Saved.</p>}
      <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : current ? 'Update name' : 'Save and continue'}</Button>
    </form>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const { session, userId, profile, loading, profileError, refresh } = useCommunityAccount();
  const [justCreatedProfile, setJustCreatedProfile] = useState(false);

  // After first-time profile setup, send the user back where they came from.
  useEffect(() => {
    if (justCreatedProfile && profile) navigate(next, { replace: true });
  }, [justCreatedProfile, profile, next, navigate]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-ink">Community account</h1>

      {!session || !userId ? (
        <>
          <p className="mb-6 text-sm text-ink-2">Sign in to join field communities, post and comment. Browsing is open to everyone.</p>
          <AuthForm next={next} />
        </>
      ) : (
        <Card className="space-y-6">
          <p className="text-sm text-ink-2">
            Signed in as <span className="font-medium text-ink">{session.user.email}</span> (private).
          </p>
          {profileError && <FormError message={profileError} />}
          {!profileError && (
            <DisplayNameForm
              userId={userId}
              current={profile?.display_name ?? null}
              onSaved={() => {
                if (!profile) setJustCreatedProfile(true);
                refresh();
              }}
            />
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            {profile && (
              <Link to={next} className="text-sm font-medium text-brand">Continue to community &rarr;</Link>
            )}
            <Button variant="secondary" onClick={() => supabase.auth.signOut()}>Sign out</Button>
          </div>
        </Card>
      )}
      <PreferencesCard />
    </div>
  );
}
