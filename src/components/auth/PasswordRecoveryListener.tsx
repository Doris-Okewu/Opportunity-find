import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initialAuthUrl, supabase } from '../../lib/supabaseClient';
import { isEmailConfirmationLanding } from '../../lib/auth/authRedirect';

/**
 * Supabase's password-recovery email lands on the app's Site URL with the
 * recovery tokens in the URL hash, wherever that happens to be. supabase-js
 * consumes the hash on load and fires a PASSWORD_RECOVERY auth event rather
 * than routing anywhere itself, so this listens globally and forwards the
 * (now-authenticated) user to the dedicated reset-password page.
 */
export default function PasswordRecoveryListener() {
  const navigate = useNavigate();

  // If Supabase sent a signup-confirmation result to some other page (e.g.
  // the Site URL root because the redirect URL wasn't allow-listed), show
  // the confirmation page instead of silently landing on the home page.
  useEffect(() => {
    if (initialAuthUrl.pathname !== '/auth/confirm' && isEmailConfirmationLanding()) {
      navigate('/auth/confirm', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/admin/reset-password', { replace: true });
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [navigate]);

  return null;
}
