import type { WorkflowDef } from "@/agent/workflowTypes";

export const generalWorkflow: WorkflowDef = {
  name: "general",
  steps: [
    {
      type: "tool",
      tool: "searchListings",
      inputs: [{ param: "intent", from: "intent" }],
      outputKey: "searchResult",
      traceLabel: "Property matched",
    },
    {
      type: "conditional",
      condition: "searchResult.primary",
      then: [
        {
          type: "tool",
          tool: "checkAvailability",
          inputs: [{ param: "propertyId", from: "searchResult.primary.id" }],
          outputKey: "availability",
          traceLabel: "Availability checked",
        },
      ],
    },
    {
      type: "tool",
      tool: "scoreLead",
      inputs: [
        { param: "intent", from: "intent" },
        { param: "messageText", from: "message.text" },
      ],
      outputKey: "leadScore",
      traceLabel: "Lead scored",
    },
    {
      type: "llm",
      promptFile: "draft-reply",
      userTemplate:
        "Customer message: {{message.text}}\n\nProperty data: {{searchResult.primary}}\n\nAvailability: {{availability}}",
      outputKey: "draft",
      traceLabel: "Draft reply generated",
    },
  ],
};
