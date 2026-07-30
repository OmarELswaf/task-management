import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/types/database";

type Comment = Tables<"comments">;

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (data: TablesInsert<"comments">) => Promise<Comment | null>;
}

export function useComments(): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setComments([]);
    } else {
      setComments(data ?? []);
    }

    setLoading(false);
  }, []);

  const addComment = useCallback(
    async (data: TablesInsert<"comments">): Promise<Comment | null> => {
      setError(null);

      const { data: created, error: createError } = await supabase
        .from("comments")
        .insert(data)
        .select()
        .single();

      if (createError) {
        setError(createError.message);
        return null;
      }

      setComments((prev) => [...prev, created]);
      return created;
    },
    []
  );

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
  };
}
