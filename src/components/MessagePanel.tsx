import type { CustomerMessage } from "@/types/index";

interface MessagePanelProps {
  messages: CustomerMessage[];
  selectedId: string | null;
  onSelect: (msg: CustomerMessage) => void;
  loading: boolean;
}

export function MessagePanel({
  messages,
  selectedId,
  onSelect,
  loading,
}: MessagePanelProps) {
  return (
    <div className="p-3">
      <h2 className="px-3 pt-3 text-sm uppercase tracking-wide text-slate-400">
        Messages
      </h2>
      <div className="mt-4">
        {messages.map((message) => {
          const selected = message.id === selectedId;
          const preview =
            message.text.length > 60
              ? `${message.text.slice(0, 60)}...`
              : message.text;

          return (
            <button
              key={message.id}
              type="button"
              onClick={() => onSelect(message)}
              disabled={loading}
              className={`mb-2 w-full cursor-pointer rounded bg-slate-800 p-3 text-left transition hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50 ${
                selected ? "bg-slate-700 ring-2 ring-amber-500" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-100">
                  {message.sender}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {message.timestamp}
                </span>
              </div>
              <p className="mt-2 truncate text-sm text-slate-300">{preview}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
