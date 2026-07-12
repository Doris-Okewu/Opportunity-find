import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInAdmin, requestPasswordReset, useAdminSession } from '../../lib/auth/adminAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInAdmin(email, password);
      navigate('/admin');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSubmitting(true);
    try {
      await requestPasswordReset(email);
    } catch (err) {
      // Never reveal the real error to the end user (would leak whether the
      // address is registered) — but surface it in dev so failures like a
      // misconfigured redirect URL or SMTP outage aren't invisible.
      if (import.meta.env.DEV) {
        console.error('Password reset request failed:', err);
        setResetError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setResetSubmitting(false);
      setResetSent(true);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-ink">Admin Login</h1>
      <p className="mb-8 text-sm text-ink-2">Sign in to manage opportunities.</p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>

      <button
        type="button"
        onClick={() => {
          setShowForgotPassword((v) => !v);
          setResetSent(false);
          setResetError(null);
        }}
        className="mt-4 text-left text-sm text-brand hover:underline"
      >
        Forgot password?
      </button>

      {showForgotPassword && (
        <div className="mt-3 rounded-lg border border-border bg-surface p-4">
          {resetSent ? (
            <div>
              <p className="text-sm text-ink-2">
                If an account exists for that email, a password reset link has been sent. Check your inbox.
              </p>
              {import.meta.env.DEV && resetError && (
                <p className="mt-2 text-xs text-milestone">
                  Dev-only diagnostic (never shown in production): {resetError}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-3">
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {resetError && <p className="text-sm text-danger">{resetError}</p>}
              <Button type="submit" variant="secondary" disabled={resetSubmitting} className="w-full">
                {resetSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
