export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand to-ai text-[10px] text-white">
            OF
          </span>
          <span className="truncate">Opportunity Find</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-sm text-ink-3 sm:items-end">
          <p>&copy; {new Date().getFullYear()} Opportunity Find. All rights reserved.</p>
          <p>Built for students, graduates, NYSC members, and career switchers.</p>
        </div>
      </div>
    </footer>
  );
}
