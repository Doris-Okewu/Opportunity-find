import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="text-ink-2">The page you're looking for doesn't exist or may have moved.</p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 active:scale-[0.97]"
      >
        Back to home
      </Link>
    </div>
  );
}
