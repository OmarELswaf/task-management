import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectsList } from "@/pages/projects/ProjectsList";
import { supabase } from "@/lib/supabase";

function renderWithProviders(ui: React.ReactElement, { initialEntries = ["/projects"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

const mockProject = {
  id: "proj-1",
  name: "Test Project",
  description: "A test project",
  color: "blue",
  user_id: "user-1",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

const mockTask = {
  id: "task-1",
  title: "Test Task",
  description: "A test task",
  status: "todo" as const,
  priority: "high" as const,
  due_date: "2024-02-01",
  project_id: "proj-1",
  assignee_id: null,
  created_at: "2024-01-16T10:00:00Z",
  updated_at: "2024-01-16T10:00:00Z",
};

const mockComment = {
  id: "comment-1",
  content: "This is a test comment",
  task_id: "task-1",
  user_id: "user-1",
  created_at: "2024-01-17T10:00:00Z",
  updated_at: "2024-01-17T10:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();

  (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: {
      session: {
        user: { id: "user-1", email: "test@example.com" },
      },
    },
  });
  (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });

  const defaultSelect = vi.fn().mockReturnThis();
  const defaultInsert = vi.fn().mockReturnThis();
  const defaultUpdate = vi.fn().mockReturnThis();
  const defaultDelete = vi.fn().mockReturnThis();

  const queryBuilder = {
    select: defaultSelect,
    insert: defaultInsert,
    update: defaultUpdate,
    delete: defaultDelete,
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    single: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  };

  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);
});

describe("Project CRUD", () => {
  it("renders empty state when no projects exist", async () => {
    renderWithProviders(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });
  });

  it("renders project list with data", async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockProject], error: null, count: 1 }),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

    renderWithProviders(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });
  });

  it("opens modal to create a project", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    const createButtons = screen.getAllByText("Create Project");
    await user.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Create Project")).toBeInTheDocument();
    });
  });

  it("shows validation error when saving project with empty name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    await user.click(screen.getAllByText("Create Project")[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /create project$/i }));

    expect(screen.getByText("Project name is required")).toBeInTheDocument();
  });

  it("creates a project successfully", async () => {
    const user = userEvent.setup();

    const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

    renderWithProviders(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    await user.click(screen.getAllByText("Create Project")[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/name/i), "New Project");
    await user.click(screen.getByRole("button", { name: /create project$/i }));

    await waitFor(() => {
      expect(queryBuilder.insert).toHaveBeenCalled();
    });
  });

  it("displays error when project fetch fails", async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "Failed to load" }, count: 0 }),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

    renderWithProviders(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });
});

describe("ProjectDetail and Task CRUD", () => {
  it("renders project detail with loading state", async () => {
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((cb: (res: { data: typeof mockProject; error: null }) => void) => {
        setTimeout(() => cb({ data: mockProject, error: null }), 100);
        return Promise.resolve();
      }),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    });

    const { ProjectDetail } = await import("@/pages/projects/ProjectDetail");

    renderWithProviders(<ProjectDetail />, {
      initialEntries: ["/projects/proj-1"],
    });

    expect(screen.getByText(/loading project/i)).toBeInTheDocument();
  });

  it("shows add comment form and submits a comment", async () => {
    const { CommentSection } = await import("@/components/comments/CommentSection");

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

    const user = userEvent.setup();
    renderWithProviders(<CommentSection taskId="task-1" />);

    await waitFor(() => {
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "New comment text");

    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(queryBuilder.insert).toHaveBeenCalled();
    });
  });

  it("shows comments after fetching", async () => {
    const { CommentSection } = await import("@/components/comments/CommentSection");

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockComment], error: null }),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

    renderWithProviders(<CommentSection taskId="task-1" />);

    await waitFor(() => {
      expect(screen.getByText("This is a test comment")).toBeInTheDocument();
    });
  });
});
