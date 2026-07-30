import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

function renderWithProviders(ui: React.ReactElement, { initialEntries = ["/login"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  const mockSession = {
    data: { session: null },
  };
  (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
  (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

describe("Login Page", () => {
  it("renders sign in form", () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), "notanemail");
    await user.type(screen.getByLabelText(/password/i), "validPass1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "ab");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
  });

  it("calls signIn on valid submission", async () => {
    const user = userEvent.setup();
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "correctPassword1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "correctPassword1",
      });
    });
  });

  it("displays error message on failed sign in", async () => {
    const user = userEvent.setup();
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongPassword1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });
  });

  it("renders link to register page", () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
  });
});

describe("Register Page", () => {
  it("renders registration form", () => {
    renderWithProviders(<Register />);
    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getAllByLabelText(/password/i)[0], "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "differentPass");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("calls signUp on valid submission", async () => {
    const user = userEvent.setup();
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });

    renderWithProviders(<Register />);

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getAllByLabelText(/password/i)[0], "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
      });
    });
  });

  it("shows success message after registration", async () => {
    const user = userEvent.setup();
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });

    renderWithProviders(<Register />);

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getAllByLabelText(/password/i)[0], "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it("renders link to login page", () => {
    renderWithProviders(<Register />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });
});

describe("ProtectedRoute", () => {
  function TestChild() {
    return <div>Protected Content</div>;
  }

  it("shows loading spinner while auth is loading", () => {
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );

    renderWithProviders(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to /login when user is not authenticated", async () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  it("renders children when user is authenticated", async () => {
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: "user-1", email: "test@example.com" },
        },
      },
    });

    renderWithProviders(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});
