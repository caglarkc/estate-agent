import type { ApprovalStatus, CustomerMessage } from "@/types/index";

interface AgentChatProps {
  selectedMessage: CustomerMessage | null;
  draft: string;
  onDraftChange: (v: string) => void;
  loading: boolean;
  status: ApprovalStatus;
}

export function AgentChat({
  selectedMessage,
  draft,
  onDraftChange,
  loading,
  status,
}: AgentChatProps) {
  if (!selectedMessage) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm italic text-slate-400">
        Select a message from the left panel to begin.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-slate-300">
        <span className="animate-pulse">🤔 Analysing message...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 rounded bg-slate-800 p-3 text-sm text-slate-200">
        {selectedMessage.text}
      </div>
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        readOnly={status === "approved"}
        placeholder="AI draft will appear here..."
        className="h-40 w-full resize-none rounded border border-slate-600 bg-slate-800 p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 read-only:opacity-50"
      />
    </div>
  );
}
