import { initialAuthUrl } from '../supabaseClient';

export type ConfirmOutcome =
  | { kind: 'verified' }
  | { kind: 'expired' }
  | { kind: 'invalid'; message: string }
  | { kind: 'none' };

function params(): URLSearchParams {
  const merged = new URLSearchParams(initialAuthUrl.search);
  new URLSearchParams(initialAuthUrl.hash.replace(/^#/, '')).forEach((v, k) => merged.set(k, v));
  return merged;
}

/**
 * Interprets the URL Supabase redirected to after an email link was clicked.
 * Supabase sends errors as `error` / `error_code` / `error_description`
 * (expired and already-used links both arrive as `otp_expired`), and success
 * as `type=signup` with tokens (implicit flow) or `code` (PKCE flow).
 */
export function readConfirmOutcome(): ConfirmOutcome {
  const p = params();
  const errorCode = p.get('error_code');
  const error = p.get('error');
  if (errorCode || error) {
    if (errorCode === 'otp_expired' || /expired/i.test(p.get('error_description') ?? '')) return { kind: 'expired' };
    return { kind: 'invalid', message: p.get('error_description') ?? 'The confirmation link is invalid.' };
  }
  const type = p.get('type');
  if (type === 'signup' || type === 'email' || type === 'email_change' || p.has('code')) return { kind: 'verified' };
  return { kind: 'none' };
}

/** True when the app was opened from a signup-confirmation (or failed email) link. */
export function isEmailConfirmationLanding(): boolean {
  const p = params();
  const type = p.get('type');
  if (type === 'recovery') return false; // handled by PasswordRecoveryListener
  return type === 'signup' || type === 'email' || type === 'email_change' || p.has('error_code');
}
