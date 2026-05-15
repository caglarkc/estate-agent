import type { WorkflowDef } from "@/agent/workflowTypes";
import { generalWorkflow } from "@/agent/workflows/general";
import { pricingWorkflow } from "@/agent/workflows/pricing";
import { statusWorkflow } from "@/agent/workflows/status";
import { viewingWorkflow } from "@/agent/workflows/viewing";

export function getWorkflow(intentType: string): WorkflowDef {
  switch (intentType) {
    case "viewing":
    case "availability":
      return viewingWorkflow;
    case "pricing":
      return pricingWorkflow;
    case "application_status":
      return statusWorkflow;
    case "general":
    default:
      return generalWorkflow;
  }
}
