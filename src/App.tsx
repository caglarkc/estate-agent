import { approvalGate } from "@/agent/approvalGate";
import { runAgent } from "@/agent/agentController";
import { startProactiveEngine } from "@/agent/proactiveEngine";
import { AgentChat } from "@/components/AgentChat";
import { ApprovalButtons } from "@/components/ApprovalButtons";
import { InsightsPanel } from "@/components/InsightsPanel";
import { LeadScore } from "@/components/LeadScore";
import { MessagePanel } from "@/components/MessagePanel";
import { PropertyCard } from "@/components/PropertyCard";
import { TracePanel } from "@/components/TracePanel";
import { mockMessages } from "@/data/mockMessages";
import { callLLM } from "@/lib/llmClient";
import type { AgentState, CustomerMessage, TraceStep } from "@/types/index";
import { useEffect, useRef, useState } from "react";

const initialAgentState: AgentState = {
  status: "idle",
  draft: "",
  trace: [],
  leadScore: null,
  matchedProperty: null,
  followUpNote: null,
};

interface ProcessedMessage {
  sender: string;
  status: string;
  processedAt: number;
}

function App() {
  const [agentState, setAgentState] =
    useState<AgentState>(initialAgentState);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<CustomerMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [processedMessages, setProcessedMessages] = useState<
    ProcessedMessage[]
  >([]);
  const processedMessagesRef = useRef<ProcessedMessage[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    processedMessagesRef.current = processedMessages;
  }, [processedMessages]);

  useEffect(() => {
    return startProactiveEngine(
      () => processedMessagesRef.current,
      (insight) => {
        setInsights((prev) =>
          prev.includes(insight) ? prev : [...prev, insight],
        );
      },
    );
  }, []);

  const processMessage = async (message: CustomerMessage) => {
    setTrace([]);
    setAgentState(initialAgentState);
    setLoading(true);

    try {
      const nextState = await runAgent(message, (step) => {
        setTrace((prev) => [...prev, step]);
      });
      setAgentState(nextState);
      setProcessedMessages((prev) => [
        ...prev,
        {
          sender: message.sender,
          status: "pending",
          processedAt: Date.now(),
        },
      ]);
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
    try {
      const nextState = await approvalGate.approve(agentState, (note) => {
        setAgentState((state) => ({ ...state, followUpNote: note }));
      });
      setAgentState(nextState);
      if (selectedMessage) {
        setProcessedMessages((prev) =>
          prev.map((message) =>
            message.sender === selectedMessage.sender
              ? { ...message, status: "approved" }
              : message,
          ),
        );
      }
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
    }
  };

  const handleEdit = () => {
    setAgentState((state) => approvalGate.edit(state, state.draft));
    if (selectedMessage) {
      setProcessedMessages((prev) =>
        prev.map((message) =>
          message.sender === selectedMessage.sender
            ? { ...message, status: "edited" }
            : message,
        ),
      );
    }
  };

  const handleRegenerate = async () => {
    if (!selectedMessage) {
      return;
    }

    setAgentState((state) => approvalGate.regenerate(state));
    await processMessage(selectedMessage);
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);

    try {
      const result = await callLLM(
        "You are an estate agent manager. Summarize today's leads concisely.",
        `${JSON.stringify(
          processedMessages,
        )}\n\nGenerate 4 bullet point summary: messages processed, HOT leads, overdue follow-ups, recommended action.`,
      );
      setSummary(result);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setSummary(`Summary generation failed: ${detail}`);
    } finally {
      setSummaryLoading(false);
    }
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
        <InsightsPanel
          insights={insights}
          onGenerateSummary={handleGenerateSummary}
          summaryLoading={summaryLoading}
          summary={summary}
        />
      </aside>
    </main>
  );
}

export default App;
