import type { ApprovalStatus } from "@/types/index";

interface ApprovalButtonsProps {
  status: ApprovalStatus;
  onApprove: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  followUpNote: string | null;
}

export function ApprovalButtons({
  status,
  onApprove,
  onEdit,
  onRegenerate,
  followUpNote,
}: ApprovalButtonsProps) {
  if (status === "pending") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-500"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded bg-slate-600 px-4 py-2 text-white transition hover:bg-slate-500"
        >
          Edit &amp; Send
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="rounded border border-amber-500 px-4 py-2 text-amber-400 transition hover:bg-amber-900"
        >
          Regenerate
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div>
        <p className="text-sm font-semibold text-green-400">
          ✓ Approved — CRM note created
        </p>
        {followUpNote ? (
          <div className="mt-3 rounded border border-slate-600 bg-slate-800 p-3 text-sm text-slate-300">
            {followUpNote}
          </div>
        ) : null}
      </div>
    );
  }

  if (status === "edited") {
    return (
      <p className="text-sm font-semibold text-amber-400">
        ✓ Sent with your edits
      </p>
    );
  }

  return null;
}
