import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/opportunities', label: 'Browse' },
  { to: '/onboarding', label: 'Find My Path' },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `border-b-2 pb-1 text-sm font-medium transition-colors ${
    isActive
      ? 'border-brand text-brand'
      : 'border-transparent text-ink-2 hover:border-border-strong hover:text-ink'
  }`;
}

function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand/10 text-brand' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
  }`;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="flex min-w-0 items-center gap-2 text-lg font-bold text-ink">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-ai text-white">
            OF
          </span>
          <span className="truncate">Opportunity Find</span>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <NavLink
            to="/onboarding"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 active:scale-[0.97]"
          >
            Get Started
          </NavLink>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-ink-2 transition-colors hover:bg-surface-2 active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              {menuOpen ? (
                <path
                  fillRule="evenodd"
                  d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 1 0 1.06 1.06L10 11.06l4.72 4.72a.75.75 0 1 0 1.06-1.06L11.06 10l4.72-4.72a.75.75 0 0 0-1.06-1.06L10 8.94 5.28 4.22Z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75ZM2.75 14a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75Z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className={mobileNavLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
