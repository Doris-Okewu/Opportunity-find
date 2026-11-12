import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getOwnProfile } from '../lib/queries/community';
import type { Profile } from '../lib/queries/community';

// Reuses the existing Supabase Auth session (the same one admin sign-in
// uses). A community account is just a Supabase user plus a `profiles` row
// holding a public display name.

export interface CommunityAccount {
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  profileError: string | null;
  refresh: () => void;
}

export function useCommunityAccount(): CommunityAccount {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function resolve(next: Session | null) {
      if (!next) {
        if (!cancelled) {
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
          setProfileError(null);
          setLoading(false);
        }
        return;
      }
      try {
        const [p, adminRes] = await Promise.all([
          getOwnProfile(next.user.id),
          supabase.from('admins').select('user_id').eq('user_id', next.user.id).maybeSingle(),
        ]);
        if (!cancelled) {
          setSession(next);
          setProfile(p);
          setIsAdmin(Boolean(adminRes.data));
          setProfileError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSession(next);
          setProfile(null);
          setProfileError(err instanceof Error ? err.message : 'Failed to load your profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Defer: supabase-js warns against awaiting other calls inside this callback.
      setTimeout(() => resolve(next), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [token]);

  const refresh = useCallback(() => setToken((t) => t + 1), []);

  return { session, userId: session?.user.id ?? null, profile, isAdmin, loading, profileError, refresh };
}
