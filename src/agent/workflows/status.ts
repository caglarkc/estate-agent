import type { WorkflowDef } from "@/agent/workflowTypes";

export const statusWorkflow: WorkflowDef = {
  name: "application_status",
  steps: [
    {
      type: "llm",
      promptFile: "draft-reply",
      userTemplate: "Customer message: {{message.text}}",
      outputKey: "draft",
      traceLabel: "Draft reply generated",
    },
  ],
};
