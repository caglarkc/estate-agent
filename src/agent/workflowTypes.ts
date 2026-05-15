export interface ToolStep {
  type: "tool";
  tool: string;
  inputs: Array<{
    param: string;
    from: string;
  }>;
  outputKey: string;
  traceLabel?: string;
}

export interface LLMStep {
  type: "llm";
  promptFile: string;
  userTemplate: string;
  outputKey: string;
  parseJson?: boolean;
  traceLabel?: string;
}

export interface ConditionalStep {
  type: "conditional";
  condition: string;
  then: WorkflowStep[];
}

export interface MergeStep {
  type: "merge";
  reviewPath: string;
  primaryPath: string;
  fallbackPath: string;
  outputKey: string;
  traceLabel?: string;
}

export type WorkflowStep = ToolStep | LLMStep | ConditionalStep | MergeStep;

export interface WorkflowDef {
  name: string;
  steps: WorkflowStep[];
}
