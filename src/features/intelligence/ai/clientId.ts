// A random, non-PII identifier used ONLY for basic request throttling on
// the ai-opportunity-insight Edge Function. It is not an account, not tied
// to any identity, and is never sent to Gemini — only included in the
// request body as `clientRequestId` for the function's rate-limit checks.
// Deliberately stored under its own localStorage key, isolated from the
// onboarding profile (see hooks/useOnboardingProfile.ts), so clearing one
// never affects the other.
const CLIENT_ID_STORAGE_KEY = 'opportunity-find-ai-client-id';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older browsers).
  // Not cryptographically strong, but this value is not a secret — it only
  // needs to be unique enough for coarse request-throttling purposes.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAIClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing) return existing;

    const generated = generateUuid();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    // localStorage unavailable (e.g. private browsing edge cases) — fall
    // back to a per-call id rather than failing the feature.
    return generateUuid();
  }
}
