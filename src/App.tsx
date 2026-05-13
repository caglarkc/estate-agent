import { approvalGate } from "@/agent/approvalGate";
import { runAgent } from "@/agent/agentController";
import { AgentChat } from "@/components/AgentChat";
import { ApprovalButtons } from "@/components/ApprovalButtons";
import { LeadScore } from "@/components/LeadScore";
import { MessagePanel } from "@/components/MessagePanel";
import { PropertyCard } from "@/components/PropertyCard";
import { TracePanel } from "@/components/TracePanel";
import { mockMessages } from "@/data/mockMessages";
import type { AgentState, CustomerMessage, TraceStep } from "@/types/index";
import { useState } from "react";

const initialAgentState: AgentState = {
  status: "idle",
  draft: "",
  trace: [],
  leadScore: null,
  matchedProperty: null,
  followUpNote: null,
};

function App() {
  const [agentState, setAgentState] =
    useState<AgentState>(initialAgentState);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<CustomerMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const processMessage = async (message: CustomerMessage) => {
    setTrace([]);
    setAgentState(initialAgentState);
    setLoading(true);

    try {
      const nextState = await runAgent(message, (step) => {
        setTrace((prev) => [...prev, step]);
      });
      setAgentState(nextState);
    } catch {
      setAgentState(initialAgentState);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: CustomerMessage) => {
    setSelectedMessage(message);
    await processMessage(message);
  };

  const handleDraftChange = (draft: string) => {
    setAgentState((state) => ({ ...state, draft }));
  };

  const handleApprove = async () => {
    setLoading(true);

    try {
      const nextState = await approvalGate.approve(agentState, (note) => {
        setAgentState((state) => ({ ...state, followUpNote: note }));
      });
      setAgentState(nextState);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setTrace((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          step: "Error",
          detail,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setAgentState((state) => approvalGate.edit(state, state.draft));
  };

  const handleRegenerate = async () => {
    if (!selectedMessage) {
      return;
    }

    setAgentState((state) => approvalGate.regenerate(state));
    await processMessage(selectedMessage);
  };

  return (
    <main className="flex h-screen bg-slate-900 text-slate-100">
      <aside className="h-screen w-1/4 overflow-y-auto border-r border-slate-800">
        <MessagePanel
          messages={mockMessages}
          selectedId={selectedMessage?.id ?? null}
          onSelect={handleSelectMessage}
          loading={loading}
        />
      </aside>

      <section className="flex h-screen w-2/4 flex-col border-r border-slate-800">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <AgentChat
            selectedMessage={selectedMessage}
            draft={agentState.draft}
            onDraftChange={handleDraftChange}
            loading={loading}
            status={agentState.status}
          />
          <div className="mt-4">
            <ApprovalButtons
              status={agentState.status}
              onApprove={handleApprove}
              onEdit={handleEdit}
              onRegenerate={handleRegenerate}
              followUpNote={agentState.followUpNote}
            />
          </div>
        </div>
        <div className="max-h-64 min-h-48 overflow-y-auto border-t border-slate-800 p-4">
          <TracePanel trace={trace} />
        </div>
      </section>

      <aside className="flex h-screen w-1/4 flex-col gap-4 overflow-y-auto p-4">
        <PropertyCard property={agentState.matchedProperty} />
        <LeadScore leadScore={agentState.leadScore} />
      </aside>
    </main>
  );
}

export default App;
