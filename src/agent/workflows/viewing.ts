import type { WorkflowDef } from "@/agent/workflowTypes";

export const viewingWorkflow: WorkflowDef = {
  name: "viewing",
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
      outputKey: "rawDraft",
      traceLabel: "Draft reply generated",
    },
    {
      type: "llm",
      promptFile: "self-critique",
      userTemplate:
        "Customer message: {{message.text}}\n\nProperty data: {{searchResult.primary}}\n\nDraft reply: {{rawDraft}}\n\nReturn ONLY valid JSON: { \"approved\": boolean, \"issues\": string[], \"improved_draft\": string }",
      outputKey: "selfReview",
      parseJson: true,
      traceLabel: "Self-review",
    },
    {
      type: "merge",
      reviewPath: "selfReview",
      primaryPath: "rawDraft",
      fallbackPath: "selfReview.improved_draft",
      outputKey: "draft",
      traceLabel: "Final draft selected",
    },
  ],
};
