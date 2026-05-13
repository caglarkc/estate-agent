export interface Property {
  id: string;
  title: string;
  city: string;
  type: "flat" | "house";
  status: "available" | "let_agreed" | "viewing_only";
  price: string;
  viewing_slots: string[];
  deposit: string;
  council_tax_band: string;
  furnished: boolean;
  bedrooms: number;
  pet_friendly: boolean;
  inquiryCount: number;
  viewingCount: number;
}

export interface CustomerMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  lastContactDays: number;
  sentimentSignal: "positive" | "neutral" | "fading";
}

export interface LeadScore {
  score: "HOT" | "WARM" | "COLD";
  signals: string[];
}

export interface TraceStep {
  id: string;
  step: string;
  detail: string;
  timestamp: number;
}

export type ApprovalStatus =
  | "idle"
  | "pending"
  | "approved"
  | "edited"
  | "regenerated";

export interface AgentState {
  status: ApprovalStatus;
  draft: string;
  trace: TraceStep[];
  leadScore: LeadScore | null;
  matchedProperty: Property | null;
  followUpNote: string | null;
}
