export function PageHeading({ title, subtitle = "Manage platform operations and activity." }: { title: string; subtitle?: string }) {
  return <div className="mb-5"><h1 className="text-2xl font-bold text-ink">{title}</h1><p className="mt-1 text-sm text-muted">{subtitle}</p></div>;
}
