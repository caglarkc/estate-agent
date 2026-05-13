import type { Property } from "@/types/index";

interface AlternativesPanelProps {
  alternatives: Property[];
}

function getStatusLabel(status: Property["status"]): string {
  if (status === "available") {
    return "Available";
  }

  if (status === "let_agreed") {
    return "Let Agreed";
  }

  return "Viewing Only";
}

export function AlternativesPanel({ alternatives }: AlternativesPanelProps) {
  const availableAlternatives = alternatives
    .filter((property) => property.status === "available")
    .slice(0, 3);

  if (availableAlternatives.length === 0) {
    return null;
  }

  return (
    <section className="mt-4">
      <h2 className="text-xs uppercase tracking-wide text-slate-400">
        Also consider
      </h2>
      <div className="mt-2 grid gap-2">
        {availableAlternatives.map((property) => (
          <article
            key={property.id}
            className="rounded border border-slate-700 bg-slate-800 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {property.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{property.city}</p>
              </div>
              <span className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                {getStatusLabel(property.status)}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-amber-400">
              {property.price}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
