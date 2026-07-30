import type { Tables } from "@/types/database";
import type { Database } from "@/types/database";

type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  deleting: boolean;
  updatingStatus: boolean;
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

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: {
    label: "Medium",
    class: "bg-blue-100 text-blue-700 border-blue-200",
  },
  high: { label: "High", class: "bg-orange-100 text-orange-700 border-orange-200" },
  urgent: { label: "Urgent", class: "bg-red-100 text-red-700 border-red-200" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  deleting,
  updatingStatus,
}: TaskCardProps) {
  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];

  const statusCycle: TaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "done",
  ];
  const currentStatusIndex = statusCycle.indexOf(task.status);
  const nextStatus =
    currentStatusIndex < statusCycle.length - 1
      ? statusCycle[currentStatusIndex + 1]
      : undefined;

  async function handleNextStatus() {
    if (!nextStatus || updatingStatus) return;
    onStatusChange(task.id, nextStatus);
  }

  return (
    <div className="group rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <button
          onClick={() => onView(task)}
          className="flex-1 text-left"
        >
          <h4 className="font-medium leading-tight hover:text-primary">
            {task.title}
          </h4>
        </button>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityInfo.class}`}
          >
            {priorityInfo.label}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${statusInfo.class}`}
        >
          {statusInfo.label}
        </span>

        {task.due_date && (
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
              isOverdue(task.due_date) && task.status !== "done"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(task.due_date)}
          </span>
        )}

        {nextStatus && (
          <button
            onClick={handleNextStatus}
            disabled={updatingStatus}
            className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            title={`Move to ${statusConfig[nextStatus].label}`}
          >
            {updatingStatus ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            {statusConfig[nextStatus].label}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <span className="text-xs text-muted-foreground">
          {formatDate(task.created_at)}
        </span>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            disabled={deleting}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
