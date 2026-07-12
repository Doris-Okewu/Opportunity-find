import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import HeroVisual from '../components/landing/HeroVisual';

const AUDIENCES = [
  'Students',
  'Graduates',
  'NYSC Members',
  'Job Seekers',
  'Tech Learners',
  'Career Switchers',
];

const STEPS = [
  {
    title: 'Tell us your goals',
    description:
      'A quick, multi-step onboarding captures your status, career interests, experience, and preferences.',
  },
  {
    title: 'Get matched instantly',
    description:
      'Our rule-based engine recommends the skills to learn next and surfaces opportunities that actually fit you.',
  },
  {
    title: 'Apply with confidence',
    description:
      'Every listing is verified with an official application link — no scams, no dead ends, no guesswork.',
  },
];

type AccentRole = 'brand' | 'journey' | 'milestone' | 'ai';

const ACCENT_CLASSES: Record<AccentRole, string> = {
  brand: 'bg-brand/10 text-brand',
  journey: 'bg-journey/10 text-journey',
  milestone: 'bg-milestone/10 text-milestone',
  ai: 'bg-ai/10 text-ai',
};

const FEATURES: Array<{ title: string; description: string; accent: AccentRole; icon: ReactNode }> = [
  {
    title: 'Verified opportunities',
    description: 'Every job, internship, scholarship, and program is reviewed before it goes live.',
    accent: 'brand',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 2 2 3.5-4" />
      </svg>
    ),
  },
  {
    title: 'Deadline tracking',
    description: 'Closing-soon badges and countdowns so you never miss an application window.',
    accent: 'journey',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2" />
      </svg>
    ),
  },
  {
    title: 'Personalized skill roadmap',
    description: 'Know exactly which skills to learn next for the career path you want.',
    accent: 'journey',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 18 9 8l4 6 3-5 4 9" />
      </svg>
    ),
  },
  {
    title: 'Curated learning resources',
    description: 'Free and paid resources hand-picked for each recommended skill.',
    accent: 'milestone',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H17a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5v-14Z" />
        <path strokeLinecap="round" d="M8 3v16" />
      </svg>
    ),
  },
  {
    title: 'AI-assisted preparation insight',
    description:
      'Optionally generate AI guidance on how to prepare for a specific opportunity — clearly labeled, and never a substitute for verifying the official details yourself.',
    accent: 'ai',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path
          strokeLinecap="round"
          d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"
        />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% -10%, color-mix(in oklab, var(--color-brand) 16%, transparent), transparent 60%), radial-gradient(circle at 90% 10%, color-mix(in oklab, var(--color-ai) 12%, transparent), transparent 55%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] dark:opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(var(--color-ink-3) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
          aria-hidden
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="animate-reveal w-full min-w-0 text-center lg:text-left">
            <p className="mb-4 inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Built for early-career Africa
            </p>
            <h1 className="mx-auto w-full max-w-xl text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:mx-0 lg:text-6xl">
              Discover opportunities that actually fit your career goals
            </h1>
            <p className="mx-auto mt-6 w-full max-w-xl text-lg text-ink-2 lg:mx-0">
              Not sure what's next? Opportunity Find helps students, graduates, NYSC members, and career
              switchers find verified jobs, internships, scholarships, and programs — and know exactly which
              skills to learn next.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to="/onboarding"
                className="w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand/90 active:scale-[0.97] sm:w-auto"
              >
                Find My Path
              </Link>
              <Link
                to="/opportunities"
                className="w-full rounded-lg border border-border-strong bg-surface px-6 py-3 text-sm font-semibold text-ink-2 transition hover:bg-surface-2 hover:text-ink active:scale-[0.97] sm:w-auto"
              >
                Browse Opportunities
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {AUDIENCES.map((audience) => (
                <span
                  key={audience}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-2"
                >
                  {audience}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-reveal" style={{ animationDelay: '120ms' }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-ink">How it works</h2>
          <p className="mt-2 text-ink-2">Three steps to your next opportunity.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-5 hidden h-0.5 w-full bg-border sm:block" aria-hidden="true" />
              )}
              <span className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              <Card className="mt-4">
                <h3 className="mb-2 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-2">{step.description}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-surface-2 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-ink">Why Opportunity Find</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT_CLASSES[feature.accent]}`}>
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-ink">{feature.title}</h3>
                <p className="text-sm text-ink-2">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 120%, color-mix(in oklab, var(--color-brand) 10%, transparent), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-sm font-medium text-journey">From uncertainty to a clear next step</p>
          <h2 className="text-3xl font-bold text-ink">Ready to find your path?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-2">
            It takes less than two minutes to get personalized recommendations.
          </p>
          <Link
            to="/onboarding"
            className="mt-8 inline-flex rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand/90 active:scale-[0.97]"
          >
            Get Started — It's Free
          </Link>
        </div>
      </section>
    </div>
  );
}
