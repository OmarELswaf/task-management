import type { Tables } from "@/types/database";
import type { Database } from "@/types/database";
import { CommentSection } from "@/components/comments/CommentSection";

type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskDetailModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
}

const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  backlog: { label: "Backlog", class: "bg-gray-100 text-gray-700 border-gray-200" },
  todo: { label: "Todo", class: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: {
    label: "In Progress",
    class: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  in_review: {
    label: "In Review",
    class: "bg-purple-100 text-purple-700 border-purple-200",
  },
  done: { label: "Done", class: "bg-green-100 text-green-700 border-green-200" },
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TaskDetailModal({
  open,
  task,
  onClose,
  onStatusChange,
}: TaskDetailModalProps) {
  if (!open || !task) return null;

  const statusInfo = statusConfig[task.status];

  const statusCycle: TaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "done",
  ];
  const currentIdx = statusCycle.indexOf(task.status);

  function canMoveTo(s: TaskStatus): boolean {
    const idx = statusCycle.indexOf(s);
    return Math.abs(idx - currentIdx) === 1;
  }

  async function handleStatusClick(s: TaskStatus) {
    if (!canMoveTo(s)) return;
    if (!task) return;
    await onStatusChange(task.id, s);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-50 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Created {formatDateTime(task.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.class}`}
          >
            {statusInfo.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          {task.due_date && (
            <span className="inline-flex items-center rounded-full border border-input bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Due {formatDate(task.due_date)}
            </span>
          )}
        </div>

        <div className="mb-6">
          <h4 className="mb-1 text-sm font-medium">Description</h4>
          <p className="text-sm text-muted-foreground">
            {task.description || "No description"}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">Quick Status Change</h4>
          <div className="flex flex-wrap gap-2">
            {statusCycle.map((s) => {
              const cfg = statusConfig[s];
              const isCurrent = s === task.status;
              const canMove = canMoveTo(s);
              return (
                <button
                  key={s}
                  onClick={() => handleStatusClick(s)}
                  disabled={!canMove || isCurrent}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    isCurrent
                      ? `${cfg.class} ring-2 ring-ring`
                      : canMove
                        ? `${cfg.class} cursor-pointer hover:opacity-80`
                        : "border-input bg-background text-muted-foreground cursor-not-allowed opacity-40"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-4">
          <CommentSection taskId={task.id} />
        </div>
      </div>
    </div>
  );
}
