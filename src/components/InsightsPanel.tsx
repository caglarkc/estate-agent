import { useState } from "react";

interface InsightsPanelProps {
  insights: string[];
  onGenerateSummary: () => Promise<void>;
  summaryLoading: boolean;
  summary: string | null;
}

export function InsightsPanel({
  insights,
  onGenerateSummary,
  summaryLoading,
  summary,
}: InsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded bg-slate-800 p-4">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm uppercase tracking-wide text-slate-400">
          Insights
        </span>
        <span className="flex items-center gap-2">
          {insights.length > 0 ? (
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          ) : null}
          <span className="text-xs text-slate-400">
            {isOpen ? "▲" : "▼"}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="mt-4">
          {insights.length === 0 ? (
            <p className="text-sm italic text-slate-400">
              No insights yet — process a message to begin.
            </p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <p key={insight} className="text-sm text-slate-300">
                  • {insight}
                </p>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void onGenerateSummary();
            }}
            disabled={summaryLoading}
            className="mt-4 rounded border border-amber-500 px-3 py-2 text-sm text-amber-400 transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate Summary
          </button>

          {summaryLoading ? (
            <p className="mt-3 text-sm text-slate-400">Generating...</p>
          ) : null}

          {summary ? (
            <div className="mt-3 rounded bg-slate-900 p-3 text-sm text-slate-300">
              {summary}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
