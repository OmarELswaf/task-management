import type { Database } from "@/types/database";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

export const STATUS_CYCLE: TaskStatus[] = ["Todo", "In Progress", "Done"];

export const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  Todo: { label: "Todo", class: "bg-blue-100 text-blue-700 border-blue-200" },
  "In Progress": {
    label: "In Progress",
    class: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  Done: { label: "Done", class: "bg-green-100 text-green-700 border-green-200" },
};

export const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  Low: { label: "Low", class: "bg-slate-100 text-slate-600 border-slate-200" },
  Medium: {
    label: "Medium",
    class: "bg-blue-100 text-blue-700 border-blue-200",
  },
  High: { label: "High", class: "bg-orange-100 text-orange-700 border-orange-200" },
};
