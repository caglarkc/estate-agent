import type { WorkflowDef } from "@/agent/workflowTypes";

export const pricingWorkflow: WorkflowDef = {
  name: "pricing",
  steps: [
    {
      type: "tool",
      tool: "searchListings",
      inputs: [{ param: "intent", from: "intent" }],
      outputKey: "searchResult",
      traceLabel: "Property matched",
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
        "Customer message: {{message.text}}\n\nProperty data: {{searchResult.primary}}",
      outputKey: "draft",
      traceLabel: "Draft reply generated",
    },
  ],
};
