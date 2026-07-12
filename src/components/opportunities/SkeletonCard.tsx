export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border p-5">
      <div className="mb-3 h-4 w-20 rounded bg-border" />
      <div className="mb-2 h-5 w-3/4 rounded bg-border" />
      <div className="mb-4 h-4 w-1/2 rounded bg-border" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-border" />
        <div className="h-5 w-16 rounded-full bg-border" />
      </div>
    </div>
  );
}
