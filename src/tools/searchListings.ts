import listings from "@/data/mockListings.json";
import type { Property, SearchResult } from "@/types/index";

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

function matchesKeywords(property: Property, keywords: string[]): boolean {
  if (keywords.length === 0) {
    return true;
  }

  const normalizedKeywords = keywords
    .flatMap((keyword) => keyword.toLowerCase().split(/\s+/))
    .map((keyword) => keyword.replace(/[^a-z0-9]/g, ""))
    .filter((keyword) => keyword.length > 2);

  if (normalizedKeywords.length === 0) {
    return true;
  }

  const searchable = [
    property.title,
    property.city,
    property.type,
    property.bedrooms.toString(),
  ]
    .join(" ")
    .toLowerCase();

  return normalizedKeywords.some((keyword) => searchable.includes(keyword));
}

function hasSharedCity(property: Property, primary: Property): boolean {
  return property.city.toLowerCase() === primary.city.toLowerCase();
}

function hasSharedType(property: Property, primary: Property): boolean {
  return property.type === primary.type;
}

export function searchListings(intent: Intent): SearchResult {
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

  matches = matches.filter((property) =>
    matchesKeywords(property, intent.property_keywords),
  );

  const primary = matches[0] ?? null;

  if (!primary) {
    return {
      primary: null,
      alternatives: [],
    };
  }

  const alternatives = properties
    .filter((property) => property.id !== primary.id)
    .filter((property) => property.status === "available")
    .filter(
      (property) => hasSharedCity(property, primary) || hasSharedType(property, primary),
    )
    .slice(0, 3);

  return {
    primary,
    alternatives,
  };
}
