import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Pagination } from "@/components/common/Pagination";
import { supabase } from "@/lib/supabase";

function renderWithProviders(ui: React.ReactElement, { initialEntries = ["/projects/proj-1"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });

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
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TaskFilters", () => {
  const defaultValues = {
    search: "",
    status: "" as const,
    priority: "" as const,
    dueDateFrom: "",
    dueDateTo: "",
  };

  it("renders all filter inputs", () => {
    const onChange = vi.fn();
    renderWithProviders(<TaskFilters values={defaultValues} onChange={onChange} />);

    expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due to/i)).toBeInTheDocument();
  });

  it("debounces search input by 300ms", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(<TaskFilters values={defaultValues} onChange={onChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    await user.type(searchInput, "test");

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "test" })
      );
    });
  });

  it("calls onChange immediately when status select changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(<TaskFilters values={defaultValues} onChange={onChange} />);

    const statusSelect = screen.getByLabelText(/status/i);
    await user.selectOptions(statusSelect, "in_progress");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "in_progress" })
    );
  });

  it("calls onChange immediately when priority select changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(<TaskFilters values={defaultValues} onChange={onChange} />);

    const prioritySelect = screen.getByLabelText(/priority/i);
    await user.selectOptions(prioritySelect, "urgent");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "urgent" })
    );
  });

  it("shows clear filters button when filters are active", () => {
    const onChange = vi.fn();
    const activeValues = { ...defaultValues, search: "active", status: "todo" as const };

    renderWithProviders(<TaskFilters values={activeValues} onChange={onChange} />);

    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
  });

  it("clears all filters when clear button is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const activeValues = { ...defaultValues, search: "active", status: "todo" as const };

    renderWithProviders(<TaskFilters values={activeValues} onChange={onChange} />);

    await user.click(screen.getByText(/clear filters/i));

    expect(onChange).toHaveBeenCalledWith(defaultValues);
  });

  it("hides clear filters button when no filters are set", () => {
    const onChange = vi.fn();
    renderWithProviders(<TaskFilters values={defaultValues} onChange={onChange} />);

    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
  });

  it("handles due date from and to changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(<TaskFilters values={defaultValues} onChange={onChange} />);

    const dueFrom = screen.getByLabelText(/due from/i);
    await user.type(dueFrom, "2024-01-01");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dueDateFrom: "2024-01-01" })
    );

    const dueTo = screen.getByLabelText(/due to/i);
    await user.type(dueTo, "2024-12-31");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dueDateTo: "2024-12-31" })
    );
  });
});

describe("Pagination", () => {
  it("renders nothing when totalPages <= 1", () => {
    const onPageChange = vi.fn();
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={onPageChange} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders page numbers", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("disables next button on last page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText("Previous")).not.toBeDisabled();
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("calls onPageChange when page button is clicked", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByText("3"));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with previous/next values", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("shows ellipsis for large page ranges", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} totalPages={20} onPageChange={onPageChange} />);

    const ellipsis = screen.getAllByText("…");
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it("highlights current page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    const page3Button = screen.getByText("3");
    expect(page3Button).toHaveClass("bg-primary");
  });
});
