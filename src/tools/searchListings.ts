import listings from "@/data/mockListings.json";
import type { Property } from "@/types/index";

interface Intent {
  intent_type: string;
  property_keywords: string[];
  city: string | null;
  urgency: boolean;
  specific_date: string | null;
  pet: boolean;
  furnished: boolean | null;
  bedrooms: number | null;
}

const properties = listings as Property[];

export function searchListings(intent: Intent): Property | null {
  let matches = properties;

  if (intent.city !== null) {
    const city = intent.city.toLowerCase();
    matches = matches.filter((property) =>
      property.city.toLowerCase().includes(city),
    );
  }

  if (intent.pet) {
    matches = matches.filter((property) => property.pet_friendly);
  }

  if (intent.furnished !== null) {
    matches = matches.filter(
      (property) => property.furnished === intent.furnished,
    );
  }

  if (intent.bedrooms !== null) {
    matches = matches.filter(
      (property) => property.bedrooms === intent.bedrooms,
    );
  }

  return matches[0] ?? null;
}
