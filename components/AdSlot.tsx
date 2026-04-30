export function AdSlot({ label = "Ad placement" }: { label?: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-line bg-white/60 px-4 text-xs font-medium uppercase tracking-[0.14em] text-ink/45">
      {label}
    </div>
  );
}
