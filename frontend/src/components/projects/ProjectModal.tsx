import { useState, type FormEvent } from "react";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type Project = Tables<"projects">;

interface ProjectModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (data: TablesInsert<"projects"> | TablesUpdate<"projects">) => Promise<void>;
  saving: boolean;
}

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "teal", label: "Teal" },
  { value: "pink", label: "Pink" },
  { value: "indigo", label: "Indigo" },
];

export function ProjectModal({ open, project, onClose, onSave, saving }: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? "blue");
  const [nameError, setNameError] = useState<string | null>(null);

  const isEditing = project !== null;

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNameError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Project name is required");
      return;
    }

    onSave({
      name: trimmedName,
      description: description.trim() || null,
      color,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Edit Project" : "Create Project"}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label
              htmlFor="project-name"
              className="text-sm font-medium leading-none"
            >
              Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                nameError ? "border-destructive" : "border-input"
              }`}
              placeholder="My Project"
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-description"
              className="text-sm font-medium leading-none"
            >
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === opt.value
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor:
                      opt.value === "blue"
                        ? "#3b82f6"
                        : opt.value === "green"
                          ? "#22c55e"
                          : opt.value === "purple"
                            ? "#a855f7"
                            : opt.value === "orange"
                              ? "#f97316"
                              : opt.value === "red"
                                ? "#ef4444"
                                : opt.value === "teal"
                                  ? "#14b8a6"
                                  : opt.value === "pink"
                                    ? "#ec4899"
                                    : "#6366f1",
                  }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
