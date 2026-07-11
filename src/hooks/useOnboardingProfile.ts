import { useCallback, useState } from 'react';
import type { OnboardingProfile } from '../features/careerEngine/types';

const STORAGE_KEY = 'opportunity-find-onboarding-profile';

export function readStoredProfile(): OnboardingProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingProfile) : null;
  } catch {
    return null;
  }
}

export function useOnboardingProfile() {
  const [profile, setProfileState] = useState<OnboardingProfile | null>(readStoredProfile);

  const saveProfile = useCallback((next: OnboardingProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfileState(next);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfileState(null);
  }, []);

  return { profile, saveProfile, clearProfile };
}
