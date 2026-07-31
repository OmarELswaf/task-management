import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Pagination } from "@/components/common/Pagination";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import type { Database } from "@/types/database";
import type { TaskFilterValues } from "@/components/tasks/TaskFilters";
import type { FetchTasksParams } from "@/hooks/useTasks";

type Project = Tables<"projects">;
type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    tasks,
    totalCount,
    totalPages,
    loading: tasksLoading,
    error: tasksError,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  } = useTasks();

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const filterValues: TaskFilterValues = {
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as TaskStatus | "") || "",
    priority: (searchParams.get("priority") as Task["priority"] | "") || "",
    dueDateFrom: searchParams.get("dueDateFrom") || "",
    dueDateTo: searchParams.get("dueDateTo") || "",
  };
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    if (!projectId) return;

    setProjectLoading(true);
    supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setProjectError(error.message);
        } else {
          setProject(data);
        }
        setProjectLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    const params: FetchTasksParams = {
      projectId,
      page: pageFromUrl,
    };

    if (filterValues.search) params.search = filterValues.search;
    if (filterValues.status) params.status = filterValues.status;
    if (filterValues.priority) params.priority = filterValues.priority;
    if (filterValues.dueDateFrom) params.dueDateFrom = filterValues.dueDateFrom;
    if (filterValues.dueDateTo) params.dueDateTo = filterValues.dueDateTo;

    fetchTasks(params);
  }, [projectId, fetchTasks, pageFromUrl, filterValues.search, filterValues.status, filterValues.priority, filterValues.dueDateFrom, filterValues.dueDateTo]);

  function updateUrl(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  function handleFilterChange(values: TaskFilterValues) {
    const params: Record<string, string> = {};
    if (values.search) params.search = values.search;
    if (values.status) params.status = values.status;
    if (values.priority) params.priority = values.priority;
    if (values.dueDateFrom) params.dueDateFrom = values.dueDateFrom;
    if (values.dueDateTo) params.dueDateTo = values.dueDateTo;
    params.page = "";
    updateUrl(params);
  }

  function handlePageChange(p: number) {
    updateUrl({ page: p > 1 ? String(p) : "" });
  }

  async function handleSaveTask(
    data: TablesInsert<"tasks"> | TablesUpdate<"tasks">
  ) {
    setSavingTask(true);

    if (editingTask) {
      await updateTask(editingTask.id, data as TablesUpdate<"tasks">);
    } else {
      await createTask({
        ...(data as TablesInsert<"tasks">),
        project_id: projectId!,
      });
    }

    setSavingTask(false);
    setTaskModalOpen(false);
    setEditingTask(null);
  }

  async function handleDeleteTask(id: string) {
    setDeletingTaskId(id);
    await deleteTask(id);
    setDeletingTaskId(null);
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    setUpdatingStatusId(id);
    await updateTaskStatus(id, status);
    setUpdatingStatusId(null);

    if (viewingTask && viewingTask.id === id) {
      setViewingTask((prev) => (prev ? { ...prev, status } : null));
    }
  }

  function handleViewTask(task: Task) {
    setViewingTask(task);
    setDetailModalOpen(true);
  }

  if (projectLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {projectError || "Project not found"}
        </div>
        <Link
          to="/projects"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2">
        <Link
          to="/projects"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          &larr; Back to Projects
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
          Add Task
        </button>
      </div>

      <div className="mb-6">
        <TaskFilters values={filterValues} onChange={handleFilterChange} />
      </div>

      {tasksError && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {tasksError}
        </div>
      )}

      {tasksLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-3 text-muted-foreground"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <p className="mb-1 font-medium">No tasks found</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {filterValues.search || filterValues.status || filterValues.priority
              ? "Try adjusting your filters"
              : "Create your first task for this project"}
          </p>
          {!filterValues.search && !filterValues.status && !filterValues.priority && (
            <button
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Create Task
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onView={handleViewTask}
                onStatusChange={handleStatusChange}
                deleting={deletingTaskId === task.id}
                updatingStatus={updatingStatusId === task.id}
              />
            ))}
          </div>

          <div className="mt-6">
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

      <TaskModal
        open={taskModalOpen}
        task={editingTask}
        projectId={projectId!}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        saving={savingTask}
      />

      {viewingTask && (
        <TaskDetailModal
          open={detailModalOpen}
          task={viewingTask}
          onClose={() => {
            setDetailModalOpen(false);
            setViewingTask(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
