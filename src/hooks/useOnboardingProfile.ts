import { useCallback, useEffect, useState } from 'react';
import type { OnboardingProfile } from '../features/careerEngine/types';
import { APPLICANT_STATUS_LABELS } from '../features/careerEngine/types';
import { isCareerPathSlug } from '../features/careerEngine/careerPaths';
import { EXPERIENCE_LEVEL_ORDER, OPPORTUNITY_TYPE_LABELS } from '../types/opportunity';
import type { OpportunityType } from '../types/opportunity';

// Onboarding preferences persist in this browser's localStorage (no account
// needed). Returning visitors keep their career path and preferences until
// they deliberately edit them (/onboarding?edit=1) — reads never write, so a
// saved profile is never overwritten with empty defaults.
const STORAGE_KEY = 'opportunity-find-onboarding-profile';
const CHANGE_EVENT = 'opportunity-find-profile-change';

/** Returns a valid profile or null. Tolerates older/partial saved shapes. */
export function readStoredProfile(): OnboardingProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<OnboardingProfile> | null;
    if (!p || typeof p !== 'object') return null;
    if (!isCareerPathSlug(p.careerPath)) return null;
    if (!p.experienceLevel || !EXPERIENCE_LEVEL_ORDER.includes(p.experienceLevel)) return null;
    const preferredTypes = Array.isArray(p.preferredTypes)
      ? p.preferredTypes.filter((t): t is OpportunityType => typeof t === 'string' && t in OPPORTUNITY_TYPE_LABELS)
      : [];
    return {
      status: p.status && p.status in APPLICANT_STATUS_LABELS ? p.status : 'tech_learner',
      careerPath: p.careerPath,
      experienceLevel: p.experienceLevel,
      preferredTypes,
      remotePreference: p.remotePreference === 'remote' || p.remotePreference === 'onsite' ? p.remotePreference : 'any',
      location: typeof p.location === 'string' ? p.location : '',
    };
  } catch {
    return null;
  }
}

export function useOnboardingProfile() {
  const [profile, setProfileState] = useState<OnboardingProfile | null>(readStoredProfile);

  // Keep every component (header, pages) and other tabs in sync.
  useEffect(() => {
    const sync = () => setProfileState(readStoredProfile());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const saveProfile = useCallback((next: OnboardingProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: still use it for this page session.
    }
    setProfileState(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const clearProfile = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setProfileState(null);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { profile, saveProfile, clearProfile };
}
