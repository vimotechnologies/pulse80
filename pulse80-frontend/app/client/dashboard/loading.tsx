export default function Loading() {
  return <div role="status" aria-label="Loading analytics" className="space-y-4"><div className="h-24 animate-pulse rounded-xl bg-card-border/50" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-card-border/50" />)}</div></div>;
}
