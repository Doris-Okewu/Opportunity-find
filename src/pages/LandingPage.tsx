import { Link } from 'react-router-dom';

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

const FEATURES = [
  {
    title: 'Verified opportunities',
    description: 'Every job, internship, scholarship, and program is reviewed before it goes live.',
  },
  {
    title: 'Deadline tracking',
    description: 'Closing-soon badges and countdowns so you never miss an application window.',
  },
  {
    title: 'Personalized skill roadmap',
    description: 'Know exactly which skills to learn next for the career path you want.',
  },
  {
    title: 'Curated learning resources',
    description: 'Free and paid resources hand-picked for each recommended skill.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,theme(colors.indigo.100),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.indigo.950),transparent_60%)]"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mb-4 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            Built for early-career Africa
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Discover opportunities that actually fit your career goals
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Opportunity Find helps students, graduates, NYSC members, and career switchers find
            verified jobs, internships, scholarships, and programs — and know exactly which
            skills to learn next.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/onboarding"
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:w-auto"
            >
              Find My Path
            </Link>
            <Link
              to="/opportunities"
              className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Browse Opportunities
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {AUDIENCES.map((audience) => (
              <span
                key={audience}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:text-slate-400"
              >
                {audience}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How it works</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Three steps to your next opportunity.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-xl border border-slate-200 p-6 dark:border-slate-800">
              <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why Opportunity Find</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
                <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ready to find your path?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          It takes less than two minutes to get personalized recommendations.
        </p>
        <Link
          to="/onboarding"
          className="mt-8 inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Get Started — It's Free
        </Link>
      </section>
    </div>
  );
}
