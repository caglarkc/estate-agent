import type { LeadScore as LeadScoreType } from "@/types/index";

interface LeadScoreProps {
  leadScore: LeadScoreType | null;
}

function getLeadClasses(score: LeadScoreType["score"]): string {
  if (score === "HOT") {
    return "border-red-500 bg-red-900";
  }

  if (score === "WARM") {
    return "border-amber-500 bg-amber-900";
  }

  return "border-slate-500 bg-slate-700";
}

function getLeadLabel(score: LeadScoreType["score"]): string {
  if (score === "HOT") {
    return "🔥 HOT LEAD";
  }

  if (score === "WARM") {
    return "⚡ WARM LEAD";
  }

  return "🧊 COLD LEAD";
}

function getLeadTextClass(score: LeadScoreType["score"]): string {
  if (score === "HOT") {
    return "text-red-400";
  }

  if (score === "WARM") {
    return "text-amber-400";
  }

  return "text-slate-300";
}

export function LeadScore({ leadScore }: LeadScoreProps) {
  if (!leadScore) {
    return null;
  }

  return (
    <section className={`rounded border p-4 ${getLeadClasses(leadScore.score)}`}>
      <h2 className={`font-bold ${getLeadTextClass(leadScore.score)}`}>
        {getLeadLabel(leadScore.score)}
      </h2>
      <div className="mt-3 space-y-1">
        {leadScore.signals.map((signal) => (
          <p key={signal} className="text-xs text-slate-300">
            • {signal}
          </p>
        ))}
      </div>
    </section>
  );
}
