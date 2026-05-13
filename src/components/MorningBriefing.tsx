interface MorningBriefingProps {
  items: string[];
  loading: boolean;
  onDismiss: () => void;
}

export function MorningBriefing({
  items,
  loading,
  onDismiss,
}: MorningBriefingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <section className="w-full max-w-lg rounded border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-xl font-semibold text-slate-100">
          Good morning — Daily Briefing
        </h1>
        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span>Preparing your briefing...</span>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-slate-200">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 w-full rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          Start Day
        </button>
      </section>
    </div>
  );
}
