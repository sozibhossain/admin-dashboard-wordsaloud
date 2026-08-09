export function PageHeading({ title }: { title: string }) {
  return <div className="mb-5"><h1 className="text-2xl font-bold text-ink">{title}</h1><p className="mt-1 text-sm text-muted">Welcome back to your Dashboard</p></div>;
}
