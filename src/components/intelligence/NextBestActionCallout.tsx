import { Link } from 'react-router-dom';
import Button from '../ui/Button';

export interface NextBestActionLink {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary';
}

export default function NextBestActionCallout({ action, links = [] }: { action: string; links?: NextBestActionLink[] }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand/5 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Next Best Action</p>
        <p className="whitespace-normal break-normal text-sm font-medium text-ink">{action}</p>
        {links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button variant={link.variant ?? 'primary'}>{link.label}</Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
