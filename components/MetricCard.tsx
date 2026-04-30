export function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-sm text-ink/60">{label}</div>
    </div>
  );
}
