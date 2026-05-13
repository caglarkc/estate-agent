import mockListings from "@/data/mockListings.json";
import type { Property } from "@/types/index";
import { useState } from "react";

interface InsightsPanelProps {
  insights: string[];
  onGenerateSummary: () => Promise<void>;
  summaryLoading: boolean;
  summary: string | null;
}

const listings = mockListings as Property[];

function getUnhealthyListings(): Property[] {
  return listings.filter((listing) => {
    if (listing.inquiryCount <= 3) {
      return false;
    }

    if (listing.viewingCount === 0) {
      return true;
    }

    return listing.viewingCount / listing.inquiryCount < 0.3;
  });
}

export function InsightsPanel({
  insights,
  onGenerateSummary,
  summaryLoading,
  summary,
}: InsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const unhealthyListings = getUnhealthyListings();

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

          <div className="mt-5 border-t border-slate-700 pt-4">
            <h3 className="text-xs uppercase tracking-wide text-slate-400">
              Listing Health
            </h3>
            {unhealthyListings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                All listings healthy
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {unhealthyListings.map((listing) => (
                  <article
                    key={listing.id}
                    className="rounded border border-slate-700 bg-slate-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">
                          {listing.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-400">
                          {listing.city}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-red-950 px-2 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-700">
                        Low conversion
                      </span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-slate-300">
                      <span>Inquiries: {listing.inquiryCount}</span>
                      <span>Viewings: {listing.viewingCount}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
