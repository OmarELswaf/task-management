import { memo } from "react";
import { Link } from "react-router-dom";
import type { Tables } from "@/types/database";
import { formatDate } from "@/lib/format";

type Project = Tables<"projects">;

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-green-100 text-green-700 border-green-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  red: "bg-red-100 text-red-700 border-red-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

function getColorClass(color: string | null): string {
  const c = color?.toLowerCase() ?? "";
  return colorMap[c] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

export const ProjectCard = memo(function ProjectCard({
  project,
  onEdit,
  onDelete,
  deleting,
}: ProjectCardProps) {
  return (
    <div className="group rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-4">
        <Link
          to={`/projects/${project.id}`}
          className="flex-1"
        >
          <h3 className="text-lg font-semibold leading-tight hover:text-primary">
            {project.name}
          </h3>
        </Link>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getColorClass(project.color)}`}
        >
          {project.color ?? "default"}
        </span>
      </div>

      {project.description && (
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>Created {formatDate(project.created_at, { year: true })}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(project)}
            className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(project.id)}
            disabled={deleting}
            className="rounded px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
});
