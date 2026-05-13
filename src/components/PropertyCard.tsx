import type { Property } from "@/types/index";

interface PropertyCardProps {
  property: Property | null;
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

function getStatusClass(status: Property["status"]): string {
  if (status === "available") {
    return "bg-green-500 text-white";
  }

  if (status === "let_agreed") {
    return "bg-red-500 text-white";
  }

  return "bg-amber-500 text-slate-950";
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <section className="rounded bg-slate-800 p-4">
      <h2 className="text-sm uppercase tracking-wide text-slate-400">
        Property
      </h2>
      {!property ? (
        <p className="mt-4 text-sm italic text-slate-400">
          No matching property found.
        </p>
      ) : (
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {property.title}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{property.city}</p>
            </div>
            <span
              className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${getStatusClass(
                property.status,
              )}`}
            >
              {getStatusLabel(property.status)}
            </span>
          </div>

          <p className="mt-4 text-xl font-bold text-amber-400">
            {property.price}
          </p>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>Bedrooms: {property.bedrooms}</p>
            <p>Furnished: {property.furnished ? "✓" : "✗"}</p>
            <p>Pet Friendly: {property.pet_friendly ? "✓" : "✗"}</p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-300">
              Viewing slots
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {property.viewing_slots.map((slot) => (
                <span
                  key={slot}
                  className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200"
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
