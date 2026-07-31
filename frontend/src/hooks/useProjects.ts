import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type Project = Tables<"projects">;

const DEFAULT_PAGE_SIZE = 4;

export interface FetchProjectsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UseProjectsReturn {
  projects: Project[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchProjects: (params?: FetchProjectsParams) => Promise<void>;
  createProject: (data: TablesInsert<"projects">) => Promise<Project | null>;
  updateProject: (id: string, data: TablesUpdate<"projects">) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (params?: FetchProjectsParams) => {
    setLoading(true);
    setError(null);

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("projects")
      .select("*", { count: "exact" });

    if (params?.search) {
      query = query.ilike("name", `%${params.search}%`);
    }

    const { data, error: fetchError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      setError(fetchError.message);
      setProjects([]);
    } else {
      setProjects(data ?? []);
      setTotalCount(count ?? 0);
      setTotalPages(Math.max(1, Math.ceil((count ?? 0) / pageSize)));
    }

    setLoading(false);
  }, []);

  const createProject = useCallback(
    async (data: TablesInsert<"projects">): Promise<Project | null> => {
      setError(null);

      const { data: created, error: createError } = await supabase
        .from("projects")
        .insert(data)
        .select()
        .single();

      if (createError) {
        setError(createError.message);
        return null;
      }

      setProjects((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, data: TablesUpdate<"projects">): Promise<Project | null> => {
      setError(null);

      const { data: updated, error: updateError } = await supabase
        .from("projects")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
      return updated;
    },
    []
  );

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  return {
    projects,
    totalCount,
    totalPages,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
