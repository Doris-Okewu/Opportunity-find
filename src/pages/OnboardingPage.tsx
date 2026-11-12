import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import ProgressBar from '../components/onboarding/ProgressBar';
import OptionButton from '../components/onboarding/OptionButton';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { CAREER_PATH_GROUPS } from '../features/careerEngine/careerPaths';
import { trackSiteEvent } from '../features/tracking/trackSiteEvent';
import { APPLICANT_STATUS_LABELS } from '../features/careerEngine/types';
import type { ApplicantStatus, OnboardingProfile, RemotePreference } from '../features/careerEngine/types';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../types/opportunity';
import type { OpportunityType, ExperienceLevel } from '../types/opportunity';

const TOTAL_STEPS = 5;

type Draft = Partial<OnboardingProfile>;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEdit = params.get('edit') === '1';
  const { profile, saveProfile } = useOnboardingProfile();
  const [step, setStep] = useState(1);
  // Editing starts from the saved preferences, never from empty defaults.
  const [draft, setDraft] = useState<Draft>(() =>
    isEdit && profile ? { ...profile } : { preferredTypes: [], remotePreference: 'any', location: '' },
  );

  const canGoNext =
    (step === 1 && !!draft.status) ||
    (step === 2 && !!draft.careerPath) ||
    (step === 3 && !!draft.experienceLevel) ||
    (step === 4 && (draft.preferredTypes?.length ?? 0) > 0) ||
    step === 5;

  function togglePreferredType(type: OpportunityType) {
    setDraft((prev) => {
      const current = prev.preferredTypes ?? [];
      const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
      return { ...prev, preferredTypes: next };
    });
  }

  function handleFinish() {
    const profile: OnboardingProfile = {
      status: draft.status!,
      careerPath: draft.careerPath!,
      experienceLevel: draft.experienceLevel!,
      preferredTypes: draft.preferredTypes!,
      remotePreference: draft.remotePreference ?? 'any',
      location: draft.location ?? '',
    };
    trackSiteEvent(isEdit ? 'preferences_updated' : 'onboarding_complete', {
      detail: `${profile.careerPath}:${profile.experienceLevel}`,
    });
    saveProfile(profile);
    navigate('/recommendations');
  }

  // Returning users who already completed onboarding go straight to their
  // matches; preferences are changed deliberately via ?edit=1.
  if (profile && !isEdit) return <Navigate to="/recommendations" replace />;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">{isEdit ? 'Edit your preferences' : 'Find My Path'}</h1>
        <p className="mt-1 text-ink-2">
          {isEdit
            ? 'Update your answers — your personalised recommendations will change to match.'
            : 'Answer a few quick questions to get personalized recommendations.'}
        </p>
      </div>

      <div className="mb-8">
        <ProgressBar step={step} totalSteps={TOTAL_STEPS} />
      </div>

      {step === 1 && (
        <fieldset className="space-y-3">
          <legend className="mb-3 text-lg font-semibold text-ink">
            Which best describes you?
          </legend>
          {(Object.entries(APPLICANT_STATUS_LABELS) as [ApplicantStatus, string][]).map(([value, label]) => (
            <OptionButton
              key={value}
              selected={draft.status === value}
              onClick={() => setDraft((prev) => ({ ...prev, status: value }))}
              title={label}
            />
          ))}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="space-y-3">
          <legend className="mb-3 text-lg font-semibold text-ink">
            Which career path interests you most?
          </legend>
          {CAREER_PATH_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">{group.label}</h3>
              {group.paths.map((path) => (
                <OptionButton
                  key={path.slug}
                  selected={draft.careerPath === path.slug}
                  onClick={() => setDraft((prev) => ({ ...prev, careerPath: path.slug }))}
                  title={path.label}
                  description={path.description}
                />
              ))}
            </div>
          ))}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="space-y-3">
          <legend className="mb-3 text-lg font-semibold text-ink">
            What's your experience level?
          </legend>
          {(Object.entries(EXPERIENCE_LEVEL_LABELS) as [ExperienceLevel, string][]).map(([value, label]) => (
            <OptionButton
              key={value}
              selected={draft.experienceLevel === value}
              onClick={() => setDraft((prev) => ({ ...prev, experienceLevel: value }))}
              title={label}
            />
          ))}
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="space-y-3">
          <legend className="mb-3 text-lg font-semibold text-ink">
            What types of opportunities are you looking for?{' '}
            <span className="font-normal text-ink-3">(select all that apply)</span>
          </legend>
          {(Object.entries(OPPORTUNITY_TYPE_LABELS) as [OpportunityType, string][]).map(([value, label]) => (
            <OptionButton
              key={value}
              selected={(draft.preferredTypes ?? []).includes(value)}
              onClick={() => togglePreferredType(value)}
              title={label}
            />
          ))}
        </fieldset>
      )}

      {step === 5 && (
        <fieldset className="space-y-6">
          <div>
            <legend className="mb-3 text-lg font-semibold text-ink">
              Do you prefer remote or on-site opportunities?
            </legend>
            <div className="space-y-3">
              {(
                [
                  ['any', 'No preference'],
                  ['remote', 'Remote only'],
                  ['onsite', 'On-site only'],
                ] as [RemotePreference, string][]
              ).map(([value, label]) => (
                <OptionButton
                  key={value}
                  selected={(draft.remotePreference ?? 'any') === value}
                  onClick={() => setDraft((prev) => ({ ...prev, remotePreference: value }))}
                  title={label}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="location" className="mb-2 block text-sm font-medium text-ink">
              Preferred location <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <Input
              id="location"
              placeholder="e.g. Lagos, Nigeria"
              value={draft.location ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
        </fieldset>
      )}

      <div className="mt-10 flex items-center justify-between">
        <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          Back
        </Button>

        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canGoNext}>
            Next
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={!canGoNext}>
            See My Recommendations
          </Button>
        )}
      </div>
    </div>
  );
}
