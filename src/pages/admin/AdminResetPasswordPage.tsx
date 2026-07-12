import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { updatePassword } from '../../lib/auth/adminAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const MIN_PASSWORD_LENGTH = 8;

type SessionStatus = 'checking' | 'ready' | 'invalid';

export default function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('checking');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // A password-recovery link authenticates the browser with a real Supabase
  // session. Depending on timing, either the PASSWORD_RECOVERY event fires
  // after this page mounts, or the session is already established (e.g. the
  // global listener already redirected here). Accept either signal; if
  // neither shows up, the link was invalid, expired, or already used.
  useEffect(() => {
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !cancelled) {
        setSessionStatus('ready');
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        setSessionStatus('ready');
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setSessionStatus((current) => (current === 'checking' ? 'invalid' : current));
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/admin/login', { replace: true }), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionStatus === 'checking') {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <p className="text-sm text-ink-2">Verifying your reset link...</p>
      </div>
    );
  }

  if (sessionStatus === 'invalid') {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold text-ink">Link expired</h1>
        <p className="mb-6 text-sm text-ink-2">
          This password reset link is invalid or has expired. Request a new one from the login page.
        </p>
        <Button onClick={() => navigate('/admin/login')} className="w-full">
          Back to login
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold text-ink">Password updated</h1>
        <p className="text-sm text-ink-2">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-ink">Set new password</h1>
      <p className="mb-8 text-sm text-ink-2">
        Choose a new password for your admin account.
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-ink">
              New password
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-ink-3 hover:text-ink"
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-3">At least {MIN_PASSWORD_LENGTH} characters.</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-ink">
              Confirm new password
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-ink-3 hover:text-ink"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
