import type {
  ConditionalStep,
  LLMStep,
  MergeStep,
  ToolStep,
  WorkflowDef,
  WorkflowStep,
} from "@/agent/workflowTypes";
import { getTool } from "@/agent/toolRegistry";
import type { ToolName } from "@/agent/toolRegistry";
import { callLLM } from "@/lib/llmClient";
import type { CustomerMessage, TraceStep } from "@/types/index";

export type RunnerContext = Record<string, unknown>;

export interface InitialRunnerContext extends RunnerContext {
  message: CustomerMessage;
}

const prompts = import.meta.glob("@/prompts/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

export function resolvePath(ctx: RunnerContext, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, ctx);
}

export function resolveTemplate(
  ctx: RunnerContext,
  template: string,
): string {
  return template.replace(/{{\s*([^}]+?)\s*}}/g, (_match, path: string) => {
    const value = resolvePath(ctx, path.trim());

    if (typeof value === "undefined") {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

function loadPrompt(promptFile: string): string {
  const key = `/src/prompts/${promptFile}.md`;
  const content = prompts[key];
  if (typeof content !== "string") {
    throw new Error(`Prompt file not found: ${promptFile}.md`);
  }
  return content;
}

function createTraceStep(step: string, detail: string): TraceStep {
  return { id: crypto.randomUUID(), step, detail, timestamp: Date.now() };
}

function stringifyTraceDetail(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "undefined") {
    return "";
  }

  return JSON.stringify(value);
}

async function executeToolStep(
  step: ToolStep,
  ctx: RunnerContext,
  onTrace: (step: TraceStep) => void,
): Promise<void> {
  const tool = getTool(step.tool as ToolName);
  const args = step.inputs.map(({ from }) => resolvePath(ctx, from));
  const result = await (tool as (...args: unknown[]) => unknown)(...args);
  ctx[step.outputKey] = result;

  if (step.traceLabel) {
    onTrace(createTraceStep(step.traceLabel, stringifyTraceDetail(result)));
  }
}

async function executeLLMStep(
  step: LLMStep,
  ctx: RunnerContext,
  onTrace: (step: TraceStep) => void,
): Promise<void> {
  const system = loadPrompt(step.promptFile);
  const user = resolveTemplate(ctx, step.userTemplate);
  const text = await callLLM(system, user);
  let result: unknown = text;

  if (step.parseJson === true) {
    try {
      result = JSON.parse(text) as unknown;
    } catch {
      result = text;
    }
  }

  ctx[step.outputKey] = result;

  if (step.traceLabel) {
    onTrace(createTraceStep(step.traceLabel, stringifyTraceDetail(result)));
  }
}

async function executeConditionalStep(
  step: ConditionalStep,
  ctx: RunnerContext,
  onTrace: (step: TraceStep) => void,
): Promise<void> {
  if (resolvePath(ctx, step.condition)) {
    for (const nextStep of step.then) {
      await executeStep(nextStep, ctx, onTrace);
    }
  }
}

function executeMergeStep(
  step: MergeStep,
  ctx: RunnerContext,
  onTrace: (step: TraceStep) => void,
): void {
  const reviewResult = resolvePath(ctx, step.reviewPath) as
    | { approved?: unknown }
    | undefined;
  const output =
    reviewResult?.approved === true
      ? resolvePath(ctx, step.primaryPath)
      : resolvePath(ctx, step.fallbackPath);
  ctx[step.outputKey] = output;

  if (step.traceLabel) {
    onTrace(createTraceStep(step.traceLabel, stringifyTraceDetail(output)));
  }
}

export async function executeStep(
  step: WorkflowStep,
  ctx: RunnerContext,
  onTrace: (step: TraceStep) => void,
): Promise<void> {
  if (step.type === "tool") {
    await executeToolStep(step, ctx, onTrace);
    return;
  }

  if (step.type === "llm") {
    await executeLLMStep(step, ctx, onTrace);
    return;
  }

  if (step.type === "conditional") {
    await executeConditionalStep(step, ctx, onTrace);
    return;
  }

  executeMergeStep(step, ctx, onTrace);
}

export async function runWorkflow(
  workflow: WorkflowDef,
  initialCtx: RunnerContext,
  onTrace: (step: TraceStep) => void,
): Promise<RunnerContext> {
  const ctx: RunnerContext = { ...initialCtx };
  for (const step of workflow.steps) {
    await executeStep(step, ctx, onTrace);
  }
  return ctx;
}
