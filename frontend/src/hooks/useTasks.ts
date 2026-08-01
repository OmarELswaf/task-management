import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import type { Database } from "@/types/database";

type Task = Tables<"tasks">;
type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

const DEFAULT_PAGE_SIZE = 4;

export interface FetchTasksParams {
  projectId: string;
  search?: string;
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  assigneeId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  pageSize?: number;
}

interface UseTasksReturn {
  tasks: Task[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchTasks: (params: FetchTasksParams) => Promise<void>;
  createTask: (data: TablesInsert<"tasks">) => Promise<Task | null>;
  updateTask: (id: string, data: TablesUpdate<"tasks">) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task | null>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (params: FetchTasksParams) => {
    setLoading(true);
    setError(null);

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("tasks")
      .select("*", { count: "exact" })
      .eq("project_id", params.projectId);

    if (params.search) {
      query = query.ilike("title", `%${params.search}%`);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.priority) {
      query = query.eq("priority", params.priority);
    }

    if (params.assigneeId) {
      query = query.eq("assignee_id", params.assigneeId);
    }

    if (params.dueDateFrom) {
      query = query.gte("due_date", params.dueDateFrom);
    }

    if (params.dueDateTo) {
      query = query.lte("due_date", params.dueDateTo);
    }

    const { data, error: fetchError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      setError(fetchError.message);
      setTasks([]);
    } else {
      setTasks(data ?? []);
      setTotalCount(count ?? 0);
      setTotalPages(Math.max(1, Math.ceil((count ?? 0) / pageSize)));
    }

    setLoading(false);
  }, []);

  const createTask = useCallback(
    async (data: TablesInsert<"tasks">): Promise<Task | null> => {
      setError(null);

      const { data: created, error: createError } = await supabase
        .from("tasks")
        .insert(data)
        .select()
        .single();

      if (createError) {
        setError(createError.message);
        return null;
      }

      setTasks((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, data: TablesUpdate<"tasks">): Promise<Task | null> => {
      setError(null);

      const { data: updated, error: updateError } = await supabase
        .from("tasks")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    []
  );

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus): Promise<Task | null> => {
      return updateTask(id, { status });
    },
    [updateTask]
  );

  return {
    tasks,
    totalCount,
    totalPages,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };
}
