import listings from "@/data/mockListings.json";
import type { Property } from "@/types/index";

const properties = listings as Property[];

export function checkAvailability(propertyId: string): {
  status: Property["status"];
  viewing_slots: string[];
  message: string;
} {
  const property = properties.find((listing) => listing.id === propertyId);

  if (!property) {
    return {
      status: "available",
      viewing_slots: [],
      message: "Property not found.",
    };
  }

  if (property.status === "let_agreed") {
    return {
      status: property.status,
      viewing_slots: property.viewing_slots,
      message: "This property is no longer available.",
    };
  }

  return {
    status: property.status,
    viewing_slots: property.viewing_slots,
    message: "Viewing slots are available.",
  };
}
