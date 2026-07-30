import { useState, useEffect, useRef } from "react";
import type { Database } from "@/types/database";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

export interface TaskFilterValues {
  search: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  dueDateFrom: string;
  dueDateTo: string;
}

interface TaskFiltersProps {
  values: TaskFilterValues;
  onChange: (values: TaskFilterValues) => void;
}

const statusOptions: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TaskFilters({ values, onChange }: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(values.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSearchInput(values.search);
  }, [values.search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange({ ...values, search: value });
    }, 300);
  }

  function handleStatusChange(status: TaskStatus | "") {
    onChange({ ...values, status });
  }

  function handlePriorityChange(priority: TaskPriority | "") {
    onChange({ ...values, priority });
  }

  function handleDueDateFromChange(date: string) {
    onChange({ ...values, dueDateFrom: date });
  }

  function handleDueDateToChange(date: string) {
    onChange({ ...values, dueDateTo: date });
  }

  function handleClear() {
    setSearchInput("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onChange({
      search: "",
      status: "",
      priority: "",
      dueDateFrom: "",
      dueDateTo: "",
    });
  }

  const hasActiveFilters =
    searchInput !== "" ||
    values.status !== "" ||
    values.priority !== "" ||
    values.dueDateFrom !== "" ||
    values.dueDateTo !== "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="task-search" className="mb-1 block text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            id="task-search"
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="filter-status"
            value={values.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus | "")}
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-priority" className="mb-1 block text-xs font-medium text-muted-foreground">
            Priority
          </label>
          <select
            id="filter-priority"
            value={values.priority}
            onChange={(e) => handlePriorityChange(e.target.value as TaskPriority | "")}
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-due-from" className="mb-1 block text-xs font-medium text-muted-foreground">
            Due From
          </label>
          <input
            id="filter-due-from"
            type="date"
            value={values.dueDateFrom}
            onChange={(e) => handleDueDateFromChange(e.target.value)}
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="filter-due-to" className="mb-1 block text-xs font-medium text-muted-foreground">
            Due To
          </label>
          <input
            id="filter-due-to"
            type="date"
            value={values.dueDateTo}
            onChange={(e) => handleDueDateToChange(e.target.value)}
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
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
              className="mr-1.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
