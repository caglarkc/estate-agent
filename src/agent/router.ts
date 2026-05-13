export type ToolPlan = {
  needsPropertySearch: boolean;
  needsAvailabilityCheck: boolean;
  needsLeadScoring: boolean;
  needsDraft: boolean;
  needsSelfCritique: boolean;
};

export type RouteType =
  | "full"
  | "pricing"
  | "status_update"
  | "general";

const PLANS: Record<RouteType, ToolPlan> = {
  full: {
    needsPropertySearch: true,
    needsAvailabilityCheck: true,
    needsLeadScoring: true,
    needsDraft: true,
    needsSelfCritique: true,
  },
  pricing: {
    needsPropertySearch: true,
    needsAvailabilityCheck: false,
    needsLeadScoring: true,
    needsDraft: true,
    needsSelfCritique: false,
  },
  status_update: {
    needsPropertySearch: false,
    needsAvailabilityCheck: false,
    needsLeadScoring: false,
    needsDraft: true,
    needsSelfCritique: false,
  },
  general: {
    needsPropertySearch: true,
    needsAvailabilityCheck: true,
    needsLeadScoring: true,
    needsDraft: true,
    needsSelfCritique: false,
  },
};

export function resolveRoute(intentType: string): RouteType {
  switch (intentType) {
    case "viewing":
    case "availability":
      return "full";
    case "pricing":
      return "pricing";
    case "application_status":
      return "status_update";
    default:
      return "general";
  }
}

export function getPlan(intentType: string): ToolPlan {
  return PLANS[resolveRoute(intentType)];
}
