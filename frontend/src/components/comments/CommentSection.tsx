import { useState, useEffect, type FormEvent } from "react";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";

interface CommentSectionProps {
  taskId: string;
}

export function CommentSection({ taskId }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, fetchComments, addComment } = useComments();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments(taskId);
  }, [fetchComments, taskId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const created = await addComment({
      message: trimmed,
      task_id: taskId,
      author_id: user!.id,
    });
    setSubmitting(false);

    if (created) {
      setContent("");
    } else {
      setError("Failed to add comment");
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Comments</h4>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "Send"
          )}
        </button>
      </form>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No comments yet
        </p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-md border bg-muted/30 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium">
                  {comment.author_id === user?.id ? "You" : comment.author_id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(comment.created_at)}
                </span>
              </div>
              <p className="text-sm">{comment.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
