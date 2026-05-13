import { getTool } from "@/agent/toolRegistry";
import type { AgentState } from "@/types/index";

export interface ApprovalGate {
  approve: (
    state: AgentState,
    onFollowUp: (note: string) => void,
  ) => Promise<AgentState>;
  edit: (state: AgentState, editedDraft: string) => AgentState;
  regenerate: (state: AgentState) => AgentState;
}

async function approve(
  state: AgentState,
  onFollowUp: (note: string) => void,
): Promise<AgentState> {
  if (state.leadScore === null) {
    throw new Error("Cannot approve without a lead score.");
  }

  const createFollowUp = getTool("createFollowUp");
  const followUpNote = await createFollowUp(
    state.draft,
    state.draft,
    state.leadScore,
  );

  onFollowUp(followUpNote);

  return {
    ...state,
    status: "approved",
    followUpNote,
  };
}

function edit(state: AgentState, editedDraft: string): AgentState {
  return {
    ...state,
    status: "edited",
    draft: editedDraft,
  };
}

function regenerate(state: AgentState): AgentState {
  return {
    ...state,
    status: "regenerated",
    draft: "",
    trace: [],
  };
}

export const approvalGate: ApprovalGate = {
  approve,
  edit,
  regenerate,
};
