export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="mb-3 h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mb-2 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mb-4 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
