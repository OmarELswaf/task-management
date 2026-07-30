import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { Pagination } from "@/components/common/Pagination";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type Project = Tables<"projects">;

export function ProjectsList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    projects,
    totalCount,
    totalPages,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const searchFromUrl = searchParams.get("search") || "";
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchProjects({ search: searchFromUrl, page: pageFromUrl });
  }, [fetchProjects, searchFromUrl, pageFromUrl]);

  function updateUrl(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateUrl({ search: value, page: value !== searchFromUrl ? "" : searchParams.get("page") || "" });
    }, 300);
  }

  function handlePageChange(p: number) {
    updateUrl({ page: p > 1 ? String(p) : "", search: searchFromUrl });
  }

  async function handleSave(
    data: TablesInsert<"projects"> | TablesUpdate<"projects">
  ) {
    setSaving(true);

    if (editingProject) {
      await updateProject(editingProject.id, data as TablesUpdate<"projects">);
    } else {
      await createProject({
        ...(data as TablesInsert<"projects">),
        user_id: user!.id,
      });
    }

    setSaving(false);
    setModalOpen(false);
    setEditingProject(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const success = await deleteProject(id);
    setDeletingId(null);
    if (!success) {
      alert("Failed to delete project");
    }
  }

  function handleEdit(project: Project) {
    setEditingProject(project);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your projects and tasks
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setModalOpen(true);
          }}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Project
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search projects by name..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-muted-foreground"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <p className="mb-1 text-lg font-medium">No projects yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first project to get started
          </p>
          <button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Project
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deleting={deletingId === project.id}
              />
            ))}
          </div>

          <div className="mt-8">
            <Pagination
              page={pageFromUrl}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          {totalCount > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Showing page {pageFromUrl} of {totalPages} ({totalCount} total)
            </p>
          )}
        </>
      )}

      <ProjectModal
        open={modalOpen}
        project={editingProject}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
