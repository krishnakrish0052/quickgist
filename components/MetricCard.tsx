export function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
      <div className="text-2xl font-semibold text-[var(--ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--ink-muted)]">{label}</div>
    </div>
  );
}
