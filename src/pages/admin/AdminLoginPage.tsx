import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInAdmin, useAdminSession } from '../../lib/auth/adminAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h1>
      <p className="mb-8 text-sm text-slate-600 dark:text-slate-400">Sign in to manage opportunities.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
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
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
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

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
