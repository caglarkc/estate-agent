import type { TraceStep } from "@/types/index";
import { useEffect, useState } from "react";

interface TracePanelProps {
  trace: TraceStep[];
}

function getTraceIcon(step: string): string {
  if (step.includes("Intent")) {
    return "🔍";
  }

  if (step.includes("Property")) {
    return "🏠";
  }

  if (step.includes("Availability")) {
    return "📅";
  }

  if (step.includes("Lead")) {
    return "🌡️";
  }

  if (step.includes("Draft")) {
    return "✏️";
  }

  if (step.includes("Self-review")) {
    return "🔄";
  }

  if (step.includes("Error")) {
    return "❌";
  }

  return "✅";
}

export function TracePanel({ trace }: TracePanelProps) {
  return (
    <div>
      <h2 className="text-sm uppercase tracking-wide text-slate-400">
        Agent Trace
      </h2>
      {trace.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Trace will appear here once a message is processed.
        </p>
      ) : (
        <div className="mt-3">
          {trace.map((step, index) => (
            <TraceRow
              key={step.id}
              step={step}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TraceRow({ step, index }: { step: TraceStep; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      style={{ transitionDelay: `${index * 150}ms` }}
      className={`border-b border-slate-700 py-1 text-xs text-slate-300 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="mr-2">{getTraceIcon(step.step)}</span>
      <span>{step.step}</span>
      <span className="px-1 text-slate-500">—</span>
      <span>{step.detail}</span>
    </div>
  );
}
